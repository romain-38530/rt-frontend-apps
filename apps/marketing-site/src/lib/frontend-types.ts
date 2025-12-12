/**
 * Types for Frontend API Integration
 */

export interface API_CONFIG {
  baseUrl: string;
  timeout: number;
}

export interface VATValidationRequest {
  vatNumber: string;
}

export interface VATValidationResponse {
  success: boolean;
  valid: boolean;
  vatNumber?: string;
  countryCode?: string;
  companyName?: string;
  address?: string;
  message?: string;
}

export interface VATFormatValidationRequest {
  vatNumber: string;
}

export interface VATFormatValidationResponse {
  success: boolean;
  valid: boolean;
  message?: string;
}

export interface PriceCalculationRequest {
  amount: number;
  countryCode: string;
}

export interface PriceCalculationResponse {
  success: boolean;
  priceExcl: number;
  priceIncl: number;
  vatRate: number;
  vatAmount: number;
  currency: string;
  countryCode: string;
}

export interface HealthCheckResponse {
  status: string;
  message?: string;
  timestamp?: string;
}

export interface APIInfoResponse {
  name: string;
  version: string;
  description?: string;
}

export interface APIError extends Error {
  code: string;
  status: number;
  details?: unknown;
}
