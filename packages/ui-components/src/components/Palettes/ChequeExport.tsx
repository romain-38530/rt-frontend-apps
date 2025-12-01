/**
 * ChequeExport - Utilitaires d'export pour les chèques-palette
 * Génération PDF, Excel (CSV) et impression
 */

import React, { useCallback } from 'react';

export interface PalletChequeExport {
  chequeId: string;
  qrCode?: string;
  orderId?: string;
  palletType: string;
  quantity: number;
  transporterName: string;
  vehiclePlate: string;
  driverName: string;
  destinationSiteName: string;
  destinationAddress?: string;
  status: string;
  emittedAt: string;
  depositedAt?: string;
  receivedAt?: string;
  cryptoSignature?: string;
  signatures?: {
    transporter?: string;
    receiver?: string;
  };
}

export interface ChequeExportProps {
  // Chèques à exporter
  cheques: PalletChequeExport[];

  // Format d'export
  format?: 'pdf' | 'csv' | 'print';

  // Nom du fichier (sans extension)
  filename?: string;

  // Inclure les QR codes dans le PDF
  includeQRCodes?: boolean;

  // Inclure les signatures
  includeSignatures?: boolean;

  // Logo entreprise (base64)
  companyLogo?: string;

  // Nom entreprise
  companyName?: string;

  // Callback après export
  onExportComplete?: (format: string, count: number) => void;

  // Style du bouton
  buttonStyle?: React.CSSProperties;

  // Enfants (contenu du bouton)
  children?: React.ReactNode;
}

