import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const records = parseInt(searchParams.get('records') || '10');
    const pageNo = parseInt(searchParams.get('pageNo') || '1');
    const colName = searchParams.get('colName') || 'id';
    const sort = searchParams.get('sort') || 'desc';
    const item_id = searchParams.get('item_id');
    const store_id = searchParams.get('store_id');
    const store_type_id = searchParams.get('store_type_id');
    const category_id = searchParams.get('category_id');
    const sub_category_id = searchParams.get('sub_category_id');
    const part_model_id = searchParams.get('part_model_id');
    const from_date = searchParams.get('from_date');
    const to_date = searchParams.get('to_date');

    const limit = records;
    const page = pageNo;
    const offset = (page - 1) * limit;

    // Build filters - use AND to combine all conditions
    const conditions: any[] = [];
    
    // Basic filters
    if (item_id) conditions.push({ id: item_id });
    if (category_id) conditions.push({ mainCategory: category_id });
    if (sub_category_id) conditions.push({ subCategory: sub_category_id });
    if (part_model_id) conditions.push({ id: part_model_id });
    
    // Build date filter
    if (from_date || to_date) {
      const dateFilter: any = {};
      if (from_date) {
        const fromDate = new Date(from_date);
        fromDate.setHours(0, 0, 0, 0);
        dateFilter.gte = fromDate;
      }
      if (to_date) {
        const toDate = new Date(to_date);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.lte = toDate;
      }
      
      // Add date filter - match either createdAt or updatedAt
      conditions.push({
        OR: [
          { createdAt: dateFilter },
          { updatedAt: dateFilter }
        ]
      });
    }
    
    // Combine all conditions with AND (don't filter by stock here - we'll do it after)
    const where: any = conditions.length > 0 ? { AND: conditions } : {};

    // Fetch parts with stock included (we'll filter by quantity after fetching)
    // Fetch a larger batch to account for zero quantity items that will be filtered out
    const fetchLimit = Math.max(limit * 5, 100); // Fetch at least 5x the limit or 100, whichever is larger
    
    const allParts = await prisma.part.findMany({
      where,
      include: {
        stock: true,
        models: true
      },
      orderBy: {
        [colName]: sort as 'asc' | 'desc'
      },
      take: fetchLimit
    });

    // Filter out zero quantity items and parts without stock AFTER fetching
    const partsWithStock = allParts.filter((part) => {
      return part.stock && (part.stock.quantity || 0) > 0;
    });
    
    // For total count, we estimate based on what we fetched
    // In production, consider adding a database view or materialized query for better performance
    const total = partsWithStock.length;
    
    // Apply pagination to filtered results
    const parts = partsWithStock.slice(offset, offset + limit);

    // Format response to match expected structure from documentation
    const formattedData = parts
      .map((part) => ({
        id: part.id,
        quantity: part.stock?.quantity || 0,
        item: {
          id: part.id,
          machine_part_oem_part: {
            oem_part_number: {
              number1: part.partNo,
              number2: part.masterPartNo || ''
            },
            machine_part: {
              name: part.description || part.partNo,
              unit: {
                name: part.uom || 'Piece'
              }
            }
          },
          brand: {
            name: part.brand || 'Generic'
          },
          machine_model: {
            name: part.models?.[0]?.modelNo || 'Universal'
          }
        },
        store: {
          name: part.stock?.store || 'Main Store',
          store_type: {
            name: 'Warehouse'
          }
        },
        racks: {
          rack_number: part.stock?.racks || part.rackNo || 'R001'
        },
        shelves: {
          shelf_number: part.stock?.shelf || 'S001'
        }
      }));

    const response = {
      itemsInventory: {
        data: formattedData,
        from: offset + 1,
        to: Math.min(offset + limit, total),
        total,
        current_page: page,
        per_page: limit
      }
    };

    console.log('Returning inventory data:', {
      total,
      dataCount: formattedData.length,
      page,
      limit
    });
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching inventory items:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to fetch inventory items',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}