/**
 * Test templates restants (sans caracteres speciaux problematiques)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_EMAIL = 'r.tardy@rt-groupe.com';
const REGION = 'eu-central-1';

console.log(`\n🚀 Test templates restants`);
console.log(`📧 Destination: ${TEST_EMAIL}\n`);

const templates = [
  {
    name: 'Delivery - Confirmation',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Delivery - Livraison confirmee',
    html: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1>Livraison Confirmee</h1><p>api-orders</p></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>La commande <strong>ORD-2024-00142</strong> a ete livree avec succes.</p><div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;"><p><strong>Receptionne par:</strong> Marie Martin</p><p><strong>Date/Heure:</strong> 15/01/2024 14:32</p><p><strong>Etat:</strong> Parfait etat</p></div><p>La preuve de livraison (POD) a ete generee avec signature electronique.</p><a href="#" style="display:inline-block;background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Voir les details</a></div></div></body></html>'
  },
  {
    name: 'Delivery - Incident',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Delivery - Incident livraison',
    html: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:#ef4444;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1>Incident Livraison</h1><p>Severite: Majeur</p></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>Un incident a ete signale pour la commande <strong>ORD-2024-00142</strong>.</p><div style="background:#fee2e2;border-left:4px solid #ef4444;padding:15px;margin:15px 0;"><p><strong>Type:</strong> Marchandise endommagee</p><p><strong>Signale par:</strong> Pierre Durand</p><p><strong>Description:</strong> 2 cartons ecrases lors du transport</p></div><p>Reference incident: <code>issue_abc123</code></p><a href="#" style="display:inline-block;background:#667eea;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Gerer incident</a></div></div></body></html>'
  },
  {
    name: 'Document - Rejection',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Document - Document rejete',
    html: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:#dc2626;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1>Document Rejete</h1><p>api-orders</p></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>Votre document pour la commande <strong>ORD-2024-00142</strong> a ete rejete.</p><p><strong>Document:</strong> CMR_ORD-2024-00142.pdf</p><div style="background:#fee2e2;border-left:4px solid #dc2626;padding:15px;margin:15px 0;"><strong>Motif du rejet:</strong><br>Signature manquante - Le document CMR doit etre signe par expediteur</div><p>Merci de deposer un nouveau document conforme.</p><a href="#" style="display:inline-block;background:#667eea;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Deposer nouveau document</a></div></div></body></html>'
  },
  {
    name: 'Tracking - Status update',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Tracking - En route vers livraison',
    html: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:#dd6b20;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h2>Mise a jour de votre livraison</h2></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>Bonjour Jean Dupont,</p><p>Votre commande <strong>ORD-2024-00142</strong> a un nouveau statut:</p><div style="text-align:center;"><span style="background:#dd6b20;color:white;padding:10px 20px;border-radius:20px;display:inline-block;font-weight:bold;margin:15px 0;">Arrive a destination</span></div><div style="background:#e2e8f0;padding:15px;border-radius:8px;margin:15px 0;"><p><strong>Enlevement:</strong> Paris</p><p><strong>Livraison:</strong> Marseille</p><p><strong>ETA:</strong> 15/01/2024 15:30</p><p><strong>Transporteur:</strong> Transport Express</p></div><a href="#" style="display:inline-block;background:#667eea;color:white;padding:12px 25px;text-decoration:none;border-radius:8px;margin-top:15px;">Suivre en temps reel</a></div></div></body></html>'
  },
  {
    name: 'Tracking - ETA update',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Tracking - ETA mise a jour',
    html: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:#dd6b20;color:white;padding:20px;text-align:center;border-radius:8px;"><h2>Mise a jour ETA</h2></div><div style="background:#fffaf0;padding:30px;border-radius:8px;margin-top:10px;"><p>Bonjour Jean Dupont,</p><p>Heure arrivee estimee pour votre commande <strong>ORD-2024-00142</strong> a ete retardee de 45 minutes.</p><p><strong>Nouvelle ETA:</strong> 15/01/2024 16:15</p><p><strong>Raison:</strong> Trafic dense sur A7</p></div></div></body></html>'
  },
  {
    name: 'Tracking - Ping request',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Tracking - Demande de pointage',
    html: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#ed8936,#dd6b20);color:white;padding:25px;text-align:center;border-radius:8px 8px 0 0;"><h2>Demande de pointage</h2></div><div style="background:#fffaf0;padding:30px;border-radius:0 0 8px 8px;"><p>Bonjour Transport Express,</p><p><strong>Industriel ABC</strong> (Donneur ordre) demande une mise a jour de position pour le transport en cours.</p><div style="background:white;padding:15px;border-radius:8px;border-left:4px solid #ed8936;margin:15px 0;"><p><strong>Commande:</strong> ORD-2024-00142</p><p><strong>Trajet:</strong> Paris - Marseille</p><p><strong>Statut actuel:</strong> En route vers livraison</p></div><p>Merci de mettre a jour votre position pour permettre un suivi en temps reel.</p><a href="#" style="display:inline-block;background:#38a169;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;margin:15px 0;">Mettre a jour ma position</a></div></div></body></html>'
  },
  {
    name: 'Closure - Order completed',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Closure - Commande cloturee',
    html: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1>Commande Cloturee</h1><p>api-orders</p></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>La commande <strong>ORD-2024-00142</strong> a ete cloturee avec succes.</p><div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;"><p><strong>Reference:</strong> ORD-2024-00142</p><p><strong>Trajet:</strong> Paris - Marseille</p><p><strong>Livraison:</strong> 15/01/2024</p><p><strong>Transporteur:</strong> Transport Express</p></div><p>Cette commande sera automatiquement archivee dans 30 jours et conservee 10 ans conformement aux obligations legales.</p><p>Tous les documents (CMR, POD, factures) sont disponibles dans votre espace.</p></div></div></body></html>'
  }
];

function sendEmail(template, index) {
  const messageJson = {
    Subject: { Data: template.subject, Charset: 'UTF-8' },
    Body: { Html: { Data: template.html, Charset: 'UTF-8' } }
  };

  const tempFile = path.join(__dirname, `temp-msg2-${index}.json`);
  fs.writeFileSync(tempFile, JSON.stringify(messageJson));

  const destJson = { ToAddresses: [TEST_EMAIL] };
  const destFile = path.join(__dirname, `temp-dest2-${index}.json`);
  fs.writeFileSync(destFile, JSON.stringify(destJson));

  const fromAddress = `${template.fromName} <${template.fromEmail}>`;
  const cmd = `aws ses send-email --region ${REGION} --from "${fromAddress}" --destination file://${destFile} --message file://${tempFile}`;

  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const parsed = JSON.parse(result);
    console.log(`✅ ${template.name}`);
    fs.unlinkSync(tempFile);
    fs.unlinkSync(destFile);
    return true;
  } catch (error) {
    try { fs.unlinkSync(tempFile); } catch(e) {}
    try { fs.unlinkSync(destFile); } catch(e) {}
    const stderr = error.stderr || error.message;
    console.error(`❌ ${template.name}: ${stderr.substring(0, 100)}`);
    return false;
  }
}

async function runTests() {
  console.log('─'.repeat(60));

  let success = 0;
  for (let i = 0; i < templates.length; i++) {
    if (sendEmail(templates[i], i)) success++;
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('─'.repeat(60));
  console.log(`\n📊 Résultats: ${success}/${templates.length} emails envoyés`);
  console.log(`📬 Vérifiez votre boîte: ${TEST_EMAIL}\n`);
}

runTests();
