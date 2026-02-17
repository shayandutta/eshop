# Redis – ioredis, Upstash

## Overview

- **Library**: ioredis
- **Location**: `packages/libs/redis/index.ts`
- **Used for**: OTP storage, cooldowns, rate limiting

---

## Connection

```ts
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
```

Use `REDIS_URL` from `.env` in production; avoid hardcoding credentials.

---

## Upstash (Cloud Redis)

### URL format

```
rediss://default:<password>@<host>.upstash.io:6379
```

- `rediss://`: TLS
- `default`: username (Upstash uses "default")
- Get URL from Upstash dashboard → Redis → Connect

### .env

```env
REDIS_URL="rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379"
```

No spaces around `=` in `.env`.

---

## Keys Used

| Key | Purpose | TTL |
|-----|---------|-----|
| `otp:{email}` | OTP code | 300s |
| `otp_cooldown:{email}` | Wait 60s before next OTP | 60s |
| `otp_request_count:{email}` | OTP request count per hour | 3600s |
| `otp_spam_lock:{email}` | Lock after too many requests | 3600s |
| `otp_lock:{email}` | General lock (e.g. failed attempts) | — |

---

## Error Handling

```ts
redis.on('error', (err) => console.error('[redis] Connection error:', err));
```

Adds an error handler so connection errors don’t produce unhandled "Unhandled error event".
