import { NextRequest, NextResponse } from 'next/server';

const VAT_API_URL = process.env.NEXT_PUBLIC_VAT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${VAT_API_URL}/api/vat/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('VAT validation proxy error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur de connexion au service de validation TVA' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
