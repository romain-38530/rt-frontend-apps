/**
 * Script de test AWS SES - Envoi d'emails de test depuis chaque service
 * Usage: npx ts-node scripts/test-ses-emails.ts
 */

import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

const TEST_EMAIL = 'r.tardy@rt-groupe.com';

// Configuration AWS SES
const SES_CONFIG = {
  region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'eu-central-1',
};

// Vérifier les credentials
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  console.error('❌ AWS credentials not configured');
  console.error('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables');
  process.exit(1);
}

const sesClient = new SESClient({
  region: SES_CONFIG.region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

console.log(`\n🚀 Test AWS SES - Region: ${SES_CONFIG.region}`);
console.log(`📧 Destination: ${TEST_EMAIL}\n`);

interface ServiceConfig {
  name: string;
  fromEmail: string;
  fromName: string;
  subject: string;
}

const services: ServiceConfig[] = [
  {
    name: 'api-admin (CRM)',
    fromEmail: 'commerciaux@symphonia-controltower.com',
    fromName: 'Equipe Commerciale SYMPHONI.A',
    subject: '[TEST] api-admin - Email CRM'
  },
  {
    name: 'api-admin (SES)',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] api-admin - Email SES générique'
  },
  {
    name: 'api-sales-agents',
    fromEmail: 'agents@symphonia-controltower.com',
    fromName: 'RT Transport Solutions',
    subject: '[TEST] api-sales-agents - Agents commerciaux'
  },
  {
    name: 'api-auth',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] api-auth - Authentification'
  },
  {
    name: 'api-supplier (notifications)',
    fromEmail: 'notifications@symphonia-controltower.com',
    fromName: 'RT Technologie',
    subject: '[TEST] api-supplier - Notifications fournisseur'
  },
  {
    name: 'api-supplier (invitations)',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'RT Technologie',
    subject: '[TEST] api-supplier - Invitations fournisseur'
  },
  {
    name: 'api-orders (notifications)',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] api-orders - Notifications transport'
  },
  {
    name: 'api-orders (billing)',
    fromEmail: 'billing@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] api-orders - Facturation'
  },
  {
    name: 'api-orders (portal)',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] api-orders - Invitations portail'
  }
];

async function sendTestEmail(service: ServiceConfig): Promise<boolean> {
  const fromAddress = `${service.fromName} <${service.fromEmail}>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .success { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .info { background: #e0f2fe; border: 1px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Test AWS SES</h1>
          <p>${service.name}</p>
        </div>
        <div class="content">
          <div class="success">
            <strong>✅ Email envoyé avec succès!</strong>
          </div>

          <div class="info">
            <p><strong>Service:</strong> ${service.name}</p>
            <p><strong>From:</strong> ${fromAddress}</p>
            <p><strong>Region:</strong> ${SES_CONFIG.region}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>

          <p>Cet email confirme que la configuration AWS SES fonctionne correctement pour ce service.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const params: SendEmailCommandInput = {
    Source: fromAddress,
    Destination: {
      ToAddresses: [TEST_EMAIL],
    },
    Message: {
      Subject: {
        Data: service.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: html,
          Charset: 'UTF-8',
        },
      },
    },
    ReplyToAddresses: ['support@symphonia-controltower.com'],
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log(`✅ ${service.name}: Envoyé (${response.MessageId})`);
    return true;
  } catch (error: any) {
    console.error(`❌ ${service.name}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('─'.repeat(60));

  let success = 0;
  let failed = 0;

  for (const service of services) {
    const result = await sendTestEmail(service);
    if (result) {
      success++;
    } else {
      failed++;
    }
    // Délai entre chaque envoi pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('─'.repeat(60));
  console.log(`\n📊 Résultats: ${success}/${services.length} emails envoyés`);

  if (failed > 0) {
    console.log(`⚠️  ${failed} échec(s)`);
    console.log('\nVérifiez que les adresses email sont vérifiées dans AWS SES:');
    console.log('   - noreply@symphonia-controltower.com');
    console.log('   - commerciaux@symphonia-controltower.com');
    console.log('   - agents@symphonia-controltower.com');
    console.log('   - notifications@symphonia-controltower.com');
    console.log('   - billing@symphonia-controltower.com');
  } else {
    console.log('🎉 Tous les tests ont réussi!');
  }

  console.log(`\n📬 Vérifiez votre boîte: ${TEST_EMAIL}\n`);
}

runTests().catch(console.error);
