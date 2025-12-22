import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/utils/prisma';
import { verifyToken } from '@/lib/middleware/auth';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// Temporary storage file path (in project root/data directory)
const getStoragePath = () => {
  // Use a data directory in the project root
  return join(process.cwd(), 'data', 'stock-transfers.json');
};

// Helper to read transfers from file
async function readTransfers(): Promise<any[]> {
  try {
    const storageFile = getStoragePath();
    const data = await readFile(storageFile, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    // File doesn't exist yet, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading transfers file:', error);
    return [];
  }
}

// Helper to write transfers to file
async function writeTransfers(transfers: any[]): Promise<void> {
  try {
    const storageFile = getStoragePath();
    const { mkdir } = await import('fs/promises');
    const { dirname } = await import('path');
    await mkdir(dirname(storageFile), { recursive: true });
    await writeFile(storageFile, JSON.stringify(transfers, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing transfers file:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Read transfers from file
    const allTransfers = await readTransfers();
    
    // Apply pagination
    const transfers = allTransfers
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(skip, skip + limit);
    
    const total = allTransfers.length;
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      transfers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('Error fetching stock transfers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock transfers', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transferNo, transferDate, status, notes, items, fromStoreId, toStoreId } = body;

    // Validate required fields
    if (!transferNo || !transferDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Read existing transfers
    const allTransfers = await readTransfers();
    
    // Create new transfer
    const transfer = {
      id: `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      transferNo,
      transferDate,
      status: status || 'draft',
      notes: notes || '',
      items,
      fromStoreId,
      toStoreId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to array and save
    allTransfers.push(transfer);
    await writeTransfers(allTransfers);

    console.log('Stock transfer saved:', transfer.id);

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating stock transfer:', error);
    return NextResponse.json(
      { error: 'Failed to create stock transfer', message: error.message },
      { status: 500 }
    );
  }
}

