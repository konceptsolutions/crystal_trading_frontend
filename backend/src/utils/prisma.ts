import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Handle Prisma connection errors gracefully (don't block serverless functions)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  prisma.$connect().catch((error) => {
    console.error('Prisma connection error:', error);
  });
}

