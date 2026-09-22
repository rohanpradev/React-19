# React Systems Studio

A Bun-powered frontend systems workspace for current React, React Router Data Mode, shadcn-style UI, Better Auth, and full-stack Bun learning patterns.

The app is intentionally compact: each route explains one advanced frontend idea with focused examples instead of long reference text. It is built to be useful for architects and senior frontend engineers evaluating modern React patterns, routing boundaries, state transitions, UI architecture, and Bun-backed data flows.

## What This Covers

- React 19.3 patterns: Actions, `useActionState`, `useFormStatus`, `useOptimistic`, `use`, Suspense, ref cleanup, document metadata, custom elements, `useDeferredValue`, Activity, Effect Events, and stable View Transitions.
- React Router 8.4 Data Mode: `createBrowserRouter`, route objects, lazy route modules, redirects, route-level error handling, auth-aware app shell behavior, and a documented Data Mode vs Framework Mode decision.
- Frontend architecture: app shell design, progressive route loading, signal-style external state, context injection, error boundaries, server state boundaries, optimistic mutations, virtualized browsing, upload queue management, resizable workbench layouts, drag-and-drop interactions, schema validation, microfrontend tradeoffs, platform APIs, and UI system decisions.
- Full-stack Bun: one Bun server for HTML import frontend delivery, API routes, Better Auth, Drizzle ORM, SQLite, health checks, and server-side TanStack Table state.
- Developer workflow: TypeScript 7 native preview through `tsgo`, Biome 2 formatting/lint/assist rules, Drizzle destructive-write lint rules, Zed project settings, and a Bun build pipeline.
- Source-backed learning: official React, React Router, Better Auth, Bun, shadcn, and Module Federation docs are linked from the app and command palette.

## Stack

| Area | Tools |
| --- | --- |
| Runtime | Bun |
| UI | React 19.3, React DOM, shadcn-style components, Radix UI, Tailwind CSS 4 |
| Routing | React Router 8.4 Data Mode |
| Data UI | TanStack Table, TanStack Query |
| Forms | TanStack Form, Valibot |
| Interaction | dnd-kit |
| Auth | Better Auth |
| Database | SQLite through Bun, Drizzle ORM, Drizzle Kit |
| Type Checking | TypeScript 7 native preview via `@typescript/native-preview` and `tsgo` |
| Quality | Biome 2 formatter, linter, assist, and import organization |
| Editor | Zed workspace settings in `.zed/settings.json` |

## Routes

| Route | Focus |
| --- | --- |
| `/overview` | Compact map of the React, Bun, routing, UI, and tooling coverage |
| `/architecture` | Senior frontend architecture notes, React 19.3 posture, router boundaries, and microfrontend decisions |
| `/platform-readiness` | Experienced upgrade track for React 19.3, React Router 8.4 modes, Better Auth security, and Bun delivery |
| `/control-room` | Signal-style external store, context injection, command log, derived state, and recoverable error boundary |
| `/form-actions` | Form mutations with `useActionState`, `useFormStatus`, pending states, and returned state |
| `/actions` | Async Actions shaped with `startTransition` and clear mutation feedback |
| `/optimistic` | `useOptimistic` with fast UI updates, success paths, and rollback handling |
| `/react-use` | `use`, Suspense boundaries, promise reads, and conditional context reads |
| `/dom-interop` | Metadata, refs, custom elements, assets, and React DOM interoperability |
| `/search-debounce` | Debounced autocomplete with `useDeferredValue` and a real Bun API endpoint |
| `/virtual-explorer` | High-volume entity browsing with deferred filters, virtual rows, ref cleanup, and Activity-preserved detail state |
| `/workflow-board` | Sortable drag-and-drop prioritization with dnd-kit and shadcn-style UI |
| `/intake-form` | Complex launch intake validation with TanStack Form and Valibot |
| `/upload-manager` | Enterprise file intake with validation, optimistic queueing, progress, retry, and cancel states |
| `/workbench-layout` | Resizable enterprise workbench shell with accessible splitters and Activity-preserved panels |
| `/server-state` | TanStack Query cache, optimistic mutation, rollback, invalidation, and a Bun API endpoint |
| `/revenue-ops` | Server-side TanStack Table state backed by Bun, Drizzle, and SQLite |
| `/account` | Better Auth profile, password, and active-session management |
| `/auth` | Better Auth sign-in and account creation |

Unknown app routes redirect to `/overview`.

## Run Locally

```bash
bun install
bun dev
```

The app serves the frontend and API from Bun. The default landing page is `/overview`.

