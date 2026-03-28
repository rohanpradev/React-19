import {
	and,
	asc,
	count,
	desc,
	eq,
	like,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import db from "@/db";
import { customersTable } from "@/db/schema";
import {
	type CustomerAutocompleteResponse,
	type CustomerListResponse,
	type CustomerPlan,
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
};

export function listCustomers(request: Request): CustomerListResponse {
	const query = parseCustomersRequest(request);
	const status = getCustomerFilterValue(query.filters, "status");
	const plan = getCustomerFilterValue(query.filters, "plan");
	const whereClause = buildCustomerWhereClause({
		search: query.search,
		status,
		plan,
	});
	const totalRows = Number(
		db.select({ value: count() }).from(customersTable).where(whereClause).get()
			?.value ?? 0,
	);
	const pageCount = totalRows === 0 ? 1 : Math.ceil(totalRows / query.pageSize);
	const pageIndex =
		totalRows === 0 ? 0 : Math.min(query.pageIndex, Math.max(pageCount - 1, 0));

	const rows = db
		.select()
		.from(customersTable)
		.where(whereClause)
		.orderBy(...buildOrderBy(query.sorting))
		.limit(query.pageSize)
		.offset(pageIndex * query.pageSize)
		.all();

	const summaryRow = db
		.select({
			matchedCustomers: count(),
			totalAnnualValue: sql<number>`coalesce(sum(${customersTable.annualValue}), 0)`,
			averageSeats: sql<number>`coalesce(round(avg(${customersTable.seats})), 0)`,
		})
		.from(customersTable)
		.where(whereClause)
		.get();

	const statusFacetRows = db
		.select({
			value: customersTable.status,
			total: count(),
		})
		.from(customersTable)
		.where(
			buildCustomerWhereClause({
				search: query.search,
				status: "",
				plan,
			}),
		)
		.groupBy(customersTable.status)
		.all();

	const planFacetRows = db
		.select({
			value: customersTable.plan,
			total: count(),
		})
		.from(customersTable)
		.where(
			buildCustomerWhereClause({
				search: query.search,
				status,
				plan: "",
			}),
		)
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
			sorting:
				query.sorting.length > 0 ? query.sorting : defaultCustomerSorting,
			filters: {
				status,
				plan,
			},
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
}

export function autocompleteCustomers(
	request: Request,
): CustomerAutocompleteResponse {
	const url = new URL(request.url);
	const query =
		url.searchParams
			.get("query")
			?.trim()
			.slice(0, MAX_AUTOCOMPLETE_QUERY_LENGTH) ?? "";
	const limit = clampInteger(
		Number(url.searchParams.get("limit")),
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
	const prefixPattern = `${query}%`;
	const total = Number(
		db.select({ value: count() }).from(customersTable).where(whereClause).get()
			?.value ?? 0,
	);
	const relevanceRank = sql<number>`case
		when ${customersTable.name} like ${prefixPattern} then 0
		when ${customersTable.company} like ${prefixPattern} then 1
		when ${customersTable.email} like ${prefixPattern} then 2
		else 3
	end`;
	const items = db
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
		)
		.limit(limit)
		.all();

	return {
		items,
		meta: {
			query,
			limit,
			total,
		},
	};
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
		const pattern = `%${search}%`;

		conditions.push(
			or(
				like(customersTable.name, pattern),
				like(customersTable.email, pattern),
				like(customersTable.company, pattern),
				like(customersTable.country, pattern),
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

	return clauses.length > 0 ? clauses : [desc(customersTable.lastSeenAt)];
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

function clampInteger(
	value: number,
	min: number,
	max: number,
	fallback: number,
) {
	if (!Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(Math.max(Math.trunc(value), min), max);
}
