// ============================================
// SALES AGENTS & COMMISSIONS MODULE TYPES
// ============================================

export type AgentStatus =
  | 'pending_signature'
  | 'active'
  | 'suspended'
  | 'terminated'
  | 'non_compliant';

export type AgentContractStatus =
  | 'draft'
  | 'sent'
  | 'signed'
  | 'expired'
  | 'terminated';

export type CommissionStatus =
  | 'pending'
  | 'validated'
  | 'paid'
  | 'cancelled';

export type ChallengeStatus =
  | 'draft'
  | 'active'
  | 'completed'
  | 'cancelled';

export type ClientStatus =
  | 'prospect'
  | 'active'
  | 'churned';

export type AgentDocumentType =
  | 'id_card'
  | 'kbis'
  | 'urssaf'
  | 'rib';

export type ContractDuration =
  | 'unlimited'
  | '1_year';

// ============================================
// AGENT TYPES
// ============================================

export interface AgentAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface AgentDocument {
  type: AgentDocumentType;
  url: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  expiresAt?: Date;
}

export interface BankDetails {
  iban: string;
  bic: string;
  bankName: string;
}

export interface PortalAccess {
  enabled: boolean;
  lastLogin?: Date;
  passwordHash?: string;
}

export interface Agent {
  _id: string;
  agentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: AgentAddress;
  region: string;
  status: AgentStatus;
  documents: AgentDocument[];
  bankDetails?: BankDetails;
  contractId?: string;
  portalAccess: PortalAccess;
  createdAt: Date;
  updatedAt: Date;
  activatedAt?: Date;
  terminatedAt?: Date;
}

export interface CreateAgentRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: AgentAddress;
  region: string;
  bankDetails?: BankDetails;
}

export interface UpdateAgentRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Partial<AgentAddress>;
  bankDetails?: Partial<BankDetails>;
}

export interface AgentStatusUpdate {
  status: AgentStatus;
}

export interface AgentUploadDocumentRequest {
  type: AgentDocumentType;
  url: string;
  expiresAt?: Date;
}

// ============================================
// CONTRACT TYPES
// ============================================

export interface ContractSignature {
  signedAt: Date;
  signatureData: string;
  ipAddress: string;
  deviceInfo: string;
}

export interface AgentContract {
  _id: string;
  contractId: string;
  agentId: string;
  templateVersion: string;
  commissionRate: number;
  region: string;
  duration: ContractDuration;
  clauses: string[];
  pdfUrl?: string;
  status: AgentContractStatus;
  signature?: ContractSignature;
  createdAt: Date;
  sentAt?: Date;
  signedAt?: Date;
}

export interface GenerateContractRequest {
  agentId: string;
  region?: string;
  duration?: ContractDuration;
  clauses?: string[];
}

export interface SignContractRequest {
  signatureData: string;
  ipAddress: string;
  deviceInfo: string;
}

// ============================================
// COMMISSION TYPES
// ============================================

export interface CommissionPeriod {
  month: number;
  year: number;
}

export interface CommissionClient {
  clientId: string;
  clientName: string;
  subscriptionAmount: number;
  commissionAmount: number;
}

