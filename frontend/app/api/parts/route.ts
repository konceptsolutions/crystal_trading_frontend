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
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const brand = searchParams.get('brand');
    const mainCategory = searchParams.get('mainCategory');
    const origin = searchParams.get('origin');
    const grade = searchParams.get('grade');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { partNo: { contains: search, mode: 'insensitive' } },
        { masterPartNo: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }
    if (mainCategory) {
      where.mainCategory = { contains: mainCategory, mode: 'insensitive' };
    }
    if (origin) {
      where.origin = { contains: origin, mode: 'insensitive' };
    }
    if (grade) {
      where.grade = grade;
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip,
        take: limit,
        include: {
          stock: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.part.count({ where }),
    ]);

    return NextResponse.json({
      parts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Parts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parts', message: error.message },
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
    const part = await prisma.part.create({
      data: body,
    });

    return NextResponse.json({ part }, { status: 201 });
  } catch (error: any) {
    console.error('Part creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create part', message: error.message },
      { status: 500 }
    );
  }
}

