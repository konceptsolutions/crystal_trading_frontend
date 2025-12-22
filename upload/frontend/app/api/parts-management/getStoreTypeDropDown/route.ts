import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Since store types don't exist in the current schema, 
    // we'll return some default store types
    const storeTypes = [
      { id: 1, name: 'Warehouse' },
      { id: 2, name: 'Retail Store' },
      { id: 3, name: 'Service Center' }
    ];

    return NextResponse.json({ storeType: storeTypes });
  } catch (error) {
    console.error('Error fetching store types:', error);
    return NextResponse.json({ error: 'Failed to fetch store types' }, { status: 500 });
  }
}