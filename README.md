# Eshop

Nx monorepo for the Eshop backend: API gateway, auth service, shared packages, and Prisma (MongoDB).

---

## Repo structure

```
eshop/
├── apps/
│   ├── auth-service/       # Auth API (Express, port 6001)
│   ├── api-gateway/        # Gateway, proxy, rate limit (Express, port 8080)
│   └── auth-service-e2e/   # E2E tests for auth-service
├── packages/
│   ├── error-handler/      # AppError classes + Express error middleware
│   └── libs/
│       └── prisma/         # Prisma client singleton (shared)
├── prisma/
│   └── schema.prisma       # MongoDB models (users, images)
├── .github/workflows/
│   └── ci.yml              # Nx CI (lint, test, build, typecheck)
├── package.json            # Root workspace, dev script
├── nx.json
├── prisma.config.ts        # Prisma config (schema path, DATABASE_URL)
└── .env                    # DATABASE_URL (not committed)
```

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Monorepo | Nx 22, npm workspaces |
| Apps | Express (Node), TypeScript |
| Auth service build | esbuild |
| API gateway build | esbuild |
| DB | MongoDB via Prisma |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

---

## Prerequisites

- Node 20+
- npm
- MongoDB (local or Atlas; connection string in `.env`)

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment

Create `.env` at repo root:

```env
DATABASE_URL="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>"
```

Used by Prisma (see `prisma.config.ts`).

### 3. Prisma

Generate client and (optional) push schema:

```bash
npx prisma generate
# npx prisma db push   # if you need to sync schema to DB
```

### 4. Run all apps (development)

```bash
npm run dev
```

- Runs **auth-service** (6001) and **api-gateway** (8080) in development.
- Uses `nx run-many --target=serve --all --configuration=development`.
- In the Nx TUI: **1** / **2** for per-app logs, **Enter** to expand.

---

## Ports & proxy

| App | Port | Role |
|-----|------|------|
| **auth-service** | 6001 | Auth API (register, login, etc.) |
| **api-gateway** | 8080 | Single entry for clients; CORS, rate limit, proxy to services |

- Frontend (e.g. `http://localhost:3000`) should call **8080**.
- Gateway forwards `/auth/*` to **auth-service** at `http://localhost:6001`.

Example: `GET http://localhost:8080/auth/` → proxied to `http://localhost:6001/`.

---

## Apps

### auth-service (`apps/auth-service`)

- Express app; build via **esbuild** (`project.json`; same as api-gateway).
- Uses `packages/error-handler` (error middleware + `ValidationError`, etc.).
- Controllers: e.g. `auth.controller` (registration wired to `auth.helper` validation).
- Helpers: e.g. `auth.helper` – validation with `ValidationError` from error-handler.
- Requires `apps/auth-service/src/assets/` (empty dir with `.gitkeep` is fine).
- Legacy Webpack config kept as `webpack.config.js.bak` if needed for reference.

### api-gateway (`apps/api-gateway`)

- Express app; build via esbuild (targets in `package.json` under `"nx"`).
- CORS (e.g. origin `http://localhost:3000`), morgan, rate limit, cookie-parser.
- Proxy: `app.use('/auth', proxy('http://localhost:6001'))`.
- Routes: `/` (welcome), `/auth/*` (proxy). No `/api` route by default; use `/` or `/gateway-health` if you add it.

---

## Shared packages

### packages/error-handler

- **AppError** base class (`statusCode`, `isOperational`, optional `details`).
- Subclasses: `NotFoundError` (404), `ValidationError` (400), `AuthenticationError` (401), `ForbiddenError` (403), `DatabaseError` (500), `RateLimitError` (429).
- **error-middleware**: 4-arg Express error handler; responds with JSON from `AppError` or 500 for unknown errors.
- Used in auth-service: `import { errorMiddleware } from '../../../packages/error-handler/error-middleware'`.

### packages/libs/prisma

- Intended shared Prisma client (e.g. `export const prisma = new PrismaClient()`).
- Currently commented out; uncomment and use once DB is wired.

---

## Prisma

- **Schema**: `prisma/schema.prisma` (MongoDB provider).
- **Config**: `prisma.config.ts` – schema path, migrations path, `DATABASE_URL` from env.
- **Models**: e.g. `users` (name, email, password, following, avatar, timestamps), `images` (file_id, url, relation to users).

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Serve all apps in development |
| `npx nx build @eshop/auth-service` | Build auth-service |
| `npx nx build @eshop/api-gateway` | Build api-gateway |
| `npx nx serve @eshop/auth-service` | Serve auth-service only |
| `npx nx serve @eshop/api-gateway` | Serve api-gateway only |
| `npx nx show projects` | List Nx projects |
| `npx prisma generate` | Generate Prisma client |

---

## CI

- `.github/workflows/ci.yml` runs on push to `main` and on pull requests.
- Runs: `nx run-many -t lint test build typecheck` then `nx fix-ci`.
- Added by Nx when the workspace was created; edit or remove if you don’t want it.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| auth-service build fails (ENOENT `src/assets`) | Ensure `apps/auth-service/src/assets/` exists (e.g. add `.gitkeep`). |
| api-gateway build fails (TS6133 unused imports) | Remove or use the reported imports. |
| Only one app runs with `npm run dev` | Ensure both projects have a `serve` target (e.g. api-gateway in `package.json` under `"nx".targets`). |
| Gateway uses production build | Dev script includes `--configuration=development`; use `npm run dev`. |
| Cannot GET /api on 8080 | Gateway has no `/api` route; use `/` or add a route. |
| Serve shows “Waiting for task...” | Normal; use Nx TUI keys 1/2 or Enter to see logs. |

More detail: `docs/PROJECT_AND_ERROR_HANDLER_NOTES.md`.

---

## Links

- [Nx docs](https://nx.dev)
- [Prisma docs](https://www.prisma.io/docs)
- [Nx + Express](https://nx.dev/nx-api/express)
