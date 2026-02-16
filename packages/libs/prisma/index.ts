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
