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
    const subCategory = searchParams.get('subCategory');
    const search = searchParams.get('search');

    const where: any = {};

    if (category) {
      where.mainCategory = category;
    }

    if (subCategory) {
      where.subCategory = subCategory;
    }

    if (search) {
      where.OR = [
        { partNo: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const items = await prisma.part.findMany({
      where,
      select: {
        id: true,
        partNo: true,
        description: true,
      },
      take: 50,
      orderBy: {
        partNo: 'asc',
      },
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Items fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items', message: error.message },
      { status: 500 }
    );
  }
}

