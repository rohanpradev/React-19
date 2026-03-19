import { count } from "drizzle-orm";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import db from "@/db";
import { customersTable, type NewCustomer } from "@/db/schema";
import { Temporal } from "@/lib/temporal";

const DAY_IN_MS = 86_400_000;

const firstNames = [
	"Ava",
	"Ethan",
	"Mia",
	"Noah",
	"Priya",
	"Luca",
	"Elena",
	"Julian",
	"Isla",
	"Arjun",
	"Sophia",
	"Leo",
	"Layla",
	"Owen",
	"Zoe",
	"Riya",
	"Mateo",
	"Nora",
	"Daniel",
	"Chloe",
] as const;

const lastNames = [
	"Patel",
	"Kim",
	"Garcia",
	"Nguyen",
	"Brown",
	"Singh",
	"Lopez",
	"Carter",
	"Alvarez",
	"Reed",
	"Sharma",
	"Walker",
	"Young",
	"Diaz",
	"Chen",
	"Rivera",
	"Hall",
	"Turner",
	"Adams",
	"Ramos",
] as const;

const companyPrefixes = [
	"Northstar",
	"Lattice",
	"Orbit",
	"Harbor",
	"Summit",
	"Atlas",
	"Crescent",
	"Beacon",
	"Nova",
	"Pulse",
	"Helix",
	"Meridian",
] as const;

const companySuffixes = [
	"Cloud",
	"Works",
	"Analytics",
	"Commerce",
	"Systems",
	"Labs",
	"Capital",
	"Logistics",
	"Health",
	"Studio",
] as const;

const countries = [
	"United States",
	"Canada",
	"United Kingdom",
	"Germany",
	"India",
	"Australia",
	"Netherlands",
	"Singapore",
	"Japan",
	"Brazil",
] as const;

const weightedStatuses = [
	"active",
	"active",
	"active",
	"trial",
	"paused",
	"churned",
] as const;

const weightedPlans = [
	"starter",
	"growth",
	"growth",
	"business",
	"enterprise",
] as const;

const baseAnnualValueByPlan = {
	starter: 3_600,
	growth: 14_400,
	business: 42_000,
	enterprise: 120_000,
} as const;

const baseSeatsByPlan = {
	starter: 3,
	growth: 12,
	business: 35,
	enterprise: 120,
} as const;

function seededRandom(seed: number) {
	const raw = Math.sin(seed * 12_989.271 + 78.233) * 43_758.5453;
	return raw - Math.floor(raw);
}

function pick<T>(values: readonly [T, ...T[]], seed: number) {
	return values[Math.floor(seededRandom(seed) * values.length)] ?? values[0];
}

function between(seed: number, min: number, max: number) {
	return Math.round(min + seededRandom(seed) * (max - min));
}

function toSlug(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export function buildCustomerSeedRows(totalRows = 240): NewCustomer[] {
	const now = Temporal.Now.instant().epochMilliseconds;

	return Array.from({ length: totalRows }, (_, index) => {
		const rowNumber = index + 1;
		const firstName = pick(firstNames, rowNumber * 11);
		const lastName = pick(lastNames, rowNumber * 17);
		const name = `${firstName} ${lastName}`;
		const company = `${pick(companyPrefixes, rowNumber * 23)} ${pick(companySuffixes, rowNumber * 29)}`;
		const status = pick(weightedStatuses, rowNumber * 31);
		const plan = pick(weightedPlans, rowNumber * 37);
		const country = pick(countries, rowNumber * 41);
		const annualValue =
			baseAnnualValueByPlan[plan] +
			between(
				rowNumber * 43,
				plan === "enterprise" ? 8_000 : 1_200,
				plan === "enterprise" ? 180_000 : 28_000,
			);
		const seats =
			baseSeatsByPlan[plan] +
			between(
				rowNumber * 47,
				0,
				plan === "enterprise" ? 220 : plan === "business" ? 60 : 24,
			);
		const inactivityDays =
			status === "churned"
				? between(rowNumber * 53, 45, 210)
				: status === "paused"
					? between(rowNumber * 53, 14, 90)
					: status === "trial"
						? between(rowNumber * 53, 0, 21)
						: between(rowNumber * 53, 0, 45);

		return {
			name,
			email: `${toSlug(firstName)}.${toSlug(lastName)}${rowNumber}@${toSlug(company)}.example`,
			company,
			status,
			plan,
			country,
			annualValue,
			seats,
			lastSeenAt: now - inactivityDays * DAY_IN_MS,
		};
	});
}

export function seedCustomers(totalRows = 240) {
	const existingCustomers = Number(
		db.select({ value: count() }).from(customersTable).get()?.value ?? 0,
	);

	if (existingCustomers > 0) {
		return 0;
	}

	db.insert(customersTable).values(buildCustomerSeedRows(totalRows)).run();
	return totalRows;
}

if (import.meta.main) {
	migrate(db, { migrationsFolder: "./drizzle" });

	const insertedRows = seedCustomers();
	console.log(
		insertedRows > 0
			? `Inserted ${insertedRows} demo customers.`
			: "Database already contains demo customers.",
	);
}
