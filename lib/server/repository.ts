import postgres from "postgres";

import type { AppErrorEvent, PerformanceEvent } from "@/lib/observability";
import {
  buildClassMarketState,
  getDefaultClassMarketConfig,
  normalizeClassMarketConfig,
  type ClassMarketConfig,
  type ClassMarketState,
} from "@/lib/server/market-engine";
import type { NormalizedMarketQuote } from "@/lib/server/market-providers";
import type { AuditEvent } from "./audit";
import type { AuthenticatedUser, PermissionKey } from "./auth";
import { hashPassword, verifyPassword } from "./crypto";

type SqlClient = ReturnType<typeof postgres>;

let sqlClient: SqlClient | null = null;

export const defaultDistrictId = "district-lincoln-usd";
export const defaultSupportEmail = "support@futurefund.local";

export function hasProductionDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for production persistence.");
  }

  sqlClient ??= postgres(process.env.DATABASE_URL, {
    max: Number(process.env.DB_POOL_SIZE ?? 5),
    prepare: false,
  });

  return sqlClient;
}

export async function findUserByPassword(email: string, password: string) {
  if (!hasProductionDatabase()) {
    return null;
  }

  const sql = getSql();
  const [row] = await sql<
    Array<{
      alias: string;
      class_name: string | null;
      email: string;
      first_name: string;
      id: string;
      last_name: string;
      password_hash: string;
      role: string | null;
      status: string;
    }>
  >`
    select
      app_users.id,
      app_users.email,
      app_users.first_name,
      app_users.last_name,
      app_users.alias,
      app_users.status,
      user_credentials.password_hash,
      role_assignments.role,
      role_assignments.scope as class_name
    from user_credentials
    join app_users on app_users.id = user_credentials.user_id
    left join role_assignments on role_assignments.user_id = app_users.id
    where lower(user_credentials.email) = ${email.toLowerCase()}
      and user_credentials.force_reset = false
    order by role_assignments.assigned_at desc
    limit 1
  `;

  if (!row || row.status !== "active") {
    return null;
  }

  if (!(await verifyPassword(password, row.password_hash))) {
    return null;
  }

  const grants = await sql<Array<{ enabled: boolean; permission: string }>>`
    select permission, enabled
    from user_permission_grants
    where user_id = ${row.id}
    order by granted_at asc
  `;
  const role = normalizeRole(row.role);
  const classNames = await listUserClassNames(sql, row.id, role);

  await sql`
    update user_credentials
    set last_login_at = ${new Date()}, updated_at = ${new Date()}
    where lower(email) = ${email.toLowerCase()}
  `;

  return {
    alias: row.alias,
    className: role === "Admin" ? "District" : classNames[0] ?? row.class_name ?? "",
    classNames: role === "Admin" ? ["District"] : classNames,
    email: row.email,
    firstName: row.first_name,
    id: row.id,
    lastName: row.last_name,
    permissions: permissionsFromGrants(role, grants),
    role,
  } satisfies AuthenticatedUser;
}

export async function revokeSession(sessionTokenHash: string) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    update auth_sessions
    set revoked_at = ${new Date()}
    where session_token_hash = ${sessionTokenHash}
      and revoked_at is null
  `;
}

export async function findUserById(userId: string) {
  if (!hasProductionDatabase()) {
    return null;
  }

  const sql = getSql();
  const [row] = await sql<
    Array<{
      alias: string;
      class_name: string | null;
      email: string;
      first_name: string;
      id: string;
      last_name: string;
      role: string | null;
      status: string;
    }>
  >`
    select
      app_users.id,
      app_users.email,
      app_users.first_name,
      app_users.last_name,
      app_users.alias,
      app_users.status,
      role_assignments.role,
      role_assignments.scope as class_name
    from app_users
    left join role_assignments on role_assignments.user_id = app_users.id
    where app_users.id = ${userId}
    order by role_assignments.assigned_at desc
    limit 1
  `;

  if (!row || row.status !== "active") {
    return null;
  }

  const grants = await sql<Array<{ enabled: boolean; permission: string }>>`
    select permission, enabled
    from user_permission_grants
    where user_id = ${row.id}
    order by granted_at asc
  `;
  const role = normalizeRole(row.role);
  const classNames = await listUserClassNames(sql, row.id, role);

  return {
    alias: row.alias,
    className: role === "Admin" ? "District" : classNames[0] ?? row.class_name ?? "",
    classNames: role === "Admin" ? ["District"] : classNames,
    email: row.email,
    firstName: row.first_name,
    id: row.id,
    lastName: row.last_name,
    permissions: permissionsFromGrants(role, grants),
    role,
  } satisfies AuthenticatedUser;
}

export async function createSession(input: {
  authMethod: string;
  expiresAt: Date;
  ipAddress?: string | null;
  sessionTokenHash: string;
  userAgent?: string | null;
  userId: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    insert into auth_sessions (
      id, user_id, session_token_hash, auth_method, ip_address, user_agent,
      expires_at, created_at
    )
    values (
      ${id("session")}, ${input.userId}, ${input.sessionTokenHash},
      ${input.authMethod}, ${input.ipAddress ?? null}, ${input.userAgent ?? null},
      ${input.expiresAt}, ${new Date()}
    )
  `;
}

