import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const machine_part_id = searchParams.get('machine_part_id');

    if (!machine_part_id) {
      return NextResponse.json({ error: 'machine_part_id is required' }, { status: 400 });
    }

    // Get models for the specific part
    const models = await prisma.partModel.findMany({
      where: {
        partId: machine_part_id
      },
      select: {
        id: true,
        modelNo: true
      },
      orderBy: {
        modelNo: 'asc'
      }
    });

    const formattedModels = models.map(model => ({
      id: model.id,
      name: model.modelNo
    }));

    return NextResponse.json({ machinepartmodel: formattedModels });
  } catch (error) {
    console.error('Error fetching machine part models:', error);
    return NextResponse.json({ error: 'Failed to fetch machine part models' }, { status: 500 });
  }
}