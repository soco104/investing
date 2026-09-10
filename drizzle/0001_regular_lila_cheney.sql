CREATE TABLE `backup_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text,
	`job_type` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`backup_location` text,
	`restore_tested_at` integer,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `data_retention_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`requested_by_user_id` text NOT NULL,
	`request_type` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending_review' NOT NULL,
	`export_location` text,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `incident_response_records` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text,
	`severity` text NOT NULL,
	`summary` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`owner_user_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`resolved_at` integer,
	`postmortem_url` text,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `moderation_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`district_id` text NOT NULL,
	`message_id` text NOT NULL,
	`reviewed_by_user_id` text NOT NULL,
	`action` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`status_after_review` text NOT NULL,
	`reviewed_at` integer NOT NULL,
	FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`message_id`) REFERENCES `conversation_messages`(`id`) ON UPDATE no action ON DELETE no action
);
