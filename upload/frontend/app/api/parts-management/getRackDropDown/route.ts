import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const store_id = searchParams.get('store_id');

    // Get unique rack numbers from the stock table
    let racks = await prisma.stock.findMany({
      where: {
        ...(store_id && {
          store: store_id
        }),
        racks: {
          not: null
        }
      },
      select: {
        racks: true,
        store: true
      },
      distinct: ['racks']
    });

    // If no racks found, provide defaults
    let formattedRacks = racks
      .filter(s => s.racks)
      .map((stock, index) => ({
        id: index + 1,
        rack_number: stock.racks,
        store_id: 1 // Default store ID
      }));

    // If no racks found, provide defaults
    if (formattedRacks.length === 0) {
      formattedRacks = [
        { id: 1, rack_number: 'R001', store_id: 1 },
        { id: 2, rack_number: 'R002', store_id: 1 },
        { id: 3, rack_number: 'R003', store_id: 1 },
        { id: 4, rack_number: 'R004', store_id: 1 },
        { id: 5, rack_number: 'R005', store_id: 1 }
      ];
    }

    return NextResponse.json({ racks: formattedRacks });
  } catch (error) {
    console.error('Error fetching racks:', error);
    return NextResponse.json({ error: 'Failed to fetch racks' }, { status: 500 });
  }
}