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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const masterPartNo = searchParams.get('masterPartNo');
    const partNo = searchParams.get('partNo');
    const brand = searchParams.get('brand');
    const description = searchParams.get('description');
    const mainCategory = searchParams.get('mainCategory');
    const subCategory = searchParams.get('subCategory');
    const application = searchParams.get('application');
    const origin = searchParams.get('origin');
    const grade = searchParams.get('grade');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    
    // Individual filters take priority over general search
    if (masterPartNo) {
      // Use exact match for masterPartNo filter (case-insensitive)
      where.masterPartNo = { equals: masterPartNo, mode: 'insensitive' };
    }
    if (partNo) {
      where.partNo = { contains: partNo, mode: 'insensitive' };
    }
    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }
    if (description) {
      where.description = { contains: description, mode: 'insensitive' };
    }
    if (mainCategory) {
      where.mainCategory = { contains: mainCategory, mode: 'insensitive' };
    }
    if (subCategory) {
      where.subCategory = { contains: subCategory, mode: 'insensitive' };
    }
    if (application) {
      where.application = { contains: application, mode: 'insensitive' };
    }
    if (origin) {
      where.origin = { contains: origin, mode: 'insensitive' };
    }
    if (grade) {
      where.grade = grade;
    }
    
    // General search only if no individual filters are set
    if (search && !masterPartNo && !partNo && !description) {
      where.OR = [
        { partNo: { contains: search, mode: 'insensitive' } },
        { masterPartNo: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        skip,
        take: limit,
        include: {
          stock: true,
          models: true,
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

    // Extract models from body
    const { models, ...partData } = body;

    // Create part in a transaction
    const part = await prisma.$transaction(async (tx) => {
      // Create the part
      const newPart = await tx.part.create({
        data: partData,
      });

      // Create models if provided
      if (models && models.length > 0) {
        await tx.partModel.createMany({
          data: models.map((model: any) => ({
            partId: newPart.id,
            modelNo: model.modelNo,
            qtyUsed: model.qtyUsed,
            tab: model.tab || 'P1',
          })),
        });
      }

      // Return the part with models
      return await tx.part.findUnique({
        where: { id: newPart.id },
        include: {
          models: true,
          stock: true,
        },
      });
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

