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
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ suppliers });
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

