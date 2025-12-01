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
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            part: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ purchaseOrders });
  } catch (error: any) {
    console.error('Purchase orders fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders', message: error.message },
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
    const { poNo, supplierId, type, status, orderDate, expectedDate, items, totalAmount } = body;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNo,
        supplierId,
        type: type || 'purchase',
        status: status || 'draft',
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        totalAmount,
        items: {
          create: items.map((item: any) => ({
            partId: item.partId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            part: true,
          },
        },
      },
    });

    return NextResponse.json({ purchaseOrder }, { status: 201 });
  } catch (error: any) {
    console.error('Purchase order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase order', message: error.message },
      { status: 500 }
    );
  }
}

