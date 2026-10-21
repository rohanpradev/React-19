import type { Database } from "bun:sqlite";

import {
	type AppPermission,
	type AppRole,
	hasPermission,
	isAppRole,
	permissions,
} from "@/auth/permissions";
import type {
	AccessAuditEntry,
	AccessResponse,
	AccessUser,
	UpdateUserRoleRequest,
} from "@/lib/access";

import { readJsonBody, validateMutationOrigin } from "./requests";
import { privateJson } from "./responses";

const MAX_ACCESS_BODY_BYTES = 4 * 1024;

export class AccessError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		message: string,
	) {
		super(message);
		this.name = "AccessError";
	}
}

export type AccessActor = { userId: string; sessionId: string };
type UserRecord = AccessUser & { banned: number | null; banExpires: string | null };
type Pagination = { page: number; limit: number; auditPage: number; auditLimit: number };

/** Better Auth stores dates as ISO strings in this SQLite schema. Invalid ban dates deny access. */
export function isUserActive(
	user: { banned: number | null; banExpires: string | null },
	now = Date.now(),
) {
	if (!user.banned) return true;
	const expires = user.banExpires === null ? NaN : Date.parse(user.banExpires);
	return Number.isFinite(expires) && expires <= now;
}

/** No global database: this same authorization domain runs against isolated test databases. */
export function createAccessService(database: Database) {
	const findUser = database.query<UserRecord, [string]>(
		"SELECT id, name, email, role, banned, banExpires FROM user WHERE id = ?",
	);
	const findSession = database.query<
		{ userId: string; expiresAt: string; createdAt: string },
		[string]
	>("SELECT userId, expiresAt, createdAt FROM session WHERE id = ?");

	function assertActor(actor: AccessActor, permission: AppPermission, requireFresh = false) {
		const user = findUser.get(actor.userId);
		const session = findSession.get(actor.sessionId);
		const expires = session ? Date.parse(session.expiresAt) : NaN;
		if (
			!user ||
			!isUserActive(user) ||
			!session ||
			session.userId !== actor.userId ||
			!Number.isFinite(expires) ||
			expires <= Date.now()
		) {
			throw new AccessError(401, "unauthenticated", "Authentication required.");
		}
		if (!hasPermission(user.role, permission)) {
			throw new AccessError(403, "forbidden", "Your role does not allow this action.");
		}
		const created = Date.parse(session.createdAt);
		if (
			requireFresh &&
			(!Number.isFinite(created) || created > Date.now() || Date.now() - created > 10 * 60 * 1000)
		) {
			throw new AccessError(
				403,
				"reauthentication_required",
				"Sign out and sign in again before changing access.",
			);
		}
		return user;
	}

	function changeRole(
		user: AccessUser,
		role: AppRole,
		actorId: string,
		source: AccessAuditEntry["source"],
	) {
		const now = new Date().toISOString();
		database.query("UPDATE user SET role = ?, updatedAt = ? WHERE id = ?").run(role, now, user.id);
		// A demoted user's old browser must reauthenticate before receiving a new cache scope.
		database.query("DELETE FROM session WHERE userId = ?").run(user.id);
		database
			.query(
				"INSERT INTO access_audit (id, actorId, targetId, previousRole, nextRole, createdAt, source) VALUES (?, ?, ?, ?, ?, ?, ?)",
			)
			.run(crypto.randomUUID(), actorId, user.id, user.role, role, now, source);
		return { id: user.id, name: user.name, email: user.email, role };
	}

	const list = database.transaction(
		(actor: AccessActor, pagination: Pagination): AccessResponse => {
			assertActor(actor, permissions.accessRead);
			const users = database
				.query<AccessUser, [number, number]>(
					"SELECT id, name, email, role FROM user ORDER BY name COLLATE NOCASE, id LIMIT ? OFFSET ?",
				)
				.all(pagination.limit, (pagination.page - 1) * pagination.limit);
			const total =
				database.query<{ count: number }, []>("SELECT count(*) AS count FROM user").get()?.count ??
				0;
			const audit = database
				.query<AccessAuditEntry, [number, number]>(
					"SELECT id, actorId, targetId, previousRole, nextRole, createdAt, source FROM access_audit ORDER BY createdAt DESC, rowid DESC LIMIT ? OFFSET ?",
				)
				.all(pagination.auditLimit, (pagination.auditPage - 1) * pagination.auditLimit);
			const auditTotal =
				database.query<{ count: number }, []>("SELECT count(*) AS count FROM access_audit").get()
					?.count ?? 0;
			return { currentUserId: actor.userId, users, total, audit, auditTotal, ...pagination };
		},
	);

	const updateRole = database.transaction((actor: AccessActor, command: UpdateUserRoleRequest) => {
		assertActor(actor, permissions.accessManage, true);
		if (!parseRoleCommand(command))
			throw new AccessError(
				400,
				"invalid_role_command",
				"Provide a user ID, a single recognized role, and the expected current role.",
			);
		const target = findUser.get(command.userId);
		if (!target) throw new AccessError(404, "user_not_found", "The user no longer exists.");
		if (!isAppRole(target.role))
			throw new AccessError(
				409,
				"invalid_stored_role",
				"The user's stored role needs administrator repair.",
			);
		if (target.role !== command.expectedRole)
			throw new AccessError(
				409,
				"role_conflict",
				"This role changed. Refresh the list before saving again.",
			);
		if (target.role === command.role)
			return { id: target.id, name: target.name, email: target.email, role: target.role };
		if (target.role === "admin" && command.role !== "admin" && isUserActive(target)) {
			const activeAdministrators = database
				.query<UserRecord, []>(
					"SELECT id, name, email, role, banned, banExpires FROM user WHERE role = 'admin'",
				)
				.all()
				.filter((user) => isUserActive(user)).length;
			if (activeAdministrators <= 1)
				throw new AccessError(
					409,
					"last_admin",
					"The workspace must retain an active administrator.",
				);
		}
		if (target.id === actor.userId)
			throw new AccessError(
				409,
				"self_role_change",
				"Ask another administrator to change your role.",
			);
		return changeRole(target, command.role, actor.userId, "role-change");
	});

	const bootstrapAdministrator = database.transaction((userId: string) => {
		if (!isUserId(userId))
			throw new AccessError(400, "invalid_user_id", "A valid user ID is required.");
		const existing = database
			.query<{ id: string }, []>("SELECT id FROM user WHERE role = 'admin' LIMIT 1")
			.get();
		if (existing)
			throw new AccessError(
				409,
				"admin_exists",
				"An administrator already exists. Use Access management to assign roles.",
			);
		const target = findUser.get(userId);
		if (!target)
			throw new AccessError(
				404,
				"user_not_found",
				"The user does not exist. Create an account before bootstrapping it.",
			);
		if (!isUserActive(target) || !isAppRole(target.role))
			throw new AccessError(
				409,
				"invalid_bootstrap_user",
				"Bootstrap requires an active user with a recognized role.",
			);
		return changeRole(target, "admin", "local-bootstrap", "bootstrap");
	});

	return {
		// Call synchronously at the commit boundary of mutations that parsed an awaited request body.
		authorize: (actor: AccessActor, permission: AppPermission) => assertActor(actor, permission),
		list: (actor: AccessActor, pagination: Pagination) => list.deferred(actor, pagination),
		updateRole: (actor: AccessActor, command: UpdateUserRoleRequest) =>
			updateRole.immediate(actor, command),
		bootstrapAdministrator: (userId: string) => bootstrapAdministrator.immediate(userId),
	};
}

