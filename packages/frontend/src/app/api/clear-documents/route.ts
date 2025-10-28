import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  const response = await fetch(`${backendUrl}/api/clear-documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader || '',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Backend clear documents error:', errorText);
    return NextResponse.json({ detail: errorText }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
