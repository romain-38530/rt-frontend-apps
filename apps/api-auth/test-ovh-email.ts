/**
 * Script pour vérifier les comptes email OVH via API
 */

import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';

const OVH_APP_KEY = process.env.OVH_APP_KEY;
const OVH_APP_SECRET = process.env.OVH_APP_SECRET;
const OVH_CONSUMER_KEY = process.env.OVH_CONSUMER_KEY;
const DOMAIN = 'symphonia-controltower.com';

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
  console.log('=== Test API OVH Email ===\n');
  console.log('Credentials:');
  console.log(`  OVH_APP_KEY: ${OVH_APP_KEY}`);
  console.log(`  OVH_APP_SECRET: ${OVH_APP_SECRET ? '***' : 'NON DEFINI'}`);
  console.log(`  OVH_CONSUMER_KEY: ${OVH_CONSUMER_KEY}`);
  console.log('');

  // Test 1: Vérifier les domaines email
  console.log('1. Liste des domaines email...');
  const domains = await ovhRequest('GET', '/email/domain');
  console.log('   Résultat:', domains);

  // Test 2: Lister les comptes email du domaine
  console.log(`\n2. Comptes email sur ${DOMAIN}...`);
  const accounts = await ovhRequest('GET', `/email/domain/${DOMAIN}/account`);
  console.log('   Résultat:', accounts);

  // Test 3: Détails du compte noreply
  if (accounts.status === 200 && Array.isArray(accounts.data)) {
    console.log(`\n3. Détails des comptes...`);
    for (const account of accounts.data) {
      const details = await ovhRequest('GET', `/email/domain/${DOMAIN}/account/${account}`);
      console.log(`   ${account}:`, details.data);
    }
  }
}

main().catch(console.error);
