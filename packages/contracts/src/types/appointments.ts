/**
 * Types TypeScript pour le système de rendez-vous SYMPHONI.A
 */

export type AppointmentType = 'pickup' | 'delivery';

export type AppointmentStatus =
  | 'pending'       // En attente de proposition
  | 'proposed'      // Proposé par le transporteur
  | 'confirmed'     // Confirmé par les deux parties
  | 'rejected'      // Rejeté
  | 'completed'     // Terminé (RDV effectué)
  | 'missed'        // Manqué
  | 'cancelled';    // Annulé

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface TimeSlot {
  start: string; // HH:mm format (e.g., "09:00")
  end: string;   // HH:mm format (e.g., "17:00")
}

export interface AppointmentParticipant {
  userId: string;
  userType: 'industrial' | 'carrier' | 'supplier' | 'recipient' | 'logistician';
  name: string;
  email?: string;
  phone?: string;
}

export interface AppointmentLocation {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  instructions?: string;
}

export interface Appointment {
  id: string;
  orderId: string;
  type: AppointmentType;
  status: AppointmentStatus;

  // Participants
  requester: AppointmentParticipant;  // Celui qui demande le RDV
  responder: AppointmentParticipant;  // Celui qui doit répondre

  // Date et heure
  proposedDate: string;               // ISO date (YYYY-MM-DD)
  proposedTimeSlot: TimeSlot;
  confirmedDate?: string;             // Date confirmée (peut être différente de proposedDate)
  confirmedTimeSlot?: TimeSlot;

  // Lieu
  location: AppointmentLocation;

  // Détails
  title: string;
  description?: string;
  notes?: string;

  // Contraintes
  requirements?: string[];            // Ex: ["Hayon", "Badge d'accès", "Autorisation préalable"]
  estimatedDuration?: number;         // minutes

  // Rappels
  reminderSent?: boolean;
  reminderDate?: string;

  // Historique
  proposalHistory?: {
    date: string;
    timeSlot: TimeSlot;
    proposedBy: string;
    proposedAt: string;
    status: 'accepted' | 'rejected';
    reason?: string;
  }[];

  // Métadonnées
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface CreateAppointmentRequest {
  orderId: string;
  type: AppointmentType;
  responderId: string;
  proposedDate: string;
  proposedTimeSlot: TimeSlot;
  location: AppointmentLocation;
  title: string;
  description?: string;
  requirements?: string[];
  estimatedDuration?: number;
}

export interface ProposeAlternativeRequest {
  appointmentId: string;
  alternativeDate: string;
  alternativeTimeSlot: TimeSlot;
  reason?: string;
}

export interface ConfirmAppointmentRequest {
  appointmentId: string;
  confirmedDate?: string;           // Si différent de proposedDate
  confirmedTimeSlot?: TimeSlot;     // Si différent de proposedTimeSlot
  notes?: string;
}

export interface CancelAppointmentRequest {
  appointmentId: string;
  reason: string;
  notifyParticipants?: boolean;
}

export interface AppointmentFilters {
  orderId?: string;
  type?: AppointmentType;
  status?: AppointmentStatus[];
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedAppointments {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Types pour le calendrier

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  extendedProps?: {
    appointment: Appointment;
    type: AppointmentType;
    status: AppointmentStatus;
  };
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  date: Date;
}

export interface AvailabilitySlot {
  date: string;           // YYYY-MM-DD
  slots: TimeSlot[];
  isAvailable: boolean;
  reason?: string;        // Si non disponible
}

export interface AvailabilityRequest {
  userId: string;
  dateFrom: string;
  dateTo: string;
  type?: AppointmentType;
  location?: {
    city?: string;
    postalCode?: string;
  };
}

export interface AvailabilityResponse {
  userId: string;
  availabilities: AvailabilitySlot[];
  timezone: string;
  workingHours?: {
    start: string;  // HH:mm
    end: string;    // HH:mm
  };
  blockedDates?: string[];  // Dates complètement bloquées
}

// Statistiques

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  missed: number;
  cancelled: number;
  averageDuration: number;  // minutes
  onTimePercentage: number; // 0-100
}

// Rappels

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  type: 'email' | 'sms' | 'push';
  recipients: string[];     // emails ou phones
  scheduledFor: string;     // ISO timestamp
  sent: boolean;
  sentAt?: string;
  template?: string;
}

// Récurrence

export interface RecurrencePattern {
  frequency: RecurrenceFrequency;
  interval?: number;        // Ex: tous les 2 jours si interval=2
  daysOfWeek?: number[];    // 0=Dimanche, 1=Lundi, etc. (pour weekly)
  dayOfMonth?: number;      // 1-31 (pour monthly)
  endDate?: string;         // Date de fin de la récurrence
  occurrences?: number;     // Nombre d'occurrences (alternative à endDate)
}

export interface RecurringAppointment {
  id: string;
  templateAppointment: Omit<Appointment, 'id' | 'proposedDate' | 'status' | 'createdAt' | 'updatedAt'>;
  recurrence: RecurrencePattern;
  active: boolean;
  nextOccurrence?: string;
  generatedAppointments: string[];  // IDs des RDV générés
  createdAt: string;
  updatedAt: string;
}

// Notifications

export interface AppointmentNotification {
  id: string;
  appointmentId: string;
  type: 'requested' | 'proposed' | 'confirmed' | 'rejected' | 'cancelled' | 'reminder' | 'completed';
  recipientId: string;
  message: string;
  read: boolean;
  createdAt: string;
}
