# API Gateway

## Overview

- **Port**: 8080
- **Role**: Single entry for clients; CORS, rate limit, proxy to services
- **Entry**: `apps/api-gateway/src/main.ts`

---

## Proxy

```ts
app.use('/auth', proxy('http://localhost:6001'));
```

- `GET http://localhost:8080/auth/api/register` → proxied to `http://localhost:6001/api/register`
- Path is forwarded as-is (gateway mounts proxy at `/auth`, auth-service at `/api`)

---

## Rate Limiting

```ts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => (req.user ? 1000 : 100),
  message: { error: 'Too many requests...' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? String(req.user) : ipKeyGenerator(req.ip ?? '', 56)),
});
app.use(limiter);
```

- 100 req/15min unauthenticated
- 1000 req/15min authenticated (when `req.user` exists)

---

## Middleware

- CORS (origin `http://localhost:3000`)
- morgan
- express.json, express.urlencoded
- cookie-parser
- `trust proxy: 1` (for rate limit behind proxy)

---

## Routes

| Path | Behavior |
|------|----------|
| /api/health | Gateway health check |
| /auth/* | Proxy to auth-service (6001) |
