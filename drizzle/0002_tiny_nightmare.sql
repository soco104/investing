ALTER TABLE `password_reset_requests` ADD `reset_token_hash` text;--> statement-breakpoint
ALTER TABLE `password_reset_requests` ADD `expires_at` integer;