import bcrypt from "bcryptjs";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("DATABASE_URL is not set; skipping demo data seed.");
  process.exit(0);
}

await import("./cloudrun-migrate.mjs");

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const now = new Date();
const districtId = "district-lincoln-usd";
const adminUserId = "user-sam-gordon";

const demoPasswordByRole = {
  Admin: "admin-demo",
  Teacher: "teacher-demo",
  Student: "student-demo",
};

const permissionsByRole = {
  Admin: [
    "admin.all",
    "users.manage",
    "permissions.manage",
    "support.manage",
    "market.integrations.manage",
    "market.simulator.manage",
    "portfolio.corrections.manage",
    "privacy.manage",
    "quest.import",
    "quest.export",
    "monitoring.view",
  ],
  Teacher: [
    "teacher.portal.access",
    "quest.author",
    "quest.import",
    "quest.export",
    "class.market.manage",
    "student.progress.view",
    "messages.send",
  ],
  Student: [
    "student.profile.access",
    "portfolio.manage",
    "quest.complete",
    "messages.send",
    "discussion.participate",
  ],
};

const schools = [
  {
    id: "school-lincoln-middle",
    name: "Lincoln Middle School",
    classCount: 3,
    studentCount: 58,
  },
  {
    id: "school-lincoln-high",
    name: "Lincoln High School",
    classCount: 1,
    studentCount: 17,
  },
];

const users = [
  {
    id: "user-avery",
    schoolId: "school-lincoln-middle",
    firstName: "Avery",
    lastName: "Johnson",
    alias: "ValueVoyager",
    displayName: "Avery Johnson",
    email: "avery.johnson@example.edu",
    role: "Student",
    scopes: ["7th Grade Finance A"],
  },
  {
    id: "user-maya",
    schoolId: "school-lincoln-middle",
    firstName: "Maya",
    lastName: "Patel",
    alias: "CompoundMaya",
    displayName: "Maya Patel",
    email: "maya.patel@example.edu",
    role: "Student",
    scopes: ["7th Grade Finance B"],
  },
  {
    id: "user-jordan",
    schoolId: "school-lincoln-middle",
    firstName: "Jordan",
    lastName: "Lee",
    alias: "BudgetBuilder",
    displayName: "Jordan Lee",
    email: "jordan.lee@example.edu",
    role: "Student",
    scopes: ["8th Grade Investing Lab"],
  },
  {
    id: "user-elena-rivera",
    schoolId: "school-lincoln-middle",
    firstName: "Elena",
    lastName: "Rivera",
    alias: "CoachRivera",
    displayName: "Elena Rivera",
    email: "elena.rivera@example.edu",
    role: "Teacher",
    scopes: [
      "7th Grade Finance A",
      "7th Grade Finance B",
      "8th Grade Investing Lab",
    ],
  },
  {
    id: adminUserId,
    schoolId: null,
    firstName: "Sam",
    lastName: "Gordon",
    alias: "DistrictAdmin",
    displayName: "Sam Gordon",
    email: "sam.gordon@example.edu",
    role: "Admin",
    scopes: ["District"],
  },
];

const integrations = [
  {
    id: "integration-sandbox-market-feed",
    credentialId: "credential-sandbox-market-feed",
    provider: "FutureFund Sandbox Market Feed",
    endpoint: "https://example.edu/api/market/sandbox",
    status: "Connected",
    targetClass: "7th Grade Finance A",
    allowedSymbols: "SPY,QQQ,BND,IPO-LAB",
    tokenRequired: false,
    pollingFrequencyMinutes: 15,
  },
  {
    id: "integration-equity-lab-feed",
    credentialId: "credential-equity-lab-feed",
    provider: "Equity Lab Delayed Quotes",
    endpoint: "https://example.edu/api/market/equity-lab",
    status: "Testing",
    targetClass: "8th Grade Investing Lab",
    allowedSymbols: "",
    tokenRequired: true,
    pollingFrequencyMinutes: 30,
  },
];

