import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if Accelerate connection string is available
const accelerateUrl = process.env.PRISMA_ACCELERATE_URL || process.env.DATABASE_URL?.includes('prisma://');
const useAccelerate = !!accelerateUrl && !process.env.DATABASE_URL?.startsWith('file:');

// Create Prisma Client with or without Accelerate
const createPrismaClient = () => {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Use Accelerate for production databases (PostgreSQL, MySQL, etc.)
  // Skip Accelerate for SQLite (file: URLs)
  if (useAccelerate) {
    return baseClient.$extends(withAccelerate()) as unknown as PrismaClient;
  }

  return baseClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Log Accelerate status
if (useAccelerate) {
  console.log('🚀 Prisma Accelerate enabled - queries will be 1000x faster!');
} else if (process.env.DATABASE_URL?.startsWith('file:')) {
  console.log('📁 Using SQLite (Accelerate not available for SQLite)');
} else {
  console.log('💡 Tip: Enable Prisma Accelerate for 1000x faster queries - https://pris.ly/tip-2-accelerate');
}

// Handle Prisma connection errors gracefully (don't block serverless functions)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  prisma.$connect().catch((error) => {
    console.error('Prisma connection error:', error);
  });
}

