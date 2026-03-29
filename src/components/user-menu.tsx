import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { type AuthSession, authClient } from "@/auth/client";
import { buildAuthHref } from "@/auth/redirects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
	session,
	className,
}: {
	session: AuthSession;
	className?: string;
}) {
	const navigate = useNavigate();
	const [isSigningOut, setIsSigningOut] = useState(false);
	const initials = getInitials(session.user.name, session.user.email);

	async function handleSignOut() {
		setIsSigningOut(true);

		try {
			await authClient.signOut();
			navigate(buildAuthHref("/react-19"), { replace: true });
		} finally {
			setIsSigningOut(false);
		}
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className={className}
					aria-label="Open account menu"
				>
					<span className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
						{initials}
					</span>
					<span className="hidden min-w-0 flex-1 text-left sm:block">
						<span className="block truncate text-sm font-medium">
							{session.user.name}
						</span>
						<span className="block truncate text-xs text-muted-foreground">
							{session.user.email}
						</span>
					</span>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-72">
				<DropdownMenuLabel className="space-y-1">
					<p className="truncate font-medium">{session.user.name}</p>
					<p className="truncate text-xs font-normal text-muted-foreground">
						{session.user.email}
					</p>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<div className="px-2 pb-2">
					<Badge variant="secondary" className="w-full justify-center">
						<ShieldCheck className="size-3.5" />
						Private workspace
					</Badge>
				</div>
				<DropdownMenuItem
					onSelect={(event) => {
						event.preventDefault();
						void handleSignOut();
					}}
					disabled={isSigningOut}
				>
					{isSigningOut ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<LogOut className="size-4" />
					)}
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function getInitials(name: string, email: string) {
	const source = name.trim() || email.trim();
	const parts = source.split(/\s+/).filter(Boolean);

	if (parts.length >= 2) {
		return `${parts[0]?.charAt(0) ?? ""}${parts[1]?.charAt(0) ?? ""}`.toUpperCase();
	}

	return source.slice(0, 2).toUpperCase();
}
