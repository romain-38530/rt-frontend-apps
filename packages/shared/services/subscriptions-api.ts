/**
 * SYMPHONI.A - Subscriptions & Pricing API Client
 * Service TypeScript pour la gestion des abonnements et tarification
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net';

// =============================================================================
// TYPES
// =============================================================================

export interface SubscriptionType {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceLaunch?: number;
  launchEndDate?: string;
  currentPrice: number;
  isLaunchPrice: boolean;
  features: string[];
  limitations?: string[];
  includedTransports?: number;
  extraTransportPrice?: number;
}

export interface TrackingIAOption {
  id: string;
  name: string;
  description: string;
  priceMonthly?: number;
  pricePerTransport?: number;
  features: string[];
}

export interface Module {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  commissionRate?: number;
  features: string[];
}

export interface Pack {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  savings: string;
  includes: Array<{ type: string; id: string }>;
  includedDetails: Array<SubscriptionType | TrackingIAOption | Module>;
  bonusFeatures: string[];
}

export interface Discount {
  id: string;
  name: string;
  discountPercent: number;
  durationYears: number;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  priceOneShot?: number;
  pricePerUnit?: number;
  unit?: string;
  features: string[];
}

export interface PricingGrid {
  subscriptions: Record<string, SubscriptionType>;
  trackingIA: Record<string, TrackingIAOption>;
  modules: Record<string, Module>;
  packs: Record<string, Pack>;
  discounts: Record<string, Discount>;
  services: Record<string, Service>;
  isLaunchPeriod: boolean;
  launchEndDate: string;
}

export interface PricingBreakdownItem {
  type: 'subscription' | 'module' | 'tracking' | 'pack' | 'discount';
  name: string;
  price: number;
  percent?: number;
  isLaunchPrice?: boolean;
}

export interface PricingCalculation {
  basePrice: number;
  modulesPrice: number;
  trackingPrice: number;
  packPrice: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalMonthly: number;
  totalAnnual: number;
  breakdown: PricingBreakdownItem[];
}

export interface ActiveModule {
  moduleId: string;
  moduleName: string;
  activatedAt: string;
  priceMonthly: number;
}

export interface Subscription {
  id: string;
  companyId: string;
  companyName: string;
  companyType: 'industry' | 'transporter' | 'logistician' | 'forwarder';
  subscriptionType: string;
  subscriptionName: string;
  activeModules: ActiveModule[];
  trackingIALevel: 'NONE' | 'BASIC' | 'INTERMEDIAIRE' | 'PREMIUM';
  packId?: string;
  packName?: string;
  pricing: {
    basePrice: number;
    modulesPrice: number;
    trackingPrice: number;
    packPrice: number;
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    totalMonthly: number;
    totalAnnual: number;
  };
  engagement: {
    type: 'monthly' | '1_year' | '3_years' | '4_years' | '5_years';
    startDate: string;
    endDate?: string;
    discountPercent: number;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'trial' | 'past_due' | 'canceled' | 'suspended';
  trialEndsAt?: string;
  billingCycle: 'monthly' | 'annual';
  nextBillingDate?: string;
  lastBillingDate?: string;
  usage: {
    transportsThisMonth: number;
    affretIATransactions: number;
    trackingPremiumUsage: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: 'subscription' | 'module' | 'usage' | 'commission' | 'discount';
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  companyId: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'refunded';
  paidAt?: string;
  stripeInvoiceId?: string;
  pdfUrl?: string;
  createdAt: string;
}

export interface UsageRecord {
  id: string;
  subscriptionId: string;
  companyId: string;
  type: 'transport' | 'affret_ia_commission' | 'tracking_premium';
  referenceId?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  metadata?: any;
  recordedAt: string;
  billingPeriod: string;
}

export interface RevenueStats {
  mrr: number;
  arr: number;
  monthlyRevenue: Array<{ _id: string; revenue: number; count: number }>;
  revenueByType: Array<{ _id: string; revenue: number; count: number }>;
  subscribersByType: Array<{ _id: string; count: number }>;
  totalActiveSubscriptions: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(error.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// PRICING GRID
// =============================================================================

export async function getPricingGrid(): Promise<PricingGrid> {
  return fetchAPI('/pricing/grid');
}

export async function getSubscriptionTypes(companyType?: string): Promise<SubscriptionType[]> {
  const query = companyType ? `?companyType=${companyType}` : '';
  return fetchAPI(`/pricing/subscriptions${query}`);
}

export async function getModules(): Promise<Module[]> {
  return fetchAPI('/pricing/modules');
}

export async function getTrackingOptions(): Promise<TrackingIAOption[]> {
  return fetchAPI('/pricing/tracking');
}

export async function getPacks(): Promise<Pack[]> {
  return fetchAPI('/pricing/packs');
}

export async function getDiscounts(): Promise<Discount[]> {
  return fetchAPI('/pricing/discounts');
}

export async function getServices(): Promise<Service[]> {
  return fetchAPI('/pricing/services');
}

export async function calculatePrice(params: {
  subscriptionType?: string;
  modules?: string[];
  trackingLevel?: string;
  packId?: string;
  engagementType?: string;
}): Promise<PricingCalculation> {
  return fetchAPI('/pricing/calculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// SUBSCRIPTIONS
// =============================================================================

export async function createSubscription(params: {
  companyId: string;
  companyName: string;
  companyType: string;
  subscriptionType: string;
  modules?: string[];
  trackingLevel?: string;
  packId?: string;
  engagementType?: string;
  billingCycle?: 'monthly' | 'annual';
}): Promise<{ subscription: Subscription; pricing: PricingCalculation }> {
  return fetchAPI('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getSubscriptions(params?: {
  status?: string;
  companyType?: string;
  page?: number;
  limit?: number;
}): Promise<{
  subscriptions: Subscription[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.companyType) query.append('companyType', params.companyType);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  return fetchAPI(`/subscriptions?${query}`);
}

export async function getCompanySubscription(companyId: string): Promise<Subscription> {
  return fetchAPI(`/subscriptions/company/${companyId}`);
}

export async function getSubscription(id: string): Promise<Subscription> {
  return fetchAPI(`/subscriptions/${id}`);
}

export async function updateSubscription(
  id: string,
  params: {
    modules?: string[];
    trackingLevel?: string;
    packId?: string;
  }
): Promise<{ subscription: Subscription; pricing: PricingCalculation }> {
  return fetchAPI(`/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function activateSubscription(id: string): Promise<{ message: string; subscription: Subscription }> {
  return fetchAPI(`/subscriptions/${id}/activate`, {
    method: 'POST',
  });
}

export async function cancelSubscription(
  id: string,
  params: { reason?: string; cancelAtPeriodEnd?: boolean }
): Promise<{ message: string; subscription: Subscription }> {
  return fetchAPI(`/subscriptions/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// MODULES
// =============================================================================

export async function addModule(
  subscriptionId: string,
  moduleId: string
): Promise<{ message: string; subscription: Subscription; pricing: PricingCalculation }> {
  return fetchAPI(`/subscriptions/${subscriptionId}/modules`, {
    method: 'POST',
    body: JSON.stringify({ moduleId }),
  });
}

export async function removeModule(
  subscriptionId: string,
  moduleId: string
): Promise<{ message: string; subscription: Subscription; pricing: PricingCalculation }> {
  return fetchAPI(`/subscriptions/${subscriptionId}/modules/${moduleId}`, {
    method: 'DELETE',
  });
}

// =============================================================================
// USAGE
// =============================================================================

export async function recordUsage(params: {
  subscriptionId: string;
  companyId: string;
  type: 'transport' | 'affret_ia_commission' | 'tracking_premium';
  referenceId?: string;
  quantity?: number;
  unitPrice?: number;
  metadata?: any;
}): Promise<{ record: UsageRecord }> {
  return fetchAPI('/usage/record', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getUsageHistory(
  subscriptionId: string,
  period?: string
): Promise<{
  records: UsageRecord[];
  summary: Array<{ _id: string; count: number; total: number }>;
}> {
  const query = period ? `?period=${period}` : '';
  return fetchAPI(`/usage/${subscriptionId}${query}`);
}

// =============================================================================
// INVOICES
// =============================================================================

export async function generateInvoice(params: {
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<{ invoice: Invoice }> {
  return fetchAPI('/invoices/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getInvoices(params?: {
  companyId?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{
  invoices: Invoice[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const query = new URLSearchParams();
  if (params?.companyId) query.append('companyId', params.companyId);
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  return fetchAPI(`/invoices?${query}`);
}

export async function getInvoice(id: string): Promise<Invoice> {
  return fetchAPI(`/invoices/${id}`);
}

export async function markInvoicePaid(
  id: string,
  params?: { paymentMethod?: string; stripePaymentIntentId?: string }
): Promise<{ message: string; invoice: Invoice }> {
  return fetchAPI(`/invoices/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(params || {}),
  });
}

// =============================================================================
// STRIPE
// =============================================================================

export async function createStripeCustomer(params: {
  companyId: string;
  companyName: string;
  email: string;
}): Promise<{ customerId: string }> {
  return fetchAPI('/stripe/create-customer', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function createSetupIntent(customerId: string): Promise<{ clientSecret: string }> {
  return fetchAPI('/stripe/create-setup-intent', {
    method: 'POST',
    body: JSON.stringify({ customerId }),
  });
}

export async function createStripeSubscription(params: {
  subscriptionId: string;
  customerId: string;
  paymentMethodId: string;
}): Promise<{ subscriptionId: string; clientSecret: string }> {
  return fetchAPI('/stripe/create-subscription', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// STATISTICS (Admin)
// =============================================================================

export async function getRevenueStats(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<RevenueStats> {
  const query = new URLSearchParams();
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);

  return fetchAPI(`/stats/revenue?${query}`);
}

export async function getSubscriptionStats(): Promise<{
  byStatus: Array<{ _id: string; count: number }>;
  byType: Array<{ _id: string; count: number }>;
  byCompanyType: Array<{ _id: string; count: number }>;
  byEngagement: Array<{ _id: string; count: number }>;
  moduleUsage: Array<{ _id: string; count: number }>;
  trackingUsage: Array<{ _id: string; count: number }>;
}> {
  return fetchAPI('/stats/subscriptions');
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function getStatusLabel(status: Subscription['status']): string {
  const labels: Record<string, string> = {
    active: 'Actif',
    trial: 'Essai',
    past_due: 'Paiement en retard',
    canceled: 'Annule',
    suspended: 'Suspendu',
  };
  return labels[status] || status;
}

export function getStatusColor(status: Subscription['status']): string {
  const colors: Record<string, string> = {
    active: 'green',
    trial: 'blue',
    past_due: 'orange',
    canceled: 'gray',
    suspended: 'red',
  };
  return colors[status] || 'gray';
}

export function getEngagementLabel(type: string): string {
  const labels: Record<string, string> = {
    monthly: 'Sans engagement',
    '1_year': '1 an',
    '3_years': '3 ans (-3%)',
    '4_years': '4 ans (-5%)',
    '5_years': '5 ans (-7%)',
  };
  return labels[type] || type;
}
