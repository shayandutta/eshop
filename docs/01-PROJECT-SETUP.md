# Project Setup – Monorepo Structure

## Repo Layout

```
eshop/
├── apps/
│   ├── auth-service/          # Auth API (Express, port 6001)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   └── utils/
│   │   ├── project.json
│   │   └── tsconfig.app.json
│   ├── api-gateway/           # Gateway, proxy, rate limit (Express, port 8080)
│   │   ├── src/main.ts
│   │   └── package.json       # Nx targets defined here
│   └── auth-service-e2e/      # E2E tests
├── packages/
│   ├── error-handler/         # AppError classes + Express error middleware
│   └── libs/
│       ├── prisma/            # Prisma client singleton
│       └── redis/             # Redis client (ioredis)
├── prisma/
│   └── schema.prisma          # MongoDB models
├── package.json               # Root workspace
├── nx.json
├── tsconfig.base.json
└── .env
```

---

## Root `package.json`

### Workspaces

```json
"workspaces": ["apps/*", "api-gateway"]
```

- `apps/*` includes `auth-service`, `auth-service-e2e`
- `api-gateway` is at `apps/api-gateway` but referenced as `api-gateway` in workspaces

### Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `nx run-many -t serve -all --configuration=development` | Build and serve all apps |
| `dev:watch` | `nx run-many -t build -p auth-service,api-gateway && concurrently ...` | Build once, then watch dist and restart |

### `dev:watch` Flow

1. Build auth-service and api-gateway
2. Run `nx run auth-service:build --watch` and `nx run api-gateway:build --watch`
3. Run nodemon on:
   - `apps/auth-service/dist` → `PORT=6001 node -r tsconfig-paths/register -r ts-node/register apps/auth-service/dist/main.js`
   - `apps/api-gateway/dist` → `PORT=8080 node apps/api-gateway/dist/main.js`

---

## Path Aliases (`tsconfig.base.json`)

```json
"baseUrl": ".",
"paths": {
  "@packages/*": ["packages/*"]
}
```

Usage: `import x from '@packages/libs/prisma'` → resolves to `packages/libs/prisma`.

At runtime (auth-service), `tsconfig-paths/register` makes Node resolve these aliases.

---

## Ports

| App | Port | Purpose |
|-----|------|---------|
| auth-service | 6001 | Auth API (register, login, OTP) |
| api-gateway | 8080 | Single entry for clients; proxy to services |

Frontend should call `http://localhost:8080`. Gateway forwards `/auth/*` to auth-service.
