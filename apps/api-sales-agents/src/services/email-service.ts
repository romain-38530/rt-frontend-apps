import Agent from '../models/Agent';
import AgentContract from '../models/AgentContract';
import Commission from '../models/Commission';

/**
 * Send contract email to agent for signature
 */
export async function sendContractEmail(agentId: string, contractId: string): Promise<void> {
  try {
    const agent = await Agent.findById(agentId);
    const contract = await AgentContract.findById(contractId);

    if (!agent || !contract) {
      throw new Error('Agent or contract not found');
    }

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`
      ========================================
      EMAIL: Contract Signature Request
      ========================================
      To: ${agent.email}
      Subject: Votre contrat d'agent commercial à signer

      Bonjour ${agent.firstName} ${agent.lastName},

      Votre contrat d'agent commercial (${contract.contractId}) est prêt à être signé.

      Veuillez consulter le document et le signer électroniquement via votre portail agent.

      Lien du portail: ${process.env.PORTAL_URL || 'https://agents.rt-transport.com'}

      Cordialement,
      L'équipe RT Transport Solutions
      ========================================
    `);
  } catch (error) {
    console.error('Error sending contract email:', error);
    throw error;
  }
}

/**
 * Send commission notification to agent
 */
export async function sendCommissionNotification(agentId: string, commissionId: string): Promise<void> {
  try {
    const agent = await Agent.findById(agentId);
    const commission = await Commission.findById(commissionId);

    if (!agent || !commission) {
      throw new Error('Agent or commission not found');
    }

    // In production, integrate with email service
    console.log(`
      ========================================
      EMAIL: Commission Validated
      ========================================
      To: ${agent.email}
      Subject: Commission validée pour ${commission.period.month}/${commission.period.year}

      Bonjour ${agent.firstName} ${agent.lastName},

      Votre commission pour la période ${commission.period.month}/${commission.period.year} a été validée.

      Détails:
      - Nombre de clients actifs: ${commission.totalClients}
      - Montant total: ${commission.totalAmount}€
      - Statut: ${commission.status}

      Le paiement sera effectué prochainement.

      Consultez le détail sur votre portail agent.

      Cordialement,
      L'équipe RT Transport Solutions
      ========================================
    `);
  } catch (error) {
    console.error('Error sending commission notification:', error);
    throw error;
  }
}

/**
 * Send welcome email to new agent
 */
export async function sendWelcomeEmail(agentId: string): Promise<void> {
  try {
    const agent = await Agent.findById(agentId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    // In production, integrate with email service
    console.log(`
      ========================================
      EMAIL: Bienvenue chez RT Transport
      ========================================
      To: ${agent.email}
      Subject: Bienvenue en tant qu'agent commercial RT Transport

      Bonjour ${agent.firstName} ${agent.lastName},

      Bienvenue dans l'équipe des agents commerciaux RT Transport Solutions!

      Votre compte a été créé avec succès.
      Identifiant: ${agent.agentId}

      Prochaines étapes:
      1. Complétez vos documents administratifs (KBIS, URSSAF, RIB)
      2. Signez votre contrat d'agent commercial
      3. Accédez à votre portail agent pour commencer

      Portail agent: ${process.env.PORTAL_URL || 'https://agents.rt-transport.com'}

      Nous sommes ravis de vous compter parmi nos agents!

      Cordialement,
      L'équipe RT Transport Solutions
      ========================================
    `);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

/**
 * Send document verification notification
 */
export async function sendDocumentVerificationEmail(agentId: string, docType: string): Promise<void> {
  try {
    const agent = await Agent.findById(agentId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    const docNames: { [key: string]: string } = {
      'id_card': 'Pièce d\'identité',
      'kbis': 'KBIS',
      'urssaf': 'Attestation URSSAF',
      'rib': 'RIB'
    };

    // In production, integrate with email service
    console.log(`
      ========================================
      EMAIL: Document Verified
      ========================================
      To: ${agent.email}
      Subject: Document vérifié - ${docNames[docType]}

      Bonjour ${agent.firstName} ${agent.lastName},

      Votre document "${docNames[docType]}" a été vérifié et validé.

      Consultez l'état de vos documents sur votre portail agent.

      Cordialement,
      L'équipe RT Transport Solutions
      ========================================
    `);
  } catch (error) {
    console.error('Error sending document verification email:', error);
    throw error;
  }
}

/**
 * Send monthly commission summary to all agents
 */
export async function sendMonthlyCommissionSummary(month: number, year: number): Promise<void> {
  try {
    const commissions = await Commission.find({
      'period.month': month,
      'period.year': year
    }).populate('agentId');

    for (const commission of commissions) {
      const agent = commission.agentId as any;

      console.log(`
        ========================================
        EMAIL: Commission Summary
        ========================================
        To: ${agent.email}
        Subject: Récapitulatif commission ${month}/${year}

        Bonjour ${agent.firstName} ${agent.lastName},

        Votre commission pour ${month}/${year}:

        - Clients actifs: ${commission.totalClients}
        - Commission totale: ${commission.totalAmount}€
        - Statut: ${commission.status}

        Détails disponibles sur votre portail agent.

        Cordialement,
        L'équipe RT Transport Solutions
        ========================================
      `);
    }

    console.log(`Sent ${commissions.length} commission summary emails`);
  } catch (error) {
    console.error('Error sending monthly commission summaries:', error);
    throw error;
  }
}
