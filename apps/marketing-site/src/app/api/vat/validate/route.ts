import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route for VAT validation
 * Proxies requests to the authz API backend to avoid mixed content blocking
 * (frontend is HTTPS, backend is HTTP only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vatNumber } = body;

    if (!vatNumber) {
      return NextResponse.json(
        { success: false, error: 'VAT number is required' },
        { status: 400 }
      );
    }

    // Backend API URL from environment variable
    const backendUrl = process.env.NEXT_PUBLIC_VAT_API_URL || process.env.NEXT_PUBLIC_API_URL;

    if (!backendUrl) {
      console.error('Backend API URL not configured');
      return NextResponse.json(
        { success: false, error: 'Backend API not configured' },
        { status: 500 }
      );
    }

    // Proxy the request to the backend
    const response = await fetch(`${backendUrl}/api/vat/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vatNumber }),
    });

    const data = await response.json();

    // Return the backend response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('VAT validation proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate VAT number',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST method to validate VAT numbers' },
    { status: 405 }
  );
}
