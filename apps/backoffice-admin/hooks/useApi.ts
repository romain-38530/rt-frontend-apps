/**
 * Hook useApi pour les appels API avec authentification
 */
import { useCallback } from 'react';

const ADMIN_GATEWAY_URL = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://dg8g5z1kjx7u6.cloudfront.net';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_jwt') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useApi() {
  const get = useCallback(async (path: string) => {
    const url = path.startsWith('/api/v1') ? `${ADMIN_GATEWAY_URL}${path}` : `${ADMIN_GATEWAY_URL}/api/v1${path}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'API Error');
    }
    return json;
  }, []);

  const post = useCallback(async (path: string, body?: any) => {
    const url = path.startsWith('/api/v1') ? `${ADMIN_GATEWAY_URL}${path}` : `${ADMIN_GATEWAY_URL}/api/v1${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'API Error');
    }
    return json;
  }, []);

  const put = useCallback(async (path: string, body?: any) => {
    const url = path.startsWith('/api/v1') ? `${ADMIN_GATEWAY_URL}${path}` : `${ADMIN_GATEWAY_URL}/api/v1${path}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'API Error');
    }
    return json;
  }, []);

  const del = useCallback(async (path: string) => {
    const url = path.startsWith('/api/v1') ? `${ADMIN_GATEWAY_URL}${path}` : `${ADMIN_GATEWAY_URL}/api/v1${path}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'API Error');
    }
    return json;
  }, []);

  return { get, post, put, delete: del };
}
