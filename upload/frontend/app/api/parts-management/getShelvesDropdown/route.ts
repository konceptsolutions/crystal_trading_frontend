import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // rack id

    // Get unique shelf numbers from the stock table
    let shelves = await prisma.stock.findMany({
      where: {
        ...(id && {
          racks: id
        }),
        shelf: {
          not: null
        }
      },
      select: {
        shelf: true,
        racks: true
      },
      distinct: ['shelf']
    });

    // If no shelves found, provide defaults
    let formattedShelves = shelves
      .filter(s => s.shelf)
      .map((stock, index) => ({
        id: index + 1,
        shelf_number: stock.shelf,
        rack_id: 1 // Default rack ID
      }));

    // If no shelves found, provide defaults
    if (formattedShelves.length === 0) {
      formattedShelves = [
        { id: 1, shelf_number: 'S001', rack_id: 1 },
        { id: 2, shelf_number: 'S002', rack_id: 1 },
        { id: 3, shelf_number: 'S003', rack_id: 1 },
        { id: 4, shelf_number: 'S004', rack_id: 1 }
      ];
    }

    return NextResponse.json({ shelves: formattedShelves });
  } catch (error) {
    console.error('Error fetching shelves:', error);
    return NextResponse.json({ error: 'Failed to fetch shelves' }, { status: 500 });
  }
}