export async function findActiveSession(sessionTokenHash: string) {
  if (!hasProductionDatabase()) {
    return null;
  }

  const [row] = await getSql()<Array<{ user_id: string }>>`
    select user_id
    from auth_sessions
    where session_token_hash = ${sessionTokenHash}
      and revoked_at is null
      and expires_at > ${new Date()}
    limit 1
  `;

  return row ?? null;
}

export async function recordAudit(event: AuditEvent) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    insert into admin_audit_events (
      id, district_id, actor_user_id, action, target_type, target_id, reason,
      created_at
    )
    values (
      ${event.id}, ${event.districtId}, ${event.actorUserId}, ${event.action},
      ${event.targetType}, ${event.targetId}, ${event.reason ?? null},
      ${new Date(event.createdAt)}
    )
  `;
}

export async function listAudit() {
  if (!hasProductionDatabase()) {
    return [];
  }

  return getSql()`
    select *
    from admin_audit_events
    order by created_at desc
    limit 100
  `;
}

export async function listAdminState() {
  if (!hasProductionDatabase()) {
    return {
      adminUsers: [],
      credentials: [],
      marketIntegrations: [],
      schools: [],
      supportCases: [],
    };
  }

  const sql = getSql();
  const [
    users,
    schools,
    supportCases,
    marketIntegrations,
    credentials,
    classMarketConfigs,
  ] =
    await Promise.all([
      sql`
      select
        app_users.id,
        app_users.first_name,
        app_users.last_name,
        app_users.alias,
        app_users.email,
        app_users.status,
        role_assignments.role,
        role_assignments.scope as class_name
      from app_users
      left join role_assignments on role_assignments.user_id = app_users.id
      order by app_users.created_at desc
      limit 500
    `,
      sql`
      select id, name, class_count, student_count
      from schools
      order by created_at desc
      limit 200
    `,
      sql`
      select id, summary, category, status, created_at
      from support_tickets
      order by created_at desc
      limit 100
    `,
      sql`
      select id, provider_name, endpoint_url, status, allowed_symbols_csv,
        max_symbols, token_required, token_secret_ref, credential_id,
        target_class, token_placement, polling_frequency_minutes,
        last_health_check_at
      from market_data_integrations
      where status <> 'deleted'
      order by updated_at desc
      limit 100
    `,
      sql`
      select id, label, provider_name, credential_type, username_hint,
        token_placement, scope_type, scope_id, status, last_rotated_at,
        last_used_at, created_at, updated_at
      from integration_credentials
      where status <> 'deleted'
      order by updated_at desc
      limit 200
    `,
      sql`
      select class_name, simulation_mode, allowed_asset_types_json,
        allowed_symbols_csv, event_scenario, volatility_multiplier,
        starting_cash_cents, teacher_controls_enabled, updated_at
      from class_market_configs
      order by updated_at desc
      limit 100
    `,
    ]);

  return {
    adminUsers: users,
    classMarketConfigs,
    credentials,
    marketIntegrations,
    schools,
    supportCases,
  };
}

export async function listClassMarketConfigs() {
  if (!hasProductionDatabase()) {
    return [];
  }

  return getSql()<
    Array<{
      allowed_asset_types_json: string;
      allowed_symbols_csv: string;
      class_name: string;
      event_scenario: string;
      simulation_mode: string;
      starting_cash_cents: number;
      teacher_controls_enabled: boolean;
      updated_at: Date;
      volatility_multiplier: number;
    }>
  >`
    select class_name, simulation_mode, allowed_asset_types_json,
      allowed_symbols_csv, event_scenario, volatility_multiplier,
      starting_cash_cents, teacher_controls_enabled, updated_at
    from class_market_configs
    order by updated_at desc
    limit 100
  `;
}

export async function getClassMarketConfig(className: string) {
  if (!hasProductionDatabase()) {
    return getDefaultClassMarketConfig(className);
  }

  const [row] = await getSql()<
    Array<{
      allowed_asset_types_json: string;
      allowed_symbols_csv: string;
      class_name: string;
      event_scenario: string;
      simulation_mode: string;
      starting_cash_cents: number;
      teacher_controls_enabled: boolean;
      volatility_multiplier: number;
    }>
  >`
    select class_name, simulation_mode, allowed_asset_types_json,
      allowed_symbols_csv, event_scenario, volatility_multiplier,
      starting_cash_cents, teacher_controls_enabled
    from class_market_configs
    where class_name = ${className}
    limit 1
  `;

  if (!row) {
    return getDefaultClassMarketConfig(className);
  }

  return normalizeClassMarketConfig({
    allowedAssetTypes: parseJsonArray(row.allowed_asset_types_json),
    allowedSymbols: row.allowed_symbols_csv,
    className: row.class_name,
    eventScenario: row.event_scenario,
    simulationMode: row.simulation_mode,
    startingCashCents: Number(row.starting_cash_cents),
    teacherControlsEnabled: row.teacher_controls_enabled,
    volatilityMultiplier: Number(row.volatility_multiplier),
  });
}

export async function upsertClassMarketConfig(input: {
  actor: AuthenticatedUser;
  config: ClassMarketConfig;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await ensureDistrict(getSql());
  await getSql()`
    insert into class_market_configs (
      id, district_id, class_name, simulation_mode, allowed_asset_types_json,
      allowed_symbols_csv, event_scenario, volatility_multiplier,
      starting_cash_cents, teacher_controls_enabled, configured_by_user_id,
      updated_at
    )
    values (
      ${id("class-market")}, ${defaultDistrictId}, ${input.config.className},
      ${input.config.simulationMode},
      ${JSON.stringify(input.config.allowedAssetTypes)},
      ${input.config.allowedSymbols.join(",")},
      ${input.config.eventScenario}, ${input.config.volatilityMultiplier},
      ${input.config.startingCashCents}, ${input.config.teacherControlsEnabled},
      ${input.actor.id}, ${new Date()}
    )
    on conflict (district_id, class_name) do update set
      simulation_mode = excluded.simulation_mode,
      allowed_asset_types_json = excluded.allowed_asset_types_json,
      allowed_symbols_csv = excluded.allowed_symbols_csv,
      event_scenario = excluded.event_scenario,
      volatility_multiplier = excluded.volatility_multiplier,
      starting_cash_cents = excluded.starting_cash_cents,
      teacher_controls_enabled = excluded.teacher_controls_enabled,
      configured_by_user_id = excluded.configured_by_user_id,
      updated_at = excluded.updated_at
  `;
}

export async function getClassMarketState(
  className: string,
  options: { recordSnapshot?: boolean } = {}
) {
  const [config, quotes] = await Promise.all([
    getClassMarketConfig(className),
    listLatestMarketQuotes(className),
  ]);
  const state = buildClassMarketState({
    className,
    config,
    quotes: quotes.map((quote) => ({
      changePercent: Number(quote.change_percent),
      name: quote.name,
      price: Number(quote.price),
      ticker: quote.ticker,
    })),
  });

  if (options.recordSnapshot) {
    await recordClassMarketSnapshot(state);
  }

  return state;
}

export async function recordClassMarketSnapshot(state: ClassMarketState) {
  if (!hasProductionDatabase()) {
    return;
  }

  await ensureDistrict(getSql());
  await getSql()`
    insert into class_market_snapshots (
      id, district_id, class_name, simulation_mode, scenario_label,
      snapshot_json, generated_at
    )
    values (
      ${id("market-snapshot")}, ${defaultDistrictId}, ${state.className},
      ${state.config.simulationMode}, ${state.scenarioLabel},
      ${JSON.stringify(state)}, ${new Date(state.generatedAt)}
    )
  `;
}

export async function listCredentialMetadata() {
  if (!hasProductionDatabase()) {
    return [];
  }

  return getSql()`
    select id, label, provider_name, credential_type, username_hint,
      token_placement, scope_type, scope_id, status, last_rotated_at,
      last_used_at, created_at, updated_at
    from integration_credentials
    where status <> 'deleted'
    order by updated_at desc
    limit 200
  `;
}

export async function upsertCredentialMetadata(input: {
  actor: AuthenticatedUser;
  credentialId: string;
  credentialType: string;
  label: string;
  providerName: string;
  scopeId?: string;
  scopeType?: string;
  secretRef?: string | null;
  status?: string;
  tokenPlacement?: string;
  usernameHint?: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await ensureDistrict(getSql());
  await getSql()`
    insert into integration_credentials (
      id, district_id, label, provider_name, credential_type, username_hint,
      token_placement, scope_type, scope_id, secret_ref, status,
      created_by_user_id, updated_by_user_id, last_rotated_at, created_at, updated_at
    )
    values (
      ${input.credentialId}, ${defaultDistrictId}, ${input.label},
      ${input.providerName}, ${input.credentialType}, ${input.usernameHint ?? null},
      ${input.tokenPlacement ?? "bearer"}, ${input.scopeType ?? "district"},
      ${input.scopeId ?? defaultDistrictId}, ${input.secretRef ?? null},
      ${input.status ?? "active"}, ${input.actor.id}, ${input.actor.id},
      ${input.secretRef ? new Date() : null}, ${new Date()}, ${new Date()}
    )
    on conflict (id) do update set
      label = excluded.label,
      provider_name = excluded.provider_name,
      credential_type = excluded.credential_type,
      username_hint = excluded.username_hint,
      token_placement = excluded.token_placement,
      scope_type = excluded.scope_type,
      scope_id = excluded.scope_id,
      secret_ref = coalesce(excluded.secret_ref, integration_credentials.secret_ref),
      status = excluded.status,
      updated_by_user_id = excluded.updated_by_user_id,
      last_rotated_at = coalesce(excluded.last_rotated_at, integration_credentials.last_rotated_at),
      updated_at = excluded.updated_at
  `;
}

export async function deleteCredentialMetadata(credentialId: string) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    update integration_credentials
    set status = 'deleted', updated_at = ${new Date()}
    where id = ${credentialId}
  `;
}

