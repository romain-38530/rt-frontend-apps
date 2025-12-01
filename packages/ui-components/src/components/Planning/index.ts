/**
 * Planning - Composants UI pour le Module Planning Chargement & Livraison
 *
 * Composants disponibles:
 * - PlanningCalendar: Calendrier multi-vues (jour/semaine/quai/transporteur)
 * - SlotPicker: Sélecteur de créneaux pour prise de RDV
 * - DriverKiosk: Borne virtuelle chauffeur avec check-in/check-out
 * - GeofenceDetector: Détection automatique d'arrivée par GPS
 */

// Planning Calendar
export { PlanningCalendar } from './PlanningCalendar';
export type {
  PlanningCalendarProps,
  PlanningSlot,
  PlanningDock
} from './PlanningCalendar';

// Slot Picker
export { SlotPicker } from './SlotPicker';
export type {
  SlotPickerProps,
  AvailableSlot,
  SlotBookingData
} from './SlotPicker';

// Driver Kiosk
export { DriverKiosk } from './DriverKiosk';
export type {
  DriverKioskProps,
  DriverBooking
} from './DriverKiosk';

// Geofence Detector
export { GeofenceDetector } from './GeofenceDetector';
export type {
  GeofenceDetectorProps,
  GeofenceZone,
  GeofenceEvent,
  GeofenceStatus
} from './GeofenceDetector';

// Default export with all components
const PlanningComponents = {
  PlanningCalendar: require('./PlanningCalendar').PlanningCalendar,
  SlotPicker: require('./SlotPicker').SlotPicker,
  DriverKiosk: require('./DriverKiosk').DriverKiosk,
  GeofenceDetector: require('./GeofenceDetector').GeofenceDetector,
};

export default PlanningComponents;
