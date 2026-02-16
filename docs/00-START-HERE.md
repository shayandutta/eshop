# Eshop – Start Here (Step-by-Step)

Follow these steps in order to build, run, and understand the project from scratch.

---

## Step 1: Prerequisites

- **Node.js 20+**
- **npm**
- **MongoDB** (local or Atlas)
- **Redis** (local or Upstash for OTP/rate limiting)
- **Gmail** or another SMTP provider for emails

---

## Step 2: Clone & Install

```bash
cd eshop
npm install
```

This installs all workspace dependencies (apps, packages, Prisma, etc.).

---

## Step 3: Environment Setup

Create `.env` at the repo root (copy from `.env.example` if present):

```env
# MongoDB (required for Prisma)
DATABASE_URL="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>"

# Redis (required for auth OTP and rate limiting)
REDIS_URL="rediss://default:<password>@<host>.upstash.io:6379"

# SMTP (required for sending OTP emails)
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SERVICE=gmail
```

**Important:** No spaces around `=`. Values in quotes are trimmed by dotenv.

---

## Step 4: Prisma – Generate Client

Prisma generates the DB client from `prisma/schema.prisma` into `packages/libs/prisma/generated`:

```bash
npx prisma generate
```

(Optional) Sync schema to MongoDB:

```bash
npx prisma db push
```

---

## Step 5: Run the Project

### Option A: Standard Nx serve (recommended)

```bash
npm run dev
```

- Builds auth-service and api-gateway in development mode
- Serves auth-service on **6001**, api-gateway on **8080**
- Use Nx TUI: **1** / **2** for per-app logs

### Option B: Watch mode (faster iteration)

```bash
npm run dev:watch
```

- Builds both apps once, then:
  - Watches `dist/` and restarts on change
  - Auth-service runs: `node -r tsconfig-paths/register -r ts-node/register apps/auth-service/dist/main.js`
  - Api-gateway runs: `node apps/api-gateway/dist/main.js`

---

## Step 6: Verify It Works

| Check | URL |
|-------|-----|
| Gateway health | `http://localhost:8080/api/health` |
| Auth service | `http://localhost:6001/api/health` |
| Auth via gateway | `http://localhost:8080/auth/api/health` |
| Swagger (auth) | `http://localhost:6001/api-docs` |

---

## Step 7: Register a User

```bash
curl -X POST http://localhost:8080/auth/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"secret123"}'
```

Expected: `200` with message "OTP sent to your email...".

---

## Next Steps

| Doc | Purpose |
|-----|---------|
| [01-PROJECT-SETUP](01-PROJECT-SETUP.md) | Monorepo structure, scripts, paths |
| [02-BUILD-SYSTEM](02-BUILD-SYSTEM.md) | esbuild, webpack, bundling |
| [03-PRISMA-AND-DATABASE](03-PRISMA-AND-DATABASE.md) | Prisma, MongoDB, models |
| [04-PACKAGES](04-PACKAGES.md) | `packages/` – error-handler, libs (prisma, redis) |
| [05-AUTH-SERVICE](05-AUTH-SERVICE.md) | Registration, OTP, validation, strictness |
| [06-EMAIL](06-EMAIL.md) | Send mail, EJS templates |
| [07-REDIS](07-REDIS.md) | Redis usage, Upstash, ioredis |
| [08-API-GATEWAY](08-API-GATEWAY.md) | Gateway, proxy, rate limiting |
| [09-CONFIGURATION](09-CONFIGURATION.md) | All config changes, `.env`, project.json |
