CREATE TABLE `access_audit` (
	`id` text PRIMARY KEY,
	`actorId` text NOT NULL,
	`targetId` text NOT NULL,
	`previousRole` text,
	`nextRole` text NOT NULL,
	`createdAt` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `access_audit_created_at_idx` ON `access_audit` (`createdAt`,`id`);
--> statement-breakpoint
ALTER TABLE `session` ADD `impersonatedBy` text;
--> statement-breakpoint
-- Add the constraint with the new column. Rebuilding the parent user table while
-- foreign keys are enabled would cascade-delete existing credentials/sessions.
ALTER TABLE `user` ADD `role` text DEFAULT 'viewer' NOT NULL CONSTRAINT "user_role_check" CHECK("role" in ('viewer', 'editor', 'admin'));
--> statement-breakpoint
ALTER TABLE `user` ADD `banned` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `user` ADD `banReason` text;
--> statement-breakpoint
ALTER TABLE `user` ADD `banExpires` text;
