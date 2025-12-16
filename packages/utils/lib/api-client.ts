/**
 * API Client centralisé pour toutes les requêtes HTTP
 * Gère l'authentification JWT, les erreurs et les retry
 */

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: ApiError = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };

        try {
          const errorData = await response.json();
          error.details = errorData;
          if (errorData && typeof errorData === 'object') {
            error.message = (errorData as any).message || error.message;
            error.code = (errorData as any).code;
          }
        } catch {
          // Response body n'est pas du JSON
        }

        throw error;
      }

      // Gérer les réponses vides (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json() as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Retry logic pour les erreurs réseau
      if (
        attempt < this.retries &&
        (error.name === 'AbortError' || error.message === 'Failed to fetch')
      ) {
        console.warn(`Retry ${attempt}/${this.retries} for ${url}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        return this.request<T>(path, options, attempt + 1);
      }

      throw error;
    }
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    let url = path;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle arrays by appending each value separately
          if (Array.isArray(value)) {
            value.forEach((item) => {
              if (item !== undefined && item !== null) {
                searchParams.append(key, String(item));
              }
            });
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${path}?${queryString}`;
      }
    }

    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async uploadFile<T>(path: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
      throw error;
    }

    return await response.json() as T;
  }
}

// Factory function pour créer des clients API spécifiques
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

// Clients API par défaut pour chaque service
export const ordersApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net/api',
  timeout: 30000,
  retries: 3,
});

export const trackingApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_TRACKING_API_URL || 'https://d2mn43ccfvt3ub.cloudfront.net/api',
  timeout: 30000,
  retries: 3,
});

export const documentsApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_DOCUMENTS_API_URL || 'https://d8987l284s9q4.cloudfront.net/api',
  timeout: 60000, // Plus long pour les uploads
  retries: 2,
});

export const notificationsApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_NOTIFICATIONS_API_URL || 'https://d2t9age53em7o5.cloudfront.net/api',
  timeout: 30000,
  retries: 3,
});

export const carriersApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_CARRIERS_API_URL || 'https://ddaywxps9n701.cloudfront.net/api',
  timeout: 30000,
  retries: 3,
});

export const affretIaApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_AFFRET_IA_API_URL || 'https://d393yiia4ig3bw.cloudfront.net/api',
  timeout: 45000, // Plus long pour l'IA
  retries: 2,
});

export default ApiClient;
