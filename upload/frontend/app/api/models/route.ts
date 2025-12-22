import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware/auth';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const search = searchParams.get('search') || '';
    const partId = searchParams.get('partId') || '';
    const tab = searchParams.get('tab') || '';

    // Forward request to backend server
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/models`;
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (search) params.set('search', search);
    if (partId) params.set('partId', partId);
    if (tab) params.set('tab', tab);

    const response = await fetch(`${backendUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models', message: error.message },
      { status: 500 }
    );
  }
}

