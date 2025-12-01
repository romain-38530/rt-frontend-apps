/**
 * Billing - Composants UI pour le Module Préfacturation & Facturation Transport
 *
 * Composants disponibles:
 * - PrefacturationList: Liste des préfactures avec filtres et sélection multiple
 * - DiscrepancyAlert: Alerte de détection d'écarts tarifaires avec détails
 * - InvoiceUpload: Upload de facture transporteur avec OCR
 * - DisputeManager: Gestion des contestations avec chat intégré
 * - BlockingStatus: Affichage des blocages automatiques (documents, vigilance, palettes, etc.)
 * - ERPExportButton: Export vers ERP (SAP, Oracle, Sage X3, Divalto, Dynamics 365, Odoo)
 */

// Prefacturation List
export { PrefacturationList } from './PrefacturationList';
export type {
  PrefacturationListProps,
  Prefacturation,
  PrefacturationLine
} from './PrefacturationList';

// Discrepancy Alert
export { DiscrepancyAlert } from './DiscrepancyAlert';
export type {
  DiscrepancyAlertProps,
  DiscrepancyDetail
} from './DiscrepancyAlert';

// Invoice Upload with OCR
export { InvoiceUpload } from './InvoiceUpload';
export type {
  InvoiceUploadProps,
  OCRResult,
  OCRInvoiceLine
} from './InvoiceUpload';

// Dispute Manager
export { DisputeManager } from './DisputeManager';
export type {
  DisputeManagerProps,
  Dispute,
  DisputeMessage
} from './DisputeManager';

// Blocking Status
export { BlockingStatus } from './BlockingStatus';
export type {
  BlockingStatusProps,
  Blocking,
  BlockingType
} from './BlockingStatus';

// ERP Export
export { ERPExportButton } from './ERPExportButton';
export type {
  ERPExportButtonProps,
  ERPExportConfig,
  ERPSystem,
  ExportResult
} from './ERPExportButton';

// Default export with all components
const BillingComponents = {
  PrefacturationList: require('./PrefacturationList').PrefacturationList,
  DiscrepancyAlert: require('./DiscrepancyAlert').DiscrepancyAlert,
  InvoiceUpload: require('./InvoiceUpload').InvoiceUpload,
  DisputeManager: require('./DisputeManager').DisputeManager,
  BlockingStatus: require('./BlockingStatus').BlockingStatus,
  ERPExportButton: require('./ERPExportButton').ERPExportButton,
};

export default BillingComponents;
