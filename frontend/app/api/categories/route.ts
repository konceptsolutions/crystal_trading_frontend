import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyToken } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Try to fetch with relations, fallback to simple query if relations don't exist
    let categories;
    try {
      categories = await prisma.category.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          subcategories: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    } catch (relationError: any) {
      // If relations fail, try without them
      console.warn('Category relations query failed, trying without relations:', relationError.message);
      categories = await prisma.category.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
      });
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, parentId, description, status } = body;

    const category = await prisma.category.create({
      data: {
        name,
        type: type || 'main',
        parentId: parentId || null,
        description,
        status: status || 'A',
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Category creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create category', message: error.message },
      { status: 500 }
    );
  }
}

