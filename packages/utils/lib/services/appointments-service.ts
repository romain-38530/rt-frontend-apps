/**
 * Service API pour le système de rendez-vous
 * Gère les RDV de collecte et livraison
 */

import { createApiClient } from '../api-client';
import type {
  Appointment,
  PaginatedAppointments,
  CreateAppointmentRequest,
  ProposeAlternativeRequest,
  ConfirmAppointmentRequest,
  CancelAppointmentRequest,
  AppointmentFilters,
  AvailabilityRequest,
  AvailabilityResponse,
  AppointmentStats,
  RecurringAppointment,
  RecurrencePattern,
  AppointmentReminder,
  CalendarEvent,
} from '@rt/contracts';

// Client API pour les appointments
const appointmentsApi = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_APPOINTMENTS_API_URL || 'https://d2i50a1vlg138w.cloudfront.net/api/v1',
  timeout: 30000,
  retries: 3,
});

export class AppointmentsService {
  /**
   * Récupérer tous les rendez-vous avec filtres
   */
  static async getAppointments(filters?: AppointmentFilters): Promise<PaginatedAppointments> {
    return await appointmentsApi.get<PaginatedAppointments>('/appointments', filters);
  }

  /**
   * Récupérer un rendez-vous par ID
   */
  static async getAppointmentById(appointmentId: string): Promise<Appointment> {
    return await appointmentsApi.get<Appointment>(`/appointments/${appointmentId}`);
  }

  /**
   * Récupérer les rendez-vous d'une commande
   */
  static async getAppointmentsByOrderId(orderId: string): Promise<Appointment[]> {
    return await appointmentsApi.get<Appointment[]>(`/appointments/orders/${orderId}`);
  }

  /**
   * Créer un nouveau rendez-vous
   */
  static async createAppointment(request: CreateAppointmentRequest): Promise<Appointment> {
    return await appointmentsApi.post<Appointment>('/appointments', request);
  }

  /**
   * Proposer une alternative (contre-proposition)
   */
  static async proposeAlternative(request: ProposeAlternativeRequest): Promise<Appointment> {
    return await appointmentsApi.post<Appointment>(
      `/appointments/${request.appointmentId}/propose-alternative`,
      request
    );
  }

  /**
   * Confirmer un rendez-vous
   */
  static async confirmAppointment(request: ConfirmAppointmentRequest): Promise<Appointment> {
    return await appointmentsApi.post<Appointment>(
      `/appointments/${request.appointmentId}/confirm`,
      request
    );
  }

  /**
   * Rejeter un rendez-vous
   */
  static async rejectAppointment(appointmentId: string, reason?: string): Promise<Appointment> {
    return await appointmentsApi.post<Appointment>(`/appointments/${appointmentId}/reject`, {
      reason,
    });
  }

  /**
   * Annuler un rendez-vous
   */
  static async cancelAppointment(request: CancelAppointmentRequest): Promise<Appointment> {
    return await appointmentsApi.post<Appointment>(
      `/appointments/${request.appointmentId}/cancel`,
      request
    );
  }

  /**
   * Marquer un rendez-vous comme complété
   */
  static async completeAppointment(appointmentId: string, notes?: string): Promise<Appointment> {
    return await appointmentsApi.post<Appointment>(`/appointments/${appointmentId}/complete`, {
      notes,
    });
  }

  /**
   * Marquer un rendez-vous comme manqué
   */
  static async markAsMissed(appointmentId: string, reason?: string): Promise<Appointment> {
    return await appointmentsApi.post<Appointment>(`/appointments/${appointmentId}/missed`, {
      reason,
    });
  }

  // ========== DISPONIBILITÉS ==========

