import { isAppRole } from "@/auth/permissions";
import { Badge } from "@/components/ui/badge";

export function roleLabel(role: unknown) {
	return isAppRole(role) ? role.charAt(0).toUpperCase() + role.slice(1) : "No assigned role";
}

export function RoleBadge({ role }: { role: unknown }) {
	return <Badge variant={role === "admin" ? "secondary" : "outline"}>{roleLabel(role)}</Badge>;
}
