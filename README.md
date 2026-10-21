# React Systems Studio

A full-stack React/Bun workspace for learning, testing, and extending modern frontend systems. One Bun server delivers a split React application, authenticated APIs, Better Auth, Drizzle, and SQLite.

## Start

Install **Bun 1.4.3 or later**, then:

```sh
bun ci
bun dev
```

Open `http://localhost:3000`. Register a local account to enter the workspace as a **Viewer**. Development works without OAuth credentials. See `.env.example` for optional configuration; never commit secrets or SQLite files.

```sh
bun start                 # Build and run production locally; requires production auth configuration
bun run validate:quick    # Lint, Bun types, migrations, regression tests
bun run validate          # Also check TypeScript, build, and exercise the production server
bun run validate:ci       # Full validation plus the online dependency security audit
```

## Workspace access

Better Auth's Admin plugin and a shared access-control policy define three application roles:

| Role | Permissions |
| --- | --- |
| Viewer | Read customers and platform signals; use learning examples |
| Editor | Viewer permissions plus updating platform signals |
| Administrator | Editor permissions plus managing workspace roles and reading the access audit |

New accounts and existing accounts upgraded by the migration start as Viewers. Roles are enforced by the server on protected API requests. The browser uses the same policy to explain permissions and hide unavailable controls.

To establish the **first Administrator**, register the intended account, copy its user ID from Account, and run this command against the same database as the application:

```sh
bun run access:bootstrap --user-id <existing-user-id>
```

The local command works only while no Administrator exists. It records an audit entry and revokes that user's existing sessions; sign in again afterward. There is no first-signup promotion or administrator email setting. Administrators can then manage other accounts from **Access Management**. Every role change revokes the affected user's sessions, so they must sign in again.

See [docs/rbac.md](docs/rbac.md) for the permission matrix, setup, API contracts, migration behavior, and security boundaries.

## Current baseline

Direct registry tags and official release guidance were checked on **October 21, 2026**. The lockfile is part of the upgrade contract.

| Area | Baseline |
| --- | --- |
| Runtime/package manager | Bun 1.4.3 |
| UI | React/React DOM 19.3.1, Radix UI 1.8.1, Tailwind CSS 4.3.3, Lucide 1.60.0 |
| Routing | React Router 8.5.0, Data Mode |
| Server state | TanStack Query 5.104.5 |
| Data table / forms | TanStack Table 9.3.1 / Form 1.33.5, Valibot 1.5.0 |
| Authentication | Better Auth 1.7.12 |
| Database | SQLite, Drizzle ORM/Kit exact-pinned together at 1.0.0-rc.4 |
| Quality | Biome 2.5.15, Bun checker, stable TypeScript 7.0.2 |

Stable releases are preferred. Drizzle remains an explicit paired release-candidate exception because this project already uses its v1 migration format. Its current `rc` tag was verified; commit-suffixed snapshots are excluded. All other direct dependencies are on their latest compatible published release. Use `bun outdated` and official release notes when refreshing this snapshot.