function isUserId(value: unknown): value is string {
	return (
		typeof value === "string" && value.length > 0 && value.length <= 256 && value.trim() === value
	);
}

function parseRoleCommand(value: unknown): UpdateUserRoleRequest | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	const body = value as Record<string, unknown>;
	if (Object.keys(body).some((key) => !["userId", "role", "expectedRole"].includes(key)))
		return null;
	if (!isUserId(body["userId"]) || !isAppRole(body["role"]) || !isAppRole(body["expectedRole"]))
		return null;
	return { userId: body["userId"], role: body["role"], expectedRole: body["expectedRole"] };
}

function parsePagination(request: Request): Pagination {
	const params = new URL(request.url).searchParams;
	function positiveInteger(name: string, fallback: number, maximum: number) {
		const values = params.getAll(name);
		if (values.length === 0) return fallback;
		const value = values[0];
		if (values.length !== 1 || !value || !/^[1-9]\d*$/.test(value) || Number(value) > maximum) {
			throw new AccessError(
				400,
				"invalid_pagination",
				`${name} must be a positive integer no greater than ${maximum}.`,
			);
		}
		return Number(value);
	}
	return {
		page: positiveInteger("page", 1, 1_000_000),
		limit: positiveInteger("limit", 25, 100),
		auditPage: positiveInteger("auditPage", 1, 1_000_000),
		auditLimit: positiveInteger("auditLimit", 20, 50),
	};
}

type AccessHandlersOptions = {
	service: ReturnType<typeof createAccessService>;
	resolveActor: (request: Request) => Promise<AccessActor | null>;
	canonicalOrigin: string;
};

export function createAccessHandlers({
	service,
	resolveActor,
	canonicalOrigin,
}: AccessHandlersOptions) {
	async function handle(action: () => Promise<Response>) {
		try {
			return await action();
		} catch (error) {
			if (error instanceof AccessError)
				return privateJson({ error: error.message, code: error.code }, { status: error.status });
			throw error;
		}
	}
	async function actorFor(request: Request) {
		const actor = await resolveActor(request);
		if (!actor) throw new AccessError(401, "unauthenticated", "Authentication required.");
		return actor;
	}
	return {
		list: (request: Request) =>
			handle(async () => {
				const actor = await actorFor(request);
				return privateJson(service.list(actor, parsePagination(request)));
			}),
		updateRole: (request: Request) =>
			handle(async () => {
				const originError = validateMutationOrigin(request, canonicalOrigin);
				if (originError) return originError;
				const actor = await actorFor(request);
				const body = await readJsonBody(request, MAX_ACCESS_BODY_BYTES);
				if (!body.ok) return body.response;
				const command = parseRoleCommand(body.value);
				if (!command)
					return privateJson(
						{
							error: "Provide a user ID, a single recognized role, and the expected current role.",
						},
						{ status: 400 },
					);
				return privateJson({ user: service.updateRole(actor, command) });
			}),
	};
}
