CREATE TABLE `admin_audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `app_error_events` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text,
	`severity` text NOT NULL,
	`source` text NOT NULL,
	`message` text NOT NULL,
	`route` text NOT NULL,
	`user_role` text,
	`trace_id` text NOT NULL,
	`context_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `app_users` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`school_id` text,
	`first_name` text DEFAULT '' NOT NULL,
	`last_name` text DEFAULT '' NOT NULL,
	`alias` text DEFAULT '' NOT NULL,
	`profile_bio` text DEFAULT '' NOT NULL,
	`profile_visible` integer DEFAULT true NOT NULL,
	`display_name` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_token_hash` text NOT NULL,
	`auth_method` text DEFAULT 'password' NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_sessions_token_hash` ON `auth_sessions` (`session_token_hash`);--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_user_id` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `classrooms` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`teacher_user_id` text NOT NULL,
	`name` text NOT NULL,
	`grade_band` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversation_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_user_id` text NOT NULL,
	`body` text NOT NULL,
	`moderation_status` text DEFAULT 'allowed' NOT NULL,
	`profanity_detected` integer DEFAULT false NOT NULL,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversation_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`display_name` text NOT NULL,
	`last_read_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text,
	`classroom_id` text,
	`title` text NOT NULL,
	`scope` text DEFAULT 'direct' NOT NULL,
	`kind` text NOT NULL,
	`text_only` integer DEFAULT true NOT NULL,
	`created_by_user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `districts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`state` text NOT NULL,
	`privacy_contact_email` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_quests` (
	`id` text PRIMARY KEY NOT NULL,
	`classroom_id` text,
	`district_id` text,
	`created_by_user_id` text NOT NULL,
	`title` text NOT NULL,
	`objective` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`score_visibility` text DEFAULT 'hidden' NOT NULL,
	`require_reflection` integer DEFAULT true NOT NULL,
	`is_district_template` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`status` text NOT NULL,
	`mastery_score` integer DEFAULT 0 NOT NULL,
	`submitted_at` integer,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`concept` text NOT NULL,
	`grade_band` text NOT NULL,
	`points` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_data_integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`provider_name` text NOT NULL,
	`endpoint_url` text NOT NULL,
	`status` text DEFAULT 'not_configured' NOT NULL,
	`allowed_symbols_csv` text DEFAULT '' NOT NULL,
	`max_symbols` integer DEFAULT 200 NOT NULL,
	`token_required` integer DEFAULT false NOT NULL,
	`token_secret_ref` text,
	`polling_frequency_minutes` integer DEFAULT 15 NOT NULL,
	`delayed_quotes` integer DEFAULT true NOT NULL,
	`configured_by_user_id` text,
	`last_health_check_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `market_integration_class_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`classroom_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`assigned_by_user_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`integration_id`) REFERENCES `market_data_integrations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `otel_span_events` (
	`id` text PRIMARY KEY NOT NULL,
	`trace_id` text NOT NULL,
	`span_name` text NOT NULL,
	`parent_span_id` text,
	`attributes_json` text DEFAULT '{}' NOT NULL,
	`duration_ms` integer NOT NULL,
	`exporter_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `password_reset_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`requested_by_user_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`requested_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `performance_events` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text,
	`route` text NOT NULL,
	`operation` text NOT NULL,
	`duration_ms` integer NOT NULL,
	`status` text NOT NULL,
	`trace_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `portfolio_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`activity_type` text NOT NULL,
	`vehicle` text NOT NULL,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`before_allocation_json` text,
	`after_allocation_json` text,
	`note` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`portfolio_id`) REFERENCES `simulated_portfolios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `portfolio_corrections` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`corrected_by_user_id` text NOT NULL,
	`correction_type` text NOT NULL,
	`before_snapshot_json` text NOT NULL,
	`after_snapshot_json` text NOT NULL,
	`audit_reason` text NOT NULL,
	`corrected_at` integer NOT NULL,
	FOREIGN KEY (`portfolio_id`) REFERENCES `simulated_portfolios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` text PRIMARY KEY NOT NULL,
	`portfolio_id` text NOT NULL,
	`vehicle` text NOT NULL,
	`symbol` text NOT NULL,
	`quantity` real NOT NULL,
	`average_price_cents` integer NOT NULL,
	FOREIGN KEY (`portfolio_id`) REFERENCES `simulated_portfolios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `privacy_posture_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`posture` text DEFAULT 'standard' NOT NULL,
	`privacy_contact_email` text NOT NULL,
	`state_code` text NOT NULL,
	`retention_policy` text DEFAULT 'standard' NOT NULL,
	`requires_integration_approval` integer DEFAULT false NOT NULL,
	`updated_by_user_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quest_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`quest_id` text NOT NULL,
	`classroom_id` text NOT NULL,
	`assigned_by_user_id` text NOT NULL,
	`due_at` integer,
	`assigned_at` integer NOT NULL,
	FOREIGN KEY (`quest_id`) REFERENCES `learning_quests`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quest_market_parameters` (
	`id` text PRIMARY KEY NOT NULL,
	`quest_id` text NOT NULL,
	`mode` text DEFAULT 'none' NOT NULL,
	`symbols_csv` text DEFAULT '' NOT NULL,
	`market_window` text DEFAULT '' NOT NULL,
	`scenario_prompt` text,
	FOREIGN KEY (`quest_id`) REFERENCES `learning_quests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quest_scoring_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`quest_id` text NOT NULL,
	`label` text NOT NULL,
	`points` integer NOT NULL,
	`visible_to_students` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`quest_id`) REFERENCES `learning_quests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quest_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`student_id` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`visible_score` integer,
	`teacher_score` integer,
	`reflection` text,
	`flagged_for_review` integer DEFAULT false NOT NULL,
	`submitted_at` integer,
	`reviewed_at` integer,
	FOREIGN KEY (`assignment_id`) REFERENCES `quest_assignments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `role_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`scope` text NOT NULL,
	`assigned_by_user_id` text NOT NULL,
	`assigned_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`name` text NOT NULL,
	`class_count` integer DEFAULT 0 NOT NULL,
	`student_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `simulated_portfolios` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`cash_cents` integer DEFAULT 0 NOT NULL,
	`total_value_cents` integer DEFAULT 0 NOT NULL,
	`risk_level` text DEFAULT 'balanced' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sso_identity_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`provider_name` text NOT NULL,
	`provider_type` text DEFAULT 'saml' NOT NULL,
	`issuer_url` text,
	`client_id` text,
	`metadata_url` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`configured_by_user_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sso_identity_providers_district_id` ON `sso_identity_providers` (`district_id`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`classroom_id` text NOT NULL,
	`display_name` text NOT NULL,
	`grade_level` integer NOT NULL,
	`readiness_score` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`reported_by_user_id` text NOT NULL,
	`category` text NOT NULL,
	`summary` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`support_contact_email` text NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_auth_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider_id` text,
	`provider_type` text DEFAULT 'password' NOT NULL,
	`provider_subject` text NOT NULL,
	`email` text NOT NULL,
	`last_seen_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`provider_id`) REFERENCES `sso_identity_providers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_auth_identities_provider_subject` ON `user_auth_identities` (`provider_type`,`provider_subject`);--> statement-breakpoint
CREATE INDEX `idx_user_auth_identities_user_id` ON `user_auth_identities` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_algorithm` text DEFAULT 'sha256' NOT NULL,
	`password_salt_ref` text,
	`force_reset` integer DEFAULT false NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_user_credentials_email` ON `user_credentials` (`email`);--> statement-breakpoint
CREATE INDEX `idx_user_credentials_user_id` ON `user_credentials` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_permission_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`permission` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`granted_by_user_id` text NOT NULL,
	`granted_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `app_users`(`id`) ON UPDATE no action ON DELETE no action
);
