/**
 * SYMPHONI.A - Sales Agents API Client
 * Service TypeScript pour la gestion des agents commerciaux et commissions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_SALES_AGENTS_API_URL || 'http://localhost:3015';

// =============================================================================
// TYPES
// =============================================================================

export type AgentStatus = 'pending_signature' | 'active' | 'suspended' | 'terminated' | 'non_compliant';

export interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  siret?: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  region: string;
  status: AgentStatus;
  contractType: 'unlimited' | '1_year';
  contractSignedAt?: string;
  contractDocumentUrl?: string;
  urssafNumber?: string;
  urssafValidUntil?: string;
  documents: AgentDocument[];
  stats: {
    totalClients: number;
    activeClients: number;
    totalCommissions: number;
    pendingCommissions: number;
  };
  activatedAt?: string;
  terminatedAt?: string;
  terminationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDocument {
  type: 'id_card' | 'kbis' | 'urssaf' | 'rib' | 'contract_signed' | 'other';
  name: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface AgentClient {
  id: string;
  agentId: string;
  companyId: string;
  companyName: string;
  companyType: 'industry' | 'transporter' | 'logistician' | 'forwarder';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  subscriptionId?: string;
  subscriptionType?: string;
  status: 'prospect' | 'pending_activation' | 'active' | 'churned';
  activatedAt?: string;
  churnedAt?: string;
  churnReason?: string;
  monthlyCommission: number;
  totalCommissionsPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface Commission {
  id: string;
  agentId: string;
  agentName: string;
  period: string;
  activeClients: number;
  totalAmount: number;
  details: CommissionDetail[];
  status: 'pending' | 'validated' | 'paid' | 'cancelled';
  validatedAt?: string;
  validatedBy?: string;
  paidAt?: string;
  paymentReference?: string;
  statementPdfUrl?: string;
  createdAt: string;
}

export interface CommissionDetail {
  clientId: string;
  companyName: string;
  subscriptionType: string;
  amount: number;
  activeSince: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  targetClients: number;
  prizes: ChallengePrize[];
  ranking: ChallengeRanking[];
  status: 'upcoming' | 'active' | 'ended';
  createdAt: string;
}

export interface ChallengePrize {
  rank: number;
  description: string;
  amount: number;
}

export interface ChallengeRanking {
  agentId: string;
  agentName: string;
  clientsRecruited: number;
  rank: number;
  prize?: number;
}

export interface PortalDashboard {
  agent: Agent;
  currentMonth: {
    activeClients: number;
    pendingClients: number;
    projectedCommission: number;
  };
  lastMonth: {
    activeClients: number;
    commission: number;
    status: string;
  };
  yearToDate: {
    totalCommissions: number;
    totalClients: number;
    averageMonthly: number;
  };
  recentClients: AgentClient[];
  activeChallenge?: {
    name: string;
    endDate: string;
    currentRank: number;
    clientsRecruited: number;
    targetClients: number;
    potentialPrize?: number;
  };
}

export interface DirectionOverview {
  totalAgents: number;
  activeAgents: number;
  pendingAgents: number;
  totalClients: number;
  activeClients: number;
  currentMonthCommissions: number;
  yearToDateCommissions: number;
  mrr: number;
  agentsByRegion: Array<{ region: string; count: number; clients: number }>;
  agentsByStatus: Array<{ status: string; count: number }>;
  topAgents: Array<{ id: string; name: string; clients: number; commissions: number }>;
  monthlyTrend: Array<{ month: string; agents: number; clients: number; commissions: number }>;
  activeChallenge?: Challenge;
}

export interface AgentDetail {
  agent: Agent;
  clients: AgentClient[];
  commissions: Commission[];
  performanceMetrics: {
    averageClientsPerMonth: number;
    retentionRate: number;
    totalCommissionsPaid: number;
    pendingCommissions: number;
  };
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
    const error = await response.json().catch(() => ({ error: 'Erreur reseau' }));
    throw new Error(error.error || `Erreur ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// AGENT MANAGEMENT
// =============================================================================

export async function createAgent(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  siret?: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  region: string;
  contractType: 'unlimited' | '1_year';
}): Promise<{ agent: Agent; message: string }> {
  return fetchAPI('/agents', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getAgents(params?: {
  status?: AgentStatus;
  region?: string;
  page?: number;
  limit?: number;
}): Promise<{
  agents: Agent[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.region) query.append('region', params.region);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  return fetchAPI(`/agents?${query}`);
}

export async function getAgent(id: string): Promise<Agent> {
  return fetchAPI(`/agents/${id}`);
}

export async function updateAgent(
  id: string,
  params: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    company: string;
    siret: string;
    address: Agent['address'];
    region: string;
    urssafNumber: string;
    urssafValidUntil: string;
  }>
): Promise<{ agent: Agent; message: string }> {
  return fetchAPI(`/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function updateAgentStatus(
  id: string,
  params: {
    status: AgentStatus;
    reason?: string;
  }
): Promise<{ agent: Agent; message: string }> {
  return fetchAPI(`/agents/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

export async function uploadAgentDocument(
  id: string,
  params: {
    type: AgentDocument['type'];
    name: string;
    url: string;
  }
): Promise<{ agent: Agent; message: string }> {
  return fetchAPI(`/agents/${id}/documents`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function verifyAgentDocument(
  agentId: string,
  documentIndex: number
): Promise<{ agent: Agent; message: string }> {
  return fetchAPI(`/agents/${agentId}/documents/${documentIndex}/verify`, {
    method: 'POST',
  });
}

export async function activateAgent(id: string): Promise<{ agent: Agent; message: string }> {
  return fetchAPI(`/agents/${id}/activate`, {
    method: 'POST',
  });
}

export async function generateAgentContract(id: string): Promise<{ contractUrl: string }> {
  return fetchAPI(`/agents/${id}/contract/generate`, {
    method: 'POST',
  });
}

// =============================================================================
// CLIENT MANAGEMENT
// =============================================================================

export async function addClient(
  agentId: string,
  params: {
    companyName: string;
    companyType: AgentClient['companyType'];
    contactName: string;
    contactEmail: string;
    contactPhone: string;
  }
): Promise<{ client: AgentClient; message: string }> {
  return fetchAPI(`/agents/${agentId}/clients`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getAgentClients(
  agentId: string,
  params?: {
    status?: AgentClient['status'];
    page?: number;
    limit?: number;
  }
): Promise<{
  clients: AgentClient[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  return fetchAPI(`/agents/${agentId}/clients?${query}`);
}

export async function activateClient(
  clientId: string,
  params: {
    subscriptionId: string;
    subscriptionType: string;
  }
): Promise<{ client: AgentClient; message: string }> {
  return fetchAPI(`/clients/${clientId}/activate`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function churnClient(
  clientId: string,
  params: { reason: string }
): Promise<{ client: AgentClient; message: string }> {
  return fetchAPI(`/clients/${clientId}/churn`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// COMMISSIONS
// =============================================================================

export async function calculateMonthlyCommissions(
  period?: string
): Promise<{ commissions: Commission[]; totalAmount: number }> {
  const query = period ? `?period=${period}` : '';
  return fetchAPI(`/commissions/calculate${query}`, {
    method: 'POST',
  });
}

export async function getCommissions(params?: {
  agentId?: string;
  status?: Commission['status'];
  period?: string;
  page?: number;
  limit?: number;
}): Promise<{
  commissions: Commission[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const query = new URLSearchParams();
  if (params?.agentId) query.append('agentId', params.agentId);
  if (params?.status) query.append('status', params.status);
  if (params?.period) query.append('period', params.period);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  return fetchAPI(`/commissions?${query}`);
}

export async function getCommission(id: string): Promise<Commission> {
  return fetchAPI(`/commissions/${id}`);
}

export async function validateCommission(id: string): Promise<{ commission: Commission; message: string }> {
  return fetchAPI(`/commissions/${id}/validate`, {
    method: 'POST',
  });
}

export async function payCommission(
  id: string,
  params: { paymentReference: string }
): Promise<{ commission: Commission; message: string }> {
  return fetchAPI(`/commissions/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function exportCommissions(params: {
  period: string;
  format?: 'csv' | 'json';
}): Promise<Blob | Commission[]> {
  const query = new URLSearchParams();
  query.append('period', params.period);
  if (params.format) query.append('format', params.format);

  if (params.format === 'csv') {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE_URL}/commissions/export?${query}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.blob();
  }

  return fetchAPI(`/commissions/export?${query}`);
}

export async function getCommissionStatement(
  agentId: string,
  period: string
): Promise<{ statementUrl: string }> {
  return fetchAPI(`/commissions/statement/${agentId}/${period}`);
}

// =============================================================================
// CHALLENGES
// =============================================================================

export async function createChallenge(params: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  targetClients: number;
  prizes: ChallengePrize[];
}): Promise<{ challenge: Challenge; message: string }> {
  return fetchAPI('/challenges', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getChallenges(params?: {
  status?: Challenge['status'];
}): Promise<Challenge[]> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);

  return fetchAPI(`/challenges?${query}`);
}

export async function getChallenge(id: string): Promise<Challenge> {
  return fetchAPI(`/challenges/${id}`);
}

export async function refreshChallengeRanking(id: string): Promise<{ challenge: Challenge }> {
  return fetchAPI(`/challenges/${id}/refresh-ranking`, {
    method: 'POST',
  });
}

// =============================================================================
// PORTAL (Agent)
// =============================================================================

export async function portalLogin(params: {
  email: string;
  password: string;
}): Promise<{ token: string; agent: Agent }> {
  return fetchAPI('/portal/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getPortalDashboard(): Promise<PortalDashboard> {
  return fetchAPI('/portal/dashboard');
}

export async function getPortalCommissions(params?: {
  year?: number;
}): Promise<{
  commissions: Commission[];
  yearTotal: number;
}> {
  const query = new URLSearchParams();
  if (params?.year) query.append('year', params.year.toString());

  return fetchAPI(`/portal/commissions?${query}`);
}

export async function getPortalClients(): Promise<{
  clients: AgentClient[];
  stats: { active: number; pending: number; churned: number };
}> {
  return fetchAPI('/portal/clients');
}

export async function updatePortalProfile(params: {
  phone?: string;
  address?: Agent['address'];
}): Promise<{ agent: Agent; message: string }> {
  return fetchAPI('/portal/profile', {
    method: 'PUT',
    body: JSON.stringify(params),
  });
}

// =============================================================================
// DIRECTION DASHBOARD
// =============================================================================

export async function getDirectionOverview(): Promise<DirectionOverview> {
  return fetchAPI('/dashboard/overview');
}

export async function getAgentDetail(agentId: string): Promise<AgentDetail> {
  return fetchAPI(`/dashboard/agents/${agentId}`);
}

export async function getRegionStats(region: string): Promise<{
  agents: Agent[];
  totalClients: number;
  totalCommissions: number;
  topPerformer: Agent;
}> {
  return fetchAPI(`/dashboard/regions/${region}`);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function formatCommission(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function getStatusLabel(status: AgentStatus): string {
  const labels: Record<AgentStatus, string> = {
    pending_signature: 'En attente de signature',
    active: 'Actif',
    suspended: 'Suspendu',
    terminated: 'Resilie',
    non_compliant: 'Non conforme URSSAF',
  };
  return labels[status] || status;
}

export function getStatusColor(status: AgentStatus): string {
  const colors: Record<AgentStatus, string> = {
    pending_signature: 'orange',
    active: 'green',
    suspended: 'yellow',
    terminated: 'gray',
    non_compliant: 'red',
  };
  return colors[status] || 'gray';
}

export function getClientStatusLabel(status: AgentClient['status']): string {
  const labels: Record<string, string> = {
    prospect: 'Prospect',
    pending_activation: 'En attente activation',
    active: 'Actif',
    churned: 'Resilie',
  };
  return labels[status] || status;
}

export function getClientStatusColor(status: AgentClient['status']): string {
  const colors: Record<string, string> = {
    prospect: 'blue',
    pending_activation: 'orange',
    active: 'green',
    churned: 'gray',
  };
  return colors[status] || 'gray';
}

export function getCommissionStatusLabel(status: Commission['status']): string {
  const labels: Record<string, string> = {
    pending: 'En attente',
    validated: 'Validee',
    paid: 'Payee',
    cancelled: 'Annulee',
  };
  return labels[status] || status;
}

export function getCommissionStatusColor(status: Commission['status']): string {
  const colors: Record<string, string> = {
    pending: 'orange',
    validated: 'blue',
    paid: 'green',
    cancelled: 'gray',
  };
  return colors[status] || 'gray';
}

export const REGIONS = [
  'Ile-de-France',
  'Auvergne-Rhone-Alpes',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Hauts-de-France',
  'Provence-Alpes-Cote d\'Azur',
  'Grand Est',
  'Pays de la Loire',
  'Bretagne',
  'Normandie',
  'Bourgogne-Franche-Comte',
  'Centre-Val de Loire',
  'Corse',
];

export const COMMISSION_RATE = 70; // EUR per client per month
