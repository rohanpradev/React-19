export const customerStatuses = [
	"active",
	"paused",
	"trial",
	"churned",
] as const;

export const customerPlans = [
	"starter",
	"growth",
	"business",
	"enterprise",
] as const;

export const customerFilterIds = ["status", "plan"] as const;

export const customerSortableColumns = [
	"name",
	"company",
	"status",
	"plan",
	"country",
	"annualValue",
	"seats",
	"lastSeenAt",
] as const;

export type CustomerStatus = (typeof customerStatuses)[number];
export type CustomerPlan = (typeof customerPlans)[number];
export type CustomerFilterId = (typeof customerFilterIds)[number];
export type CustomerSortId = (typeof customerSortableColumns)[number];

export type CustomerRow = {
	id: number;
	name: string;
	email: string;
	company: string;
	status: CustomerStatus;
	plan: CustomerPlan;
	country: string;
	annualValue: number;
	seats: number;
	lastSeenAt: number;
};

export type CustomerTableSorting = Array<{
	id: CustomerSortId;
	desc: boolean;
}>;

export type CustomerTableFilters = Array<
	| {
			id: "status";
			value: CustomerStatus;
	  }
	| {
			id: "plan";
			value: CustomerPlan;
	  }
>;

export type CustomerTableQuery = {
	pageIndex: number;
	pageSize: number;
	search: string;
	sorting: CustomerTableSorting;
	filters: CustomerTableFilters;
};

export type CustomerListResponse = {
	rows: CustomerRow[];
	meta: {
		pageIndex: number;
		pageSize: number;
		totalRows: number;
		pageCount: number;
		search: string;
		sorting: CustomerTableSorting;
		filters: {
			status: CustomerStatus | "";
			plan: CustomerPlan | "";
		};
	};
	facets: {
		status: Record<CustomerStatus, number>;
		plan: Record<CustomerPlan, number>;
	};
	summary: {
		matchedCustomers: number;
		totalAnnualValue: number;
		averageSeats: number;
	};
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const MAX_PAGE_INDEX = 10_000;
const MAX_SEARCH_LENGTH = 80;

export const defaultCustomerSorting = [
	{ id: "lastSeenAt", desc: true },
] satisfies CustomerTableSorting;

export function isCustomerSortId(value: string): value is CustomerSortId {
	return customerSortableColumns.includes(value as CustomerSortId);
}

export function isCustomerFilterId(value: string): value is CustomerFilterId {
	return customerFilterIds.includes(value as CustomerFilterId);
}

export function isCustomerStatus(value: string): value is CustomerStatus {
	return customerStatuses.includes(value as CustomerStatus);
}

export function isCustomerPlan(value: string): value is CustomerPlan {
	return customerPlans.includes(value as CustomerPlan);
}

export function buildCustomersSearchParams(query: CustomerTableQuery) {
	const params = new URLSearchParams();

	params.set(
		"pageIndex",
		String(clampInteger(query.pageIndex, 0, MAX_PAGE_INDEX, 0)),
	);
	params.set(
		"pageSize",
		String(clampInteger(query.pageSize, 5, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE)),
	);

	const normalizedSearch = query.search.trim().slice(0, MAX_SEARCH_LENGTH);
	if (normalizedSearch) {
		params.set("search", normalizedSearch);
	}

	if (query.sorting.length > 0) {
		params.set("sorting", JSON.stringify(query.sorting));
	}

	if (query.filters.length > 0) {
		params.set("filters", JSON.stringify(query.filters));
	}

	return params;
}

export function buildCustomersQueryString(query: CustomerTableQuery) {
	return buildCustomersSearchParams(query).toString();
}

export function parseCustomersSearchParams(
	searchParams: URLSearchParams,
): CustomerTableQuery {
	return {
		pageIndex: clampInteger(
			Number(searchParams.get("pageIndex")),
			0,
			MAX_PAGE_INDEX,
			0,
		),
		pageSize: clampInteger(
			Number(searchParams.get("pageSize")),
			5,
			MAX_PAGE_SIZE,
			DEFAULT_PAGE_SIZE,
		),
		search:
			searchParams.get("search")?.trim().slice(0, MAX_SEARCH_LENGTH) ?? "",
		sorting: parseCustomerSorting(searchParams.get("sorting")),
		filters: parseCustomerFilters(searchParams.get("filters")),
	};
}

export function parseCustomersRequest(request: Request) {
	const url = new URL(request.url);
	return parseCustomersSearchParams(url.searchParams);
}

export function createFacetRecord<T extends readonly string[]>(values: T) {
	return Object.fromEntries(values.map((value) => [value, 0])) as Record<
		T[number],
		number
	>;
}

export function getCustomerFilterValue(
	filters: CustomerTableFilters,
	id: "status",
): CustomerStatus | "";
export function getCustomerFilterValue(
	filters: CustomerTableFilters,
	id: "plan",
): CustomerPlan | "";
export function getCustomerFilterValue(
	filters: CustomerTableFilters,
	id: CustomerFilterId,
) {
	const activeFilter = filters.find((filter) => filter.id === id);
	return activeFilter?.value ?? "";
}

function parseCustomerSorting(rawValue: string | null) {
	const parsed = safeJsonParse(rawValue);

	if (!Array.isArray(parsed)) {
		return defaultCustomerSorting;
	}

	const normalizedSorting: CustomerTableSorting = [];

	for (const item of parsed) {
		if (
			!item ||
			typeof item !== "object" ||
			typeof item.id !== "string" ||
			typeof item.desc !== "boolean" ||
			!isCustomerSortId(item.id)
		) {
			continue;
		}

		normalizedSorting.push({
			id: item.id,
			desc: item.desc,
		});
	}

	return normalizedSorting.length > 0
		? normalizedSorting
		: defaultCustomerSorting;
}

function parseCustomerFilters(rawValue: string | null) {
	const parsed = safeJsonParse(rawValue);

	if (!Array.isArray(parsed)) {
		return [];
	}

	const normalizedFilters: CustomerTableFilters = [];

	for (const item of parsed) {
		if (
			!item ||
			typeof item !== "object" ||
			typeof item.id !== "string" ||
			typeof item.value !== "string" ||
			!isCustomerFilterId(item.id)
		) {
			continue;
		}

		if (item.id === "status" && isCustomerStatus(item.value)) {
			normalizedFilters.push({
				id: "status",
				value: item.value,
			});
		}

		if (item.id === "plan" && isCustomerPlan(item.value)) {
			normalizedFilters.push({
				id: "plan",
				value: item.value,
			});
		}
	}

	return normalizedFilters;
}

function safeJsonParse(rawValue: string | null) {
	if (!rawValue) {
		return null;
	}

	try {
		return JSON.parse(rawValue) as unknown;
	} catch {
		return null;
	}
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
