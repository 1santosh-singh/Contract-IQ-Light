import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const authHeader = request.headers.get('Authorization');

    // Add retry logic for connection issues
    let response;
    let retries = 3;
    
    while (retries > 0) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        response = await fetch(`${backendUrl}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader || '',
          },
          body: formData,
        });
        break; // Success, exit retry loop
      } catch (error) {
        console.error(`Upload attempt failed (${4-retries}/3):`, error);
        retries--;
        if (retries === 0) {
          console.error('All upload attempts failed');
          return NextResponse.json(
            { detail: 'Backend server is not responding. Please try again in a moment.' }, 
            { status: 503 }
          );
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // TypeScript guard: response is guaranteed to be defined here (early returns handled in retry loop)
    if (!response) {
      return NextResponse.json(
        { detail: 'Backend connection failed' }, 
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend upload error:', errorText);
      return NextResponse.json({ detail: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { detail: 'Internal server error during upload' }, 
      { status: 500 }
    );
  }
}