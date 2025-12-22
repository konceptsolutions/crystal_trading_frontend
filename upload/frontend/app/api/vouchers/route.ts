import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware/auth';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/vouchers`;
    const url = new URL(request.url);
    
    const response = await fetch(`${backendUrl}?${url.searchParams.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Vouchers fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('Authorization');
    
    // Log for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Vouchers API] POST request received');
      console.log('[Vouchers API] Has auth header:', !!authHeader);
    }

    const user = verifyToken(request);
    if (!user) {
      console.error('[Vouchers API] Token verification failed');
      console.error('[Vouchers API] Auth header present:', !!authHeader);
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Invalid or missing authentication token. Please login again.' 
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/vouchers`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader || '',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Vouchers API] Backend error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Vouchers API] Voucher creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create voucher', 
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

