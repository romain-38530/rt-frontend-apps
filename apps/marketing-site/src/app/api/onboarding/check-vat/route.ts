import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Essayer d'appeler l'API backend pour vérifier les doublons
    try {
      const response = await fetch(`${API_URL}/api/onboarding/check-vat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      // Si le backend n'a pas cet endpoint, on continue
      console.warn('Backend check-vat non disponible:', backendError);
    }

    // Par défaut, retourner que le VAT n'existe pas
    // La vérification sera faite à la soumission finale
    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Check VAT proxy error:', error);
    return NextResponse.json({ exists: false });
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
