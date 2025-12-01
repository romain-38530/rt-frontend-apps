/**
 * Constantes de l'application
 */

// Statuts
export const SUPPLIER_STATUSES = {
  INVITED: 'invited',
  PENDING: 'pending',
  ACTIVE: 'active',
  INCOMPLETE: 'incomplete',
  SUSPENDED: 'suspended'
} as const;

export const ORDER_STATUSES = {
  TO_PREPARE: 'to_prepare',
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  LOADED: 'loaded',
  DISPUTE: 'dispute'
} as const;

export const SLOT_STATUSES = {
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  MODIFIED: 'modified',
  CONFIRMED: 'confirmed'
} as const;

// Rôles de contact
export const CONTACT_ROLES = {
  LOGISTIQUE: 'logistique',
  PRODUCTION: 'production',
  PLANNING: 'planning'
} as const;

// Tiers d'abonnement
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
} as const;

// Types de signature
export const SIGNATURE_TYPES = {
  LOADING: 'loading',
  DELIVERY_NOTE: 'delivery_note'
} as const;

// Méthodes de signature
export const SIGNATURE_METHODS = {
  SMARTPHONE: 'smartphone',
  QRCODE: 'qrcode',
  KIOSK: 'kiosk'
} as const;

// Types de participants
export const PARTICIPANT_TYPES = {
  SUPPLIER: 'supplier',
  TRANSPORTER: 'transporter',
  INDUSTRIAL: 'industrial',
  LOGISTICIAN: 'logistician'
} as const;

// Statuts de chat
export const CHAT_STATUSES = {
  ACTIVE: 'active',
  ARCHIVED: 'archived'
} as const;

// Types de notification
export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  SLOT: 'slot',
  SIGNATURE: 'signature',
  MESSAGE: 'message',
  SYSTEM: 'system'
} as const;

// Priorités de notification
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

// Canaux de notification
export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms'
} as const;

// Types d'événements
export const EVENT_TYPES = {
  SUPPLIER_ONBOARDED: 'fournisseur.onboard.completed',
  ORDER_STATUS_CHANGED: 'fournisseur.order.status_changed',
  SLOT_VALIDATED: 'fournisseur.rdv.validated',
  SLOT_UPDATED: 'fournisseur.rdv.updated',
  SIGNATURE_COMPLETED: 'fournisseur.signature.completed',
  DOCUMENT_UPLOADED: 'fournisseur.document.uploaded'
} as const;

// Templates de messages
export const MESSAGE_TEMPLATES = {
  LOADING_READY: 'loading_ready',
  DELAY_PRODUCTION: 'delay_production',
  MISSING_DOCUMENTS: 'missing_documents',
  QUALITY_ISSUE: 'quality_issue',
  EARLY_LOADING: 'early_loading'
} as const;

// Types de documents
export const DOCUMENT_TYPES = {
  DELIVERY_NOTE: 'delivery_note',
  PACKING_LIST: 'packing_list',
  CMR: 'cmr',
  CERTIFICATE: 'certificate',
  INVOICE: 'invoice',
  INSTRUCTIONS: 'instructions',
  PHOTO: 'photo',
  OTHER: 'other'
} as const;

// Extensions de fichiers autorisées
export const ALLOWED_FILE_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'doc',
  'docx',
  'xls',
  'xlsx'
] as const;

// Taille maximale des fichiers (en octets)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Durées
export const DURATIONS = {
  INVITATION_VALIDITY_DAYS: 7,
  QR_CODE_VALIDITY_HOURS: 2,
  TOKEN_EXPIRY_DAYS: 7,
  SESSION_TIMEOUT_MINUTES: 30
} as const;

// Pagination par défaut
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100
} as const;

// Codes de statut HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Messages d'erreur courants
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  INVALID_TOKEN: 'Invalid or expired token',
  MISSING_FIELDS: 'Missing required fields',
  INVALID_CREDENTIALS: 'Invalid credentials',
  SUPPLIER_NOT_FOUND: 'Supplier not found',
  ORDER_NOT_FOUND: 'Order not found',
  SLOT_NOT_FOUND: 'Loading slot not found',
  CHAT_NOT_FOUND: 'Chat not found',
  SIGNATURE_NOT_FOUND: 'Signature not found',
  ALREADY_EXISTS: 'Resource already exists',
  INVALID_STATUS: 'Invalid status',
  INVALID_DATE: 'Invalid date',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed',
  INVALID_FILE_TYPE: 'Invalid file type'
} as const;

// Messages de succès
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  INVITATION_SENT: 'Invitation sent successfully',
  ONBOARDING_COMPLETED: 'Onboarding completed successfully',
  STATUS_UPDATED: 'Status updated successfully',
  SLOT_ACCEPTED: 'Loading slot accepted successfully',
  SLOT_REJECTED: 'Loading slot rejected successfully',
  SIGNATURE_COMPLETED: 'Signature completed successfully',
  MESSAGE_SENT: 'Message sent successfully',
  MARKED_AS_READ: 'Marked as read successfully'
} as const;

// Regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_FR: /^(0[1-9]\d{8}|(\+33|0033)[1-9]\d{8})$/,
  SIRET: /^\d{14}$/,
  POSTAL_CODE_FR: /^\d{5}$/,
  TIME: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
} as const;

// Fuseaux horaires
export const TIMEZONES = {
  PARIS: 'Europe/Paris',
  UTC: 'UTC'
} as const;

// Langues supportées
export const SUPPORTED_LANGUAGES = {
  FR: 'fr',
  EN: 'en',
  ES: 'es',
  DE: 'de'
} as const;

// Valeurs par défaut
export const DEFAULTS = {
  LANGUAGE: 'fr',
  COUNTRY: 'France',
  NOTIFICATIONS_ENABLED: true,
  SUBSCRIPTION_TIER: 'free',
  SUBSCRIPTION_DURATION_MONTHS: 1
} as const;

// Limites de rate limiting (à implémenter si nécessaire)
export const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 heure
    MAX_REQUESTS: 20
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5
  }
} as const;

// Couleurs pour les priorités (hex)
export const PRIORITY_COLORS = {
  LOW: '#388e3c',
  MEDIUM: '#1976d2',
  HIGH: '#f57c00',
  URGENT: '#d32f2f'
} as const;

// Icônes pour les types de notification
export const NOTIFICATION_ICONS = {
  ORDER: '📦',
  SLOT: '📅',
  SIGNATURE: '✍️',
  MESSAGE: '💬',
  SYSTEM: '⚙️'
} as const;
