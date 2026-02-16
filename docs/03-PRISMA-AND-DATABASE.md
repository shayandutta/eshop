# Prisma & Database (MongoDB)

## Schema Location

- **Schema**: `prisma/schema.prisma`
- **Generated client**: `packages/libs/prisma/generated/`

---

## Generator (Custom Output)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../packages/libs/prisma/generated"
}
```

- Client is generated into `packages/libs/prisma/generated` instead of `node_modules/.prisma/client`.
- Enables a shared Prisma client used by multiple apps.

---

## Datasource

```prisma
datasource db {
  provider = "mongodb"
}
```

`DATABASE_URL` comes from `.env` (e.g. MongoDB Atlas).

---

## Models

### users

```prisma
model users {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  email     String   @unique
  password  String?
  following String[]

  avatar    images?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- `@id @default(auto()) @map("_id") @db.ObjectId`: MongoDB ObjectId as primary key.
- `avatar images?`: optional one-to-one relation to `images`.
- `following String[]`: array of user IDs.

### images

```prisma
model images {
  id      String  @id @default(auto()) @map("_id") @db.ObjectId
  file_id String
  url     String

  userId  String? @db.ObjectId @unique
  users   users?  @relation(fields: [userId], references: [id])
}
```

- `userId` and `users`: optional relation back to `users`.

---

## Prisma Client Usage

### packages/libs/prisma/index.ts

```ts
import 'dotenv/config';
import { PrismaClient } from '../../../packages/libs/prisma/generated';

declare global {
  var prismadb: PrismaClient | undefined;
}

const prisma =
  global.prismadb ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismadb = prisma;
}

export default prisma;
```

- **Singleton**: Uses `global.prismadb` in dev to avoid multiple PrismaClient instances (e.g. with HMR).
- **Import path**: Uses relative path to `generated` because the client lives in a custom output folder.

### In auth-service

```ts
import prisma from '@packages/libs/prisma';

const user = await prisma.users.findUnique({
  where: { email }
});
```

---

## Commands

| Command | Purpose |
|---------|---------|
| `npx prisma generate` | Generate client into `packages/libs/prisma/generated` |
| `npx prisma db push` | Push schema to DB (dev, no migrations) |
| `npx prisma studio` | Open Prisma Studio UI |

---

## Version

- **Prisma**: `^6.15.0`
- Downgraded from 7.x for compatibility with custom output and bundling.
