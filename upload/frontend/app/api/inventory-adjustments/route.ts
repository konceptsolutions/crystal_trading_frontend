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

    const [adjustments, total] = await Promise.all([
      prisma.inventoryAdjustment.findMany({
        include: {
          items: {
            include: {
              part: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.inventoryAdjustment.count(),
    ]);

    return NextResponse.json({
      adjustments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Inventory adjustments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory adjustments', message: error.message },
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
    const { adjustmentNo, total, date, notes, items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Adjustment must have at least one item' },
        { status: 400 }
      );
    }

    // Calculate new quantities
    const itemsWithNewQuantity = items.map((item: any) => ({
      ...item,
      newQuantity: (item.previousQuantity || 0) + (item.adjustedQuantity || 0),
    }));

    // Create adjustment with items in a transaction
    const adjustment = await prisma.$transaction(async (tx) => {
      // Create the adjustment
      const newAdjustment = await tx.inventoryAdjustment.create({
        data: {
          adjustmentNo: adjustmentNo || null,
          total: total || 0,
          date: date ? new Date(date) : new Date(),
          notes: notes || null,
          createdBy: user.userId || null,
          items: {
            create: itemsWithNewQuantity.map((item: any) => ({
              partId: item.partId || null,
              partNo: item.partNo,
              description: item.description || null,
              previousQuantity: item.previousQuantity || 0,
              adjustedQuantity: item.adjustedQuantity || 0,
              newQuantity: item.newQuantity,
              reason: item.reason || null,
            })),
          },
        },
        include: {
          items: {
            include: {
              part: true,
            },
          },
        },
      });

      // Update stock for each item
      for (const item of itemsWithNewQuantity) {
        if (item.partId) {
          // Update or create stock entry
          const existingStock = await tx.stock.findUnique({
            where: { partId: item.partId },
          });

          if (existingStock) {
            await tx.stock.update({
              where: { partId: item.partId },
              data: {
                quantity: item.newQuantity,
              },
            });
          } else {
            await tx.stock.create({
              data: {
                partId: item.partId,
                quantity: item.newQuantity,
              },
            });
          }
        }
      }

      return newAdjustment;
    });

    return NextResponse.json({ adjustment }, { status: 201 });
  } catch (error: any) {
    console.error('Inventory adjustment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory adjustment', message: error.message },
      { status: 500 }
    );
  }
}

