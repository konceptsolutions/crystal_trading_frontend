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
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const storeId = searchParams.get('storeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Store filter
    if (storeId) {
      where.storeId = storeId;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { rackNumber: { contains: search } },
        { description: { contains: search } },
        { store: { name: { contains: search } } },
      ];
    }

    const [racks, total] = await Promise.all([
      prisma.rack.findMany({
        where,
        include: {
          store: {
            include: {
              storeType: true,
            },
          },
          _count: {
            select: { shelves: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.rack.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      racks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Racks fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch racks', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rackNumber, storeId, description, status } = body;

    // Validate required fields
    if (!rackNumber || !storeId) {
      return NextResponse.json(
        { error: 'Rack number and store are required' },
        { status: 400 }
      );
    }

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Check for duplicate
    const existing = await prisma.rack.findFirst({
      where: {
        rackNumber: rackNumber.trim(),
        storeId: storeId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Rack number "${rackNumber}" already exists in this store` },
        { status: 400 }
      );
    }

    const rack = await prisma.rack.create({
      data: {
        rackNumber: rackNumber.trim(),
        storeId: storeId,
        description: description?.trim() || null,
        status: status || 'A',
      },
      include: {
        store: {
          include: {
            storeType: true,
          },
        },
      },
    });

    return NextResponse.json({ rack }, { status: 201 });
  } catch (error: any) {
    console.error('Rack creation error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A rack with this number already exists in this store' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create rack', message: error.message },
      { status: 500 }
    );
  }
}

