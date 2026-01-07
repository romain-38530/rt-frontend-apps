/**
 * Hook useApi pour les appels API avec authentification
 * Inclut le mécanisme de refresh token automatique
 */
import { useCallback } from 'react';

const ADMIN_GATEWAY_URL = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://dg8g5z1kjx7u6.cloudfront.net';
const AUTHZ_URL = process.env.NEXT_PUBLIC_AUTHZ_URL || 'https://ddaywxps9n701.cloudfront.net';

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_jwt') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Attempt to refresh the access token using the refresh token
async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const refreshToken = localStorage.getItem('admin_refresh_token');
  if (!refreshToken) return false;

  // If already refreshing, wait for that promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${AUTHZ_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        return false;
      }

      const json = await res.json();
      if (json.accessToken) {
        localStorage.setItem('admin_jwt', json.accessToken);
        if (json.refreshToken) {
          localStorage.setItem('admin_refresh_token', json.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Handle 401 errors by attempting refresh, then redirecting to login if needed
async function handleUnauthorized(): Promise<boolean> {
  const refreshed = await refreshAccessToken();
  if (!refreshed && typeof window !== 'undefined') {
    localStorage.removeItem('admin_jwt');
    localStorage.removeItem('admin_refresh_token');
    window.location.href = '/login';
  }
  return refreshed;
}

// Generic fetch with retry on 401
async function fetchWithRetry(url: string, options: RequestInit): Promise<Response> {
  let res = await fetch(url, options);

  // If 401, try to refresh and retry once
  if (res.status === 401) {
    const refreshed = await handleUnauthorized();
    if (refreshed) {
      // Retry with new token
      const newOptions = {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${localStorage.getItem('admin_jwt')}`,
        },
      };
      res = await fetch(url, newOptions);
    }
  }

  return res;
}

export function useApi() {
  const get = useCallback(async (path: string) => {
    const url = path.startsWith('/api/v1') ? `${ADMIN_GATEWAY_URL}${path}` : `${ADMIN_GATEWAY_URL}/api/v1${path}`;
    const res = await fetchWithRetry(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
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
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
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
    const res = await fetchWithRetry(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
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
    const res = await fetchWithRetry(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
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
