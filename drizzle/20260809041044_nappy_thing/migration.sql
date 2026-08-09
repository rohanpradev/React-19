PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_session` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`token` text NOT NULL UNIQUE,
	`expiresAt` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL,
	CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_session`(`id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt`) SELECT `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt` FROM `session`;--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
ALTER TABLE `__new_session` RENAME TO `session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`(`id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`) SELECT `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt` FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`company` text NOT NULL,
	`status` text NOT NULL,
	`plan` text NOT NULL,
	`country` text NOT NULL,
	`annualValue` integer NOT NULL,
	`seats` integer NOT NULL,
	`lastSeenAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_customers`(`id`, `name`, `email`, `company`, `status`, `plan`, `country`, `annualValue`, `seats`, `lastSeenAt`) SELECT `id`, `name`, `email`, `company`, `status`, `plan`, `country`, `annualValue`, `seats`, `lastSeenAt` FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `session_token_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `user_email_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `customers_email_unique`;--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE INDEX `customers_status_idx` ON `customers` (`status`);--> statement-breakpoint
CREATE INDEX `customers_plan_idx` ON `customers` (`plan`);--> statement-breakpoint
CREATE INDEX `customers_last_seen_idx` ON `customers` (`lastSeenAt`);