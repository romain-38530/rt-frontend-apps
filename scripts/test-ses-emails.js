/**
 * Script de test AWS SES via AWS CLI
 * Usage: node scripts/test-ses-emails.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_EMAIL = 'r.tardy@rt-groupe.com';
const REGION = 'eu-central-1';

console.log(`\n🚀 Test AWS SES via CLI - Region: ${REGION}`);
console.log(`📧 Destination: ${TEST_EMAIL}\n`);

const services = [
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
    subject: '[TEST] api-admin - Email SES generique'
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

function generateHtml(service) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h1>Test AWS SES</h1><p>${service.name}</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><div style="background:#d1fae5;border:1px solid #10b981;padding:15px;border-radius:8px;margin:15px 0;"><strong>Email envoye avec succes!</strong></div><div style="background:#e0f2fe;border:1px solid #0ea5e9;padding:15px;border-radius:8px;margin:15px 0;"><p><strong>Service:</strong> ${service.name}</p><p><strong>From:</strong> ${service.fromName} - ${service.fromEmail}</p><p><strong>Region:</strong> ${REGION}</p><p><strong>Date:</strong> ${new Date().toISOString()}</p></div><p>Cet email confirme que la configuration AWS SES fonctionne correctement.</p></div></div></body></html>`;
}

function sendTestEmail(service) {
  const html = generateHtml(service);

  // Creer fichier JSON temporaire pour le message
  const messageJson = {
    Subject: { Data: service.subject, Charset: 'UTF-8' },
    Body: { Html: { Data: html, Charset: 'UTF-8' } }
  };

  const tempFile = path.join(__dirname, `temp-message-${Date.now()}.json`);
  fs.writeFileSync(tempFile, JSON.stringify(messageJson));

  // Creer fichier JSON pour destination
  const destJson = { ToAddresses: [TEST_EMAIL] };
  const destFile = path.join(__dirname, `temp-dest-${Date.now()}.json`);
  fs.writeFileSync(destFile, JSON.stringify(destJson));

  const cmd = `aws ses send-email --region ${REGION} --from "${service.fromEmail}" --destination file://${destFile} --message file://${tempFile}`;

  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const parsed = JSON.parse(result);
    console.log(`✅ ${service.name}: Envoye (${parsed.MessageId})`);

    // Nettoyer fichiers temp
    fs.unlinkSync(tempFile);
    fs.unlinkSync(destFile);
    return true;
  } catch (error) {
    // Nettoyer fichiers temp meme en cas d'erreur
    try { fs.unlinkSync(tempFile); } catch(e) {}
    try { fs.unlinkSync(destFile); } catch(e) {}

    // Extraire message d'erreur
    const stderr = error.stderr || error.message;
    const match = stderr.match(/error[:\s]+(.+?)(\n|$)/i) || stderr.match(/(.+?)(\n|$)/);
    console.error(`❌ ${service.name}: ${match ? match[1].trim() : 'Erreur inconnue'}`);
    return false;
  }
}

async function runTests() {
  console.log('─'.repeat(60));

  let success = 0;
  let failed = 0;

  for (const service of services) {
    const result = sendTestEmail(service);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  console.log('─'.repeat(60));
  console.log(`\n📊 Resultats: ${success}/${services.length} emails envoyes`);

  if (failed > 0) {
    console.log(`⚠️  ${failed} echec(s)`);
    console.log('\nVerifiez:');
    console.log('  1. AWS CLI est configure (aws configure)');
    console.log('  2. Les adresses email sont verifiees dans SES');
    console.log('  3. Le domaine symphonia-controltower.com est verifie');
  } else {
    console.log('🎉 Tous les tests ont reussi!');
  }

  console.log(`\n📬 Verifiez votre boite: ${TEST_EMAIL}\n`);
}

runTests();
