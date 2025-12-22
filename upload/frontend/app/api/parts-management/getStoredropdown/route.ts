import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const store_type_id = searchParams.get('store_type_id');

    // Get unique store names from the stock table
    const stores = await prisma.stock.findMany({
      where: {
        store: {
          not: null
        }
      },
      select: {
        store: true
      },
      distinct: ['store']
    });

    // If no stores in stock, provide some defaults
    let formattedStores = stores
      .filter(s => s.store)
      .map((stock, index) => ({
        id: index + 1,
        name: stock.store
      }));

    // If no stores found, provide defaults
    if (formattedStores.length === 0) {
      formattedStores = [
        { id: 1, name: 'Main Store' },
        { id: 2, name: 'Branch Store' },
        { id: 3, name: 'Warehouse' }
      ];
    }

    // Filter by store type if provided (simplified logic)
    if (store_type_id) {
      // For now, just return filtered results based on store type
      const storeTypeMap: any = {
        '1': formattedStores.filter(s => s.name?.toLowerCase().includes('warehouse')),
        '2': formattedStores.filter(s => s.name?.toLowerCase().includes('store')),
        '3': formattedStores.filter(s => s.name?.toLowerCase().includes('service'))
      };
      
      formattedStores = storeTypeMap[store_type_id] || formattedStores;
    }

    return NextResponse.json({ store: formattedStores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}