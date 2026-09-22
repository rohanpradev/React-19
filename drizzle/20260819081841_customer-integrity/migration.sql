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
	`lastSeenAt` integer NOT NULL,
	CONSTRAINT "customers_status_check" CHECK("status" in ('active', 'paused', 'trial', 'churned')),
	CONSTRAINT "customers_plan_check" CHECK("plan" in ('starter', 'growth', 'business', 'enterprise')),
	CONSTRAINT "customers_annual_value_check" CHECK("annualValue" >= 0),
	CONSTRAINT "customers_seats_check" CHECK("seats" > 0),
	CONSTRAINT "customers_last_seen_at_check" CHECK("lastSeenAt" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_customers`(`id`, `name`, `email`, `company`, `status`, `plan`, `country`, `annualValue`, `seats`, `lastSeenAt`) SELECT `id`, `name`, `email`, `company`, `status`, `plan`, `country`, `annualValue`, `seats`, `lastSeenAt` FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `customers_status_idx` ON `customers` (`status`);--> statement-breakpoint
CREATE INDEX `customers_plan_idx` ON `customers` (`plan`);--> statement-breakpoint
CREATE INDEX `customers_last_seen_idx` ON `customers` (`lastSeenAt`);--> statement-breakpoint
CREATE INDEX `customers_status_plan_last_seen_idx` ON `customers` (`status`,`plan`,`lastSeenAt`);