# Configuration – Changes & Details

## .env (Root)

```env
DATABASE_URL="mongodb+srv://..."
REDIS_URL="rediss://default:...@....upstash.io:6379"
SMTP_USER="..."
SMTP_PASSWORD="..."
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SERVICE=gmail
```

- No spaces around `=`
- Values in quotes are trimmed by dotenv

---

## auth-service project.json

### Externals (critical for Prisma)

```json
"external": ["@prisma/client", "@prisma/client/*", "@packages/libs/prisma"]
```

- Avoids bundling Prisma; prevents `DbNull` runtime error

### Assets

```json
"assets": [
  "apps/auth-service/src/assets",
  "apps/auth-service/src/swagger-output.json"
]
```

---

## auth-service tsconfig.app.json

```json
"include": ["src/**/*.ts", "../../packages/**/*.ts"]
```

- Ensures `packages/` can be imported

---

## tsconfig.base.json (Path aliases)

```json
"paths": {
  "@packages/*": ["packages/*"]
}
```

---

## Runtime (auth-service)

```bash
node -r tsconfig-paths/register -r ts-node/register apps/auth-service/dist/main.js
```

- `tsconfig-paths/register`: resolve `@packages/*`
- `ts-node/register`: load `.ts` (e.g. Prisma lib)

---

## prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../packages/libs/prisma/generated"
}
```

---

## Version Notes

- Prisma: `^6.15.0` (not 7.x; bundling issues)
- Nx: 22.5.1
- Node: 20+
