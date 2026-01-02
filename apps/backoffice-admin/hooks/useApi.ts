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

// Handle 401 errors by clearing token and redirecting to login
function handleUnauthorized() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_jwt');
    window.location.href = '/login';
  }
}

export function useApi() {
  const get = useCallback(async (path: string) => {
    const url = path.startsWith('/api/v1') ? `${ADMIN_GATEWAY_URL}${path}` : `${ADMIN_GATEWAY_URL}/api/v1${path}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    // Handle 401 - redirect to login
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired');
    }

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

    // Handle 401 - redirect to login
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired');
    }

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

    // Handle 401 - redirect to login
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired');
    }

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

    // Handle 401 - redirect to login
    if (res.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired');
    }

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'API Error');
    }
    return json;
  }, []);

  return { get, post, put, delete: del };
}
