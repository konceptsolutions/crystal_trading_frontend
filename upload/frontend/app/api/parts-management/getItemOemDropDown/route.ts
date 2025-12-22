import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category_id = searchParams.get('category_id');
    const sub_category_id = searchParams.get('sub_category_id');
    const type_id = searchParams.get('type_id') || '1'; // 1 = parts, 2 = kits

    // Build where clause
    const where: any = {
      status: 'A'
    };

    if (category_id) {
      where.mainCategory = category_id;
    }

    if (sub_category_id) {
      where.subCategory = sub_category_id;
    }

    // For now, we'll use all parts as individual items
    // In the future, you could add a typeId field to distinguish parts from kits
    const items = await prisma.part.findMany({
      where,
      select: {
        id: true,
        partNo: true,
        description: true,
        mainCategory: true,
        subCategory: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedItems = items.map(item => ({
      id: item.id,
      name: `${item.mainCategory || ''}-${item.subCategory || ''}-${item.description || item.partNo}`.replace(/^-+|-+$/g, '')
    }));

    return NextResponse.json({ data: formattedItems });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}