The October 21 refresh includes [Better Auth 1.7.12's token-validation fixes](https://github.com/better-auth/better-auth/releases/tag/v1.7.12) and [Lucide 1.60.0's icon additions](https://github.com/lucide-icons/lucide/releases/tag/1.60.0). Bun's [official latest release](https://github.com/oven-sh/bun/releases/latest) remains 1.4.3. See the engineering guide for auth configuration implications; the verification record below is dated separately from the dependency check.

## What improved

- **Recoverable startup and routes:** application boot has visible loading/failure states. Page errors preserve the authenticated shell and navigation; root session failures retain a separate recovery boundary.
- **One request policy:** HTTP errors retain their status, cancellation prevents stale commits, permanent failures do not retry, transient reads retry once, and writes never retry implicitly. Each session owns a separate Query client.
- **Consistent session revocation:** browser session reads and API authorization both consult SQLite. Cookie session caching is disabled, and old presentation-cache cookies are expired so remote revocation cannot produce a sign-in redirect loop.
- **Server-enforced workspace roles:** Viewer, Editor, and Administrator share one explicit policy. Role changes are audited, transactional, and revoke the target's sessions; privilege is never inferred from registration order or email.
- **Explicit API contracts:** read endpoints accept GET/HEAD and reject other methods with 405/Allow. Signal writes require a trusted origin and JSON, enforce a 4 KiB streamed body budget, and validate before changing state. Bun also caps overall request bodies at 64 KiB.
- **Production lifecycle:** `/healthz` checks database readiness without exposing configuration. Production drains connections on SIGINT/SIGTERM, forces closure after ten seconds, then releases SQLite.
- **Repeatable verification:** checks have names, deadlines, dependency-aware skipping, interruption handling, and a machine-readable report. Independent checks still run after a failure; production probes never run against an unsuccessful build.

The source-backed design decisions and maintenance workflow are in [docs/engineering.md](docs/engineering.md). The in-app Platform Readiness page and command palette also link current docs and maintainer articles.

## Validation harness

`bun run validate` runs Biome, Bun type checking, the stable TypeScript compiler, Drizzle migration checks, regression tests, the production build, and real HTTP probes. CI invokes this same pipeline with the dependency audit enabled. Docker builds run the full local pipeline.

```sh
bun src/tooling/validate.ts --list       # Inspect the full check plan
bun src/tooling/validate.ts --quick     # Fast feedback without build/network audit
bun src/tooling/validate.ts --audit     # Include the registry advisory service
```

Results are written to `.cache/validation/latest.json`, including status, duration, exit code, and skipped-stage reasons. CI uploads this report even after validation failure. Command output remains in the terminal/CI log. Validation exits nonzero for failures, timeouts, skips, or cancellation.

Production probes start the **actual built server** with an isolated in-memory database, disposable auth credentials, and no developer OAuth secrets. They check readiness, every manifest-listed browser asset, cache revalidation, private-file isolation, auth cookies and revocation, method handling, mutation origin/media/body limits, and rejected-write integrity. Network tests require access to localhost; the advisory audit additionally requires internet access.

On October 21, all validation stages passed with RBAC enabled: 64 regression tests (484 assertions), both type checkers, lint, migration checks, production build/HTTP probes, and an advisory audit of 197 packages with no vulnerabilities. Browser checks used an isolated database to verify Viewer read-only controls and denied Admin-page access, the Administrator role matrix and self-change protection, an explicitly approved disposable Viewer-to-Editor change with audit feedback, and Editor permissions after signing in again. Earlier browser checks also verified disposable registration and recovery from a missing route chunk. Docker and real-provider OAuth callbacks were not run locally.

Individual tools remain available:

```sh
bun run check
bun run check:write
bun run typecheck
bun run typecheck:diagnostics
bun run typecheck:single
bun test src
bun run build
bun run test:production
bun run audit
bun run db:check
bun run db:generate
bun run db:migrate
bun run db:seed
```

`typecheck` deliberately uses `bun --check`: `bun check` would invoke this project's Biome script. Stable TypeScript 7 supplies native `tsc` and Zed's language server. `.zed/settings.json` configures the official `tsgo` extension, its stable `typescript-ls` server, and Biome.

## Explore

| Routes | Examples |
| --- | --- |
| `/overview`, `/architecture`, `/platform-readiness` | Searchable route map, architecture decisions, verified docs |
| `/form-actions`, `/actions`, `/optimistic` | Actions, pending states, optimistic rollback |
| `/react-use`, `/dom-interop` | Suspense, `use`, refs, metadata, custom elements |
| `/control-room`, `/virtual-explorer` | External state, derived values, virtualization, Activity |
| `/search-debounce`, `/server-state`, `/revenue-ops` | Real APIs, cancellation, Query cache, server-side table state |
| `/workflow-board`, `/intake-form`, `/upload-manager` | Sorting, schema validation, simulated upload queue |
| `/workbench-layout` | Accessible resizing, responsive panes, preserved panel state |
| `/account`, `/auth`, `/access` | Account, password, sessions, sign-in, and Administrator access management |

This is an extensible systems workspace. Uploads are simulated; the platform-signal demo is shared in-memory state and resets on restart. Customer examples and authentication use SQLite. These demonstrations are not tenant-isolated product features.

## Production and Docker

Set `BETTER_AUTH_URL` to the canonical origin and supply a strong `BETTER_AUTH_SECRET` of at least 32 characters, or an ordered `BETTER_AUTH_SECRETS` rotation keyring such as `2:new-secret,1:previous-secret`. Production refuses missing, placeholder, malformed, or duplicate-version secrets. Set the values in a local `.env` following `.env.example`, then:

```sh
docker compose up --build
```

The app runs at `http://localhost:3000`. Compose persists SQLite in the `app-data` volume at `/data/mydb.sqlite`. The final image runs as the unprivileged `bun` user and checks `/healthz`. Bun, CI, and the image share the declared runtime baseline; CI actions use full commit pins.

The build puts browser files in `dist/public` and server files plus the private asset manifest beside it. Only `dist/public` is exposed. Manifest-listed build assets are immutable; HTML and stable assets revalidate with content ETags. Auth, protected API responses, and errors use `no-store`.

Available configuration:

- `PORT` (default `3000`), `DB_FILE_NAME` (default `mydb.sqlite`).
- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_SECRETS`, `BETTER_AUTH_TRUSTED_ORIGINS`.
- `BETTER_AUTH_IP_ADDRESS_HEADERS` for a trusted edge that overwrites a single-value client-IP header. By default Bun overwrites `x-real-ip` from the socket; forwarded header chains are not trusted.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` for optional providers.

OAuth callbacks are `/api/auth/callback/google` and `/api/auth/callback/github` on your production origin. Provider callbacks require validation with real deployment credentials. Docker image execution is checked by CI; Docker was unavailable in the local upgrade environment.

SQLite opens with WAL, foreign keys, a busy timeout, and durability settings. Startup applies Drizzle migrations and seeds customer examples. Constraints enforce customer invariants; paginated reads use deterministic ordering and snapshot transactions, and searches escape wildcard characters.

To reset development state, stop the server and remove `mydb.sqlite`, `mydb.sqlite-shm`, and `mydb.sqlite-wal`. Startup recreates the database. Keep production data in a persistent volume and back it up before schema changes.
