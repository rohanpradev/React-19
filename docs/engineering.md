# Engineering contracts

Reviewed October 21, 2026. This document explains the decisions that the code and verification harness enforce. Dependency/release review dates are separate from the dated validation and browser results in the README.

## Architecture

Bun owns the HTTP server, API boundary, SQLite connection, and build. React Router Data Mode owns navigation and route recovery. TanStack Query owns API-backed server state inside one authenticated session. Components own transient interaction state. This keeps the current application small enough to inspect without adding another server framework.

Data Mode is intentional: [React Router's mode guide](https://reactrouter.com/start/modes) supports retaining bundler/server control while using loaders, pending states, and actions. Adopt Framework Mode when server rendering, route type generation, or framework deployment conventions become requirements. React's stable APIs remain the baseline; see the [React 19.3 release](https://react.dev/blog/2026/09/09/react-19-3).

## Recovery and state ownership

Boot failures show a reload path before the router is available. Root session-loading failures use the root route boundary. Individual page failures use a nested boundary, preserving the shell and its navigation. A hard reload recovers stale deployment chunks; no automatic reload loop hides a persistent failure.

Every authenticated session gets a new Query client. HTTP failures retain their status; cancellation signals reach fetch and are checked again before publishing a response. Retry policy distinguishes permanent HTTP failures from transient reads; mutations have no implicit retries. Confirmed writes update the cache before invalidation so a failed refresh cannot erase a successful save.

These choices follow [Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation), [mutation response updates](https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses), and maintainer TkDodo's [Practical React Query](https://tkdodo.eu/blog/practical-react-query). Query [5.104.5's release](https://github.com/TanStack/query/releases/tag/release-2026-10-19-1659) corrects optimistic-fetch options and mutation snapshots. Review cache ownership and retry behavior when changing query defaults.

## Trust boundary

Better Auth verifies identity; custom API handlers verify sessions on the server. Browser session reads and API authorization use the authoritative database. Disabling the presentation-cookie cache prevents a revoked cached session from bouncing between sign-in and an API that correctly rejects it. A migration regression issues old cached cookies and verifies both ordinary browser session reads and protected authorization after remote revocation.

Authorization is a separate decision from identity. The shared policy uses Better Auth's `createAccessControl` with Viewer, Editor, and Administrator roles. Read access to customers and signals is explicit; Editor and Administrator can update signals; Administrator can manage workspace access. Unknown and comma-separated roles grant no application permissions. The migration and every authentication-created account start as Viewer.

The [Admin plugin](https://better-auth.com/docs/plugins/admin#access-control) matches the current single-workspace model. Its built-in user/session administration permissions are deliberately empty for all three roles. The custom access service is the only HTTP route for role changes, so audits, session revocation, stale-write protection, and the final-administrator invariant cannot be bypassed through a second role-changing endpoint. The server rechecks the actor's live session and role inside the SQLite write transaction. Public profile and signup payloads cannot set the plugin's protected role field; a final user-create hook also forces Viewer for new authentication accounts.

The first Administrator requires an explicit local command against an existing user ID. It refuses an already-initialized workspace, promotes the selected account, writes its bootstrap audit event, and revokes its sessions in one transaction. No email allowlist or registration-order rule confers privilege. See [the RBAC contract](rbac.md) for the operational steps and endpoint details.

These roles apply to the whole workspace. If the product adds separate customer workspaces, adopt the [Organization plugin](https://better-auth.com/docs/plugins/organization#access-control), scope records and queries by organization, and enforce membership plus permissions for each request. An application role alone is not a tenant-isolation boundary.

Auth responses retain every Set-Cookie header and use `no-store`. Request-socket IPs replace client-supplied `x-real-ip`; deployments behind an edge must explicitly configure a trusted overwritten header. Secret rotation retains decryption keys in order. See [Better Auth security](https://better-auth.com/docs/reference/security) and [session management](https://better-auth.com/docs/concepts/session-management).

[Better Auth 1.7.12](https://github.com/better-auth/better-auth/releases/tag/v1.7.12) tightens JWT algorithm/key matching, OAuth-proxy issuer/nonce checks, and ID-token audience and timestamp validation. Its explicit configuration action applies to ID-token providers missing a `clientId`: supply every accepted app client ID. This workspace already requires client IDs and secrets for Google/GitHub, disables session cookie caching, and does not enable the JWT, OAuth proxy, SSO, or MCP plugins. The release lists no schema migration. Recheck accepted audiences before adding native/mobile ID-token clients, and verify real-provider callbacks with deployment credentials.

Custom read endpoints support GET/HEAD and return 405 with Allow for unsupported methods. Cookie-authenticated signal writes require canonical-origin evidence, JSON media types, valid UTF-8/JSON, and a maximum of 4 KiB of actual streamed bytes. Validation completes before mutation. The server-wide limit is 64 KiB; file uploads are browser simulations and do not bypass that budget. New upload features need a deliberately separate streaming/storage design.

## Delivery and lifecycle

The browser/server build boundary is physical: only `dist/public` is served. The private manifest explicitly identifies content-hashed immutable assets. Stable filenames and SPA documents revalidate using content-derived ETags; error responses cannot enter shared caches. [Bun's HTML build docs](https://bun.sh/docs/bundler/html-static) describe the build primitives; [RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.5) defines the cache directives.

`/healthz` performs a database readiness query and returns minimal status. Production shutdown stops new work, drains active responses, forces connection closure at ten seconds, and then closes SQLite. Connection-drain tests cover a real delayed response plus timeout and repeated-signal behavior. See [Bun server lifecycle](https://bun.sh/docs/runtime/http/server).

## Verification

`src/tooling/validate.ts` is the shared local/CI entry point. Its plan names each stage and sets execution deadlines. Independent failures are collected into one report; the production probe explicitly depends on a successful build. Signals cancel the active stage and prevent later stages from starting. `.cache/validation/latest.json` records metadata and results, with command output retained in the caller's log.

The production probe launches a built server with disposable credentials and an isolated database. Every request has a deadline and the server subprocess has a final lifetime cap. It checks all manifest-listed assets, protected/private paths, real session revocation, and rejected-write integrity. This follows the isolation and observable-behavior principles in [Playwright's testing guidance](https://playwright.dev/docs/best-practices), implemented here with Bun's native HTTP/process tools. [Bun's subprocess docs](https://bun.sh/docs/runtime/child-process) define cancellation and timeout behavior.

Use `validate:quick` while editing, `validate` before review, and `validate:ci` for the advisory audit. The latter requires registry network access. Socket tests need localhost access. Browser behavior, OAuth callbacks, and the Docker image are separate checks: passing types and HTTP probes alone does not verify those interfaces.

## Upgrade workflow

1. Check actual registry dist-tags and primary release notes, including runtime, compiler, types, UI primitives, auth, and CI actions. Update the manifest and lockfile together.
2. Prefer stable releases. Keep Drizzle ORM/Kit paired at the explicit v1 RC until a planned stable migration; follow the [Drizzle upgrade guide](https://orm.drizzle.team/docs/upgrade-v1), validate its migration graph, and back up persistent data.
3. Install the frozen lockfile. Review compatibility and advisory output; fix the root cause of regressions rather than suppressing checks.
4. Run the shared validation pipeline. For runtime/auth/router changes also verify browser recovery and session lifecycle, real-provider callbacks where configured, and the Docker image in CI.
5. Update `src/lib/official-docs.ts` with the verification date and links that support the changes. `package.json` supplies displayed version baselines; avoid independent hardcoded version cards.

Bun 1.4.3 supplies the built-in checker ([release notes](https://bun.sh/blog/release-notes/bun-v1.4.3)). Stable [TypeScript 7](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) supplies the second compiler check and editor server. CI reads Bun's version from `package.json`; the Docker base and Bun types must stay aligned. Zed's integration follows its [official TypeScript extension configuration](https://github.com/zed-extensions/tsgo).

On October 21, Bun's [official latest release](https://github.com/oven-sh/bun/releases/latest) still resolved to 1.4.3. [Lucide 1.60.0](https://github.com/lucide-icons/lucide/releases/tag/1.60.0) adds icons and lists no React API migration; the installed version remains the shared source for icon components.

## Extension points

The platform-signal endpoint intentionally demonstrates shared in-memory collaborative state. Production multi-user features need persistent storage, ownership checks, concurrency control, and relevant migrations. The upload manager simulates transfers. Add actual streaming and durable storage before describing it as a production upload service.

Keep new features inside the existing ownership boundaries until concrete requirements justify introducing another framework or service. Add regression coverage for failures that could lose data, cross sessions, expose private files, or prevent recovery. Check the user-visible interface in a browser when changing interactions or navigation.
