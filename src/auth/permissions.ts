import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

export const roleNames = ["viewer", "editor", "admin"] as const;
export type AppRole = (typeof roleNames)[number];

const statements = {
	...defaultStatements,
	customers: ["read"],
	signals: ["read", "write"],
	access: ["read", "manage"],
} as const;

export const accessControl = createAccessControl(statements);

// Built-in account administration is deliberately ungranted. Role changes use
// the audited transactional service, which also protects the last administrator.
const reads = {
	user: [],
	session: [],
	customers: ["read"],
	signals: ["read"],
	access: [],
} as const;
export const appRoles = {
	viewer: accessControl.newRole(reads),
	editor: accessControl.newRole({ ...reads, signals: ["read", "write"] }),
	admin: accessControl.newRole({
		...reads,
		signals: ["read", "write"],
		access: ["read", "manage"],
	}),
};

export type AppPermission = Partial<{
	customers: readonly "read"[];
	signals: readonly ("read" | "write")[];
	access: readonly ("read" | "manage")[];
}>;

export const permissions = {
	customersRead: { customers: ["read"] },
	signalsRead: { signals: ["read"] },
	signalsWrite: { signals: ["write"] },
	accessRead: { access: ["read"] },
	accessManage: { access: ["manage"] },
} as const satisfies Record<string, AppPermission>;

export function isAppRole(value: unknown): value is AppRole {
	return typeof value === "string" && roleNames.includes(value as AppRole);
}

/** Unknown, empty and combined role values grant nothing. All requested actions must pass. */
export function hasPermission(role: unknown, permission: AppPermission): boolean {
	return isAppRole(role) && appRoles[role].authorize(permission).success;
}
