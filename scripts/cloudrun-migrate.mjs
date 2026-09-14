import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set; skipping Cloud Run database migration.");
  process.exit(0);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

try {
  await sql`
    create table if not exists districts (
      id text primary key,
      name text not null,
      state text not null,
      privacy_contact_email text not null,
      created_at timestamp not null
    )
  `;
  await sql`
    create table if not exists schools (
      id text primary key,
      district_id text not null references districts(id),
      name text not null,
      class_count integer not null default 0,
      student_count integer not null default 0,
      created_at timestamp not null
    )
  `;
  await sql`
    create table if not exists app_users (
      id text primary key,
      district_id text not null references districts(id),
      school_id text references schools(id),
      first_name text not null default '',
      last_name text not null default '',
      alias text not null default '',
      profile_bio text not null default '',
      profile_visible boolean not null default true,
      display_name text not null,
      email text not null unique,
      status text not null default 'active',
      created_at timestamp not null,
      updated_at timestamp not null
    )
  `;
  await sql`
    create table if not exists role_assignments (
      id text primary key,
      user_id text not null references app_users(id),
      role text not null,
      scope text not null,
      assigned_by_user_id text not null,
      assigned_at timestamp not null
    )
  `;
  await sql`
    create table if not exists user_permission_grants (
      id text primary key,
      user_id text not null references app_users(id),
      permission text not null,
      enabled boolean not null default true,
      granted_by_user_id text not null,
      granted_at timestamp not null
    )
  `;
  await sql`
    create table if not exists user_credentials (
      id text primary key,
      user_id text not null references app_users(id),
      email text not null unique,
      password_hash text not null,
      password_algorithm text not null default 'bcrypt',
      password_salt_ref text,
      force_reset boolean not null default false,
      last_login_at timestamp,
      created_at timestamp not null,
      updated_at timestamp not null
    )
  `;
  await sql`
    create table if not exists auth_sessions (
      id text primary key,
      user_id text not null references app_users(id),
      session_token_hash text not null unique,
      auth_method text not null default 'password',
      ip_address text,
      user_agent text,
      expires_at timestamp not null,
      revoked_at timestamp,
      created_at timestamp not null
    )
  `;
  await sql`
    create table if not exists admin_audit_events (
      id text primary key,
      district_id text not null references districts(id),
      actor_user_id text not null,
      action text not null,
      target_type text not null,
      target_id text not null,
      reason text,
      created_at timestamp not null
    )
  `;
  await sql`
    create table if not exists support_tickets (
      id text primary key,
      district_id text not null references districts(id),
      reported_by_user_id text not null,
      category text not null,
      summary text not null,
      status text not null default 'open',
      support_contact_email text not null,
      created_at timestamp not null,
      resolved_at timestamp
    )
  `;
  await sql`
    create table if not exists market_data_integrations (
      id text primary key,
      district_id text not null references districts(id),
      provider_name text not null,
      endpoint_url text not null,
      status text not null default 'not_configured',
      allowed_symbols_csv text not null default '',
      max_symbols integer not null default 200,
      token_required boolean not null default false,
      token_secret_ref text,
      credential_id text,
      target_class text not null default '',
      token_placement text not null default 'bearer',
      polling_frequency_minutes integer not null default 15,
      delayed_quotes boolean not null default true,
      configured_by_user_id text,
      last_health_check_at timestamp,
      updated_at timestamp not null
    )
  `;
  await sql`
    create table if not exists integration_credentials (
      id text primary key,
      district_id text not null references districts(id),
      label text not null,
      provider_name text not null,
      credential_type text not null,
      username_hint text,
      token_placement text not null default 'bearer',
      scope_type text not null default 'district',
      scope_id text not null,
      secret_ref text,
      status text not null default 'active',
      created_by_user_id text not null,
      updated_by_user_id text not null,
      last_rotated_at timestamp,
      last_used_at timestamp,
      created_at timestamp not null,
      updated_at timestamp not null
    )
  `;
  await sql`
    alter table market_data_integrations
    add column if not exists credential_id text
  `;
  await sql`
    alter table market_data_integrations
    add column if not exists token_placement text not null default 'bearer'
  `;
  await sql`
    alter table market_data_integrations
    add column if not exists target_class text not null default ''
  `;
  await sql`
    create table if not exists market_quotes (
      id text primary key,
      district_id text not null references districts(id),
      integration_id text references market_data_integrations(id),
      ticker text not null,
      name text not null,
      price numeric not null,
      change_percent numeric not null default 0,
      delayed boolean not null default true,
      source text not null,
      target_class text,
      fetched_at timestamp not null
    )
  `;
  await sql`
    alter table market_quotes
    add column if not exists target_class text
  `;
  await sql`
    create index if not exists market_quotes_ticker_fetched_idx
    on market_quotes (ticker, fetched_at desc)
  `;
  await sql`
    create table if not exists class_market_configs (
      id text primary key,
      district_id text not null references districts(id),
      class_name text not null,
      simulation_mode text not null default 'shared_provider',
      allowed_asset_types_json text not null default '[]',
      allowed_symbols_csv text not null default '',
      event_scenario text not null default 'baseline',
      volatility_multiplier numeric not null default 1,
      starting_cash_cents integer not null default 100000,
      teacher_controls_enabled boolean not null default true,
      configured_by_user_id text,
      updated_at timestamp not null,
      unique (district_id, class_name)
    )
  `;
  await sql`
    create table if not exists class_market_snapshots (
      id text primary key,
      district_id text not null references districts(id),
      class_name text not null,
      simulation_mode text not null,
      scenario_label text not null,
      snapshot_json text not null,
      generated_at timestamp not null
    )
  `;
  await sql`
    create index if not exists class_market_snapshots_class_generated_idx
    on class_market_snapshots (class_name, generated_at desc)
  `;
  await sql`
    create table if not exists privacy_posture_settings (
      id text primary key,
      district_id text not null references districts(id),
      posture text not null default 'standard',
      privacy_contact_email text not null,
      state_code text not null,
      retention_policy text not null default 'standard',
      requires_integration_approval boolean not null default false,
      updated_by_user_id text not null,
      updated_at timestamp not null
    )
  `;
  await sql`
    create table if not exists password_reset_requests (
      id text primary key,
      user_id text not null references app_users(id),
      requested_by_user_id text not null,
      status text not null default 'pending',
      reset_token_hash text,
      expires_at timestamp,
      requested_at timestamp not null,
      completed_at timestamp
    )
  `;
  await sql`
    create table if not exists portfolio_corrections (
      id text primary key,
      portfolio_id text not null,
      corrected_by_user_id text not null,
      correction_type text not null,
      before_snapshot_json text not null,
      after_snapshot_json text not null,
      audit_reason text not null,
      corrected_at timestamp not null
    )
  `;
  await sql`
    create table if not exists data_retention_requests (
      id text primary key,
      district_id text not null references districts(id),
      requested_by_user_id text not null,
      request_type text not null,
      target_type text not null,
      target_id text not null,
      reason text not null,
      status text not null default 'pending_review',
      export_location text,
      completed_at timestamp,
      created_at timestamp not null
    )
  `;
  await sql`
    create table if not exists moderation_reviews (
      id text primary key,
      district_id text not null references districts(id),
      message_id text not null,
      reviewed_by_user_id text not null,
      action text not null,
      note text not null default '',
      status_after_review text not null,
      reviewed_at timestamp not null
    )
  `;
  await sql`
    create table if not exists backup_jobs (
      id text primary key,
      district_id text references districts(id),
      job_type text not null,
      status text not null default 'scheduled',
      backup_location text,
      restore_tested_at timestamp,
      started_at timestamp not null,
      completed_at timestamp
    )
  `;
  await sql`
    create table if not exists incident_response_records (
      id text primary key,
      district_id text references districts(id),
      severity text not null,
      summary text not null,
      status text not null default 'open',
      owner_user_id text not null,
      started_at timestamp not null,
      resolved_at timestamp,
      postmortem_url text
    )
  `;
  await sql`
    create table if not exists app_error_events (
      id text primary key,
      district_id text references districts(id),
      severity text not null,
      source text not null,
      message text not null,
      route text not null,
      user_role text,
      trace_id text not null,
      context_json text,
      created_at timestamp not null
    )
  `;
  await sql`
    create table if not exists performance_events (
      id text primary key,
      district_id text references districts(id),
      route text not null,
      operation text not null,
      duration_ms integer not null,
      status text not null,
      trace_id text not null,
      created_at timestamp not null
    )
  `;
  await sql`
    create table if not exists sso_identity_providers (
      id text primary key,
      district_id text not null references districts(id),
      provider_name text not null,
      provider_type text not null default 'saml',
      issuer_url text,
      client_id text,
      metadata_url text,
      status text not null default 'draft',
      configured_by_user_id text,
      created_at timestamp not null,
      updated_at timestamp not null
    )
  `;
  await sql`
    insert into districts (id, name, state, privacy_contact_email, created_at)
    values (
      'district-lincoln-usd',
      coalesce(${process.env.BOOTSTRAP_DISTRICT_NAME ?? null}, 'Lincoln USD'),
      coalesce(${process.env.BOOTSTRAP_DISTRICT_STATE ?? null}, 'CA'),
      coalesce(${process.env.PRIVACY_CONTACT_EMAIL ?? null}, 'privacy@futurefund.local'),
      now()
    )
    on conflict (id) do nothing
  `;

  if (process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH) {
    await sql`
      insert into app_users (
        id, district_id, first_name, last_name, alias, profile_bio,
        profile_visible, display_name, email, status, created_at, updated_at
      )
      values (
        'bootstrap-admin', 'district-lincoln-usd', 'Bootstrap', 'Admin',
        'DistrictAdmin', '', true, 'Bootstrap Admin',
        ${process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase()}, 'active', now(), now()
      )
      on conflict (id) do nothing
    `;
    await sql`
      insert into user_credentials (
        id, user_id, email, password_hash, password_algorithm, force_reset,
        created_at, updated_at
      )
      values (
        'bootstrap-admin-credential', 'bootstrap-admin',
        ${process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase()},
        ${process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH}, 'bcrypt', false, now(), now()
      )
      on conflict (email) do nothing
    `;
    await sql`
      insert into role_assignments (
        id, user_id, role, scope, assigned_by_user_id, assigned_at
      )
      values (
        'bootstrap-admin-role', 'bootstrap-admin', 'Admin', 'District',
        'system', now()
      )
      on conflict (id) do nothing
    `;
  }

  console.log("Cloud Run database migration complete.");
} finally {
  await sql.end();
}
