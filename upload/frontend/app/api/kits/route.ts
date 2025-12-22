import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyToken } from '@/lib/middleware/auth';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const kits = await prisma.kit.findMany({
      include: {
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

    return NextResponse.json({ kits });
  } catch (error: any) {
    console.error('Kits fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kits', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    // Read body first
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { kitNo, name, description, totalCost, price, status, items } = body;

    const kit = await prisma.kit.create({
      data: {
        kitNo,
        name,
        description,
        totalCost,
        price,
        status: status || 'A',
        items: {
          create: items.map((item: any) => ({
            partId: item.partId,
            quantity: item.quantity,
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

    return NextResponse.json({ kit }, { status: 201 });
  } catch (error: any) {
    console.error('Kit creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create kit', message: error.message },
      { status: 500 }
    );
  }
}

