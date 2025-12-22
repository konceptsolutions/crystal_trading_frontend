import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyToken } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {
      subCategory: { not: null },
    };

    if (category) {
      where.mainCategory = category;
    }

    const subcategories = await prisma.part.findMany({
      where,
      select: {
        subCategory: true,
      },
      distinct: ['subCategory'],
    });

    const subcategoryList = subcategories
      .map((s) => s.subCategory)
      .filter((s): s is string => s !== null);

    return NextResponse.json({ subcategories: subcategoryList });
  } catch (error: any) {
    console.error('Subcategories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcategories', message: error.message },
      { status: 500 }
    );
  }
}

