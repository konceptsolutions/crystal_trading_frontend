import { NextResponse } from 'next/server';

// This route exists only to avoid Next dev build errors when a custom Express server is used.
// The real Shelves API is implemented in Express at `/api/shelves`.
export async function GET() {
  return NextResponse.json({ error: 'Use /api/shelves (Express API)' }, { status: 410 });
}


