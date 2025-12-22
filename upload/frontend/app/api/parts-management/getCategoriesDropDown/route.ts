import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get unique main categories from parts
    const categories = await prisma.part.findMany({
      where: {
        status: 'A',
        mainCategory: {
          not: null
        }
      },
      select: {
        mainCategory: true
      },
      distinct: ['mainCategory']
    });

    const formattedCategories = categories
      .filter(p => p.mainCategory)
      .map((part, index) => ({
        id: index + 1,
        name: part.mainCategory
      }));

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}