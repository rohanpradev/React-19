import { runMigrations } from "@/db/migrations";
import { seedCustomers } from "@/db/seed";

let isInitialized = false;

export function initializeDatabase() {
	if (isInitialized) {
		return;
	}

	runMigrations();
	seedCustomers();

	isInitialized = true;
}
