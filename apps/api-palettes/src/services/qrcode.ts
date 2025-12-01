import QRCode from 'qrcode';

const BASE_URL = process.env.FRONTEND_URL || 'https://symphonia-controltower.com';

export interface QRCodeData {
  chequeId: string;
  fromCompanyId: string;
  toSiteId: string;
  quantity: number;
  palletType: string;
  signature: string;
}

/**
 * Génère un QR code pour un chèque-palette
 * @param data - Les données du chèque à encoder
 * @returns L'URL du QR code en base64 (data URI)
 */
export async function generateChequeQRCode(data: QRCodeData): Promise<string> {
  // Créer l'URL de validation du chèque
  const validationUrl = `${BASE_URL}/palette/validate/${data.chequeId}`;

  // Données encodées dans le QR code (format compact)
  const qrPayload = JSON.stringify({
    url: validationUrl,
    id: data.chequeId,
    q: data.quantity,
    t: data.palletType.substring(0, 4), // Abrégé
    sig: data.signature.substring(0, 16), // Signature tronquée pour vérification rapide
  });

  try {
    // Générer le QR code en base64 (data URI)
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'H', // Haute correction d'erreur
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#1e3a5f', // Bleu marine (couleur SYMPHONI.A)
        light: '#ffffff',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Erreur génération QR code:', error);
    throw new Error('Impossible de générer le QR code');
  }
}

/**
 * Génère un QR code simple avec juste l'ID du chèque
 * @param chequeId - L'identifiant du chèque
 * @returns L'URL du QR code en base64
 */
export async function generateSimpleQRCode(chequeId: string): Promise<string> {
  const validationUrl = `${BASE_URL}/palette/validate/${chequeId}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(validationUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 250,
      margin: 2,
      color: {
        dark: '#1e3a5f',
        light: '#ffffff',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Erreur génération QR code simple:', error);
    throw new Error('Impossible de générer le QR code');
  }
}

/**
 * Génère un QR code en SVG (pour impression haute qualité)
 * @param chequeId - L'identifiant du chèque
 * @returns Le code SVG du QR code
 */
export async function generateQRCodeSVG(chequeId: string): Promise<string> {
  const validationUrl = `${BASE_URL}/palette/validate/${chequeId}`;

  try {
    const svgString = await QRCode.toString(validationUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
      color: {
        dark: '#1e3a5f',
        light: '#ffffff',
      },
    });

    return svgString;
  } catch (error) {
    console.error('Erreur génération QR code SVG:', error);
    throw new Error('Impossible de générer le QR code SVG');
  }
}

/**
 * Décode et valide les données d'un QR code scanné
 * @param qrData - Les données scannées du QR code
 * @returns Les données décodées ou null si invalide
 */
export function decodeQRCode(qrData: string): { chequeId: string; url?: string } | null {
  try {
    // Essayer de parser comme JSON
    const parsed = JSON.parse(qrData);
    if (parsed.id) {
      return { chequeId: parsed.id, url: parsed.url };
    }
  } catch {
    // Si ce n'est pas du JSON, c'est peut-être une URL directe
    const urlMatch = qrData.match(/\/palette\/validate\/([a-zA-Z0-9-]+)/);
    if (urlMatch) {
      return { chequeId: urlMatch[1], url: qrData };
    }

    // Ou juste un ID
    if (/^[a-zA-Z0-9-]{8,}$/.test(qrData)) {
      return { chequeId: qrData };
    }
  }

  return null;
}

export default {
  generateChequeQRCode,
  generateSimpleQRCode,
  generateQRCodeSVG,
  decodeQRCode,
};
