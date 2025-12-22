import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware/auth';

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET all accounts data
export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'main-groups';
    const mainGroupId = searchParams.get('mainGroupId');
    const subGroupId = searchParams.get('subGroupId');
    const status = searchParams.get('status');

    let url = `${API_BASE_URL}/accounts/${type}`;
    const params = new URLSearchParams();

    if (mainGroupId) params.append('mainGroupId', mainGroupId);
    if (subGroupId) params.append('subGroupId', subGroupId);
    if (status) params.append('status', status);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', message: error.message },
      { status: 500 }
    );
  }
}

// POST create new item
export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'main-groups';
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/accounts/${type}`, {
      method: 'POST',
      headers: {
        Authorization: request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to create item', message: error.message },
      { status: 500 }
    );
  }
}

