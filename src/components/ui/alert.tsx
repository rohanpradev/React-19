import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
	"relative grid w-full items-start gap-x-3 gap-y-1 rounded-[1.25rem] border px-4 py-4 text-sm shadow-sm supports-[backdrop-filter]:backdrop-blur-sm [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3",
	{
		variants: {
			variant: {
				default: "border-border/70 bg-background/82 text-foreground",
				info: "border-primary/15 bg-primary/10 text-foreground [&>svg]:text-primary",
				success:
					"border-success/15 bg-success/10 text-foreground [&>svg]:text-success",
				destructive:
					"border-destructive/20 bg-destructive/10 text-destructive [&_[data-slot=alert-description]]:text-destructive/85",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Alert({
	className,
	variant,
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
	return (
		<div
			role="alert"
			data-slot="alert"
			data-variant={variant}
			className={cn(alertVariants({ variant }), className)}
			{...props}
		/>
	);
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-title"
			className={cn("font-medium leading-none tracking-tight", className)}
			{...props}
		/>
	);
}

function AlertDescription({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-description"
			className={cn("text-muted-foreground leading-6", className)}
			{...props}
		/>
	);
}

export { Alert, AlertDescription, AlertTitle };
