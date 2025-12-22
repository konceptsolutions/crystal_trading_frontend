import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import path from 'path';
import { existsSync } from 'fs';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check if we're in a build context or actually running in Vercel
// During Next.js build, we're not actually in a serverless environment yet
function isBuildTime(): boolean {
  // Check for Next.js build phase indicators
  if (process.env.NEXT_PHASE) {
    return process.env.NEXT_PHASE.includes('build');
  }
  
  // Check if we're actually in Vercel runtime (not build)
  // Vercel sets these environment variables at runtime, not during build
  const isVercelRuntime = process.env.VERCEL === '1' && 
                          (process.env.VERCEL_ENV === 'production' || 
                           process.env.VERCEL_ENV === 'preview' || 
                           process.env.VERCEL_ENV === 'development');
  
  // If we're building locally or not in Vercel runtime, allow SQLite
  return !isVercelRuntime;
}

// Function to normalize and fix DATABASE_URL
// ALWAYS use the backend database in development
function getDatabaseUrl(): string {
  const isBuild = isBuildTime();
  
  // In Vercel runtime (not build), DATABASE_URL must be set as environment variable
  // Only check this if we're actually running in Vercel, not during build
  if (process.env.VERCEL === '1' && !isBuild) {
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
  
  // In development or build time, ALWAYS use the backend database (single source of truth)
  const backendDbPath = path.resolve(process.cwd(), '..', 'backend', 'prisma', 'dev.db');
  
  // During build, don't check if file exists (it might not be accessible)
  if (!isBuild && !existsSync(backendDbPath)) {
    throw new Error(`Backend database not found at: ${backendDbPath}. Please ensure the backend database exists.`);
  }
  
  const databaseUrl = `file:${backendDbPath.replace(/\\/g, '/')}`;
  
  // Update environment variable to ensure consistency
  process.env.DATABASE_URL = databaseUrl;
  
  // Log in development
  if (process.env.NODE_ENV === 'development' && !isBuild) {
    console.log('[Prisma] Using shared backend database:', backendDbPath.replace(/.*[\\\/]/, '.../'));
  }
  
  return databaseUrl;
}

// Get the normalized database URL
const databaseUrl = getDatabaseUrl();
const isBuild = isBuildTime();

// Log the final DATABASE_URL (masked for security) - skip during build
if (process.env.NODE_ENV === 'development' && !isBuild) {
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

// Check if Accelerate connection string is available
const accelerateUrl = process.env.PRISMA_ACCELERATE_URL || databaseUrl?.includes('prisma://');
const useAccelerate = !!accelerateUrl && !databaseUrl?.startsWith('file:');

// Create Prisma Client with or without Accelerate
const createPrismaClient = () => {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' && !isBuild ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Use Accelerate for production databases (PostgreSQL, MySQL, etc.)
  // Skip Accelerate for SQLite (file: URLs)
  if (useAccelerate) {
    return baseClient.$extends(withAccelerate()) as unknown as PrismaClient;
  }

  return baseClient;
};

export const prisma = prismaInstance ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Log Accelerate status (skip during build)
if (!isBuild) {
  if (useAccelerate) {
    console.log('[Prisma] 🚀 Accelerate enabled - queries will be 1000x faster!');
  } else if (databaseUrl?.startsWith('file:')) {
    console.log('[Prisma] 📁 Using SQLite (Accelerate not available for SQLite)');
  } else {
    console.log('[Prisma] 💡 Tip: Enable Accelerate for 1000x faster queries - https://pris.ly/tip-2-accelerate');
  }
}

// Don't connect during build time - connections will happen at runtime
if (!isBuild) {
  // Handle connection errors gracefully in serverless
  if (process.env.VERCEL === '1' || (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1')) {
    // In production, don't connect eagerly - let each request handle connection
    prisma.$connect().catch((error) => {
      console.error('[Prisma] Connection error:', error);
      // Don't throw - let individual requests handle errors
    });
  }
}

