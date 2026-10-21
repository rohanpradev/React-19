import { expect, test } from "bun:test";

import { appRoles, hasPermission, permissions, roleNames } from "./permissions";

test("the role matrix grants each capability explicitly", () => {
	for (const role of roleNames) {
		expect(hasPermission(role, permissions.customersRead)).toBe(true);
		expect(hasPermission(role, permissions.signalsRead)).toBe(true);
		expect(hasPermission(role, permissions.signalsWrite)).toBe(role !== "viewer");
		expect(hasPermission(role, permissions.accessRead)).toBe(role === "admin");
		expect(hasPermission(role, permissions.accessManage)).toBe(role === "admin");
	}
});

test("unknown and combined roles fail closed, including empty permission requests", () => {
	for (const role of [
		undefined,
		null,
		"",
		"user",
		"owner",
		"admin,viewer",
		"__proto__",
		["admin"],
	]) {
		expect(hasPermission(role, permissions.signalsRead)).toBe(false);
		expect(hasPermission(role, permissions.accessManage)).toBe(false);
	}
	expect(hasPermission("admin", {})).toBe(false);
	expect(hasPermission("editor", { signals: ["write"], access: ["manage"] })).toBe(false);
});

test("even administrators cannot bypass the guarded service through plugin operations", () => {
	for (const role of Object.values(appRoles)) {
		for (const action of [
			"set-role",
			"update",
			"create",
			"delete",
			"ban",
			"impersonate",
		] as const) {
			expect(role.authorize({ user: [action] }).success).toBe(false);
		}
		expect(role.authorize({ session: ["revoke"] }).success).toBe(false);
	}
});