export async function markCredentialUsed(credentialId: string) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    update integration_credentials
    set last_used_at = ${new Date()}, updated_at = ${new Date()}
    where id = ${credentialId}
  `;
}

export async function createOrUpdateUsers(input: {
  actor: AuthenticatedUser;
  action: "create" | "import" | "enable" | "disable" | "update";
  reason?: string;
  targetUserId?: string;
  users?: Array<{
    alias?: string;
    className?: string;
    email: string;
    enabled?: boolean;
    firstName?: string;
    lastName?: string;
    role?: string;
    temporaryPassword?: string;
  }>;
}) {
  if (!hasProductionDatabase()) {
    return { affected: input.users?.length ?? 1 };
  }

  const sql = getSql();

  if (input.action === "enable" || input.action === "disable") {
    if (!input.targetUserId) {
      throw new Error("targetUserId is required.");
    }

    await sql`
      update app_users
      set status = ${input.action === "enable" ? "active" : "disabled"},
          updated_at = ${new Date()}
      where id = ${input.targetUserId}
    `;

    return { affected: 1 };
  }

  const users = input.users ?? [];

  await sql.begin(async (tx) => {
    for (const user of users) {
      const role = normalizeRole(user.role);
      const existingUser = await tx<Array<{ id: string }>>`
        select id
        from app_users
        where lower(email) = ${user.email.toLowerCase()}
        limit 1
      `;
      const userId = input.targetUserId ?? existingUser[0]?.id ?? id("user");
      const className = role === "Admin" ? "District" : user.className ?? "";
      const firstName = user.firstName ?? "";
      const lastName = user.lastName ?? "";
      const alias = user.alias ?? `${firstName}${lastName}`.replace(/\s/g, "");
      const status =
        input.action === "update" && user.enabled === false ? "disabled" : "active";

      await ensureDistrict(tx);
      if (input.action === "update") {
        await tx`
          update app_users
          set first_name = ${firstName},
              last_name = ${lastName},
              alias = ${alias},
              display_name = ${`${firstName} ${lastName}`.trim()},
              email = ${user.email.toLowerCase()},
              status = ${status},
              updated_at = ${new Date()}
          where id = ${userId}
        `;
        await tx`
          update user_credentials
          set email = ${user.email.toLowerCase()},
              updated_at = ${new Date()}
          where user_id = ${userId}
        `;
        await tx`
          delete from role_assignments
          where user_id = ${userId}
        `;
      } else {
        await tx`
          insert into app_users (
            id, district_id, first_name, last_name, alias, profile_bio,
            profile_visible, display_name, email, status, created_at, updated_at
          )
          values (
            ${userId}, ${defaultDistrictId}, ${firstName}, ${lastName}, ${alias}, '',
            true, ${`${firstName} ${lastName}`.trim()}, ${user.email.toLowerCase()},
            ${status}, ${new Date()}, ${new Date()}
          )
          on conflict (email) do update set
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            alias = excluded.alias,
            display_name = excluded.display_name,
            status = excluded.status,
            updated_at = excluded.updated_at
        `;
      }

      await tx`
        insert into role_assignments (
          id, user_id, role, scope, assigned_by_user_id, assigned_at
        )
        values (${id("role")}, ${userId}, ${role}, ${className}, ${input.actor.id}, ${new Date()})
      `;

      for (const [permission, enabled] of Object.entries(permissionsForRole(role))) {
        await tx`
          insert into user_permission_grants (
            id, user_id, permission, enabled, granted_by_user_id, granted_at
          )
          values (${id("grant")}, ${userId}, ${permission}, ${enabled}, ${input.actor.id}, ${new Date()})
        `;
      }

      if (user.temporaryPassword) {
        await tx`
          insert into user_credentials (
            id, user_id, email, password_hash, password_algorithm, force_reset,
            created_at, updated_at
          )
          values (
            ${id("credential")}, ${userId}, ${user.email.toLowerCase()},
            ${await hashPassword(user.temporaryPassword)}, 'bcrypt', true,
            ${new Date()}, ${new Date()}
          )
          on conflict (email) do update set
            password_hash = excluded.password_hash,
            password_algorithm = excluded.password_algorithm,
            force_reset = true,
            updated_at = excluded.updated_at
        `;
      }
    }
  });

  return { affected: users.length };
}

export async function updatePermission(input: {
  actor: AuthenticatedUser;
  enabled: boolean;
  permission: PermissionKey;
  targetUserId: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    insert into user_permission_grants (
      id, user_id, permission, enabled, granted_by_user_id, granted_at
    )
    values (
      ${id("grant")}, ${input.targetUserId}, ${input.permission},
      ${input.enabled}, ${input.actor.id}, ${new Date()}
    )
  `;
}

