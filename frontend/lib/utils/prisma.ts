import { PrismaClient } from '@prisma/client';
import path from 'path';
import { existsSync } from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Function to normalize and fix DATABASE_URL
// ALWAYS use the backend database in development
function getDatabaseUrl(): string {
  // In production/Vercel, DATABASE_URL must be set as environment variable
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required in production. Please set it in Vercel environment variables.');
    }
    if (databaseUrl.startsWith('file:')) {
      console.error('[Prisma] ERROR: SQLite file databases are not supported on Vercel serverless functions.');
      console.error('[Prisma] Please use a cloud database (PostgreSQL, MySQL, or Turso) for production.');
      throw new Error('SQLite file databases are not supported in production. Please configure a cloud database.');
    }
    return databaseUrl.replace(/^["']|["']$/g, '').trim();
  }
  
  // In development, ALWAYS use the backend database (single source of truth)
  const backendDbPath = path.resolve(process.cwd(), '..', 'backend', 'prisma', 'dev.db');
  
  if (!existsSync(backendDbPath)) {
    throw new Error(`Backend database not found at: ${backendDbPath}. Please ensure the backend database exists.`);
  }
  
  const databaseUrl = `file:${backendDbPath.replace(/\\/g, '/')}`;
  
  // Update environment variable to ensure consistency
  process.env.DATABASE_URL = databaseUrl;
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Prisma] Using shared backend database:', backendDbPath.replace(/.*[\\\/]/, '.../'));
  }
  
  return databaseUrl;
}

// Get the normalized database URL
const databaseUrl = getDatabaseUrl();

// Log the final DATABASE_URL (masked for security)
if (process.env.NODE_ENV === 'development') {
  const maskedUrl = databaseUrl.replace(/file:.*\//, 'file:.../');
  console.log('[Prisma] DATABASE_URL:', maskedUrl);
}

// Create Prisma Client - it will use DATABASE_URL from environment
// Force recreation if Brand model is missing (for development hot-reload)
let prismaInstance = globalForPrisma.prisma;
if (prismaInstance && typeof (prismaInstance as any).brand === 'undefined') {
  // Brand model is missing, force recreate
  console.log('[Prisma] Brand model missing, recreating Prisma client...');
  if (prismaInstance) {
    try {
      prismaInstance.$disconnect().catch(() => {});
    } catch (e) {
      // Ignore disconnect errors
    }
  }
  globalForPrisma.prisma = undefined;
  prismaInstance = undefined;
}

export const prisma = prismaInstance ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Handle connection errors gracefully in serverless
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // In production, don't connect eagerly - let each request handle connection
  prisma.$connect().catch((error) => {
    console.error('[Prisma] Connection error:', error);
    // Don't throw - let individual requests handle errors
  });
}

