# Bun + React Lab

This project is a Bun-powered React 19 playground with two main goals:

- demonstrate React 19 features in focused pages
- showcase a full-stack Bun + Drizzle + SQLite table with server-side pagination, sorting, filtering, and search
- keep the shell and build pipeline aligned with current shadcn/ui and Bun full-stack patterns

## Stack

- Bun
- React 19
- React Router
- TanStack Table
- Drizzle ORM
- SQLite via Bun
- Better Auth
- shadcn-style UI components
- Temporal via `@js-temporal/polyfill`

## Pages

- `/react-19` - React 19 overview
- `/form-actions` - `useActionState` and `useFormStatus`
- `/actions` - async actions with `startTransition`
- `/optimistic` - `useOptimistic`
- `/react-use` - `use` with Suspense and context
- `/dom-interop` - document metadata, refs, and custom elements
- `/search-debounce` - debounced customer autocomplete with `useDeferredValue`
- `/revenue-ops` - server-side TanStack Table backed by Bun + Drizzle + SQLite

The app shell includes a command palette on `Ctrl/Cmd+K` for navigating demos, docs, and theme actions.

## Prerequisites

- Bun installed locally

## Install

```bash
bun install
```

## Run

```bash
bun dev
```

The app serves the frontend and API from Bun. The default landing page is `/react-19`.
The auth entrypoint is `/auth`, and protected routes redirect back to the requested page after sign-in.

Notable API routes:

- `/api/customers` for the full server-side table payload
- `/api/customers/autocomplete` for lightweight customer search suggestions
- `/api/auth/*` for Better Auth session and email/password endpoints

## Database Behavior

The app uses a local SQLite database file:

- `mydb.sqlite`
- `mydb.sqlite-shm`
- `mydb.sqlite-wal`

On startup, Bun will:

1. run Drizzle migrations from `./drizzle`
2. seed demo customer data if the database is empty
3. create Better Auth tables in the same SQLite database once the auth migration exists

You do not need to run a separate database process.

## Authentication

The app uses Better Auth with Bun's built-in SQLite driver while continuing to use Drizzle for application data and schema management.

- Create an account or sign in at `/auth`
- The customer APIs require an active Better Auth session
- Auth tables live in the same `mydb.sqlite` file as the customer data

Recommended production environment variables:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

OAuth redirect URLs to configure with the providers:

- Google: `https://your-domain.com/api/auth/callback/google`
- GitHub: `https://your-domain.com/api/auth/callback/github`

Official docs used for the integration:

- https://better-auth.com/docs/adapters/sqlite#bun-built-in-sqlite
- https://better-auth.com/docs/authentication/google
- https://better-auth.com/docs/authentication/github
- https://better-auth.com/docs/authentication/email-password
- https://better-auth.com/docs/installation

## Reset Local State

If you want a clean local run, stop Bun and delete these files from the project root:

- `mydb.sqlite`
- `mydb.sqlite-shm`
- `mydb.sqlite-wal`

The next `bun dev` will recreate the database and seed it again.

## Useful Scripts

```bash
bun dev
bun start
bun run build
bun run db:generate
bun run db:seed
```

## Notes

- The local development path is `bun dev`.
- `bun run build` now bundles the Bun server entrypoint (`src/index.ts`) so the HTML-import frontend and API routes are packaged together.
- Time handling in app code uses `Temporal` through `src/lib/temporal.ts`, which falls back to `@js-temporal/polyfill` when the runtime does not expose `globalThis.Temporal`.