export async function createSchool(input: {
  classCount: number;
  district: string;
  name: string;
  schoolId: string;
  state: string;
  studentCount: number;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  const sql = getSql();
  await ensureDistrict(sql, input.district, input.state);
  await sql`
    insert into schools (id, district_id, name, class_count, student_count, created_at)
    values (
      ${input.schoolId}, ${defaultDistrictId}, ${input.name}, ${input.classCount},
      ${input.studentCount}, ${new Date()}
    )
    on conflict (id) do update set
      name = excluded.name,
      class_count = excluded.class_count,
      student_count = excluded.student_count
  `;
}

export async function deleteSchool(schoolId: string) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`delete from schools where id = ${schoolId}`;
}

export async function createSupportTicket(input: {
  actor: AuthenticatedUser;
  category: string;
  summary: string;
  ticketId: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await ensureDistrict(getSql());
  await getSql()`
    insert into support_tickets (
      id, district_id, reported_by_user_id, category, summary, status,
      support_contact_email, created_at
    )
    values (
      ${input.ticketId}, ${defaultDistrictId}, ${input.actor.id}, ${input.category},
      ${input.summary}, 'Pending support', ${process.env.SUPPORT_CONTACT_EMAIL ?? defaultSupportEmail},
      ${new Date()}
    )
  `;
}

export async function upsertIntegration(input: {
  actor: AuthenticatedUser;
  allowedSymbols?: string;
  credentialId?: string | null;
  endpoint: string;
  integrationId: string;
  maxSymbols: number;
  provider: string;
  status: string;
  targetClass?: string;
  tokenPlacement?: string;
  tokenRequired: boolean;
  tokenSecretRef?: string | null;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await ensureDistrict(getSql());
  await getSql()`
    insert into market_data_integrations (
      id, district_id, provider_name, endpoint_url, status, allowed_symbols_csv,
      max_symbols, token_required, token_secret_ref, credential_id,
      target_class, token_placement, polling_frequency_minutes, delayed_quotes,
      configured_by_user_id, last_health_check_at, updated_at
    )
    values (
      ${input.integrationId}, ${defaultDistrictId}, ${input.provider}, ${input.endpoint},
      ${input.status}, ${input.allowedSymbols ?? ""}, ${input.maxSymbols},
      ${input.tokenRequired}, ${input.tokenSecretRef ?? null}, ${input.credentialId ?? null},
      ${input.targetClass ?? ""}, ${input.tokenPlacement ?? "bearer"}, 15,
      true, ${input.actor.id}, ${new Date()}, ${new Date()}
    )
    on conflict (id) do update set
      provider_name = excluded.provider_name,
      endpoint_url = excluded.endpoint_url,
      status = excluded.status,
      allowed_symbols_csv = excluded.allowed_symbols_csv,
      max_symbols = excluded.max_symbols,
      token_required = excluded.token_required,
      token_secret_ref = coalesce(excluded.token_secret_ref, market_data_integrations.token_secret_ref),
      credential_id = coalesce(excluded.credential_id, market_data_integrations.credential_id),
      target_class = excluded.target_class,
      token_placement = excluded.token_placement,
      last_health_check_at = excluded.last_health_check_at,
      updated_at = excluded.updated_at
  `;
}

export async function deleteIntegration(integrationId: string) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    update market_data_integrations
    set status = 'deleted', updated_at = ${new Date()}
    where id = ${integrationId}
  `;
}

export async function listPollableIntegrations() {
  if (!hasProductionDatabase()) {
    return [];
  }

  return getSql()<
    Array<{
      allowed_symbols_csv: string;
      endpoint_url: string;
      id: string;
      max_symbols: number;
      provider_name: string;
      target_class: string | null;
      token_required: boolean;
      token_secret_ref: string | null;
      credential_id: string | null;
      token_placement: "bearer" | "query" | "x-api-key" | null;
    }>
  >`
    select id, provider_name, endpoint_url, allowed_symbols_csv, max_symbols,
      token_required, token_secret_ref, credential_id, target_class, token_placement
    from market_data_integrations
    where status in ('connected', 'Connected', 'Testing')
      and status <> 'deleted'
  `;
}

export async function updateIntegrationPollResult(input: {
  errorMessage?: string;
  integrationId: string;
  ok: boolean;
  quotes?: NormalizedMarketQuote[];
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  const sql = getSql();
  await sql.begin(async (tx) => {
    await tx`
      update market_data_integrations
      set status = ${input.ok ? "Connected" : "Needs key"},
          last_health_check_at = ${new Date()},
          updated_at = ${new Date()}
      where id = ${input.integrationId}
    `;

    for (const quote of input.quotes ?? []) {
      await tx`
        insert into market_quotes (
          id, district_id, integration_id, ticker, name, price,
          change_percent, delayed, source, target_class, fetched_at
        )
        values (
          ${id("quote")}, ${defaultDistrictId}, ${input.integrationId},
          ${quote.ticker}, ${quote.name}, ${quote.price}, ${quote.changePercent},
          true, 'provider_poll',
          (select target_class from market_data_integrations where id = ${input.integrationId}),
          ${new Date()}
        )
      `;
    }

    if (!input.ok && input.errorMessage) {
      await tx`
        insert into app_error_events (
          id, district_id, severity, source, message, route, user_role, trace_id,
          context_json, created_at
        )
        values (
          ${id("err")}, ${defaultDistrictId}, 'error', 'integration',
          ${input.errorMessage}, '/api/market/poll', 'Admin', ${id("trace")},
          ${JSON.stringify({ integrationId: input.integrationId })}, ${new Date()}
        )
      `;
    }
  });
}

export async function listLatestMarketQuotes(className?: string) {
  if (!hasProductionDatabase()) {
    return [];
  }

  const sql = getSql();
  const classFilter = className?.trim();

  return sql<
    Array<{
      change_percent: number;
      fetched_at: Date;
      integration_id: string;
      name: string;
      price: number;
      target_class: string | null;
      ticker: string;
    }>
  >`
    select distinct on (ticker)
      ticker, name, price, change_percent, integration_id, target_class, fetched_at
    from market_quotes
    where ${classFilter ? sql`target_class = ${classFilter}` : sql`true`}
    order by ticker, fetched_at desc
    limit 200
  `;
}

export async function createPrivacyPosture(input: {
  actor: AuthenticatedUser;
  posture: string;
  privacyContactEmail: string;
  stateCode?: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await ensureDistrict(getSql());
  await getSql()`
    insert into privacy_posture_settings (
      id, district_id, posture, privacy_contact_email, state_code,
      retention_policy, requires_integration_approval, updated_by_user_id, updated_at
    )
    values (
      ${id("privacy")}, ${defaultDistrictId}, ${input.posture},
      ${input.privacyContactEmail}, ${input.stateCode ?? "NA"}, 'standard',
      ${input.posture !== "standard"}, ${input.actor.id}, ${new Date()}
    )
  `;
}

export async function createPasswordReset(input: {
  expiresAt: Date;
  requestedByUserId: string;
  tokenHash: string;
  userEmail: string;
}) {
  if (!hasProductionDatabase()) {
    return null;
  }

  const sql = getSql();
  const [target] = await sql<Array<{ id: string }>>`
    select id from app_users where lower(email) = ${input.userEmail.toLowerCase()} limit 1
  `;

  if (!target) {
    throw new Error("No active user was found for that email.");
  }

  await sql`
    insert into password_reset_requests (
      id, user_id, requested_by_user_id, status, reset_token_hash,
      expires_at, requested_at
    )
    values (
      ${id("reset")}, ${target.id}, ${input.requestedByUserId}, 'pending',
      ${input.tokenHash}, ${input.expiresAt}, ${new Date()}
    )
  `;

  return target.id;
}

export async function completePasswordReset(input: {
  newPassword: string;
  tokenHash: string;
}) {
  if (!hasProductionDatabase()) {
    return false;
  }

  const sql = getSql();
  const [reset] = await sql<Array<{ id: string; user_id: string }>>`
    select id, user_id
    from password_reset_requests
    where reset_token_hash = ${input.tokenHash}
      and status = 'pending'
      and expires_at > ${new Date()}
    order by requested_at desc
    limit 1
  `;

  if (!reset) {
    return false;
  }

  const passwordHash = await hashPassword(input.newPassword);

  await sql.begin(async (tx) => {
    await tx`
      update user_credentials
      set password_hash = ${passwordHash},
          password_algorithm = 'bcrypt',
          force_reset = false,
          updated_at = ${new Date()}
      where user_id = ${reset.user_id}
    `;
    await tx`
      update password_reset_requests
      set status = 'completed', completed_at = ${new Date()}
      where id = ${reset.id}
    `;
    await tx`
      update auth_sessions
      set revoked_at = ${new Date()}
      where user_id = ${reset.user_id}
        and revoked_at is null
    `;
  });

  return true;
}

export async function createPortfolioCorrection(input: {
  adjustmentCents: number;
  afterSnapshot?: unknown;
  beforeSnapshot?: unknown;
  correctedByUserId: string;
  portfolioId: string;
  reason: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    insert into portfolio_corrections (
      id, portfolio_id, corrected_by_user_id, correction_type,
      before_snapshot_json, after_snapshot_json, audit_reason, corrected_at
    )
    values (
      ${id("correction")}, ${input.portfolioId}, ${input.correctedByUserId},
      ${input.adjustmentCents >= 0 ? "increase" : "decrease"},
      ${JSON.stringify(input.beforeSnapshot ?? {})},
      ${JSON.stringify(input.afterSnapshot ?? {})},
      ${input.reason}, ${new Date()}
    )
  `;
}

export async function createRetentionRequest(input: {
  districtId: string;
  reason: string;
  requestedByUserId: string;
  targetId: string;
  targetType: string;
  type: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await ensureDistrict(getSql());
  await getSql()`
    insert into data_retention_requests (
      id, district_id, requested_by_user_id, request_type, target_type,
      target_id, reason, status, created_at
    )
    values (
      ${id("retention")}, ${input.districtId}, ${input.requestedByUserId},
      ${input.type}, ${input.targetType}, ${input.targetId}, ${input.reason},
      'pending_review', ${new Date()}
    )
  `;
}

export async function createModerationReview(input: {
  action: string;
  districtId: string;
  messageId: string;
  note: string;
  reviewedByUserId: string;
  statusAfterReview: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await ensureDistrict(getSql());
  await getSql()`
    insert into moderation_reviews (
      id, district_id, message_id, reviewed_by_user_id, action, note,
      status_after_review, reviewed_at
    )
    values (
      ${id("moderation")}, ${input.districtId}, ${input.messageId},
      ${input.reviewedByUserId}, ${input.action}, ${input.note},
      ${input.statusAfterReview}, ${new Date()}
    )
  `;
}

export async function createSsoProvider(input: {
  actor: AuthenticatedUser;
  clientId?: string;
  issuerUrl?: string;
  metadataUrl?: string;
  providerId: string;
  providerName: string;
  providerType: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await ensureDistrict(getSql());
  await getSql()`
    insert into sso_identity_providers (
      id, district_id, provider_name, provider_type, issuer_url, client_id,
      metadata_url, status, configured_by_user_id, created_at, updated_at
    )
    values (
      ${input.providerId}, ${defaultDistrictId}, ${input.providerName},
      ${input.providerType}, ${input.issuerUrl ?? null}, ${input.clientId ?? null},
      ${input.metadataUrl ?? null}, 'draft', ${input.actor.id}, ${new Date()}, ${new Date()}
    )
  `;
}

export async function createBackupJob(input: {
  backupLocation: string;
  districtId?: string;
  jobType: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    insert into backup_jobs (
      id, district_id, job_type, status, backup_location, started_at
    )
    values (
      ${id("backup")}, ${input.districtId ?? defaultDistrictId},
      ${input.jobType}, 'scheduled', ${input.backupLocation}, ${new Date()}
    )
  `;
}

export async function createIncident(input: {
  ownerUserId: string;
  severity: string;
  summary: string;
}) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    insert into incident_response_records (
      id, district_id, severity, summary, status, owner_user_id, started_at
    )
    values (
      ${id("incident")}, ${defaultDistrictId}, ${input.severity},
      ${input.summary}, 'open', ${input.ownerUserId}, ${new Date()}
    )
  `;
}

export async function recordErrorEvent(event: AppErrorEvent) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    insert into app_error_events (
      id, district_id, severity, source, message, route, user_role, trace_id,
      context_json, created_at
    )
    values (
      ${event.id}, ${defaultDistrictId}, ${event.severity}, ${event.source},
      ${event.message}, ${event.route}, ${event.userRole ?? null}, ${event.traceId},
      '{}', ${new Date(event.createdAt)}
    )
  `;
}

export async function listErrorEvents() {
  if (!hasProductionDatabase()) {
    return [];
  }

  return getSql()`
    select *
    from app_error_events
    order by created_at desc
    limit 25
  `;
}

export async function recordPerformanceEvent(event: PerformanceEvent) {
  if (!hasProductionDatabase()) {
    return;
  }

  await getSql()`
    insert into performance_events (
      id, district_id, route, operation, duration_ms, status, trace_id, created_at
    )
    values (
      ${event.id}, ${defaultDistrictId}, ${event.route}, ${event.operation},
      ${event.durationMs}, ${event.status}, ${event.traceId},
      ${new Date(event.createdAt)}
    )
  `;
}

export async function listPerformanceEvents() {
  if (!hasProductionDatabase()) {
    return [];
  }

  return getSql()`
    select *
    from performance_events
    order by created_at desc
    limit 25
  `;
}

async function ensureDistrict(
  sql: SqlClient,
  name = "Lincoln USD",
  state = "CA"
) {
  await sql`
    insert into districts (
      id, name, state, privacy_contact_email, created_at
    )
    values (
      ${defaultDistrictId}, ${name}, ${state},
      ${process.env.PRIVACY_CONTACT_EMAIL ?? "privacy@futurefund.local"},
      ${new Date()}
    )
    on conflict (id) do nothing
  `;
}

function normalizeRole(role?: string): AuthenticatedUser["role"] {
  const normalized = role?.toLowerCase();

  if (normalized === "teacher") {
    return "Teacher";
  }

  if (normalized === "admin") {
    return "Admin";
  }

  return "Student";
}

function permissionsFromGrants(
  role: AuthenticatedUser["role"],
  grants: { enabled: boolean; permission: string }[]
): Record<PermissionKey, boolean> {
  const base = permissionsForRole(role);

  for (const grant of grants) {
    if (grant.permission in base) {
      base[grant.permission as PermissionKey] = Boolean(grant.enabled);
    }
  }

  return base;
}

async function listUserClassNames(
  sql: SqlClient,
  userId: string,
  role: AuthenticatedUser["role"]
) {
  if (role === "Admin") {
    return ["District"];
  }

  const rows = await sql<Array<{ scope: string }>>`
    select distinct scope
    from role_assignments
    where user_id = ${userId}
      and scope <> ''
      and scope <> 'District'
    order by scope asc
  `;

  return rows.map((row) => row.scope);
}

function permissionsForRole(role: AuthenticatedUser["role"]) {
  if (role === "Admin") {
    return {
      adminPortal: true,
      portfolioCorrections: true,
      questImportExport: true,
      studentProfile: true,
      teacherPortal: true,
    };
  }

  if (role === "Teacher") {
    return {
      adminPortal: false,
      portfolioCorrections: false,
      questImportExport: true,
      studentProfile: false,
      teacherPortal: true,
    };
  }

  return {
    adminPortal: false,
    portfolioCorrections: false,
    questImportExport: false,
    studentProfile: true,
    teacherPortal: false,
  };
}

function parseJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
