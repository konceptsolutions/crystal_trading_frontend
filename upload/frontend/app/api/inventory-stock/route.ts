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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const category = searchParams.get('category');
    const subCategory = searchParams.get('subCategory');
    const item = searchParams.get('item');
    const search = searchParams.get('search');

    const where: any = {
      stock: {
        isNot: null,
        quantity: {
          gt: 0, // Only show items with stock quantity > 0 (processed/received items)
        },
      },
    };

    if (category) {
      where.mainCategory = { contains: category };
    }

    if (subCategory) {
      where.subCategory = { contains: subCategory };
    }

    if (item) {
      where.OR = [
        { partNo: { contains: item } },
        { description: { contains: item } },
      ];
    }

    if (search) {
      where.OR = [
        { partNo: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
        { masterPartNo: { contains: search } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip,
        take: limit,
        include: {
          stock: true,
          models: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.part.count({
        where,
      }),
    ]);

    const stockData = parts.map((part) => ({
      id: part.id,
      partNo: part.partNo || '',
      masterPartNo: part.masterPartNo || '',
      name: part.description || '',
      brand: part.brand || '',
      model: part.models?.[0]?.modelNo || '',
      uom: part.uom || '',
      qty: part.stock?.quantity || 0,
      store: part.stock?.store || '',
      racks: part.stock?.racks || '',
      shelf: part.stock?.shelf || '',
      mainCategory: part.mainCategory || '',
      subCategory: part.subCategory || '',
    }));

    return NextResponse.json({
      data: stockData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Inventory stock fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory stock', message: error.message },
      { status: 500 }
    );
  }
}