const classMarketConfigs = [
  {
    id: "class-market-7-finance-a",
    className: "7th Grade Finance A",
    simulationMode: "shared_provider",
    allowedAssetTypes: ["stocks", "bonds", "cash"],
    allowedSymbols: "SPY,QQQ,BND,IPO-LAB",
    scenario: "baseline",
    volatility: 1,
    startingCashCents: 100000,
  },
  {
    id: "class-market-7-finance-b",
    className: "7th Grade Finance B",
    simulationMode: "teacher_controlled",
    allowedAssetTypes: ["stocks", "cash"],
    allowedSymbols: "SPY,QQQ,VTI",
    scenario: "earnings_week",
    volatility: 1.25,
    startingCashCents: 100000,
  },
  {
    id: "class-market-8-investing-lab",
    className: "8th Grade Investing Lab",
    simulationMode: "shared_provider",
    allowedAssetTypes: ["stocks", "etfs", "bonds"],
    allowedSymbols: "SPY,QQQ,BND,VXUS",
    scenario: "rate_change",
    volatility: 0.9,
    startingCashCents: 150000,
  },
  {
    id: "class-market-high-personal-finance",
    className: "High School Personal Finance",
    simulationMode: "sandbox_only",
    allowedAssetTypes: ["stocks", "retirement", "cash"],
    allowedSymbols: "VTI,VXUS,BND",
    scenario: "retirement_planning",
    volatility: 0.75,
    startingCashCents: 200000,
  },
];

const quoteTemplates = [
  { ticker: "SPY", name: "S&P 500 ETF", price: 641.22, change: 0.42 },
  { ticker: "QQQ", name: "NASDAQ 100 ETF", price: 586.14, change: 0.68 },
  { ticker: "BND", name: "Total Bond Market ETF", price: 73.44, change: -0.08 },
  { ticker: "IPO-LAB", name: "Classroom IPO Lab", price: 14.75, change: 2.15 },
  { ticker: "VTI", name: "Total Stock Market ETF", price: 331.8, change: 0.37 },
  { ticker: "VXUS", name: "International Stock ETF", price: 72.19, change: -0.16 },
];

const supportTickets = [
  {
    id: "support-sup-1042",
    reportedBy: "user-elena-rivera",
    category: "Market Data",
    summary: "Sandbox quotes need verification before Monday's investing lab.",
    status: "pending_support",
  },
  {
    id: "support-sup-1038",
    reportedBy: adminUserId,
    category: "Roster",
    summary: "Import preview flagged duplicate aliases in Grade 7 classes.",
    status: "pending_user",
  },
  {
    id: "support-sup-1031",
    reportedBy: "user-avery",
    category: "Messaging",
    summary: "Student cannot find teacher profile from search.",
    status: "open",
  },
];

const errorEvents = [
  {
    id: "error-demo-market-timeout",
    severity: "warning",
    source: "api",
    message: "Market provider request exceeded the configured timeout.",
    route: "/api/admin/market-integrations/poll",
    userRole: "Admin",
    traceId: "demo-trace-market-timeout",
  },
  {
    id: "error-demo-import-validation",
    severity: "info",
    source: "admin-ui",
    message: "CSV import row skipped because the email field was missing.",
    route: "/admin/users/import",
    userRole: "Admin",
    traceId: "demo-trace-import-validation",
  },
];

const performanceEvents = [
  {
    id: "perf-demo-market-poll",
    route: "/api/admin/market-integrations/poll",
    operation: "market.poll",
    durationMs: 842,
    status: "ok",
    traceId: "demo-trace-market-poll",
  },
  {
    id: "perf-demo-user-search",
    route: "/api/admin/users",
    operation: "users.search",
    durationMs: 118,
    status: "ok",
    traceId: "demo-trace-user-search",
  },
  {
    id: "perf-demo-login",
    route: "/api/auth/login",
    operation: "auth.login",
    durationMs: 211,
    status: "ok",
    traceId: "demo-trace-login",
  },
];

const auditEvents = [
  {
    id: "audit-demo-users-imported",
    action: "users.imported",
    targetType: "csv_import",
    targetId: "demo-roster-import",
    reason: "Seeded demo roster for district walkthroughs.",
  },
  {
    id: "audit-demo-integration-created",
    action: "integration.created",
    targetType: "market_data_integration",
    targetId: "integration-sandbox-market-feed",
    reason: "Seeded sandbox market feed.",
  },
  {
    id: "audit-demo-class-market-updated",
    action: "class_market.updated",
    targetType: "class_market_config",
    targetId: "class-market-7-finance-a",
    reason: "Seeded class market simulator configuration.",
  },
  {
    id: "audit-demo-privacy-updated",
    action: "privacy.updated",
    targetType: "privacy_posture",
    targetId: "privacy-demo-standard",
    reason: "Seeded standard district privacy posture.",
  },
];

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function snapshotFor(config) {
  const symbols = config.allowedSymbols
    .split(",")
    .map((symbol) => symbol.trim())
    .filter(Boolean);

  const quotes = quoteTemplates
    .filter((quote) => symbols.includes(quote.ticker))
    .map((quote) => ({
      symbol: quote.ticker,
      name: quote.name,
      price: quote.price,
      changePercent: quote.change,
      delayed: true,
    }));

  return {
    className: config.className,
    generatedFor: "demo",
    scenario: config.scenario,
    simulationMode: config.simulationMode,
    volatilityMultiplier: config.volatility,
    startingCashCents: config.startingCashCents,
    quotes,
  };
}