// Générer le contenu HTML pour l'impression/PDF
function generatePrintContent(
  cheques: PalletChequeExport[],
  options: {
    includeQRCodes?: boolean;
    includeSignatures?: boolean;
    companyLogo?: string;
    companyName?: string;
  }
): string {
  const { includeQRCodes = true, includeSignatures = true, companyLogo, companyName = 'RT Technologie' } = options;

  const statusLabels: Record<string, string> = {
    'EMIS': 'Émis',
    'EN_TRANSIT': 'En transit',
    'DEPOSE': 'Déposé',
    'RECU': 'Reçu',
    'LITIGE': 'Litige',
    'ANNULE': 'Annulé',
  };

  const palletTypeLabels: Record<string, string> = {
    'EURO_EPAL': 'EURO EPAL',
    'EURO_EPAL_2': 'EURO EPAL 2',
    'DEMI_PALETTE': 'Demi-Palette',
    'PALETTE_PERDUE': 'Palette Perdue',
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Chèques-Palette - ${companyName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
        }
        .page {
          page-break-after: always;
          padding: 20mm;
          max-width: 210mm;
          margin: 0 auto;
        }
        .page:last-child { page-break-after: auto; }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #667eea;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo { height: 50px; }
        .company-name { font-size: 20px; font-weight: bold; color: #1a1a2e; }
        .document-title { font-size: 14px; color: #666; }
        .header-right { text-align: right; font-size: 11px; color: #666; }

        .cheque-card {
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          background: #fff;
        }
        .cheque-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        .cheque-id {
          font-size: 16px;
          font-weight: bold;
          color: #667eea;
        }
        .cheque-status {
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-EMIS { background: #FFF3CD; color: #856404; }
        .status-EN_TRANSIT { background: #CCE5FF; color: #004085; }
        .status-DEPOSE { background: #E2D4F0; color: #6F42C1; }
        .status-RECU { background: #D4EDDA; color: #155724; }
        .status-LITIGE { background: #F8D7DA; color: #721C24; }
        .status-ANNULE { background: #E2E3E5; color: #383D41; }

        .cheque-body {
          display: grid;
          grid-template-columns: 1fr ${includeQRCodes ? '150px' : ''};
          gap: 20px;
        }
        .cheque-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .detail-item {
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        .detail-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .detail-value {
          font-size: 13px;
          font-weight: 600;
          color: #1a1a2e;
        }
        .detail-full { grid-column: span 2; }

        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .qr-code { width: 120px; height: 120px; border-radius: 8px; }
        .qr-label { font-size: 10px; color: #666; margin-top: 5px; }

        .quantity-highlight {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
          text-align: center;
          padding: 15px;
          background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
          border-radius: 10px;
        }

        .timestamps {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          font-size: 11px;
        }
        .timestamp-item { text-align: center; }
        .timestamp-label { color: #666; margin-bottom: 2px; }
        .timestamp-value { font-weight: 600; }

        .signatures-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .signature-box {
          border: 1px dashed #ddd;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          min-height: 80px;
        }
        .signature-label { font-size: 10px; color: #666; margin-bottom: 10px; }
        .signature-image { max-width: 100%; max-height: 60px; }
        .signature-placeholder { color: #ccc; font-style: italic; }

        .crypto-signature {
          margin-top: 15px;
          padding: 10px;
          background: #f0f9ff;
          border-radius: 6px;
          font-family: monospace;
          font-size: 9px;
          word-break: break-all;
          color: #0369a1;
        }
        .crypto-label { font-weight: 600; margin-bottom: 5px; }

        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #eee;
          text-align: center;
          font-size: 10px;
          color: #999;
        }

        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page { padding: 15mm; }
        }
      </style>
    </head>
    <body>
      ${cheques.map((cheque, index) => `
        <div class="page">
          <div class="header">
            <div class="header-left">
              ${companyLogo ? `<img src="${companyLogo}" class="logo" alt="Logo">` : ''}
              <div>
                <div class="company-name">${companyName}</div>
                <div class="document-title">Chèque-Palette Numérique</div>
              </div>
            </div>
            <div class="header-right">
              Document ${index + 1}/${cheques.length}<br>
              Généré le ${formatDate(new Date().toISOString())}
            </div>
          </div>

          <div class="cheque-card">
            <div class="cheque-header">
              <div class="cheque-id">${cheque.chequeId}</div>
              <div class="cheque-status status-${cheque.status}">
                ${statusLabels[cheque.status] || cheque.status}
              </div>
            </div>

            <div class="cheque-body">
              <div class="cheque-details">
                <div class="detail-item detail-full">
                  <div class="quantity-highlight">
                    ${cheque.quantity} × ${palletTypeLabels[cheque.palletType] || cheque.palletType}
                  </div>
                </div>

                ${cheque.orderId ? `
                <div class="detail-item">
                  <div class="detail-label">Référence commande</div>
                  <div class="detail-value">${cheque.orderId}</div>
                </div>
                ` : ''}

                <div class="detail-item">
                  <div class="detail-label">Transporteur</div>
                  <div class="detail-value">${cheque.transporterName}</div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">Immatriculation</div>
                  <div class="detail-value">${cheque.vehiclePlate}</div>
                </div>

                <div class="detail-item">
                  <div class="detail-label">Chauffeur</div>
                  <div class="detail-value">${cheque.driverName}</div>
                </div>

                <div class="detail-item detail-full">
                  <div class="detail-label">Site de destination</div>
                  <div class="detail-value">${cheque.destinationSiteName}</div>
                  ${cheque.destinationAddress ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">${cheque.destinationAddress}</div>` : ''}
                </div>
              </div>

              ${includeQRCodes && cheque.qrCode ? `
              <div class="qr-section">
                <img src="${cheque.qrCode}" class="qr-code" alt="QR Code">
                <div class="qr-label">Scanner pour vérifier</div>
              </div>
              ` : ''}
            </div>

            <div class="timestamps">
              <div class="timestamp-item">
                <div class="timestamp-label">Émis le</div>
                <div class="timestamp-value">${formatDate(cheque.emittedAt)}</div>
              </div>
              <div class="timestamp-item">
                <div class="timestamp-label">Déposé le</div>
                <div class="timestamp-value">${formatDate(cheque.depositedAt)}</div>
              </div>
              <div class="timestamp-item">
                <div class="timestamp-label">Reçu le</div>
                <div class="timestamp-value">${formatDate(cheque.receivedAt)}</div>
              </div>
            </div>

            ${includeSignatures ? `
            <div class="signatures-section">
              <div class="signature-box">
                <div class="signature-label">Signature Transporteur</div>
                ${cheque.signatures?.transporter
                  ? `<img src="${cheque.signatures.transporter}" class="signature-image" alt="Signature transporteur">`
                  : '<div class="signature-placeholder">En attente</div>'
                }
              </div>
              <div class="signature-box">
                <div class="signature-label">Signature Récepteur</div>
                ${cheque.signatures?.receiver
                  ? `<img src="${cheque.signatures.receiver}" class="signature-image" alt="Signature récepteur">`
                  : '<div class="signature-placeholder">En attente</div>'
                }
              </div>
            </div>
            ` : ''}

            ${cheque.cryptoSignature ? `
            <div class="crypto-signature">
              <div class="crypto-label">🔐 Signature cryptographique Ed25519</div>
              ${cheque.cryptoSignature}
            </div>
            ` : ''}
          </div>

          <div class="footer">
            Ce document est généré automatiquement par le système de gestion des palettes RT Technologie.<br>
            La signature cryptographique garantit l'authenticité et l'intégrité de ce chèque-palette.
          </div>
        </div>
      `).join('')}
    </body>
    </html>
  `;
}

// Exporter en CSV
function exportToCSV(cheques: PalletChequeExport[], filename: string): void {
  const headers = [
    'ID Chèque',
    'Commande',
    'Type Palette',
    'Quantité',
    'Transporteur',
    'Immatriculation',
    'Chauffeur',
    'Site Destination',
    'Statut',
    'Émis le',
    'Déposé le',
    'Reçu le',
  ];

  const rows = cheques.map(cheque => [
    cheque.chequeId,
    cheque.orderId || '',
    cheque.palletType,
    cheque.quantity.toString(),
    cheque.transporterName,
    cheque.vehiclePlate,
    cheque.driverName,
    cheque.destinationSiteName,
    cheque.status,
    cheque.emittedAt,
    cheque.depositedAt || '',
    cheque.receivedAt || '',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Composant bouton d'export
export const ChequeExportButton: React.FC<ChequeExportProps> = ({
  cheques,
  format = 'pdf',
  filename = 'cheques-palette',
  includeQRCodes = true,
  includeSignatures = true,
  companyLogo,
  companyName,
  onExportComplete,
  buttonStyle,
  children,
}) => {
  const handleExport = useCallback(() => {
    if (cheques.length === 0) {
      alert('Aucun chèque à exporter');
      return;
    }

    switch (format) {
      case 'csv':
        exportToCSV(cheques, filename);
        break;

      case 'print':
      case 'pdf': {
        const content = generatePrintContent(cheques, {
          includeQRCodes,
          includeSignatures,
          companyLogo,
          companyName,
        });

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(content);
          printWindow.document.close();

          if (format === 'print') {
            printWindow.onload = () => printWindow.print();
          }
        }
        break;
      }
    }

    onExportComplete?.(format, cheques.length);
  }, [cheques, format, filename, includeQRCodes, includeSignatures, companyLogo, companyName, onExportComplete]);

  const defaultStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: cheques.length === 0 ? 'not-allowed' : 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: cheques.length === 0 ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: cheques.length === 0 ? '#999' : 'white',
    opacity: cheques.length === 0 ? 0.7 : 1,
    transition: 'all 0.2s',
    ...buttonStyle,
  };

  const iconMap: Record<string, string> = {
    pdf: '📄',
    csv: '📊',
    print: '🖨️',
  };

  return (
    <button onClick={handleExport} style={defaultStyle} disabled={cheques.length === 0}>
      {children || (
        <>
          {iconMap[format] || '📥'} Exporter {format.toUpperCase()} ({cheques.length})
        </>
      )}
    </button>
  );
};

// Export de l'utilitaire pour utilisation directe
export const chequeExportUtils = {
  generatePrintContent,
  exportToCSV,
};

export default ChequeExportButton;
