import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import AgentContract from '../models/AgentContract';
import Agent from '../models/Agent';

/**
 * Generate a PDF contract for an agent
 */
export async function generateContract(contractId: string): Promise<string> {
  try {
    const contract = await AgentContract.findById(contractId).populate('agentId');

    if (!contract) {
      throw new Error('Contract not found');
    }

    const agent = contract.agentId as any;

    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'storage', 'contracts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `contract-${contract.contractId}.pdf`;
    const filepath = path.join(outputDir, filename);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('CONTRAT D\'AGENT COMMERCIAL', { align: 'center' });
    doc.moveDown();

    // Contract info
    doc.fontSize(12);
    doc.text(`N° de contrat: ${contract.contractId}`);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`);
    doc.moveDown();

    // Parties
    doc.fontSize(14).text('ENTRE LES SOUSSIGNÉS:', { underline: true });
    doc.moveDown();

    doc.fontSize(12);
    doc.text('LA SOCIÉTÉ:', { continued: false });
    doc.text('RT Transport Solutions');
    doc.text('Société par actions simplifiée');
    doc.text('Siège social: [Adresse]');
    doc.moveDown();

    doc.text('ET:', { underline: true });
    doc.moveDown();

    doc.text('L\'AGENT COMMERCIAL:');
    doc.text(`${agent.firstName} ${agent.lastName}`);
    doc.text(`Email: ${agent.email}`);
    doc.text(`Téléphone: ${agent.phone}`);
    doc.text(`Adresse: ${agent.address.street}, ${agent.address.postalCode} ${agent.address.city}`);
    doc.text(`Région: ${contract.region}`);
    doc.moveDown(2);

    // Article 1 - Object
    doc.fontSize(14).text('ARTICLE 1 - OBJET DU CONTRAT', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(
      'Le présent contrat a pour objet de définir les conditions dans lesquelles l\'Agent Commercial ' +
      's\'engage à rechercher, prospecter et conclure des contrats de transport pour le compte de la Société.',
      { align: 'justify' }
    );
    doc.moveDown(2);

    // Article 2 - Durée
    doc.fontSize(14).text('ARTICLE 2 - DURÉE', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    const durationText = contract.duration === 'unlimited'
      ? 'Le présent contrat est conclu pour une durée indéterminée.'
      : 'Le présent contrat est conclu pour une durée d\'un (1) an renouvelable.';
    doc.text(durationText, { align: 'justify' });
    doc.moveDown(2);

    // Article 3 - Commission
    doc.fontSize(14).text('ARTICLE 3 - RÉMUNÉRATION', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(
      `L\'Agent Commercial percevra une commission de ${contract.commissionRate}€ par client actif et par mois. ` +
      'La commission sera calculée mensuellement et versée après validation par la Direction.',
      { align: 'justify' }
    );
    doc.moveDown(2);

    // Article 4 - Obligations
    doc.fontSize(14).text('ARTICLE 4 - OBLIGATIONS DE L\'AGENT', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text('L\'Agent s\'engage à:', { align: 'justify' });
    doc.list([
      'Prospecter activement dans sa zone géographique',
      'Respecter les tarifs et conditions commerciales de la Société',
      'Transmettre régulièrement les informations sur les prospects',
      'Maintenir ses documents administratifs à jour (KBIS, URSSAF, etc.)'
    ]);
    doc.moveDown(2);

    // Additional clauses
    if (contract.clauses && contract.clauses.length > 0) {
      doc.fontSize(14).text('CLAUSES PARTICULIÈRES', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      contract.clauses.forEach((clause, index) => {
        doc.text(`${index + 1}. ${clause}`, { align: 'justify' });
        doc.moveDown();
      });
      doc.moveDown();
    }

    // Signature
    doc.moveDown(3);
    doc.fontSize(12);
    doc.text('Fait à _________________, le _________________', { align: 'left' });
    doc.moveDown(2);

    const signatureY = doc.y;
    doc.text('Pour la Société', { continued: false, align: 'left' });
    doc.text('L\'Agent Commercial', { align: 'right' });
    doc.moveDown(3);

    // Footer
    doc.fontSize(10).fillColor('gray');
    doc.text(
      `Document généré le ${new Date().toLocaleDateString('fr-FR')} - Version ${contract.templateVersion}`,
      { align: 'center' }
    );
    doc.fillColor('black');

    // Finalize PDF
    doc.end();

    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    // Return URL (in production, this would be an S3 URL)
    const pdfUrl = `/storage/contracts/${filename}`;

    console.log(`Contract PDF generated: ${pdfUrl}`);

    return pdfUrl;
  } catch (error) {
    console.error('Error generating contract:', error);
    throw error;
  }
}

/**
 * Delete contract PDF
 */
export async function deleteContract(contractId: string): Promise<void> {
  try {
    const filename = `contract-${contractId}.pdf`;
    const filepath = path.join(process.cwd(), 'storage', 'contracts', filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      console.log(`Contract PDF deleted: ${filename}`);
    }
  } catch (error) {
    console.error('Error deleting contract:', error);
    throw error;
  }
}
