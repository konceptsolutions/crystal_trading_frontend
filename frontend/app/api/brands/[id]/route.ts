import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyToken } from '@/lib/middleware/auth';

export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brand = await prisma.brand.findUnique({
      where: { id: params.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error: any) {
    console.error('Brand fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: any;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, status } = body;

    const existingBrand = await prisma.brand.findUnique({ where: { id: params.id } });
    if (!existingBrand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    const brand = await prisma.brand.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    return NextResponse.json({ brand });
  } catch (error: any) {
    console.error('Brand update error:', error);

    if (error.code === 'P2025') return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'Brand with this name already exists' }, { status: 400 });

    return NextResponse.json(
      { error: 'Failed to update brand', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brand = await prisma.brand.findUnique({
      where: { id: params.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const partsCount = await prisma.part.count({ where: { brand: brand.name } });
    if (partsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete brand. It is used by ${partsCount} part(s).` },
        { status: 400 }
      );
    }

    await prisma.brand.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Brand deleted successfully' });
  } catch (error: any) {
    console.error('Brand delete error:', error);

    if (error.code === 'P2025') return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    return NextResponse.json(
      { error: 'Failed to delete brand', message: error.message },
      { status: 500 }
    );
  }
}