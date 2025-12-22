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
    const search = searchParams.get('search');
    const searchField = searchParams.get('searchField');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Search functionality (SQLite uses contains which is case-sensitive by default)
    // For case-insensitive search in SQLite, we use contains which works with LIKE
    if (search) {
      if (searchField && searchField !== 'all') {
        // Search in specific field
        switch (searchField) {
          case 'name':
            where.name = { contains: search };
            break;
          case 'code':
            where.code = { contains: search };
            break;
          case 'email':
            where.email = { contains: search };
            break;
          case 'phone':
            where.phone = { contains: search };
            break;
          case 'address':
            where.address = { contains: search };
            break;
          case 'contactPerson':
            where.contactPerson = { contains: search };
            break;
          default:
            where.name = { contains: search };
        }
      } else {
        // Search in all fields
        where.OR = [
          { code: { contains: search } },
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { address: { contains: search } },
          { contactPerson: { contains: search } },
          { city: { contains: search } },
          { state: { contains: search } },
        ];
      }
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: { purchaseOrders: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Suppliers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers', message: error.message },
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
    const supplier = await prisma.supplier.create({
      data: body,
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error: any) {
    console.error('Supplier creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier', message: error.message },
      { status: 500 }
    );
  }
}