Authentication is required for the workspace routes. Unauthenticated users are sent to `/auth` and then redirected back to the requested page after sign-in.

## Run With Docker

Create a local `.env` from `.env.example` and set either a strong `BETTER_AUTH_SECRET` or a
versioned `BETTER_AUTH_SECRETS` keyring. The app refuses to start in production without one.

```bash
docker compose up --build
```

The app runs at `http://localhost:3000`. Compose stores SQLite data in the `app-data` volume at `/data/mydb.sqlite` inside the container, so auth and demo data survive container restarts.

To build and run without Compose:

```bash
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
docker build -t react-systems-studio .
docker run --rm -p 3000:3000 -e BETTER_AUTH_URL=http://localhost:3000 -e BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" -v react-systems-studio-data:/data react-systems-studio
```

## Current Docs Posture

Official docs and package registry tags were checked on September 22, 2026. React 19.3 and React Router 8.4 are adopted. Better Auth 1.7.5 supports this app’s existing core schema after the 1.7.3 account-schema correction. Drizzle ORM and Kit remain exact-pinned to the current `rc` tag, `1.0.0-rc.4`; the TypeScript native preview remains on its current registry `latest` tag. Radix remains supported by shadcn and the components now share the `radix-ui` package. CI, Docker, and the package-manager declaration use Bun 1.4.2.

| Package | Version |
| --- | --- |
| `react` / `react-dom` | `^19.3.0` |
| `react-router` | `^8.4.0` |
| `better-auth` | `^1.7.5` |
| `drizzle-orm` / `drizzle-kit` | `1.0.0-rc.4` |
| `tailwindcss` | `^4.3.3` |
| `@tanstack/react-table` | `^9.2.4` |
| `@tanstack/react-query` | `^5.103.2` |
| `@tanstack/react-form` | `^1.33.5` |
| `@dnd-kit/core` / `@dnd-kit/sortable` | `^6.3.1` / `^10.0.0` |
| `valibot` | `^1.5.0` |
| `lucide-react` | `^1.47.0` |
| `@biomejs/biome` | `^2.5.14` |
| `@typescript/native-preview` | `^7.0.0-dev.20260707.2` |
| Bun runtime used for validation | `1.4.2` |

The Platform Readiness route includes a docs freshness card, stable-vs-preview release policy, Drizzle v1 migration posture, and Better Auth threat-to-control map. References cover React versions, Router v8 Data Mode, Bun HTML routes, Better Auth hardening, SQLite guidance, Drizzle's v1 upgrade and breaking-change guides, Tailwind CSS v4, TanStack, Valibot, dnd-kit, signal-style state, and Biome's Drizzle lint domain.

## September Upgrade Notes