export interface Commission {
  _id: string;
  commissionId: string;
  agentId: string;
  period: CommissionPeriod;
  clients: CommissionClient[];
  totalClients: number;
  totalAmount: number;
  status: CommissionStatus;
  validatedBy?: string;
  validatedAt?: Date;
  paidAt?: Date;
  paymentReference?: string;
  statementPdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalculateCommissionRequest {
  month?: number;
  year?: number;
}

export interface ValidateCommissionRequest {
  validatedBy: string;
}

export interface PayCommissionRequest {
  paymentReference: string;
}

export interface CommissionExportFilters {
  month?: number;
  year?: number;
  status?: CommissionStatus;
}

// ============================================
// CHALLENGE TYPES
// ============================================

export interface ChallengePrize {
  rank: number;
  amount: number;
  description: string;
}

export interface ChallengeRanking {
  agentId: string;
  score: number;
  rank: number;
  lastUpdated: Date;
}

export interface Challenge {
  _id: string;
  challengeId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: ChallengeStatus;
  target: number;
  prizes: ChallengePrize[];
  ranking: ChallengeRanking[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChallengeRequest {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  target: number;
  prizes: ChallengePrize[];
}

export interface UpdateChallengeRequest {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ChallengeStatus;
  target?: number;
  prizes?: ChallengePrize[];
}

export interface LeaderboardEntry {
  rank: number;
  agent: {
    id: string;
    agentId: string;
    name: string;
    region: string;
  };
  score: number;
  prize: ChallengePrize | null;
  lastUpdated: Date;
}

export interface Leaderboard {
  challenge: {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: ChallengeStatus;
    target: number;
  };
  leaderboard: LeaderboardEntry[];
}

// ============================================
// CLIENT TYPES
// ============================================

export interface AgentClient {
  _id: string;
  clientId: string;
  agentId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  subscriptionType: string;
  subscriptionAmount: number;
  status: ClientStatus;
  signedAt?: Date;
  churnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientRequest {
  agentId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  subscriptionType: string;
  subscriptionAmount: number;
}

export interface UpdateClientRequest {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  subscriptionType?: string;
  subscriptionAmount?: number;
}

// ============================================
// PORTAL TYPES
// ============================================

export interface AgentLoginRequest {
  email: string;
  password: string;
}

export interface AgentLoginResponse {
  token: string;
  agent: {
    id: string;
    agentId: string;
    firstName: string;
    lastName: string;
    email: string;
    region: string;
    status: AgentStatus;
  };
}

export interface AgentDashboard {
  agent: {
    id: string;
    agentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    region: string;
    status: AgentStatus;
  };
  statistics: {
    totalClients: number;
    activeClients: number;
    prospects: number;
    currentMonthCommission: number;
    totalCommissions: number;
  };
  contract?: AgentContract;
}

export interface UpdateProfileRequest {
  phone?: string;
  address?: Partial<AgentAddress>;
  bankDetails?: Partial<BankDetails>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardOverview {
  agents: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  clients: {
    total: number;
    active: number;
    prospects: number;
  };
  commissions: {
    currentMonth: {
      total: number;
      count: number;
    };
    totalPaid: number;
    pending: number;
  };
  challenges: {
    active: number;
  };
}

export interface AgentDetailView {
  agent: Agent;
  statistics: {
    clients: {
      total: number;
      active: number;
      prospects: number;
    };
    commissions: {
      total: number;
      count: number;
    };
  };
  recentClients: AgentClient[];
  commissions: Commission[];
  monthlyPerformance: Array<{
    _id: { year: number; month: number };
    clients: number;
    amount: number;
  }>;
}

export interface RegionalStatistics {
  agents: Array<{ _id: string; count: number }>;
  clients: Array<{ _id: string; count: number }>;
  commissions: Array<{ _id: string; total: number }>;
}

export interface KPIData {
  clientAcquisition: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  avgClientsPerAgent: number;
  commissions: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  topPerformers: Array<{
    agentId: string;
    name: string;
    region: string;
    clients: number;
    commission: number;
  }>;
}

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// ============================================
// FILTER TYPES
// ============================================

export interface AgentFilters extends PaginationParams {
  status?: AgentStatus;
  region?: string;
}

export interface CommissionFilters extends PaginationParams {
  agentId?: string;
  status?: CommissionStatus;
  month?: number;
  year?: number;
}

export interface ClientFilters extends PaginationParams {
  agentId?: string;
  status?: ClientStatus;
}

export interface ChallengeFilters extends PaginationParams {
  status?: ChallengeStatus;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    status: number;
  };
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
  mongodb: 'connected' | 'disconnected';
}
