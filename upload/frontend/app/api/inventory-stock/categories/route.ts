import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyToken } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.part.findMany({
      where: {
        mainCategory: { not: null },
      },
      select: {
        mainCategory: true,
      },
      distinct: ['mainCategory'],
    });

    const categoryList = categories
      .map((c) => c.mainCategory)
      .filter((c): c is string => c !== null);

    return NextResponse.json({ categories: categoryList });
  } catch (error: any) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', message: error.message },
      { status: 500 }
    );
  }
}