  /**
   * Vérifier les disponibilités d'un utilisateur
   */
  static async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    return await appointmentsApi.post<AvailabilityResponse>('/appointments/availability', request);
  }

  /**
   * Obtenir les créneaux disponibles pour un type de RDV
   */
  static async getAvailableSlots(
    userId: string,
    date: string,
    type?: 'pickup' | 'delivery'
  ): Promise<{ date: string; slots: { start: string; end: string }[] }> {
    return await appointmentsApi.get(`/appointments/users/${userId}/available-slots`, {
      date,
      type,
    });
  }

  // ========== STATISTIQUES ==========

  /**
   * Obtenir les statistiques des rendez-vous
   */
  static async getAppointmentStats(
    userId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<AppointmentStats> {
    return await appointmentsApi.get<AppointmentStats>('/appointments/stats', {
      userId,
      dateFrom,
      dateTo,
    });
  }

  /**
   * Obtenir les statistiques d'une commande
   */
  static async getOrderAppointmentStats(orderId: string): Promise<AppointmentStats> {
    return await appointmentsApi.get<AppointmentStats>(`/appointments/orders/${orderId}/stats`);
  }

  // ========== RÉCURRENCE ==========

  /**
   * Créer un rendez-vous récurrent
   */
  static async createRecurringAppointment(
    appointment: Omit<CreateAppointmentRequest, 'proposedDate'>,
    recurrence: RecurrencePattern,
    startDate: string
  ): Promise<RecurringAppointment> {
    return await appointmentsApi.post<RecurringAppointment>('/appointments/recurring', {
      appointment,
      recurrence,
      startDate,
    });
  }

  /**
   * Obtenir les rendez-vous récurrents
   */
  static async getRecurringAppointments(userId?: string): Promise<RecurringAppointment[]> {
    return await appointmentsApi.get<RecurringAppointment[]>('/appointments/recurring', {
      userId,
    });
  }

  /**
   * Mettre à jour un rendez-vous récurrent
   */
  static async updateRecurringAppointment(
    recurringId: string,
    updates: Partial<RecurringAppointment>
  ): Promise<RecurringAppointment> {
    return await appointmentsApi.put<RecurringAppointment>(
      `/appointments/recurring/${recurringId}`,
      updates
    );
  }

  /**
   * Supprimer un rendez-vous récurrent
   */
  static async deleteRecurringAppointment(recurringId: string): Promise<void> {
    return await appointmentsApi.delete(`/appointments/recurring/${recurringId}`);
  }

  // ========== RAPPELS ==========

  /**
   * Créer un rappel pour un rendez-vous
   */
  static async createReminder(
    appointmentId: string,
    type: 'email' | 'sms' | 'push',
    scheduledFor: string,
    recipients?: string[]
  ): Promise<AppointmentReminder> {
    return await appointmentsApi.post<AppointmentReminder>(
      `/appointments/${appointmentId}/reminders`,
      {
        type,
        scheduledFor,
        recipients,
      }
    );
  }

  /**
   * Obtenir les rappels d'un rendez-vous
   */
  static async getReminders(appointmentId: string): Promise<AppointmentReminder[]> {
    return await appointmentsApi.get<AppointmentReminder[]>(
      `/appointments/${appointmentId}/reminders`
    );
  }

  /**
   * Supprimer un rappel
   */
  static async deleteReminder(reminderId: string): Promise<void> {
    return await appointmentsApi.delete(`/appointments/reminders/${reminderId}`);
  }

  // ========== CALENDRIER ==========

  /**
   * Obtenir les événements du calendrier
   */
  static async getCalendarEvents(
    userId: string,
    dateFrom: string,
    dateTo: string
  ): Promise<CalendarEvent[]> {
    const appointments = await appointmentsApi.get<Appointment[]>('/appointments', {
      userId,
      dateFrom,
      dateTo,
      limit: 1000, // Pas de pagination pour le calendrier
    });

    // Convertir les appointments en événements calendrier
    return appointments.map((apt) => this.appointmentToCalendarEvent(apt));
  }

  /**
   * Convertir un appointment en événement calendrier
   */
  static appointmentToCalendarEvent(appointment: Appointment): CalendarEvent {
    const dateStr = appointment.confirmedDate || appointment.proposedDate;
    const timeSlot = appointment.confirmedTimeSlot || appointment.proposedTimeSlot;

    const startDate = new Date(`${dateStr}T${timeSlot.start}`);
    const endDate = new Date(`${dateStr}T${timeSlot.end}`);

    return {
      id: appointment.id,
      title: appointment.title,
      start: startDate,
      end: endDate,
      allDay: false,
      color: this.getStatusColor(appointment.status),
      extendedProps: {
        appointment,
        type: appointment.type,
        status: appointment.status,
      },
    };
  }

  // ========== HELPERS ==========

  /**
   * Obtenir la couleur d'un statut
   */
  static getStatusColor(status: Appointment['status']): string {
    const colors: Record<string, string> = {
      pending: '#f59e0b',
      proposed: '#3b82f6',
      confirmed: '#10b981',
      rejected: '#ef4444',
      completed: '#6b7280',
      missed: '#dc2626',
      cancelled: '#9ca3af',
    };
    return colors[status] || '#6b7280';
  }

  /**
   * Obtenir le label d'un statut
   */
  static getStatusLabel(status: Appointment['status']): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      proposed: 'Proposé',
      confirmed: 'Confirmé',
      rejected: 'Rejeté',
      completed: 'Terminé',
      missed: 'Manqué',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  }

  /**
   * Obtenir l'icône d'un type
   */
  static getTypeIcon(type: 'pickup' | 'delivery'): string {
    return type === 'pickup' ? '📍' : '🎯';
  }

  /**
   * Obtenir le label d'un type
   */
  static getTypeLabel(type: 'pickup' | 'delivery'): string {
    return type === 'pickup' ? 'Collecte' : 'Livraison';
  }

  /**
   * Formater une date pour l'affichage
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Formater un créneau horaire
   */
  static formatTimeSlot(timeSlot: { start: string; end: string }): string {
    return `${timeSlot.start} - ${timeSlot.end}`;
  }

  /**
   * Vérifier si un rendez-vous est modifiable
   */
  static isEditable(appointment: Appointment): boolean {
    return ['pending', 'proposed'].includes(appointment.status);
  }

  /**
   * Vérifier si un rendez-vous peut être confirmé
   */
  static canBeConfirmed(appointment: Appointment, currentUserId: string): boolean {
    return (
      appointment.status === 'proposed' && appointment.responder.userId === currentUserId
    );
  }

  /**
   * Vérifier si un rendez-vous peut être annulé
   */
  static canBeCancelled(appointment: Appointment): boolean {
    return !['completed', 'missed', 'cancelled'].includes(appointment.status);
  }
}

export default AppointmentsService;
