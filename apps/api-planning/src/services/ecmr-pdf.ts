/**
 * Service de génération PDF pour eCMR
 * Template conforme au format CMR standard
 */

import PDFDocument from 'pdfkit';

interface ECMRParty {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}

interface ECMRGoods {
  description: string;
  packaging: string;
  quantity: number;
  weight: number;
  volume?: number;
  adrClass?: string;
}

interface ECMRSignature {
  party: string;
  signedBy: string;
  signedAt: Date;
  signatureData?: string;
  comments?: string;
}

// Interface flexible pour accepter les données ECMR sous différentes formes
interface ECMRData {
  reference?: string;
  bookingReference?: string;
  orderReference?: string;
  sender?: Partial<ECMRParty>;
  carrier?: Partial<ECMRParty>;
  recipient?: Partial<ECMRParty>;
  loadingPlace?: {
    address?: string;
    city?: string;
    country?: string;
    date?: Date;
  };
  deliveryPlace?: {
    address?: string;
    city?: string;
    country?: string;
    date?: Date;
  };
  goods?: ECMRGoods[];
  totalWeight?: number;
  totalPackages?: number;
  vehiclePlate?: string;
  trailerPlate?: string;
  signatures?: ECMRSignature[];
  status?: string;
  eidasCompliant?: boolean;
  senderReserves?: string;
  carrierReserves?: string;
  recipientReserves?: string;
  createdAt?: Date;
  validatedAt?: Date;
  timestampToken?: string;
  [key: string]: any; // Permet d'autres propriétés
}

