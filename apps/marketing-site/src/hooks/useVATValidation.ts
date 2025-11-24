import { useState, useCallback } from 'react';

export interface VATValidationResult {
  success: boolean;
  valid: boolean;
  countryCode: string;
  vatNumber: string;
  requestDate: string;
  companyName?: string;
  companyAddress?: string;
  source?: 'VIES' | 'AbstractAPI' | 'APILayer';
  errorCode?: string;
  errorMessage?: string;
}

export function useVATValidation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VATValidationResult | null>(null);

  const validate = useCallback(async (vatNumber: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_VAT_API_URL || 'https://d2i50a1vlg138w.cloudfront.net';
      const response = await fetch(`${apiUrl}/api/vat/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatNumber }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de validation TVA';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { validate, loading, error, result, reset };
}
