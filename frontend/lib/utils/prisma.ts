import { PrismaClient } from '@prisma/client';
import path from 'path';
import { existsSync } from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Fix database URL if it's a relative path
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  // Try to construct default path
  const defaultPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
  if (existsSync(defaultPath)) {
    databaseUrl = `file:${defaultPath.replace(/\\/g, '/')}`;
    process.env.DATABASE_URL = databaseUrl;
  }
} else if (databaseUrl.startsWith('file:./')) {
  const dbPath = databaseUrl.replace('file:./', '');
  const absolutePath = path.resolve(process.cwd(), dbPath).replace(/\\/g, '/');
  process.env.DATABASE_URL = `file:${absolutePath}`;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

