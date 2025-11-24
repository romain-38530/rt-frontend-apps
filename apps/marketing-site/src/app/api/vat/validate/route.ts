import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime instead of Edge runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Backend API URL - hardcoded for reliability since env vars may not be accessible in Edge runtime
    const backendUrl = 'http://rt-authz-api-prod.eba-smipp22d.eu-central-1.elasticbeanstalk.com';

    console.log('[VAT Proxy] Forwarding request to:', backendUrl);

    // Proxy the request to the backend
    const backendResponse = await fetch(`${backendUrl}/api/vat/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vatNumber }),
    });

    console.log('[VAT Proxy] Backend response status:', backendResponse.status);

    const data = await backendResponse.json();

    // Return the backend response
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('[VAT Proxy] Error:', error);
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