- The September 22 refresh updates React Router to 8.4.0, Better Auth to 1.7.5, TanStack Query to 5.103.2, Lucide to 1.47.0, and Biome to 2.5.14. Dependency ranges and `bun.lock` are updated together.
- [Router 8.4](https://reactrouter.com/changelog#v840) reduces unrelated route re-renders and preserves lazy-route import errors. This app uses public Data Mode APIs and keeps the stable matcher; the new route-pattern matching flag is experimental.
- [Better Auth 1.7.5](https://github.com/better-auth/better-auth/releases/tag/v1.7.5) includes adapter and database fixes without requiring a core schema migration for this Bun SQLite setup. Drizzle stays paired on the `rc` tag, rather than adopting commit-suffixed experimental builds or downgrading to the older `latest` line.
- The September 14 security follow-up updated Better Auth's transitive `defu` dependency from 6.1.4 to 6.1.5 for [GHSA-737v-mqg7-c878](https://github.com/advisories/GHSA-737v-mqg7-c878). CI runs `bun run audit` after installing the lockfile; this check needs network access to npm's advisory service.
- The overview has a searchable route explorer with track filters, deferred updates, an empty state, and React 19.3 View Transitions. Reduced-motion preferences disable the transition animations.
- Mobile navigation is compact; the desktop rail scrolls independently on short viewports. Focus outlines, a focusable skip-link target, and outline-button borders improve keyboard and visual clarity.
- Version cards use declared package baselines instead of independently maintained version strings.
- Drizzle configuration uses `process.env` so the CLI works under Node as well as Bun.
- Auth tests cover legacy 1.6 password hashes and identity preservation, registration, session reads, sign-out, invalid passwords, and untrusted origins. A separate upgrade check also verified a database session created by 1.6.26 against 1.7.4.
- Google/GitHub OAuth callbacks still need a deployment-specific check with the configured provider credentials; local verification covers email/password authentication.

Sources: [React 19.3](https://react.dev/blog/2026/09/09/react-19-3), [Router changelog](https://reactrouter.com/changelog), [Better Auth upgrade guide](https://better-auth.com/docs/guides/1-7-upgrade-guide), [account schema correction](https://better-auth.com/blog/1-7-account-schema), [Radix package guidance](https://www.radix-ui.com/primitives/docs/overview/introduction), [shadcn library support](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default), [Drizzle v1](https://orm.drizzle.team/docs/upgrade-v1).

## Useful Scripts

```bash
bun dev
bun start
bun run build
bun run check
bun run check:write
bun run typecheck
bun run typecheck:diagnostics
bun run typecheck:single
bun run validate
bun run test
bun run audit
bun run db:check
bun run db:generate
bun run db:migrate
bun run db:seed
```

`bun run validate` runs the production build, Biome checks, `tsgo` type checking, migration graph validation, and auth regression tests. `bun run test` uses an isolated in-memory SQLite database and never touches local accounts.

## TypeScript 7 Native Preview

This project uses `@typescript/native-preview`. The compiler binary is currently `tsgo`, which is why the scripts use `tsgo` instead of `tsc`.

Zed is configured through `.zed/settings.json` to use the TypeScript native preview extension, Biome formatting, and project-specific language settings. No VS Code workspace settings are required.

## Biome Setup

The Biome config is VCS-aware and uses the Git ignore file. It enables formatting, linting, assist actions, React/project lint domains, import organization, Tailwind-aware CSS parsing, and focused test overrides.

Primary commands:

```bash
bun run check
bun run check:write
```

## API And Data

Notable API routes:

- `/api/customers` returns the server-side table payload.
- `/api/customers/autocomplete` returns lightweight customer search suggestions.
- `/api/platform/health` returns runtime/package versions and project readiness checks.
- `/api/platform/signals` returns and mutates the TanStack Query server-state demo payload.
- `/api/auth/*` handles Better Auth session and email/password endpoints.

The local SQLite files live in the project root:

- `mydb.sqlite`
- `mydb.sqlite-shm`
- `mydb.sqlite-wal`

Set `DB_FILE_NAME` to override the SQLite path. The Docker image sets it to `/data/mydb.sqlite` so the database can be backed by a Docker volume.

On startup, Bun runs Drizzle migrations from `./drizzle`, seeds customer demo data when needed, and uses the same SQLite database for Better Auth tables.

The Drizzle layer is treated as an operational contract:

- ORM and Kit are exact-pinned to the same RC so a lockfile refresh cannot silently split their migration semantics.
- The v1 folder-based migration graph is validated with `bun run db:check`.
- Customer status, plan, value, seat, and timestamp invariants are enforced by SQLite checks, not only TypeScript types.
- WAL mode, foreign keys, a busy timeout, and balanced durability settings are applied when the connection opens.
- Paginated reads use deterministic tie-breakers and transaction snapshots; search escapes SQL wildcard characters so user text stays literal.

## Authentication

The app uses Better Auth with Bun's built-in SQLite driver while Drizzle manages the application schema.

Recommended production environment variables:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_SECRETS` for rotation-safe `version:secret` keyrings
- `BETTER_AUTH_IP_ADDRESS_HEADERS` when a trusted edge overwrites a single-value client-IP header
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Better Auth is configured with server-side session reads, a 10-minute session freshness window for sensitive operations, short-lived compact cookie session caching, explicit trusted origins, and built-in rate limiting for auth endpoints. Bun overwrites `x-real-ip` from the socket address before the auth handler runs, so the default limiter cannot be bypassed with a client-supplied forwarding header. Behind a trusted edge, set `BETTER_AUTH_IP_ADDRESS_HEADERS` to the single-value header that edge overwrites (for example, `cf-connecting-ip`) and keep the origin unreachable directly.

The Valibot-backed server config guard rejects missing, malformed, duplicate-version, short, or placeholder production secrets. `BETTER_AUTH_SECRETS` follows Better Auth's ordered `2:new-secret,1:old-secret` format: the first key encrypts new data while older keys remain available for decryption during rotation. `BETTER_AUTH_SECRET` can remain temporarily as a fallback for legacy encrypted data.

OAuth redirect URLs:

- Google: `https://your-domain.com/api/auth/callback/google`
- GitHub: `https://your-domain.com/api/auth/callback/github`

## Reset Local State

Stop Bun and delete the local SQLite files if you want a clean seeded run:

```bash
Remove-Item .\mydb.sqlite, .\mydb.sqlite-shm, .\mydb.sqlite-wal -ErrorAction SilentlyContinue
```

The next `bun dev` will recreate and seed the database.
