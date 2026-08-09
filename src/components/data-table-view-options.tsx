import type { Column, Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";

import type { CustomerTableFeatures } from "@/components/data-table-features";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getColumnLabel<TData extends Record<string, unknown>>(
	tableColumn: Column<CustomerTableFeatures, TData, unknown>,
) {
	const meta = tableColumn.columnDef.meta as { label?: string } | undefined;
	return meta?.label ?? tableColumn.id;
}

export function DataTableViewOptions<TData extends Record<string, unknown>>({
	table,
}: {
	table: Table<CustomerTableFeatures, TData>;
}) {
	const hideableColumns = table.getAllColumns().filter((column) => column.getCanHide());

	if (hideableColumns.length === 0) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="outline" size="sm" className="ml-auto">
					<Settings2 className="size-4" />
					View
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-44">
				<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{hideableColumns.map((column) => (
					<DropdownMenuCheckboxItem
						key={column.id}
						className="capitalize"
						checked={column.getIsVisible()}
						onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
					>
						{getColumnLabel(column)}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
