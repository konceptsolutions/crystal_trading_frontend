import { NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Test connection
    await prisma.$connect();
    console.log('✓ Connected to database');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log('✓ User count:', userCount);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      databaseUrl: process.env.DATABASE_URL,
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      databaseUrl: process.env.DATABASE_URL,
    }, { status: 500 });
  }
}
