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
    const type = searchParams.get('type'); // 'main' or 'sub'
    const parentId = searchParams.get('parentId'); // For subcategories

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (parentId) {
      where.parentId = parentId;
    } else if (type === 'main') {
      where.parentId = null;
    }

    console.log('[Categories API] Query params:', { status, type, parentId, where });

    // Fetch categories - try with relations first, fallback to simple query
    let categories;
    let lastError: any = null;
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
      console.log('[Categories API] Found categories with relations:', categories.length);
    } catch (relationError: any) {
      // If relations fail, try without them
      console.warn('[Categories API] Category relations query failed, trying without relations:', relationError.message);
      lastError = relationError;
      try {
        categories = await prisma.category.findMany({
          where,
          orderBy: {
            name: 'asc',
          },
        });
        console.log('[Categories API] Found categories without relations:', categories.length);
        lastError = null; // Clear error since simple query succeeded
      } catch (simpleError: any) {
        console.error('[Categories API] Simple category query also failed:', simpleError);
        lastError = simpleError;
        // Don't set categories to empty array - we'll return an error instead
      }
    }

    // If both queries failed, return an error response instead of empty array
    if (lastError) {
      console.error('[Categories API] All category queries failed:', lastError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch categories', 
          message: lastError.message || 'Database query failed',
          categories: [] // Include empty array for backward compatibility, but indicate error
        },
        { status: 500 }
      );
    }

    const result = { categories: categories || [] };
    console.log('[Categories API] Returning:', result.categories.length, 'categories');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Categories API] Categories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', message: error.message, categories: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    // Read body first
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

