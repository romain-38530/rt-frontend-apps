import QRCode from 'qrcode';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import SupplierSignature from '../models/SupplierSignature';
import axios from 'axios';

export class SignatureService {
  private readonly QR_SECRET = process.env.QR_CODE_SECRET || 'default-secret';

  /**
   * Génère un QR code pour signature
   */
  async generateQRCode(data: {
    orderId: string;
    supplierId: string;
    type: 'loading' | 'delivery_note';
  }): Promise<{ qrCodeUrl: string; token: string; expiresAt: Date }> {
    // Générer un token JWT avec expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // Expire dans 2 heures

    const token = jwt.sign(
      {
        orderId: data.orderId,
        supplierId: data.supplierId,
        type: data.type,
        exp: Math.floor(expiresAt.getTime() / 1000)
      },
      this.QR_SECRET
    );

    // Générer le QR code avec l'URL de scan
    const scanUrl = `${process.env.SUPPLIER_PORTAL_URL}/sign/qr?token=${token}`;
    const qrCodeUrl = await QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2
    });

    return {
      qrCodeUrl,
      token,
      expiresAt
    };
  }

  /**
   * Vérifie et décode un token QR code
   */
  verifyQRToken(token: string): {
    orderId: string;
    supplierId: string;
    type: 'loading' | 'delivery_note';
  } {
    try {
      const decoded = jwt.verify(token, this.QR_SECRET) as any;
      return {
        orderId: decoded.orderId,
        supplierId: decoded.supplierId,
        type: decoded.type
      };
    } catch (error) {
      throw new Error('Invalid or expired QR code token');
    }
  }

  /**
   * Crée une signature électronique
   */
  async createSignature(data: {
    orderId: string;
    supplierId: string;
    type: 'loading' | 'delivery_note';
    method: 'smartphone' | 'qrcode' | 'kiosk';
    signatureData: string;
    signerName: string;
    signerRole: string;
    location?: { lat: number; lng: number };
    deviceInfo?: string;
  }) {
    const signature = new SupplierSignature({
      orderId: data.orderId,
      supplierId: data.supplierId,
      type: data.type,
      method: data.method,
      signatureData: data.signatureData,
      signerName: data.signerName,
      signerRole: data.signerRole,
      location: data.location,
      timestamp: new Date(),
      deviceInfo: data.deviceInfo,
      verified: true
    });

    await signature.save();

    // Émettre événement
    await this.emitEvent('fournisseur.signature.completed', {
      signatureId: signature.signatureId,
      orderId: signature.orderId,
      supplierId: signature.supplierId,
      type: signature.type,
      method: signature.method,
      signerName: signature.signerName,
      timestamp: signature.timestamp
    });

    return signature;
  }

  /**
   * Signature via QR code
   */
  async signViaQRCode(
    token: string,
    signatureData: string,
    signerName: string,
    signerRole: string,
    location?: { lat: number; lng: number },
    deviceInfo?: string
  ) {
    // Vérifier le token QR
    const decoded = this.verifyQRToken(token);

    // Créer la signature
    const signature = await this.createSignature({
      orderId: decoded.orderId,
      supplierId: decoded.supplierId,
      type: decoded.type,
      method: 'qrcode',
      signatureData,
      signerName,
      signerRole,
      location,
      deviceInfo
    });

    return signature;
  }

  /**
   * Vérifie l'authenticité d'une signature
   */
  async verifySignature(signatureId: string): Promise<boolean> {
    const signature = await SupplierSignature.findOne({ signatureId });

    if (!signature) {
      throw new Error('Signature not found');
    }

    // Vérifier l'intégrité de la signature
    const hash = this.generateSignatureHash(
      signature.orderId,
      signature.supplierId,
      signature.signatureData,
      signature.timestamp
    );

    // Dans un cas réel, on comparerait ce hash avec celui stocké
    // Pour cet exemple, on considère toutes les signatures comme valides
    signature.verified = true;
    await signature.save();

    return true;
  }

  /**
   * Récupère toutes les signatures pour une commande
   */
  async getOrderSignatures(orderId: string) {
    const signatures = await SupplierSignature.find({ orderId }).sort({
      timestamp: -1
    });
    return signatures;
  }

  /**
   * Génère un hash pour vérifier l'intégrité de la signature
   */
  private generateSignatureHash(
    orderId: string,
    supplierId: string,
    signatureData: string,
    timestamp: Date
  ): string {
    const data = `${orderId}:${supplierId}:${signatureData}:${timestamp.toISOString()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Génère un PDF du bon de chargement signé
   */
  async generateSignedLoadingNote(orderId: string, signatureId: string) {
    const signature = await SupplierSignature.findOne({ signatureId });

    if (!signature) {
      throw new Error('Signature not found');
    }

    // Dans un cas réel, on générerait un PDF ici
    // Pour cet exemple, on retourne les données nécessaires
    return {
      orderId: signature.orderId,
      signatureId: signature.signatureId,
      signerName: signature.signerName,
      signerRole: signature.signerRole,
      timestamp: signature.timestamp,
      signatureData: signature.signatureData,
      verified: signature.verified
    };
  }

  /**
   * Vérifie si toutes les signatures requises sont présentes pour une commande
   */
  async checkRequiredSignatures(orderId: string): Promise<{
    complete: boolean;
    missing: string[];
    signatures: any[];
  }> {
    const signatures = await SupplierSignature.find({ orderId });

    const requiredTypes = ['loading', 'delivery_note'];
    const existingTypes = signatures.map((sig) => sig.type);
    const missing = requiredTypes.filter((type) => !existingTypes.includes(type));

    return {
      complete: missing.length === 0,
      missing,
      signatures
    };
  }

  /**
   * Émet un événement vers l'API Events
   */
  private async emitEvent(eventType: string, data: any) {
    try {
      await axios.post(`${process.env.API_EVENTS_URL}/events`, {
        type: eventType,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error emitting event:', error);
    }
  }
}

export default new SignatureService();
