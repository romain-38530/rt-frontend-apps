import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

// Clé privée serveur (en production, stocker dans les variables d'environnement)
const SERVER_SEED = process.env.CRYPTO_SEED || 'rt-technologie-palettes-europe-seed-2024';

// Générer une paire de clés Ed25519 déterministe à partir d'une seed
function generateKeyPair(): nacl.SignKeyPair {
  const seed = new Uint8Array(32);
  const seedBytes = decodeUTF8(SERVER_SEED);
  for (let i = 0; i < 32; i++) {
    seed[i] = seedBytes[i % seedBytes.length];
  }
  return nacl.sign.keyPair.fromSeed(seed);
}

const keyPair = generateKeyPair();

/**
 * Signe un message avec la clé privée Ed25519 du serveur
 * @param message - Le message à signer (sera JSON.stringify si objet)
 * @returns La signature en base64
 */
export function signMessage(message: string | object): string {
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  const messageBytes = decodeUTF8(messageStr);
  const signature = nacl.sign.detached(messageBytes, keyPair.secretKey);
  return encodeBase64(signature);
}

/**
 * Vérifie une signature Ed25519
 * @param message - Le message original
 * @param signature - La signature en base64
 * @returns true si la signature est valide
 */
export function verifySignature(message: string | object, signature: string): boolean {
  try {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    const messageBytes = decodeUTF8(messageStr);
    const signatureBytes = decodeBase64(signature);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, keyPair.publicKey);
  } catch (error) {
    return false;
  }
}

/**
 * Génère un hash SHA-256 simple (pour identifiants uniques)
 * @param input - La chaîne à hasher
 * @returns Le hash en hexadécimal
 */
export function generateHash(input: string): string {
  const bytes = decodeUTF8(input);
  const hash = nacl.hash(bytes);
  return encodeBase64(hash).slice(0, 32).replace(/[+/=]/g, '');
}

/**
 * Crée une signature pour un chèque-palette
 * @param chequeData - Les données du chèque à signer
 * @returns L'objet avec les données signées
 */
export function signCheque(chequeData: {
  chequeId: string;
  fromCompanyId: string;
  toSiteId: string;
  quantity: number;
  palletType: string;
  timestamp: Date;
}): string {
  const payload = {
    id: chequeData.chequeId,
    from: chequeData.fromCompanyId,
    to: chequeData.toSiteId,
    qty: chequeData.quantity,
    type: chequeData.palletType,
    ts: chequeData.timestamp.toISOString(),
  };
  return signMessage(payload);
}

/**
 * Vérifie la signature d'un chèque-palette
 */
export function verifyChequeSignature(
  chequeData: {
    chequeId: string;
    fromCompanyId: string;
    toSiteId: string;
    quantity: number;
    palletType: string;
    timestamp: Date;
  },
  signature: string
): boolean {
  const payload = {
    id: chequeData.chequeId,
    from: chequeData.fromCompanyId,
    to: chequeData.toSiteId,
    qty: chequeData.quantity,
    type: chequeData.palletType,
    ts: chequeData.timestamp.toISOString(),
  };
  return verifySignature(payload, signature);
}

/**
 * Retourne la clé publique du serveur (pour vérification externe)
 */
export function getPublicKey(): string {
  return encodeBase64(keyPair.publicKey);
}

export default {
  signMessage,
  verifySignature,
  generateHash,
  signCheque,
  verifyChequeSignature,
  getPublicKey,
};
