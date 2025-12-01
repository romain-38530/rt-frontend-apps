/**
 * Types TypeScript pour le module Chatbots SYMPHONI.A
 * Support HelpBot, Planif-IA, Routier, Quai-WMS, Livraisons, Expedition, Freight-IA, Copilote
 */

// Types de bot
export type ChatbotType =
  | 'helpbot'
  | 'planif-ia'
  | 'routier'
  | 'quai-wms'
  | 'livraisons'
  | 'expedition'
  | 'freight-ia'
  | 'copilote';

// Priorites
export type Priority = 1 | 2 | 3; // 1=Urgent, 2=Important, 3=Standard

// Conversation
export interface Conversation {
  id: string;
  userId: string;
  botType: ChatbotType;
  status: 'active' | 'closed' | 'transferred';
  priority: Priority;
  messages: Message[];
  metadata: ConversationMetadata;
  transferredToTechnician: boolean;
  technicianId?: string;
  feedback?: ConversationFeedback;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface ConversationMetadata {
  module?: string;
  orderId?: string;
  context?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ConversationFeedback {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  submittedAt: string;
}

// Messages
export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  suggestedActions?: SuggestedAction[];
  timestamp: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface SuggestedAction {
  id: string;
  label: string;
  action: string;
  payload?: Record<string, any>;
}

// Tickets
export interface Ticket {
  id: string;
  ticketNumber: string;
  conversationId: string;
  userId: string;
  subject: string;
  description: string;
  priority: Priority;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  category: TicketCategory;
  assignedTo?: string;
  sla: TicketSLA;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export type TicketCategory =
  | 'technical'
  | 'billing'
  | 'integration'
  | 'feature_request'
  | 'bug'
  | 'other';

export interface TicketSLA {
  responseTime: number; // minutes
  resolutionTime: number; // minutes
  dueAt: string;
  breached: boolean;
}

// Knowledge Base
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  botTypes: ChatbotType[];
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

// FAQ
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  botType: ChatbotType | 'all';
  order: number;
  active: boolean;
}

// Diagnostics
export interface DiagnosticResult {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
  checkedAt: string;
}

export interface DiagnosticReport {
  type: 'erp' | 'api' | 'tracking' | 'server' | 'full';
  status: 'healthy' | 'degraded' | 'down';
  results: DiagnosticResult[];
  summary: string;
  runAt: string;
}

// Stats
export interface ChatbotStats {
  totalConversations: number;
  activeConversations: number;
  resolvedByBot: number;
  transferredToTechnician: number;
  averageResolutionTime: number;
  satisfactionRate: number;
  topIssues: { issue: string; count: number }[];
}

// API Requests/Responses
export interface CreateConversationRequest {
  botType: ChatbotType;
  context?: string;
  metadata?: Partial<ConversationMetadata>;
}

export interface SendMessageRequest {
  content: string;
  attachments?: { filename: string; data: string; mimeType: string }[];
}

export interface SendMessageResponse {
  message: Message;
  shouldTransfer: boolean;
  suggestedActions: SuggestedAction[];
}

export interface CreateTicketRequest {
  conversationId: string;
  subject: string;
  description: string;
  priority: Priority;
  category: TicketCategory;
}

export interface SearchKnowledgeRequest {
  query: string;
  category?: string;
  botType?: ChatbotType;
  limit?: number;
}

// Copilote Chauffeur specifiques
export interface CopiloteMission {
  id: string;
  missionNumber: string;
  driverId: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  origin: Location;
  destination: Location;
  cargo: CargoInfo;
  route: RouteInfo;
  checkpoints: Checkpoint[];
  documents: MissionDocument[];
  tracking: MissionTracking;
  timeline: MissionEvent[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Location {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  contact?: {
    name: string;
    phone: string;
  };
}

export interface CargoInfo {
  type: string;
  weight: number;
  volume?: number;
  pallets?: number;
  description: string;
  specialInstructions?: string;
}

export interface RouteInfo {
  distance: number; // km
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  waypoints: Location[];
}

export interface Checkpoint {
  id: string;
  type: 'pickup' | 'delivery' | 'break' | 'inspection';
  location: Location;
  scheduledAt: string;
  arrivedAt?: string;
  departedAt?: string;
  status: 'pending' | 'arrived' | 'completed' | 'skipped';
  proof?: CheckpointProof;
}

export interface CheckpointProof {
  photos: string[]; // URLs
  signature?: SignatureData;
  notes?: string;
  timestamp: string;
}

export interface SignatureData {
  dataUrl: string; // base64
  signerName: string;
  signerRole?: string;
  timestamp: string;
}

export interface MissionDocument {
  id: string;
  type: 'cmr' | 'delivery_note' | 'invoice' | 'photo' | 'other';
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  checkpoint?: string; // checkpoint ID
}

export interface MissionTracking {
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
  speed?: number; // km/h
  heading?: number; // degrees
  batteryLevel?: number; // percentage
  lastUpdate: string;
}

export interface MissionEvent {
  id: string;
  type: 'created' | 'started' | 'checkpoint_reached' | 'document_uploaded' | 'status_changed' | 'message' | 'completed';
  description: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Requetes API Copilote
export interface ActivateMissionRequest {
  missionId: string;
  startLocation: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateMissionStatusRequest {
  status: 'active' | 'paused' | 'completed';
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface CheckpointArrivalRequest {
  checkpointId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface CheckpointCompletionRequest {
  checkpointId: string;
  proof: CheckpointProof;
}

export interface UploadDocumentRequest {
  missionId: string;
  checkpointId?: string;
  type: MissionDocument['type'];
  filename: string;
  mimeType: string;
  data: string; // base64
}

export interface SendLocationRequest {
  missionId: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number;
    heading?: number;
  };
  batteryLevel?: number;
}
