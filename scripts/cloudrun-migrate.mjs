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
    create table if not exists credential_secret_values (
      credential_id text primary key,
      ciphertext text not null,
      iv text not null,
      auth_tag text not null,
      algorithm text not null default 'aes-256-gcm',
      key_version text not null default 'v1',
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
  // "View as student": an admin's session can point at a student account.
  await sql`alter table auth_sessions add column if not exists view_as_user_id text references app_users(id)`;
  await sql`alter table auth_sessions add column if not exists view_as_reason text`;
  await sql`alter table auth_sessions add column if not exists view_as_started_at timestamp`;

  // Teacher market changes (raise/lower a price, scenarios). One row per
  // class and symbol; student_user_ids_json null = the whole class, else only
  // those students. Active until cleared; never deleted.
  await sql`
    create table if not exists market_adjustments (
      id text primary key,
      event_id text not null,
      class_name text not null,
      student_user_ids_json text,
      ticker text not null,
      percent numeric(8, 3) not null,
      label text not null,
      news text not null default '',
      created_by_user_id text not null references app_users(id),
      created_at timestamp not null,
      cleared_at timestamp,
      cleared_by_user_id text
    )
  `;
  await sql`
    create index if not exists market_adjustments_active_idx
      on market_adjustments (class_name) where cleared_at is null
  `;

  // Learning quests (v0.2.9). Owned by the teacher who made them; every
  // teacher can see the shared library and copy from it. Never deleted.
  await sql`
    create table if not exists learning_quests (
      id text primary key,
      owner_user_id text not null references app_users(id),
      title text not null,
      objective text not null default '',
      market_mode text not null default 'none',
      market_symbols text not null default '',
      market_window text not null default '',
      require_reflection boolean not null default true,
      score_visibility text not null default 'hidden',
      criteria_json text not null default '[]',
      copied_from_quest_id text,
      created_at timestamp not null,
      updated_at timestamp not null
    )
  `;
  // A quest assigned to a class, with an optional due date.
  await sql`
    create table if not exists quest_assignments (
      id text primary key,
      quest_id text not null references learning_quests(id),
      class_name text not null,
      due_at timestamp,
      assigned_by_user_id text not null references app_users(id),
      assigned_at timestamp not null,
      unique (quest_id, class_name)
    )
  `;
  // One submission per student per assignment; editable until the due date.
  await sql`
    create table if not exists quest_submissions (
      id text primary key,
      assignment_id text not null references quest_assignments(id),
      student_user_id text not null references app_users(id),
      reflection text not null,
      submitted_at timestamp not null,
      updated_at timestamp not null,
      unique (assignment_id, student_user_id)
    )
  `;
  // Comments on a submission, by the student, their teacher, or an admin.
  await sql`
    create table if not exists quest_submission_comments (
      id text primary key,
      submission_id text not null references quest_submissions(id),
      author_user_id text not null references app_users(id),
      body text not null,
      created_at timestamp not null
    )
  `;

  // Quest grades (v0.2.15). One grade per student per assignment: points for
  // each scoring rule, a total, and feedback. A grade is a 'draft' (hidden
  // from the student) until a teacher releases it. submission_id is empty when
  // a teacher records a grade for a student who didn't submit.
  await sql`
    create table if not exists quest_grades (
      id text primary key,
      assignment_id text not null references quest_assignments(id),
      student_user_id text not null references app_users(id),
      submission_id text references quest_submissions(id),
      scores_json text not null,
      total_points integer not null,
      max_points integer not null,
      feedback text not null default '',
      status text not null default 'draft',
      graded_by_user_id text not null references app_users(id),
      graded_at timestamp not null,
      released_by_user_id text references app_users(id),
      released_at timestamp,
      unique (assignment_id, student_user_id)
    )
  `;

  // Messages (v0.2.10). A conversation is a one-to-one thread ('direct') or a
  // class discussion room ('room'). Messages are deleted after 90 days unless
  // someone ticked Keep (see lib/message-rules.ts and the cleanup job).
  await sql`
    create table if not exists conversations (
      id text primary key,
      kind text not null,
      title text not null default '',
      class_name text,
      created_by_user_id text not null references app_users(id),
      created_at timestamp not null
    )
  `;
  await sql`
    create table if not exists conversation_participants (
      conversation_id text not null references conversations(id),
      user_id text not null references app_users(id),
      last_read_at timestamp,
      primary key (conversation_id, user_id)
    )
  `;
  await sql`
    create table if not exists messages (
      id text primary key,
      conversation_id text not null references conversations(id),
      sender_user_id text not null references app_users(id),
      acting_admin_user_id text,
      body text not null,
      created_at timestamp not null
    )
  `;
  await sql`
    create index if not exists messages_conversation_idx on messages (conversation_id, created_at)
  `;
  // Keep is per person: a message is retained while anyone has kept it.
  await sql`
    create table if not exists message_keeps (
      message_id text not null references messages(id),
      user_id text not null references app_users(id),
      kept_at timestamp not null,
      primary key (message_id, user_id)
    )
  `;
  // A flag goes to the teacher first; they can resolve it or forward it.
  await sql`
    create table if not exists message_flags (
      id text primary key,
      message_id text not null references messages(id),
      flagged_by_user_id text references app_users(id),
      reason text not null,
      status text not null default 'open',
      created_at timestamp not null,
      handled_by_user_id text,
      handled_at timestamp,
      handled_note text not null default ''
    )
  `;
  await sql`
    create table if not exists message_flag_forwards (
      id text primary key,
      flag_id text not null references message_flags(id),
      forwarded_to_kind text not null,
      forwarded_to text not null,
      forwarded_by_user_id text not null references app_users(id),
      note text not null default '',
      email_status text not null default '',
      forwarded_at timestamp not null
    )
  `;
  // Email domains teachers may forward flagged messages to (set by admins).
  await sql`
    create table if not exists allowed_email_domains (
      domain text primary key,
      added_by_user_id text not null references app_users(id),
      added_at timestamp not null
    )
  `;
  // Parent / guardian emails: a teacher requests, an admin approves, and the
  // approved contact is added to the student's profile.
  await sql`
    create table if not exists alternate_contact_requests (
      id text primary key,
      student_user_id text not null references app_users(id),
      requested_by_user_id text not null references app_users(id),
      contact_name text not null,
      relationship text not null default '',
      contact_email text not null,
      note text not null default '',
      status text not null default 'pending',
      decided_by_user_id text,
      decided_at timestamp,
      decision_note text not null default '',
      created_at timestamp not null
    )
  `;
  await sql`
    create table if not exists student_alternate_contacts (
      id text primary key,
      student_user_id text not null references app_users(id),
      contact_name text not null,
      relationship text not null default '',
      contact_email text not null,
      added_by_user_id text not null references app_users(id),
      request_id text,
      created_at timestamp not null,
      removed_at timestamp,
      removed_by_user_id text
    )
  `;
  // Records when a daily job last ran, so only one instance runs it per day.
  await sql`
    create table if not exists maintenance_runs (
      name text primary key,
      last_run_at timestamp not null,
      details text not null default ''
    )
  `;

  // School year dates per district ("MM-DD"); default Aug 28 – Jun 1.
  await sql`
    create table if not exists district_settings (
      district_id text primary key references districts(id),
      school_year_start text not null default '08-28',
      school_year_end text not null default '06-01',
      updated_by_user_id text,
      updated_at timestamp not null
    )
  `;
  // Grade level per class (decides fractional shares). Null = not set.
  await sql`
    alter table class_market_configs add column if not exists grade_level integer
  `;
  // Stock info level per class (v0.2.11): 'basic' or 'full'. Null = use the
  // default for the class's grade level (Full for grades 9-12).
  await sql`
    alter table class_market_configs add column if not exists stock_info_level text
  `;

  // Life event cards (v0.2.17): a "wrench" a teacher throws at students'
  // cash. One row per play; one hit per student it touched. Undo reverses
  // every hit and sets undone_at.
  await sql`
    create table if not exists life_events (
      id text primary key,
      district_id text not null,
      class_name text not null,
      card_id text,
      title text not null,
      description text not null,
      prompt text not null default '',
      kind text not null,
      percent_of_starting_cash integer not null,
      target_type text not null,
      played_by_user_id text not null,
      played_at timestamp not null,
      undone_by_user_id text,
      undone_at timestamp
    )
  `;
  await sql`
    create index if not exists life_events_class_idx on life_events (district_id, class_name, played_at desc)
  `;
  await sql`
    create table if not exists life_event_hits (
      id text primary key,
      event_id text not null references life_events(id),
      portfolio_id text not null,
      student_user_id text not null,
      amount_cents bigint not null,
      capped boolean not null default false,
      cash_before_cents bigint not null,
      cash_after_cents bigint not null
    )
  `;
  await sql`
    create index if not exists life_event_hits_student_idx on life_event_hits (student_user_id)
  `;

  // Running market (v0.2.12). One clock per class: whether it is running or
  // paused, its speed, its hours, and the anchors simulated time is worked
  // out from. Prices are calculated from the clock, never stored.
  await sql`
    create table if not exists class_market_clocks (
      district_id text not null,
      class_name text not null,
      status text not null default 'running',
      speed integer not null default 1,
      hours text not null default 'always',
      sim_anchor_ms bigint not null,
      real_anchor_ms bigint not null,
      updated_by_user_id text,
      updated_at timestamp not null,
      primary key (district_id, class_name)
    )
  `;
  // Every clock change, kept so history can be replayed later (rewind).
  await sql`
    create table if not exists class_market_clock_events (
      id text primary key,
      district_id text not null,
      class_name text not null,
      action text not null,
      status text not null,
      speed integer not null,
      hours text not null,
      sim_ms bigint not null,
      real_ms bigint not null,
      actor_user_id text,
      created_at timestamp not null
    )
  `;
  await sql`
    create index if not exists class_market_clock_events_class_idx
    on class_market_clock_events (district_id, class_name, real_ms)
  `;

  // Student portfolios: one per student, per class, per school year (kind
  // 'class'), plus 'practice' portfolios for staff. Never deleted: past years
  // are the student's multi-year record. Money in cents; quantities in units
  // of 1/10,000 share.
  await sql`
    create table if not exists student_portfolios (
      id text primary key,
      user_id text not null references app_users(id),
      class_name text not null,
      school_year text not null,
      kind text not null default 'class',
      starting_cash_cents bigint not null,
      cash_cents bigint not null,
      reset_count integer not null default 0,
      created_at timestamp not null,
      updated_at timestamp not null,
      unique (user_id, class_name, school_year, kind)
    )
  `;
  await sql`
    create table if not exists portfolio_holdings (
      portfolio_id text not null references student_portfolios(id),
      ticker text not null,
      name text not null,
      quantity_units bigint not null,
      average_cost_cents numeric(18, 4) not null,
      updated_at timestamp not null,
      primary key (portfolio_id, ticker)
    )
  `;
  await sql`
    create table if not exists portfolio_activity (
      id text primary key,
      portfolio_id text not null references student_portfolios(id),
      kind text not null,
      ticker text,
      quantity_units bigint,
      price_cents bigint,
      amount_cents bigint,
      cash_after_cents bigint,
      note text not null default '',
      actor_user_id text,
      created_at timestamp not null
    )
  `;
  await sql`
    create index if not exists portfolio_activity_portfolio_idx
      on portfolio_activity (portfolio_id, created_at desc)
  `;
  await sql`
    create table if not exists portfolio_allocation_targets (
      portfolio_id text primary key references student_portfolios(id),
      targets_json text not null,
      updated_at timestamp not null
    )
  `;
  await sql`
    create table if not exists portfolio_value_snapshots (
      id text primary key,
      portfolio_id text not null references student_portfolios(id),
      value_cents bigint not null,
      cash_cents bigint not null,
      recorded_at timestamp not null
    )
  `;
  await sql`
    create index if not exists portfolio_value_snapshots_portfolio_idx
      on portfolio_value_snapshots (portfolio_id, recorded_at)
  `;
  // Teacher-requested portfolio resets, approved or denied by an admin.
  await sql`
    create table if not exists portfolio_reset_requests (
      id text primary key,
      portfolio_id text not null references student_portfolios(id),
      student_user_id text not null references app_users(id),
      requested_by_user_id text not null references app_users(id),
      reason text not null,
      status text not null default 'pending',
      decided_by_user_id text,
      decision_note text,
      created_at timestamp not null,
      decided_at timestamp
    )
  `;

  // Email delivery log. Stores who/what/status only, never message bodies,
  // because emails can contain student information.
  await sql`
    create table if not exists email_deliveries (
      id text primary key,
      kind text not null,
      recipient text not null,
      subject text not null,
      status text not null,
      provider text not null,
      provider_message_id text,
      error text,
      requested_by_user_id text,
      created_at timestamp not null
    )
  `;
  await sql`
    create index if not exists email_deliveries_created_at_idx
      on email_deliveries (created_at desc)
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