try {
  const passwordHashes = {};
  for (const [role, password] of Object.entries(demoPasswordByRole)) {
    passwordHashes[role] = await bcrypt.hash(password, 12);
  }

  await sql.begin(async (tx) => {
    await tx`
      insert into districts (id, name, state, privacy_contact_email, created_at)
      values (${districtId}, 'Lincoln USD', 'CA', 'privacy@futurefund.local', ${now})
      on conflict (id) do update set
        name = excluded.name,
        state = excluded.state,
        privacy_contact_email = excluded.privacy_contact_email
    `;

    for (const school of schools) {
      await tx`
        insert into schools (
          id, district_id, name, class_count, student_count, created_at
        )
        values (
          ${school.id}, ${districtId}, ${school.name}, ${school.classCount},
          ${school.studentCount}, ${now}
        )
        on conflict (id) do update set
          name = excluded.name,
          class_count = excluded.class_count,
          student_count = excluded.student_count
      `;
    }

    for (const user of users) {
      await tx`
        insert into app_users (
          id, district_id, school_id, first_name, last_name, alias, profile_bio,
          profile_visible, display_name, email, status, created_at, updated_at
        )
        values (
          ${user.id}, ${districtId}, ${user.schoolId}, ${user.firstName},
          ${user.lastName}, ${user.alias}, ${`${user.role} demo profile`},
          true, ${user.displayName}, ${user.email}, 'active', ${now}, ${now}
        )
        on conflict (id) do update set
          school_id = excluded.school_id,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          alias = excluded.alias,
          profile_bio = excluded.profile_bio,
          profile_visible = excluded.profile_visible,
          display_name = excluded.display_name,
          email = excluded.email,
          status = excluded.status,
          updated_at = excluded.updated_at
      `;

      await tx`
        insert into user_credentials (
          id, user_id, email, password_hash, password_algorithm, force_reset,
          created_at, updated_at
        )
        values (
          ${`credential-${user.id}`}, ${user.id}, ${user.email},
          ${passwordHashes[user.role]}, 'bcrypt', false, ${now}, ${now}
        )
        on conflict (email) do update set
          password_hash = excluded.password_hash,
          password_algorithm = excluded.password_algorithm,
          force_reset = excluded.force_reset,
          updated_at = excluded.updated_at
      `;

      for (const scope of user.scopes) {
        await tx`
          insert into role_assignments (
            id, user_id, role, scope, assigned_by_user_id, assigned_at
          )
          values (
            ${`role-${user.id}-${slug(scope)}`}, ${user.id}, ${user.role},
            ${scope}, ${adminUserId}, ${now}
          )
          on conflict (id) do update set
            role = excluded.role,
            scope = excluded.scope,
            assigned_by_user_id = excluded.assigned_by_user_id,
            assigned_at = excluded.assigned_at
        `;
      }

      for (const permission of permissionsByRole[user.role]) {
        await tx`
          insert into user_permission_grants (
            id, user_id, permission, enabled, granted_by_user_id, granted_at
          )
          values (
            ${`grant-${user.id}-${slug(permission)}`}, ${user.id},
            ${permission}, true, ${adminUserId}, ${now}
          )
          on conflict (id) do update set
            enabled = excluded.enabled,
            granted_by_user_id = excluded.granted_by_user_id,
            granted_at = excluded.granted_at
        `;
      }
    }

    for (const integration of integrations) {
      await tx`
        insert into integration_credentials (
          id, district_id, label, provider_name, credential_type, username_hint,
          token_placement, scope_type, scope_id, secret_ref, status,
          created_by_user_id, updated_by_user_id, last_rotated_at, last_used_at,
          created_at, updated_at
        )
        values (
          ${integration.credentialId}, ${districtId}, ${integration.provider},
          ${integration.provider}, ${integration.tokenRequired ? "api_token" : "none"},
          null, 'bearer', 'class', ${integration.targetClass}, null,
          ${integration.tokenRequired ? "pending_secret" : "active"},
          ${adminUserId}, ${adminUserId}, null, null, ${now}, ${now}
        )
        on conflict (id) do update set
          label = excluded.label,
          provider_name = excluded.provider_name,
          credential_type = excluded.credential_type,
          scope_type = excluded.scope_type,
          scope_id = excluded.scope_id,
          status = excluded.status,
          updated_by_user_id = excluded.updated_by_user_id,
          updated_at = excluded.updated_at
      `;

      await tx`
        insert into market_data_integrations (
          id, district_id, provider_name, endpoint_url, status,
          allowed_symbols_csv, max_symbols, token_required, token_secret_ref,
          credential_id, target_class, token_placement,
          polling_frequency_minutes, delayed_quotes, configured_by_user_id,
          last_health_check_at, updated_at
        )
        values (
          ${integration.id}, ${districtId}, ${integration.provider},
          ${integration.endpoint}, ${integration.status},
          ${integration.allowedSymbols}, 200, ${integration.tokenRequired},
          null, ${integration.credentialId}, ${integration.targetClass},
          'bearer', ${integration.pollingFrequencyMinutes}, true,
          ${adminUserId}, ${now}, ${now}
        )
        on conflict (id) do update set
          provider_name = excluded.provider_name,
          endpoint_url = excluded.endpoint_url,
          status = excluded.status,
          allowed_symbols_csv = excluded.allowed_symbols_csv,
          max_symbols = excluded.max_symbols,
          token_required = excluded.token_required,
          credential_id = excluded.credential_id,
          target_class = excluded.target_class,
          token_placement = excluded.token_placement,
          polling_frequency_minutes = excluded.polling_frequency_minutes,
          delayed_quotes = excluded.delayed_quotes,
          configured_by_user_id = excluded.configured_by_user_id,
          last_health_check_at = excluded.last_health_check_at,
          updated_at = excluded.updated_at
      `;
    }

    for (const config of classMarketConfigs) {
      await tx`
        insert into class_market_configs (
          id, district_id, class_name, simulation_mode,
          allowed_asset_types_json, allowed_symbols_csv, event_scenario,
          volatility_multiplier, starting_cash_cents,
          teacher_controls_enabled, configured_by_user_id, updated_at
        )
        values (
          ${config.id}, ${districtId}, ${config.className},
          ${config.simulationMode}, ${JSON.stringify(config.allowedAssetTypes)},
          ${config.allowedSymbols}, ${config.scenario}, ${config.volatility},
          ${config.startingCashCents}, true, ${adminUserId}, ${now}
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

      await tx`
        insert into class_market_snapshots (
          id, district_id, class_name, simulation_mode, scenario_label,
          snapshot_json, generated_at
        )
        values (
          ${`snapshot-demo-${slug(config.className)}`}, ${districtId},
          ${config.className}, ${config.simulationMode}, ${config.scenario},
          ${JSON.stringify(snapshotFor(config))}, ${now}
        )
        on conflict (id) do update set
          simulation_mode = excluded.simulation_mode,
          scenario_label = excluded.scenario_label,
          snapshot_json = excluded.snapshot_json,
          generated_at = excluded.generated_at
      `;

      const symbols = config.allowedSymbols
        .split(",")
        .map((symbol) => symbol.trim())
        .filter(Boolean);
      for (const quote of quoteTemplates.filter((item) =>
        symbols.includes(item.ticker),
      )) {
        await tx`
          insert into market_quotes (
            id, district_id, integration_id, ticker, name, price,
            change_percent, delayed, source, target_class, fetched_at
          )
          values (
            ${`quote-demo-${slug(config.className)}-${quote.ticker.toLowerCase()}`},
            ${districtId}, 'integration-sandbox-market-feed', ${quote.ticker},
            ${quote.name}, ${quote.price}, ${quote.change}, true,
            'demo-seed', ${config.className}, ${now}
          )
          on conflict (id) do update set
            price = excluded.price,
            change_percent = excluded.change_percent,
            fetched_at = excluded.fetched_at
        `;
      }
    }

    await tx`
      insert into privacy_posture_settings (
        id, district_id, posture, privacy_contact_email, state_code,
        retention_policy, requires_integration_approval, updated_by_user_id,
        updated_at
      )
      values (
        'privacy-demo-standard', ${districtId}, 'standard',
        'privacy@futurefund.local', 'CA', 'standard', true,
        ${adminUserId}, ${now}
      )
      on conflict (id) do update set
        posture = excluded.posture,
        privacy_contact_email = excluded.privacy_contact_email,
        state_code = excluded.state_code,
        retention_policy = excluded.retention_policy,
        requires_integration_approval = excluded.requires_integration_approval,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = excluded.updated_at
    `;

    for (const ticket of supportTickets) {
      await tx`
        insert into support_tickets (
          id, district_id, reported_by_user_id, category, summary, status,
          support_contact_email, created_at, resolved_at
        )
        values (
          ${ticket.id}, ${districtId}, ${ticket.reportedBy},
          ${ticket.category}, ${ticket.summary}, ${ticket.status},
          'support@futurefund.local', ${now}, null
        )
        on conflict (id) do update set
          category = excluded.category,
          summary = excluded.summary,
          status = excluded.status,
          support_contact_email = excluded.support_contact_email
      `;
    }

    for (const event of errorEvents) {
      await tx`
        insert into app_error_events (
          id, district_id, severity, source, message, route, user_role,
          trace_id, context_json, created_at
        )
        values (
          ${event.id}, ${districtId}, ${event.severity}, ${event.source},
          ${event.message}, ${event.route}, ${event.userRole}, ${event.traceId},
          ${JSON.stringify({ demo: true, seededAt: now.toISOString() })}, ${now}
        )
        on conflict (id) do update set
          severity = excluded.severity,
          message = excluded.message,
          context_json = excluded.context_json,
          created_at = excluded.created_at
      `;
    }

    for (const event of performanceEvents) {
      await tx`
        insert into performance_events (
          id, district_id, route, operation, duration_ms, status, trace_id,
          created_at
        )
        values (
          ${event.id}, ${districtId}, ${event.route}, ${event.operation},
          ${event.durationMs}, ${event.status}, ${event.traceId}, ${now}
        )
        on conflict (id) do update set
          duration_ms = excluded.duration_ms,
          status = excluded.status,
          created_at = excluded.created_at
      `;
    }

    for (const event of auditEvents) {
      await tx`
        insert into admin_audit_events (
          id, district_id, actor_user_id, action, target_type, target_id,
          reason, created_at
        )
        values (
          ${event.id}, ${districtId}, ${adminUserId}, ${event.action},
          ${event.targetType}, ${event.targetId}, ${event.reason}, ${now}
        )
        on conflict (id) do update set
          reason = excluded.reason,
          created_at = excluded.created_at
      `;
    }

    await tx`
      insert into sso_identity_providers (
        id, district_id, provider_name, provider_type, issuer_url, client_id,
        metadata_url, status, configured_by_user_id, created_at, updated_at
      )
      values (
        'sso-demo-lincoln-oidc', ${districtId}, 'Lincoln USD OIDC',
        'oidc', 'https://sso.example.edu/oauth2/default',
        'futurefund-classroom-demo',
        'https://sso.example.edu/.well-known/openid-configuration',
        'draft', ${adminUserId}, ${now}, ${now}
      )
      on conflict (id) do update set
        provider_name = excluded.provider_name,
        provider_type = excluded.provider_type,
        issuer_url = excluded.issuer_url,
        client_id = excluded.client_id,
        metadata_url = excluded.metadata_url,
        status = excluded.status,
        configured_by_user_id = excluded.configured_by_user_id,
        updated_at = excluded.updated_at
    `;

    await tx`
      insert into backup_jobs (
        id, district_id, job_type, status, backup_location,
        restore_tested_at, started_at, completed_at
      )
      values (
        'backup-demo-nightly', ${districtId}, 'scheduled_postgres_backup',
        'completed', 'gs://futurefund-demo-backups/nightly/latest',
        ${now}, ${now}, ${now}
      )
      on conflict (id) do update set
        status = excluded.status,
        backup_location = excluded.backup_location,
        restore_tested_at = excluded.restore_tested_at,
        completed_at = excluded.completed_at
    `;

    await tx`
      insert into incident_response_records (
        id, district_id, severity, summary, status, owner_user_id,
        started_at, resolved_at, postmortem_url
      )
      values (
        'incident-demo-runbook', ${districtId}, 'low',
        'Demo incident record for admin operations walkthrough.',
        'resolved', ${adminUserId}, ${now}, ${now},
        'https://example.edu/futurefund/runbooks/demo-incident'
      )
      on conflict (id) do update set
        severity = excluded.severity,
        summary = excluded.summary,
        status = excluded.status,
        owner_user_id = excluded.owner_user_id,
        resolved_at = excluded.resolved_at,
        postmortem_url = excluded.postmortem_url
    `;
  });

  console.log("Demo data seed complete.");
  console.log("Demo credentials:");
  console.log("- Student: avery.johnson@example.edu / student-demo");
  console.log("- Teacher: elena.rivera@example.edu / teacher-demo");
  console.log("- Admin: sam.gordon@example.edu / admin-demo");
} finally {
  await sql.end();
}
