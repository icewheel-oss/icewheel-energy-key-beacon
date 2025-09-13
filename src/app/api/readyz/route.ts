import { NextResponse } from 'next/server';

export async function GET() {
  // For now, a simple OK. This can be extended to check database connections, etc.
  return new NextResponse(JSON.stringify({ status: 'ok' }), { status: 200 });
}
