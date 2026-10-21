import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { accessControl, appRoles } from "@/auth/permissions";

export const authClient = createAuthClient({
	basePath: "/api/auth",
	plugins: [adminClient({ ac: accessControl, roles: appRoles })],
});

export type AuthSession = typeof authClient.$Infer.Session;
