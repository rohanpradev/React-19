CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`status` text NOT NULL,
	`plan` text NOT NULL,
	`country` text NOT NULL,
	`annualValue` integer NOT NULL,
	`seats` integer NOT NULL,
	`lastSeenAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_email_unique` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `customers_status_idx` ON `customers` (`status`);--> statement-breakpoint
CREATE INDEX `customers_plan_idx` ON `customers` (`plan`);--> statement-breakpoint
CREATE INDEX `customers_last_seen_idx` ON `customers` (`lastSeenAt`);