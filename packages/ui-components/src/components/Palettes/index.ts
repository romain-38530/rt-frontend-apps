/**
 * Palettes - Composants UI pour le module Économie Circulaire des Palettes Europe
 *
 * Composants disponibles:
 * - QRScanner: Scanner QR code avec caméra pour les chèques-palette
 * - SitesMap: Carte interactive des sites de restitution
 * - SignatureCapture: Capture de signature manuscrite numérique
 * - ChequeExportButton: Boutons d'export PDF/CSV/Print
 */

// QR Scanner
export { QRScanner } from './QRScanner';
export type { QRScannerProps } from './QRScanner';

// Sites Map
export { SitesMap } from './SitesMap';
export type { SitesMapProps, PaletteSite } from './SitesMap';

// Signature Capture
export { SignatureCapture } from './SignatureCapture';
export type { SignatureCaptureProps, SignatureData } from './SignatureCapture';

// Cheque Export
export { ChequeExportButton, chequeExportUtils } from './ChequeExport';
export type { ChequeExportProps, PalletChequeExport } from './ChequeExport';

// Default export with all components
const PalettesComponents = {
  QRScanner: require('./QRScanner').QRScanner,
  SitesMap: require('./SitesMap').SitesMap,
  SignatureCapture: require('./SignatureCapture').SignatureCapture,
  ChequeExportButton: require('./ChequeExport').ChequeExportButton,
};

export default PalettesComponents;
