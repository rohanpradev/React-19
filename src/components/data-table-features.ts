import {
	columnFilteringFeature,
	columnVisibilityFeature,
	globalFilteringFeature,
	rowPaginationFeature,
	rowSortingFeature,
	tableFeatures,
} from "@tanstack/react-table";

export const customerTableFeatures = tableFeatures({
	columnFilteringFeature,
	columnVisibilityFeature,
	globalFilteringFeature,
	rowPaginationFeature,
	rowSortingFeature,
});

export type CustomerTableFeatures = typeof customerTableFeatures;
