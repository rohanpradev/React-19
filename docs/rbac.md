# Workspace role-based access control

Reviewed against Better Auth **1.7.12** and its current official documentation on **October 21, 2026**. This document describes the implementation in this repository; it does not claim organization or tenant isolation.

## Model and policy

This application has one workspace. A user has exactly one of three roles stored in SQLite. Better Auth's Admin plugin supplies the server-owned role field and shared `createAccessControl` primitives. The application policy lives in `src/auth/permissions.ts`; server handlers, the auth configuration, and browser permission displays import the same definitions.

| Capability                                        | Viewer (`viewer`) | Editor (`editor`) | Administrator (`admin`) |
| ------------------------------------------------- | ----------------- | ----------------- | ----------------------- |
| Read customer APIs                                | Yes               | Yes               | Yes                     |
| Read platform signals                             | Yes               | Yes               | Yes                     |
| Update platform signals                           | No                | Yes               | Yes                     |
| List workspace users and access history           | No                | No                | Yes                     |
| Change another user's role                        | No                | No                | Yes                     |
| Change own role                                   | No                | No                | No                      |
| Built-in Admin-plugin user/session administration | No                | No                | No                      |

Learning examples and simulated interactions remain available to authenticated users. The permission boundary applies to protected server resources, including direct requests made outside the interface. Customer data and platform signals are shared workspace data. The latter remains an in-memory demonstration that resets when the server restarts.

