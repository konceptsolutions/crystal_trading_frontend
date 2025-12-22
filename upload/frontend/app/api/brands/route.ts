import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyToken } from '@/lib/middleware/auth';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (search && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    const brands = await prisma.brand.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ brands });
  } catch (error: any) {
    console.error('[Brands API] Brands fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands', message: error.message, brands: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, status } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const trimmedName = String(name).trim();

    const brand = await prisma.brand.create({
      data: {
        name: trimmedName,
        status: status || 'A',
      },
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Brand with this name already exists' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create brand', message: error.message },
      { status: 500 }
    );
  }
}
