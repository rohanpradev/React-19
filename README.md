# React Systems Studio

A Bun-powered frontend systems workspace for current React, React Router Data Mode, shadcn-style UI, Better Auth, and full-stack Bun learning patterns.

The app is intentionally compact: each route explains one advanced frontend idea with focused examples instead of long reference text. It is built to be useful for architects and senior frontend engineers evaluating modern React patterns, routing boundaries, state transitions, UI architecture, and Bun-backed data flows.

## What This Covers

- React 19.2 patterns: Actions, `useActionState`, `useFormStatus`, `useOptimistic`, `use`, Suspense, ref cleanup, document metadata, custom elements, `useDeferredValue`, Activity, and Effect Events.
- React Router 8.1 Data Mode: `createBrowserRouter`, route objects, lazy route modules, redirects, route-level error handling, auth-aware app shell behavior, and a documented Data Mode vs Framework Mode decision.
- Frontend architecture: app shell design, progressive route loading, signal-style external state, context injection, error boundaries, server state boundaries, optimistic mutations, drag-and-drop interactions, schema validation, microfrontend tradeoffs, platform APIs, and UI system decisions.
- Full-stack Bun: one Bun server for HTML import frontend delivery, API routes, Better Auth, Drizzle ORM, SQLite, health checks, and server-side TanStack Table state.
- Developer workflow: TypeScript 7 native preview through `tsgo`, Biome 2 formatting/lint/assist rules, Drizzle destructive-write lint rules, Zed project settings, and a Bun build pipeline.
- Source-backed learning: official React, React Router, Better Auth, Bun, shadcn, and Module Federation docs are linked from the app and command palette.

## Stack

| Area | Tools |
| --- | --- |
| Runtime | Bun |
| UI | React 19.2, React DOM, shadcn-style components, Radix UI, Tailwind CSS 4 |
| Routing | React Router 8.1 Data Mode |
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
| `/architecture` | Senior frontend architecture notes, React 19.2 posture, router boundaries, and microfrontend decisions |
| `/platform-readiness` | Experienced upgrade track for React 19.2, React Router 8.1.0 modes, Better Auth sessions, and Bun delivery |
| `/control-room` | Signal-style external store, context injection, command log, derived state, and recoverable error boundary |
| `/form-actions` | Form mutations with `useActionState`, `useFormStatus`, pending states, and returned state |
| `/actions` | Async Actions shaped with `startTransition` and clear mutation feedback |
| `/optimistic` | `useOptimistic` with fast UI updates, success paths, and rollback handling |
| `/react-use` | `use`, Suspense boundaries, promise reads, and conditional context reads |
| `/dom-interop` | Metadata, refs, custom elements, assets, and React DOM interoperability |
| `/search-debounce` | Debounced autocomplete with `useDeferredValue` and a real Bun API endpoint |
| `/workflow-board` | Sortable drag-and-drop prioritization with dnd-kit and shadcn-style UI |
| `/intake-form` | Complex launch intake validation with TanStack Form and Valibot |
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

Create a local `.env` from `.env.example` and set a strong `BETTER_AUTH_SECRET`.

```bash
docker compose up --build
```

The app runs at `http://localhost:3000`. Compose stores SQLite data in the `app-data` volume at `/data/mydb.sqlite` inside the container, so auth and demo data survive container restarts.

To build and run without Compose:

```bash
docker build -t react-systems-studio .
docker run --rm -p 3000:3000 -e BETTER_AUTH_URL=http://localhost:3000 -e BETTER_AUTH_SECRET=replace-with-a-strong-random-secret -v react-systems-studio-data:/data react-systems-studio
```

## Current Docs Posture

Latest official docs were checked on July 4, 2026. React's docs list React 19.2 as the current documented release line, React Router is on the latest v8 line, Bun is on the latest 1.3 line, and the app now pins the current package set for the actively tracked libraries:

| Package | Version |
| --- | --- |
| `react` / `react-dom` | `^19.2.7` |
| `react-router` | `^8.1.0` |
| `better-auth` | `^1.6.23` |
| `tailwindcss` | `^4.3.2` |
| `@tanstack/react-query` | `^5.101.2` |
| `@tanstack/react-form` | `^1.33.0` |
| `@dnd-kit/core` / `@dnd-kit/sortable` | `^6.3.1` / `^10.0.0` |
| `valibot` | `^1.4.2` |
| `@typescript/native-preview` | `^7.0.0-dev.20260630.1` |
| Bun runtime used for validation | `1.3.14` |

The Platform Readiness route now includes a docs freshness card and expanded references for React versions, Effect Events, `useSyncExternalStore`, error boundaries, React Router v8 Data Mode and `HydrateFallback`, Bun HTML routes, Better Auth options, session caching, rate limiting, SQLite guidance, TanStack Query, TanStack Form, Valibot, dnd-kit, signal-style state, Robin Wieruch's 2026 React library guide, and Biome's Drizzle lint domain.

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
bun run db:generate
bun run db:seed
```

`bun run validate` runs Biome checks, `tsgo` type checking, and the Bun build.

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

## Authentication

The app uses Better Auth with Bun's built-in SQLite driver while Drizzle manages the application schema.

Recommended production environment variables:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Better Auth is configured with server-side session reads, a 10-minute session freshness window for sensitive operations, short-lived compact cookie session caching, explicit trusted origins, and built-in rate limiting for auth endpoints.

OAuth redirect URLs:

- Google: `https://your-domain.com/api/auth/callback/google`
- GitHub: `https://your-domain.com/api/auth/callback/github`

## Reset Local State

Stop Bun and delete the local SQLite files if you want a clean seeded run:

```bash
Remove-Item .\mydb.sqlite, .\mydb.sqlite-shm, .\mydb.sqlite-wal -ErrorAction SilentlyContinue
```

The next `bun dev` will recreate and seed the database.
