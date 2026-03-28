import type * as React from "react";
import { cn } from "@/lib/utils";

export function CodeBlock({
	className,
	...props
}: React.ComponentProps<"pre">) {
	return (
		<pre
			className={cn(
				"app-code-block overflow-x-auto rounded-[1.2rem] p-4 text-xs leading-6",
				className,
			)}
			{...props}
		/>
	);
}