The [Admin plugin's custom access control](https://better-auth.com/docs/plugins/admin#access-control) fits application-level roles. Its built-in user and session actions are ungranted, including `set-role`, account updates/deletion, impersonation, and changing other users' passwords. Do not add those permissions casually: they could bypass the custom access service's guarantees. No `adminUserIds` override is configured.

Unknown, blank, differently cased, and comma-separated role values grant no application permissions. Public signup and profile updates cannot select a role. Better Auth marks the role field as `input: false`; the application additionally forces Viewer in its final user-create database hook, including authentication-created social accounts. See [server-owned user fields](https://better-auth.com/docs/concepts/database#extending-core-schema).

## Establish the first Administrator

1. Run the application with its intended database and register the person who will administer the workspace.
2. Open **Account** and copy that account's user ID. Verify the account belongs to the intended person; a display name alone does not establish identity.
3. In a trusted local terminal configured for the same `DB_FILE_NAME`, run:

   ```sh
   bun run access:bootstrap --user-id <existing-user-id>
   ```

4. Sign in again. Bootstrap revokes all previous sessions for the promoted account. Open **Access Management** (`/access`) to manage other users.

The command requires an existing active account and refuses to run when any Administrator role already exists, including a banned Administrator. Promotion, audit insertion, and session revocation commit together. The bootstrap event identifies the selected account and has source `bootstrap`.

There is no bootstrap HTTP endpoint, first-registration promotion, administrator password, or administrator email environment variable. The local command relies on access to the application database, which is already an administrative trust boundary. Once initialized, use an authenticated Administrator to change roles. Keep at least two trusted Administrators for recovery; the command cannot replace a lost Administrator while that role still exists. A database operator must use a reviewed recovery procedure if all administrative accounts become inaccessible.

## Manage access

An Administrator can inspect the paginated user directory, choose a different role for another account, and review the recorded history. A role change requires an administrative session created within the previous **ten minutes**. If the interface requests reauthentication, sign out through Account and sign in again before retrying.

Each mutation runs in an SQLite `IMMEDIATE` transaction. Before writing, it rechecks the actor's persisted session, expiry, account state, current permission, and session creation time. It then checks the target's current role against `expectedRole`, prevents self-changes and removal of the last Administrator, updates the role, records an audit event, and deletes the target's sessions. All these database effects commit or roll back together.

The expected role prevents an old page from silently overwriting a concurrent role change. On a conflict, refresh the directory, review the current role, and submit again if the change is still appropriate. Changing to the already-current role is a no-op and creates neither an audit event nor a session revocation.

Every actual promotion or demotion requires the affected user to sign in again. Browser session reads and protected API authorization consult the database; cookie session caching is disabled. Signal writes also recheck permission after reading the streamed request body, immediately before changing state. Previously rendered information can remain visible until the browser next checks the session or makes a request; revocation cannot retract data already delivered or work already committed. See [Better Auth session management](https://better-auth.com/docs/concepts/session-management).

## API contracts

All access responses use private `no-store` caching. Authentication failure returns `401`; an authenticated account without the required permission receives `403`. Supported read methods are `GET` and `HEAD`; unsupported methods return `405` with `Allow`.

### Read users and audit

```http
GET /api/access?page=1&limit=25&auditPage=1&auditLimit=20
```

Requires `access:read`. The response contains `currentUserId`, `users`, `total`, `page`, `limit`, `audit`, `auditTotal`, `auditPage`, and `auditLimit`. User entries expose `id`, `name`, `email`, and `role`. User limits are at most 100; audit limits are at most 50. Page numbers are positive integers capped at 1,000,000.

Audit entries contain an event ID, actor ID, target ID, previous role, next role, timestamp, and source (`bootstrap` or `role-change`). Bootstrap uses `local-bootstrap` as its actor ID. The API does not expose session tokens, passwords, OAuth credentials, or database connection details.

### Change another user's role

```http
PATCH /api/access/roles
Content-Type: application/json
Origin: <canonical application origin>

{"userId":"existing-user-id","role":"editor","expectedRole":"viewer"}
```

Requires `access:manage`, a fresh session, trusted origin evidence, and valid JSON within the shared 4 KiB streamed-body limit. `role` and `expectedRole` must each be one exact known role. Success returns `{ "user": { "id", "name", "email", "role" } }` with the updated account values.

Invalid input returns `400`, an unknown user returns `404`, and role conflicts or protected Administrator invariants return `409`. Incorrect media types and bodies over the limit return `415` and `413`, respectively. A stale administrative session returns `403` with code `reauthentication_required`; sign out and in to create a fresh session. A rejected operation leaves roles, audit history, and sessions unchanged.

## Migration and audit ownership

Startup applies the checked-in Drizzle migration before serving requests. The migration adds the Admin plugin's user/session fields and the access audit table. Existing accounts receive Viewer access; it does not infer privilege from old profile information or account age. Back up a persistent database before deploying schema changes.

The audit records accepted privilege changes, with no application endpoint for editing or deleting history. It is a transactional application log, not a cryptographically tamper-proof ledger. A process or person with direct database access can change roles or history. Production deployments needing independent retention should export events to a separately controlled audit system and define a retention/access policy there. Failed authorization attempts are not inserted into this successful-change history.

The schema includes plugin ban and impersonation fields for compatibility. This workspace does not grant administrative ban or impersonation operations. Self-service account deletion remains disabled so it cannot undermine the final-Administrator guarantee.

## Extend the policy safely

Add resource/action definitions and role grants in `src/auth/permissions.ts`, then require that permission in the corresponding server handler. Browser checks only shape the interface. For writes that can outlive asynchronous validation, check permission again at the mutation boundary. Preserve session revocation and the single transaction when extending role management.

If the product gains independent customer workspaces, migrate to [organization-scoped membership and permissions](https://better-auth.com/docs/plugins/organization#access-control). Add an organization owner to each record and scope every query and mutation to an authorized organization. Changing the role names alone cannot provide tenant isolation. Runtime-defined roles, teams, invitations, and external policy systems should be introduced only with requirements and corresponding threat-model tests.

Run `bun run validate` after changing the policy, authentication configuration, migrations, or access handlers. The regression suite covers authorization and mutation invariants; production probes exercise the real HTTP boundary. Review tests and the current validation report for executed coverage rather than inferring it from this design document.
