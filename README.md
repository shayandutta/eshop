# Eshop

Nx monorepo for the Eshop fullstack project: API gateway, auth service,  user-ui, admin-ui, vendor-ui, shared packages, and Prisma (MongoDB).

---

## Quick Start

1. **Install**: `npm install`
2. **Env**: Create `.env` with `DATABASE_URL`, `REDIS_URL`, `SMTP_*`
3. **Prisma**: `npx prisma generate`
4. **Run**: `npm run dev`

Full step-by-step guide: **[docs/00-START-HERE.md](docs/00-START-HERE.md)**

---

## Repo Structure

```
eshop/
├── apps/
│   ├── auth-service/       # Auth API (Express, port 6001)
│   ├── api-gateway/        # Gateway, proxy, rate limit (Express, port 8080)
│   └── auth-service-e2e/   # E2E tests
├── packages/
│   ├── error-handler/      # AppError + Express error middleware
│   └── libs/
│       ├── prisma/         # Prisma client singleton
│       └── redis/          # Redis client (ioredis)
├── prisma/schema.prisma    # MongoDB models
└── .env
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Monorepo | Nx 22, npm workspaces |
| Build | esbuild (auth-service bundled, api-gateway transpiled) |
| DB | MongoDB via Prisma |
| Cache | Redis (ioredis, Upstash) |
| Email | nodemailer + EJS |

---

## Documentation

| Doc | Topic |
|-----|-------|
| [00-START-HERE](docs/00-START-HERE.md) | Step-by-step setup |
| [01-PROJECT-SETUP](docs/01-PROJECT-SETUP.md) | Monorepo, scripts |
| [02-BUILD-SYSTEM](docs/02-BUILD-SYSTEM.md) | esbuild, bundling |
| [03-PRISMA-AND-DATABASE](docs/03-PRISMA-AND-DATABASE.md) | Prisma, MongoDB |
| [04-PACKAGES](docs/04-PACKAGES.md) | error-handler, libs |
| [05-AUTH-SERVICE](docs/05-AUTH-SERVICE.md) | Registration, OTP |
| [06-EMAIL](docs/06-EMAIL.md) | Send mail, EJS |
| [07-REDIS](docs/07-REDIS.md) | Redis, Upstash |
| [08-API-GATEWAY](docs/08-API-GATEWAY.md) | Gateway, proxy |
| [09-CONFIGURATION](docs/09-CONFIGURATION.md) | Config changes |
| [PROJECT_AND_ERROR_HANDLER_NOTES](docs/PROJECT_AND_ERROR_HANDLER_NOTES.md) | Error handling details |

---

## Ports & Proxy

| App | Port |
|-----|------|
| api-gateway | 8080 |
| auth-service | 6001 |

Frontend calls `http://localhost:8080`. Gateway forwards `/auth/*` to auth-service.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Serve all apps |
| `npm run dev:watch` | Build + watch + nodemon |
| `npx prisma generate` | Generate Prisma client |
| `npx nx build auth-service` | Build auth-service |
| `npx nx build api-gateway` | Build api-gateway |
