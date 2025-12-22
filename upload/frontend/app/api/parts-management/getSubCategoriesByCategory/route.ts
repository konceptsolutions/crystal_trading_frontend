import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category_id = searchParams.get('category_id');

    if (!category_id) {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 });
    }

    // Get unique sub-categories for the given main category
    const subcategories = await prisma.part.findMany({
      where: {
        status: 'A',
        mainCategory: category_id,
        subCategory: {
          not: null
        }
      },
      select: {
        subCategory: true
      },
      distinct: ['subCategory']
    });

    const formattedSubcategories = subcategories
      .filter(p => p.subCategory)
      .map((part, index) => ({
        id: index + 1,
        name: part.subCategory
      }));

    return NextResponse.json({ subcategories: formattedSubcategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}