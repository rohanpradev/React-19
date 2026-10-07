import { and, asc, count, desc, eq, or, type SQL, type SQLWrapper, sql } from "drizzle-orm";

import db from "@/db";
import { customersTable } from "@/db/schema";
import {
	type CustomerAutocompleteResponse,
	type CustomerListResponse,
	type CustomerPlan,
	type CustomerSortId,
	type CustomerStatus,
	type CustomerTableSorting,
	createFacetRecord,
	customerPlans,
	customerStatuses,
	defaultCustomerSorting,
	getCustomerFilterValue,
	parseCustomersRequest,
} from "@/lib/customer-table";

const DEFAULT_AUTOCOMPLETE_LIMIT = 8;
const MAX_AUTOCOMPLETE_LIMIT = 12;
const MAX_AUTOCOMPLETE_QUERY_LENGTH = 60;

const sortableColumns = {
	name: customersTable.name,
	company: customersTable.company,
	status: customersTable.status,
	plan: customersTable.plan,
	country: customersTable.country,
	annualValue: customersTable.annualValue,
	seats: customersTable.seats,
	lastSeenAt: customersTable.lastSeenAt,
} satisfies Record<CustomerSortId, SQLWrapper>;

export function listCustomers(request: Request): CustomerListResponse {
	const query = parseCustomersRequest(request);
	const status = getCustomerFilterValue(query.filters, "status");
	const plan = getCustomerFilterValue(query.filters, "plan");
	const whereClause = buildCustomerWhereClause({
		search: query.search,
		status,
		plan,
	});

	return db.transaction((tx) => {
		const totalRows = Number(
			tx.select({ value: count() }).from(customersTable).where(whereClause).get()?.value ?? 0,
		);
		const pageCount = totalRows === 0 ? 1 : Math.ceil(totalRows / query.pageSize);
		const pageIndex = totalRows === 0 ? 0 : Math.min(query.pageIndex, Math.max(pageCount - 1, 0));

		const rows = tx
			.select()
			.from(customersTable)
			.where(whereClause)
			.orderBy(...buildOrderBy(query.sorting))
			.limit(query.pageSize)
			.offset(pageIndex * query.pageSize)
			.all();

		const summaryRow = tx
			.select({
				matchedCustomers: count(),
				totalAnnualValue: sql<number>`coalesce(sum(${customersTable.annualValue}), 0)`,
				averageSeats: sql<number>`coalesce(round(avg(${customersTable.seats})), 0)`,
			})
			.from(customersTable)
			.where(whereClause)
			.get();

		const statusFacetRows = tx
			.select({ value: customersTable.status, total: count() })
			.from(customersTable)
			.where(buildCustomerWhereClause({ search: query.search, status: "", plan }))
			.groupBy(customersTable.status)
			.all();

		const planFacetRows = tx
			.select({ value: customersTable.plan, total: count() })
			.from(customersTable)
			.where(buildCustomerWhereClause({ search: query.search, status, plan: "" }))
			.groupBy(customersTable.plan)
			.all();

		return {
			rows,
			meta: {
				pageIndex,
				pageSize: query.pageSize,
				totalRows,
				pageCount,
				search: query.search,
				sorting: query.sorting.length > 0 ? query.sorting : defaultCustomerSorting,
				filters: { status, plan },
			},
			facets: {
				status: toFacetRecord(statusFacetRows, customerStatuses),
				plan: toFacetRecord(planFacetRows, customerPlans),
			},
			summary: {
				matchedCustomers: Number(summaryRow?.matchedCustomers ?? 0),
				totalAnnualValue: Number(summaryRow?.totalAnnualValue ?? 0),
				averageSeats: Number(summaryRow?.averageSeats ?? 0),
			},
		};
	});
}

export function autocompleteCustomers(request: Request): CustomerAutocompleteResponse {
	const url = new URL(request.url);
	const query = url.searchParams.get("query")?.trim().slice(0, MAX_AUTOCOMPLETE_QUERY_LENGTH) ?? "";
	const limit = clampInteger(
		Number(url.searchParams.get("limit") ?? DEFAULT_AUTOCOMPLETE_LIMIT),
		1,
		MAX_AUTOCOMPLETE_LIMIT,
		DEFAULT_AUTOCOMPLETE_LIMIT,
	);

	if (!query) {
		return {
			items: [],
			meta: {
				query: "",
				limit,
				total: 0,
			},
		};
	}

	const whereClause = buildCustomerWhereClause({
		search: query,
		status: "",
		plan: "",
	});
	const prefixPattern = toLikePattern(query, "prefix");

	const relevanceRank = sql<number>`case
		when ${likeEscaped(customersTable.name, prefixPattern)} then 0
		when ${likeEscaped(customersTable.company, prefixPattern)} then 1
		when ${likeEscaped(customersTable.email, prefixPattern)} then 2
		else 3
	end`;

	return db.transaction((tx) => {
		const total = Number(
			tx.select({ value: count() }).from(customersTable).where(whereClause).get()?.value ?? 0,
		);
		const items = tx
			.select({
				id: customersTable.id,
				name: customersTable.name,
				email: customersTable.email,
				company: customersTable.company,
				status: customersTable.status,
				plan: customersTable.plan,
				country: customersTable.country,
				lastSeenAt: customersTable.lastSeenAt,
			})
			.from(customersTable)
			.where(whereClause)
			.orderBy(
				asc(relevanceRank),
				desc(customersTable.lastSeenAt),
				asc(customersTable.name),
				asc(customersTable.id),
			)
			.limit(limit)
			.all();

		return { items, meta: { query, limit, total } };
	});
}

function buildCustomerWhereClause({
	search,
	status,
	plan,
}: {
	search: string;
	status: CustomerStatus | "";
	plan: CustomerPlan | "";
}) {
	const conditions: SQL[] = [];

	if (search) {
		const pattern = toLikePattern(search, "contains");

		conditions.push(
			or(
				likeEscaped(customersTable.name, pattern),
				likeEscaped(customersTable.email, pattern),
				likeEscaped(customersTable.company, pattern),
				likeEscaped(customersTable.country, pattern),
			) as SQL,
		);
	}

	if (status) {
		conditions.push(eq(customersTable.status, status));
	}

	if (plan) {
		conditions.push(eq(customersTable.plan, plan));
	}

	return conditions.length > 0 ? and(...conditions) : undefined;
}

function buildOrderBy(sorting: CustomerTableSorting) {
	const activeSorting = sorting.length > 0 ? sorting : defaultCustomerSorting;
	const clauses = activeSorting.map((entry) => {
		const column = sortableColumns[entry.id];
		return entry.desc ? desc(column) : asc(column);
	});

	return clauses.length > 0
		? [...clauses, asc(customersTable.id)]
		: [desc(customersTable.lastSeenAt), asc(customersTable.id)];
}

function likeEscaped(column: SQLWrapper, pattern: string) {
	return sql`${column} like ${pattern} escape '\\'`;
}

function toLikePattern(value: string, mode: "contains" | "prefix") {
	const escaped = value.replace(/[\\%_]/g, "\\$&");
	return mode === "contains" ? `%${escaped}%` : `${escaped}%`;
}

function toFacetRecord<T extends readonly string[]>(
	rows: Array<{ value: T[number]; total: number | string }>,
	values: T,
) {
	const record = createFacetRecord(values);

	for (const row of rows) {
		record[row.value] = Number(row.total);
	}

	return record;
}

function clampInteger(value: number, min: number, max: number, fallback: number) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(Math.max(Math.trunc(value), min), max);
}
