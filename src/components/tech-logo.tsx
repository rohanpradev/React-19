import type { CSSProperties } from "react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

type TechLogoName =
	| "react"
	| "bun"
	| "typescript"
	| "react-router"
	| "shadcn"
	| "better-auth"
	| "tanstack";

type TechLogoSource =
	| string
	| {
			light: string;
			dark: string;
	  };

const techLogoSources: Record<TechLogoName, { label: string; source: TechLogoSource }> = {
	react: {
		label: "React",
		source: {
			light: "https://svgl.app/library/react_light.svg",
			dark: "https://svgl.app/library/react_dark.svg",
		},
	},
	bun: {
		label: "Bun",
		source: "https://svgl.app/library/bun.svg",
	},
	typescript: {
		label: "TypeScript",
		source: "https://svgl.app/library/typescript.svg",
	},
	"react-router": {
		label: "React Router",
		source: "https://svgl.app/library/reactrouter.svg",
	},
	shadcn: {
		label: "shadcn/ui",
		source: {
			light: "https://svgl.app/library/shadcn-ui.svg",
			dark: "https://svgl.app/library/shadcn-ui_dark.svg",
		},
	},
	"better-auth": {
		label: "Better Auth",
		source: {
			light: "https://svgl.app/library/better-auth_light.svg",
			dark: "https://svgl.app/library/better-auth_dark.svg",
		},
	},
	tanstack: {
		label: "TanStack",
		source: "https://svgl.app/library/tanstack.svg",
	},
};

function resolveSource(source: TechLogoSource, resolvedTheme: "light" | "dark") {
	return typeof source === "string" ? source : source[resolvedTheme];
}

export function TechLogo({
	name,
	className,
	style,
}: {
	name: TechLogoName;
	className?: string;
	style?: CSSProperties;
}) {
	const { resolvedTheme } = useTheme();
	const icon = techLogoSources[name];

	return (
		<img
			src={resolveSource(icon.source, resolvedTheme)}
			alt={icon.label}
			className={cn("h-4 w-4 shrink-0 object-contain", className)}
			loading="lazy"
			style={style}
		/>
	);
}

export function TechPill({ name, className }: { name: TechLogoName; className?: string }) {
	const icon = techLogoSources[name];

	return (
		<div
			className={cn(
				"inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm shadow-black/[0.03] backdrop-blur-xl",
				className,
			)}
		>
			<TechLogo name={name} />
			<span>{icon.label}</span>
		</div>
	);
}