export function generateECMRPDFBuffer(ecmr: ECMRData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Valeurs par défaut
      const defaultParty: ECMRParty = { name: 'N/A', address: 'N/A', city: 'N/A', postalCode: '', country: 'France' };
      const reference = ecmr.reference || `ECMR-${Date.now()}`;
      const sender = { ...defaultParty, ...ecmr.sender } as ECMRParty;
      const carrier = { ...defaultParty, ...ecmr.carrier } as ECMRParty;
      const recipient = { ...defaultParty, ...ecmr.recipient } as ECMRParty;
      const loadingPlace = { address: 'N/A', city: 'N/A', country: 'France', ...ecmr.loadingPlace };
      const deliveryPlace = { address: 'N/A', city: 'N/A', country: 'France', ...ecmr.deliveryPlace };
      const goods = ecmr.goods || [];
      const signatures = ecmr.signatures || [];
      const status = ecmr.status || 'draft';

      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        info: {
          Title: `eCMR - ${reference}`,
          Author: 'SYMPHONI.A',
          Subject: 'Lettre de Voiture Électronique',
          Keywords: 'eCMR, CMR, transport, logistique'
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = 535; // A4 width - margins
      const leftCol = 30;
      const midCol = 200;
      const rightCol = 370;

      // Couleurs
      const darkBlue = '#1a365d';
      const lightBlue = '#ebf8ff';
      const borderColor = '#2b6cb0';

      // === EN-TÊTE ===
      doc.rect(leftCol, 30, pageWidth, 60).fill(darkBlue);

      doc.fillColor('white')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('LETTRE DE VOITURE ÉLECTRONIQUE', leftCol + 10, 45, { align: 'center', width: pageWidth - 20 });

      doc.fontSize(14)
         .font('Helvetica')
         .text('eCMR - Convention CMR Genève 1956', leftCol + 10, 70, { align: 'center', width: pageWidth - 20 });

      // === RÉFÉRENCE ET STATUT ===
      let y = 100;

      doc.rect(leftCol, y, pageWidth, 35).stroke(borderColor);
      doc.fillColor(darkBlue)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(`N° eCMR: ${reference}`, leftCol + 10, y + 10);

      const statusText = getStatusText(status);
      const statusColor = getStatusColor(status);
      doc.fillColor(statusColor)
         .text(`Statut: ${statusText}`, rightCol, y + 10);

      if (ecmr.bookingReference) {
        doc.fillColor('#666')
           .fontSize(10)
           .font('Helvetica')
           .text(`Réf. Réservation: ${ecmr.bookingReference}`, leftCol + 10, y + 22);
      }
      if (ecmr.orderReference) {
        doc.text(`Réf. Commande: ${ecmr.orderReference}`, midCol, y + 22);
      }

      // === CASES 1-3: EXPÉDITEUR, DESTINATAIRE, TRANSPORTEUR ===
      y = 145;
      const boxHeight = 85;

      // Case 1: Expéditeur
      drawPartyBox(doc, leftCol, y, 165, boxHeight, '1', 'EXPÉDITEUR', sender, darkBlue, borderColor);

      // Case 2: Destinataire
      drawPartyBox(doc, leftCol + 175, y, 165, boxHeight, '2', 'DESTINATAIRE', recipient, darkBlue, borderColor);

      // Case 17: Transporteur
      drawPartyBox(doc, leftCol + 350, y, 185, boxHeight, '17', 'TRANSPORTEUR', carrier, darkBlue, borderColor);

      // === CASES 4-5: LIEUX DE PRISE EN CHARGE ET LIVRAISON ===
      y = 240;
      const placeBoxHeight = 55;

      // Case 4: Lieu de prise en charge
      doc.rect(leftCol, y, 262.5, placeBoxHeight).stroke(borderColor);
      doc.fillColor(darkBlue).fontSize(8).font('Helvetica-Bold')
         .text('4. Lieu de prise en charge', leftCol + 5, y + 3);
      doc.fillColor('#333').fontSize(10).font('Helvetica')
         .text(loadingPlace.address || 'N/A', leftCol + 5, y + 16)
         .text(`${loadingPlace.city || 'N/A'}, ${loadingPlace.country || 'France'}`, leftCol + 5, y + 28);
      if (loadingPlace.date) {
        doc.fontSize(9).text(`Date: ${formatDate(loadingPlace.date)}`, leftCol + 5, y + 42);
      }

      // Case 5: Lieu de livraison
      doc.rect(leftCol + 272.5, y, 262.5, placeBoxHeight).stroke(borderColor);
      doc.fillColor(darkBlue).fontSize(8).font('Helvetica-Bold')
         .text('5. Lieu de livraison prévu', leftCol + 277.5, y + 3);
      doc.fillColor('#333').fontSize(10).font('Helvetica')
         .text(deliveryPlace.address || 'N/A', leftCol + 277.5, y + 16)
         .text(`${deliveryPlace.city || 'N/A'}, ${deliveryPlace.country || 'France'}`, leftCol + 277.5, y + 28);
      if (deliveryPlace.date) {
        doc.fontSize(9).text(`Date prévue: ${formatDate(deliveryPlace.date)}`, leftCol + 277.5, y + 42);
      }

      // === CASES 6-12: MARCHANDISES ===
      y = 305;

      // En-tête tableau marchandises
      doc.rect(leftCol, y, pageWidth, 20).fill(lightBlue).stroke(borderColor);
      doc.fillColor(darkBlue).fontSize(9).font('Helvetica-Bold');
      doc.text('6. Marques', leftCol + 5, y + 6);
      doc.text('7. Nombre de colis', leftCol + 80, y + 6);
      doc.text('8. Mode emballage', leftCol + 170, y + 6);
      doc.text('9. Nature marchandise', leftCol + 270, y + 6);
      doc.text('11. Poids brut kg', leftCol + 400, y + 6);
      doc.text('12. Volume m³', leftCol + 480, y + 6);

      // Lignes marchandises
      y += 20;
      goods.forEach((good, index) => {
        const rowHeight = 25;
        doc.rect(leftCol, y, pageWidth, rowHeight).stroke(borderColor);
        doc.fillColor('#333').fontSize(9).font('Helvetica');
        doc.text(good.adrClass || '-', leftCol + 5, y + 8);
        doc.text(String(good.quantity || 0), leftCol + 100, y + 8);
        doc.text(good.packaging || 'N/A', leftCol + 175, y + 8);
        doc.text(good.description || 'N/A', leftCol + 275, y + 8, { width: 115 });
        doc.text(String(good.weight || 0), leftCol + 420, y + 8);
        doc.text(good.volume ? String(good.volume) : '-', leftCol + 490, y + 8);
        y += rowHeight;
      });

      // Totaux
      doc.rect(leftCol, y, pageWidth, 25).fill(lightBlue).stroke(borderColor);
      doc.fillColor(darkBlue).fontSize(10).font('Helvetica-Bold');
      doc.text(`TOTAL: ${ecmr.totalPackages || 0} colis`, leftCol + 100, y + 7);
      doc.text(`Poids total: ${ecmr.totalWeight || 0} kg`, leftCol + 400, y + 7);
      y += 25;

      // === CASE 18: VÉHICULE ===
      doc.rect(leftCol, y, pageWidth, 30).stroke(borderColor);
      doc.fillColor(darkBlue).fontSize(8).font('Helvetica-Bold')
         .text('18. Véhicule et remorque', leftCol + 5, y + 3);
      doc.fillColor('#333').fontSize(11).font('Helvetica')
         .text(`Immatriculation: ${ecmr.vehiclePlate || 'N/A'}`, leftCol + 5, y + 15);
      if (ecmr.trailerPlate) {
        doc.text(`Remorque: ${ecmr.trailerPlate}`, leftCol + 200, y + 15);
      }
      y += 35;

      // === RÉSERVES ===
      if (ecmr.senderReserves || ecmr.carrierReserves || ecmr.recipientReserves) {
        doc.rect(leftCol, y, pageWidth, 45).stroke(borderColor);
        doc.fillColor(darkBlue).fontSize(8).font('Helvetica-Bold')
           .text('RÉSERVES ET OBSERVATIONS', leftCol + 5, y + 3);
        doc.fillColor('#333').fontSize(9).font('Helvetica');
        let reserveY = y + 14;
        if (ecmr.senderReserves) {
          doc.text(`Expéditeur: ${ecmr.senderReserves}`, leftCol + 5, reserveY);
          reserveY += 10;
        }
        if (ecmr.carrierReserves) {
          doc.text(`Transporteur: ${ecmr.carrierReserves}`, leftCol + 5, reserveY);
          reserveY += 10;
        }
        if (ecmr.recipientReserves) {
          doc.text(`Destinataire: ${ecmr.recipientReserves}`, leftCol + 5, reserveY);
        }
        y += 50;
      }

      // === SIGNATURES ===
      y = Math.max(y + 10, 580);
      const sigBoxWidth = 175;
      const sigBoxHeight = 80;

      // Case 22: Signature expéditeur
      drawSignatureBox(doc, leftCol, y, sigBoxWidth, sigBoxHeight, '22', 'EXPÉDITEUR',
        signatures.find(s => s.party === 'sender'), darkBlue, borderColor);

      // Case 23: Signature transporteur
      drawSignatureBox(doc, leftCol + 180, y, sigBoxWidth, sigBoxHeight, '23', 'TRANSPORTEUR',
        signatures.find(s => s.party === 'carrier'), darkBlue, borderColor);

      // Case 24: Signature destinataire
      drawSignatureBox(doc, leftCol + 360, y, sigBoxWidth, sigBoxHeight, '24', 'DESTINATAIRE',
        signatures.find(s => s.party === 'recipient'), darkBlue, borderColor);

      // === PIED DE PAGE ===
      y = 680;
      doc.rect(leftCol, y, pageWidth, 45).stroke(borderColor);

      if (ecmr.eidasCompliant) {
        doc.fillColor('#276749').fontSize(10).font('Helvetica-Bold')
           .text('✓ Document conforme eIDAS', leftCol + 10, y + 8);
        if (ecmr.timestampToken) {
          doc.fillColor('#666').fontSize(8).font('Helvetica')
             .text(`Token horodatage: ${ecmr.timestampToken}`, leftCol + 10, y + 22);
        }
        if (ecmr.validatedAt) {
          doc.text(`Validé le: ${formatDateTime(ecmr.validatedAt)}`, leftCol + 300, y + 22);
        }
      }

      doc.fillColor('#666').fontSize(8).font('Helvetica')
         .text(`Document généré le ${formatDateTime(new Date())}`, leftCol + 10, y + 35);
      doc.text('SYMPHONI.A - Plateforme logistique', rightCol + 50, y + 35);

      // Ligne de validité
      y += 50;
      doc.fillColor('#999').fontSize(7)
         .text('Ce document électronique a la même valeur juridique que la lettre de voiture papier conformément au Protocole additionnel à la CMR (e-CMR).',
               leftCol, y, { width: pageWidth, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawPartyBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  caseNum: string,
  title: string,
  party: ECMRParty,
  darkBlue: string,
  borderColor: string
) {
  doc.rect(x, y, width, height).stroke(borderColor);
  doc.fillColor(darkBlue).fontSize(8).font('Helvetica-Bold')
     .text(`${caseNum}. ${title}`, x + 5, y + 3);
  doc.fillColor('#333').fontSize(10).font('Helvetica-Bold')
     .text(party.name, x + 5, y + 16, { width: width - 10 });
  doc.fontSize(9).font('Helvetica')
     .text(party.address, x + 5, y + 30, { width: width - 10 })
     .text(`${party.postalCode} ${party.city}`, x + 5, y + 42)
     .text(party.country, x + 5, y + 54);
  if (party.contactPhone) {
    doc.fontSize(8).text(`Tél: ${party.contactPhone}`, x + 5, y + 66);
  }
}

function drawSignatureBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  caseNum: string,
  title: string,
  signature: ECMRSignature | undefined,
  darkBlue: string,
  borderColor: string
) {
  doc.rect(x, y, width, height).stroke(borderColor);
  doc.fillColor(darkBlue).fontSize(8).font('Helvetica-Bold')
     .text(`${caseNum}. Signature ${title}`, x + 5, y + 3);

  if (signature) {
    doc.fillColor('#276749').fontSize(9).font('Helvetica-Bold')
       .text('✓ Signé', x + 5, y + 20);
    doc.fillColor('#333').fontSize(9).font('Helvetica')
       .text(`Par: ${signature.signedBy}`, x + 5, y + 35)
       .text(`Le: ${formatDateTime(signature.signedAt)}`, x + 5, y + 50);
    if (signature.comments) {
      doc.fontSize(8).text(`Note: ${signature.comments}`, x + 5, y + 62, { width: width - 10 });
    }
  } else {
    doc.fillColor('#999').fontSize(9).font('Helvetica')
       .text('En attente de signature', x + 5, y + 35);
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'draft': 'Brouillon',
    'pending_carrier': 'En attente transporteur',
    'pending_recipient': 'En attente destinataire',
    'signed': 'Signé',
    'validated': 'Validé',
    'cancelled': 'Annulé'
  };
  return statusMap[status] || status;
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'draft': '#718096',
    'pending_carrier': '#d69e2e',
    'pending_recipient': '#d69e2e',
    'signed': '#276749',
    'validated': '#276749',
    'cancelled': '#c53030'
  };
  return colorMap[status] || '#333';
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default { generateECMRPDFBuffer };
