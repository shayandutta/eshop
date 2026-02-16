# Packages – Shared Code

## Structure

```
packages/
├── error-handler/         # AppError + Express error middleware
│   ├── index.ts           # AppError, ValidationError, etc.
│   └── error-middleware.ts
└── libs/
    ├── prisma/            # Prisma client singleton
    │   ├── index.ts
    │   └── generated/     # Prisma-generated (do not edit)
    └── redis/             # Redis client (ioredis)
        └── index.ts
```

---

## error-handler

### AppError (base)

```ts
export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly details?: any;
  constructor(message, statusCode, isOperational, details?);
}
```

### Subclasses

| Class | statusCode | Use |
|-------|------------|-----|
| NotFoundError | 404 | Resource not found |
| ValidationError | 400 | Invalid input |
| AuthenticationError | 401 | Auth failed |
| ForbiddenError | 403 | Not allowed |
| DatabaseError | 500 | DB error |
| RateLimitError | 429 | Too many requests |

### error-middleware

- 4-arg Express error handler: `(err, req, res, next)`
- If `err instanceof AppError`: `res.status(err.statusCode).json({ message, statusCode, details })`
- Otherwise: `res.status(500).json({ message: "Internal server error", isOperational: false })`
- Must be registered **after** routes: `app.use(errorMiddleware)`
- Receives errors when controllers call `next(error)` (see [PROJECT_AND_ERROR_HANDLER_NOTES](PROJECT_AND_ERROR_HANDLER_NOTES.md) Part 3)

### Usage

```ts
import { ValidationError } from '@packages/error-handler';
throw new ValidationError('Invalid email');
```

---

## packages/libs/prisma

- Exports singleton Prisma client.
- See [03-PRISMA-AND-DATABASE](03-PRISMA-AND-DATABASE.md).

---

## packages/libs/redis

### index.ts

```ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => console.log('[redis] Connected'));
redis.on('error', (err) => console.error('[redis] Connection error:', err));
```

### Usage

```ts
import { redis } from '@packages/libs/redis';

await redis.set('key', 'value', 'EX', 300);  // TTL 300 seconds
const val = await redis.get('key');
```

- Uses ioredis.
- For Upstash: `REDIS_URL` should be `rediss://default:<password>@<host>.upstash.io:6379`.
