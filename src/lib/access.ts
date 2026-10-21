import type { AppRole } from "@/auth/permissions";

export type AccessUser = {
	id: string;
	name: string;
	email: string;
	role: AppRole;
};

export type AccessAuditEntry = {
	id: string;
	actorId: string;
	targetId: string;
	previousRole: AppRole | null;
	nextRole: AppRole;
	createdAt: string;
	source: "bootstrap" | "role-change";
};

export type AccessResponse = {
	currentUserId: string;
	users: AccessUser[];
	total: number;
	page: number;
	limit: number;
	audit: AccessAuditEntry[];
	auditTotal: number;
	auditPage: number;
	auditLimit: number;
};

export type UpdateUserRoleRequest = {
	userId: string;
	role: AppRole;
	expectedRole: AppRole;
};

export type UpdateUserRoleResponse = { user: AccessUser };
