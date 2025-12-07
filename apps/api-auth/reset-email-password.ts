/**
 * Script pour changer le mot de passe d'un compte email OVH
 */

import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';

const OVH_APP_KEY = process.env.OVH_APP_KEY;
const OVH_APP_SECRET = process.env.OVH_APP_SECRET;
const OVH_CONSUMER_KEY = process.env.OVH_CONSUMER_KEY;
const DOMAIN = 'symphonia-controltower.com';
const ACCOUNT = 'noreply';
const NEW_PASSWORD = 'Symphonia2024!';

async function ovhRequest(method: string, path: string, body?: any) {
  const timestamp = Math.floor(Date.now() / 1000);
  const url = `https://eu.api.ovh.com/1.0${path}`;

  const bodyStr = body ? JSON.stringify(body) : '';
  const toSign = `${OVH_APP_SECRET}+${OVH_CONSUMER_KEY}+${method}+${url}+${bodyStr}+${timestamp}`;
  const signature = '$1$' + crypto.createHash('sha1').update(toSign).digest('hex');

  const headers: any = {
    'Content-Type': 'application/json',
    'X-Ovh-Application': OVH_APP_KEY,
    'X-Ovh-Timestamp': timestamp.toString(),
    'X-Ovh-Signature': signature,
    'X-Ovh-Consumer': OVH_CONSUMER_KEY,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: bodyStr || undefined,
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function main() {
  console.log('=== Changement du mot de passe ===\n');
  console.log(`Compte: ${ACCOUNT}@${DOMAIN}`);
  console.log(`Nouveau mot de passe: ${NEW_PASSWORD}\n`);

  // Changer le mot de passe
  const result = await ovhRequest(
    'POST',
    `/email/domain/${DOMAIN}/account/${ACCOUNT}/changePassword`,
    { password: NEW_PASSWORD }
  );

  console.log('Résultat:', result);

  if (result.status === 200) {
    console.log('\n✅ Mot de passe changé avec succès!');
    console.log(`\nNouvelle configuration:`);
    console.log(`  SMTP_USER=${ACCOUNT}@${DOMAIN}`);
    console.log(`  SMTP_PASSWORD=${NEW_PASSWORD}`);
  } else {
    console.log('\n❌ Erreur lors du changement de mot de passe');
  }
}

main().catch(console.error);
