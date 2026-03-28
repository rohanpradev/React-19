import type { Column } from "@tanstack/react-table";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	EyeOff,
	MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type DataTableColumnHeaderProps<TData, TValue> = {
	column: Column<TData, TValue>;
	title: string;
	className?: string;
};

export function DataTableColumnHeader<TData, TValue>({
	column,
	title,
	className,
}: DataTableColumnHeaderProps<TData, TValue>) {
	const canSort = column.getCanSort();
	const canHide = column.getCanHide();

	if (!canSort && !canHide) {
		return <div className={cn(className)}>{title}</div>;
	}

	return (
		<div className={cn("flex items-center gap-2", className)}>
			{canSort ? (
				<Button
					variant="ghost"
					size="sm"
					className="-ml-3 h-8 px-3 text-muted-foreground hover:text-foreground"
					onClick={(event) =>
						column.toggleSorting(column.getIsSorted() === "asc", event.shiftKey)
					}
				>
					<span>{title}</span>
					{column.getIsSorted() === "desc" ? (
						<ArrowDown className="size-4" />
					) : column.getIsSorted() === "asc" ? (
						<ArrowUp className="size-4" />
					) : (
						<ArrowUpDown className="size-4 opacity-60" />
					)}
				</Button>
			) : (
				<div className="px-0 text-sm font-medium">{title}</div>
			)}

			{canHide ? (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className="size-7 text-muted-foreground hover:text-foreground"
						>
							<MoreHorizontal className="size-4" />
							<span className="sr-only">Open column menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						{canSort ? (
							<>
								<DropdownMenuItem onClick={() => column.toggleSorting(false)}>
									<ArrowUp className="size-4" />
									Asc
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => column.toggleSorting(true)}>
									<ArrowDown className="size-4" />
									Desc
								</DropdownMenuItem>
								<DropdownMenuSeparator />
							</>
						) : null}
						<DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
							<EyeOff className="size-4" />
							Hide column
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			) : null}
		</div>
	);
}
