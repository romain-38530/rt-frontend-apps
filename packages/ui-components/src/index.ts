// Components
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';

export { Card, GlassCard } from './components/Card';
export type { CardProps, GlassCardProps } from './components/Card';

export { SubscriptionCard } from './components/SubscriptionCard';
export type { SubscriptionCardProps } from './components/SubscriptionCard';

export { PortalCard } from './components/PortalCard';
export type { PortalCardProps } from './components/PortalCard';

export { Header } from './components/Header';
export type { HeaderProps } from './components/Header';

export { Logo } from './components/Logo';
export type { LogoProps } from './components/Logo';

// Types
export type { SubscriptionTier, SubscriptionPlan, UserSubscription } from './types/subscription';
export { SUBSCRIPTION_PLANS } from './types/subscription';

export type { PortalType, PortalConfig } from './types/portal';
export { PORTALS } from './types/portal';

// Styles
export { colors, subscriptionColors } from './styles/colors';

// Hooks
export { useSubscription } from './hooks/useSubscription';
export { useHover, useHoverMap } from './hooks/useHover';

// Orders Components
export { CreateOrderForm, OrdersList } from './components/Orders';
export type { CreateOrderFormProps } from './components/Orders/CreateOrderForm';
export type { OrdersListProps } from './components/Orders/OrdersList';

// Notifications Components
export { NotificationBell, NotificationPanel } from './Notifications';
export type { Notification } from './Notifications';

// Tracking Components
export { MapView, TrackingPanel, TrackingFeed } from './components/Tracking';
export type { TrackingFeedProps, TrackingEvent, AIInsight } from './components/Tracking';

// Appointments Components
export { Calendar } from './components/Appointments';

// Documents Components
export { FileUpload, DocumentsList, DocumentViewer } from './components/Documents';

// Scoring Components
export { ScoreCard, PerformanceChart, CarrierRanking, AnalyticsDashboard } from './components/Scoring';

// Affret.IA Components
export { CarrierSearch, OffersList } from './components/Affret';

// Timeline Components
export { Timeline } from './components/Timeline';
export type { TimelineEvent } from './components/Timeline';

// Palettes Components - Économie Circulaire des Palettes Europe
export { QRScanner, SitesMap, SignatureCapture, ChequeExportButton, chequeExportUtils } from './components/Palettes';
export type { QRScannerProps, SitesMapProps, PaletteSite, SignatureCaptureProps, SignatureData, ChequeExportProps, PalletChequeExport } from './components/Palettes';

// Planning Components - Module Planning Chargement & Livraison
export { PlanningCalendar, SlotPicker, DriverKiosk, GeofenceDetector } from './components/Planning';
export type {
  PlanningCalendarProps,
  PlanningSlot,
  PlanningDock,
  SlotPickerProps,
  AvailableSlot,
  SlotBookingData,
  DriverKioskProps,
  DriverBooking,
  GeofenceDetectorProps,
  GeofenceZone,
  GeofenceEvent,
  GeofenceStatus
} from './components/Planning';

// Address Autocomplete - API Adresse Gouv.fr + OpenStreetMap Nominatim
export { AddressAutocomplete } from './components/AddressAutocomplete';
export type { AddressAutocompleteProps, AddressSuggestion, AddressProvider } from './components/AddressAutocomplete';

// Toast Notifications - Replacement for alert()
export { Toast, ToastProvider, useToast } from './components/Toast';
export type { ToastProps, ToastType } from './components/Toast';

// Skeleton Loading States
export { Skeleton, SkeletonCard, SkeletonTable, SkeletonGrid } from './components/Skeleton';
export type { SkeletonProps, SkeletonCardProps, SkeletonTableProps, SkeletonGridProps } from './components/Skeleton';

// Empty States
export { EmptyState, EmptyStateNoData, EmptyStateNoResults, EmptyStateError } from './components/EmptyState';
export type { EmptyStateProps } from './components/EmptyState';

// Billing Components - Module Préfacturation & Facturation Transport
export { PrefacturationList, DiscrepancyAlert, InvoiceUpload, DisputeManager, BlockingStatus, ERPExportButton } from './components/Billing';
export type {
  PrefacturationListProps,
  Prefacturation,
  PrefacturationLine,
  DiscrepancyAlertProps,
  DiscrepancyDetail,
  InvoiceUploadProps,
  OCRResult,
  OCRInvoiceLine,
  DisputeManagerProps,
  Dispute,
  DisputeMessage,
  BlockingStatusProps,
  Blocking,
  BlockingType,
  ERPExportButtonProps,
  ERPExportConfig,
  ERPSystem,
  ExportResult
} from './components/Billing';

// Order Detail Components - Composants partagés pour les pages commandes
export { OrderProgressStepper, CarrierInfoCard } from './components/Order';
export type { OrderProgressStepperProps, CarrierInfoCardProps } from './components/Order';

// Appointments Components - Gestion des RDV transporteur <-> industriel
export { AppointmentRequestForm, AppointmentResponsePanel } from './components/Appointments';
export type { AppointmentRequestFormProps, AppointmentRequestData, AppointmentResponsePanelProps, AppointmentRequest } from './components/Appointments';

// Auto Planning Components - Planification automatique avec escalade Affret.IA
export { AutoPlanningModal } from './components/AutoPlanning';
export type { AutoPlanningModalProps, CarrierMatch } from './components/AutoPlanning';
