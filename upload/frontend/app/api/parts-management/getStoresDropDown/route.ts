import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const store_type_id = searchParams.get('store_type_id');

    // Try to get stores from the Store model first (if it exists in schema)
    let formattedStores: any[] = [];
    
    try {
      // Check if Store model exists and has data
      const stores = await prisma.store.findMany({
        where: {
          status: 'A'
        },
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      if (stores && stores.length > 0) {
        formattedStores = stores.map(store => ({
          id: store.id,
          name: store.name
        }));
      }
    } catch (storeModelError) {
      console.log('Store model not available, trying Stock table...');
    }

    // If no stores from Store model, get from Stock table
    if (formattedStores.length === 0) {
      try {
        const stocks = await prisma.stock.findMany({
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

        formattedStores = stocks
          .filter(s => s.store)
          .map((stock, index) => ({
            id: `stock-${index + 1}`,
            name: stock.store
          }));
      } catch (stockError) {
        console.log('Stock table not available...');
      }
    }

    // If no stores found, provide defaults
    if (formattedStores.length === 0) {
      formattedStores = [
        { id: '1', name: 'Main Store' },
        { id: '2', name: 'Branch Store' },
        { id: '3', name: 'Warehouse' }
      ];
    }

    // Filter by store type if provided
    if (store_type_id) {
      const storeTypeMap: any = {
        '1': formattedStores.filter(s => s.name?.toLowerCase().includes('warehouse')),
        '2': formattedStores.filter(s => s.name?.toLowerCase().includes('store')),
        '3': formattedStores.filter(s => s.name?.toLowerCase().includes('service'))
      };
      
      formattedStores = storeTypeMap[store_type_id] || formattedStores;
    }

    // Return in the format expected by the component
    return NextResponse.json({ 
      stores: formattedStores,
      store: formattedStores // Also include 'store' for backward compatibility
    });
  } catch (error: any) {
    console.error('Error fetching stores:', error);
    // Return default stores on error
    return NextResponse.json({ 
      stores: [
        { id: '1', name: 'Main Store' },
        { id: '2', name: 'Branch Store' },
        { id: '3', name: 'Warehouse' }
      ],
      error: 'Failed to fetch stores'
    }, { status: 500 });
  }
}

