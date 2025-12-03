/**
 * Script de Génération de Token Admin JWT
 *
 * Ce script génère un token JWT pour un administrateur.
 * Le token peut être utilisé pour accéder aux endpoints admin protégés.
 *
 * Usage:
 *   node scripts/generate-admin-token.js [userId] [email] [role] [expiresIn]
 *
 * Exemples:
 *   node scripts/generate-admin-token.js
 *   node scripts/generate-admin-token.js admin-123 admin@rt-technologie.com
 *   node scripts/generate-admin-token.js admin-123 admin@rt-technologie.com super_admin 30d
 *
 * Service: subscriptions-contracts v2.4.0
 */

const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// ==========================================
// Configuration
// ==========================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ISSUER = process.env.JWT_ISSUER || 'rt-technologie';

// Rôles admin disponibles
const ADMIN_ROLES = ['admin', 'super_admin', 'pricing_manager'];

// ==========================================
// Récupérer les arguments
// ==========================================

const args = process.argv.slice(2);

const userId = args[0] || `admin-${Date.now()}`;
const email = args[1] || 'admin@rt-technologie.com';
const role = args[2] || 'admin';
const expiresIn = args[3] || '30d';

// ==========================================
// Validation
// ==========================================

if (!ADMIN_ROLES.includes(role)) {
  console.error(`\n❌ Erreur: Le rôle "${role}" n'est pas valide.`);
  console.error(`   Rôles disponibles: ${ADMIN_ROLES.join(', ')}\n`);
  process.exit(1);
}

if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
  console.warn('\n⚠️  ATTENTION: JWT_SECRET utilise la valeur par défaut!');
  console.warn('   En production, configurez un secret fort dans .env\n');
}

// ==========================================
// Créer le payload du token
// ==========================================

const payload = {
  userId: userId,
  email: email,
  role: role,
  accountType: role === 'admin' || role === 'super_admin' ? 'DOUANE' : 'ADMIN',
  isAdmin: true,
  // Metadata additionnelle
  generatedAt: new Date().toISOString(),
  generatedBy: 'generate-admin-token script'
};

// ==========================================
// Générer le token
// ==========================================

try {
  const token = jwt.sign(payload, JWT_SECRET, {
    issuer: JWT_ISSUER,
    expiresIn: expiresIn
  });

  // ==========================================
  // Afficher les résultats
  // ==========================================

  console.log('\n' + '='.repeat(70));
  console.log('🔑  TOKEN ADMIN JWT GÉNÉRÉ AVEC SUCCÈS');
  console.log('='.repeat(70) + '\n');

  console.log('📋 INFORMATIONS:');
  console.log('─'.repeat(70));
  console.log(`   User ID:      ${userId}`);
  console.log(`   Email:        ${email}`);
  console.log(`   Rôle:         ${role}`);
  console.log(`   Account Type: ${payload.accountType}`);
  console.log(`   Expire dans:  ${expiresIn}`);
  console.log(`   Émis le:      ${new Date().toLocaleString('fr-FR')}`);
  console.log('');

  console.log('🔐 TOKEN JWT:');
  console.log('─'.repeat(70));
  console.log(token);
  console.log('');

  console.log('📝 UTILISATION:');
  console.log('─'.repeat(70));
  console.log('Incluez ce token dans le header Authorization de vos requêtes:');
  console.log('');
  console.log(`   Authorization: Bearer ${token}`);
  console.log('');

  console.log('📦 EXEMPLE CURL:');
  console.log('─'.repeat(70));
  console.log('curl -X POST https://d39uizi9hzozo8.cloudfront.net/api/pricing \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log(`  -H "Authorization: Bearer ${token}" \\`);
  console.log('  -d \'{"accountType":"TRANSPORTEUR","displayName":"Transporteur","basePrice":49}\'');
  console.log('');

  console.log('🧪 VÉRIFICATION DU TOKEN:');
  console.log('─'.repeat(70));

  // Décoder le token pour vérification
  const decoded = jwt.decode(token, { complete: true });

  console.log('Header:');
  console.log(JSON.stringify(decoded.header, null, 2));
  console.log('');
  console.log('Payload:');
  console.log(JSON.stringify(decoded.payload, null, 2));
  console.log('');

  // Calculer la date d'expiration
  if (decoded.payload.exp) {
    const expiryDate = new Date(decoded.payload.exp * 1000);
    console.log(`⏰ Expire le: ${expiryDate.toLocaleString('fr-FR')}`);

    const now = new Date();
    const timeLeft = expiryDate - now;
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    console.log(`   Temps restant: ${daysLeft} jours et ${hoursLeft} heures`);
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('✅ Token prêt à utiliser!');
  console.log('='.repeat(70) + '\n');

  // ==========================================
  // Sauvegarder dans un fichier (optionnel)
  // ==========================================

  const fs = require('fs');
  const tokensDir = path.join(__dirname, '../tokens');

  if (!fs.existsSync(tokensDir)) {
    fs.mkdirSync(tokensDir, { recursive: true });
  }

  const tokenFile = path.join(tokensDir, `admin-token-${userId}-${Date.now()}.txt`);

  const tokenContent = `
RT Technologie - Admin Token
=============================

Généré le: ${new Date().toLocaleString('fr-FR')}

User ID:      ${userId}
Email:        ${email}
Rôle:         ${role}
Expire dans:  ${expiresIn}

TOKEN:
${token}

UTILISATION:
Authorization: Bearer ${token}

CURL EXEMPLE:
curl -X POST https://d39uizi9hzozo8.cloudfront.net/api/pricing \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '{"accountType":"TRANSPORTEUR","displayName":"Transporteur","basePrice":49}'

⚠️  ATTENTION: Ce token donne accès complet aux endpoints admin.
   Gardez-le en sécurité et ne le partagez jamais publiquement.
`;

  fs.writeFileSync(tokenFile, tokenContent.trim());

  console.log(`💾 Token sauvegardé dans: ${tokenFile}\n`);

} catch (error) {
  console.error('\n❌ Erreur lors de la génération du token:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// ==========================================
// Fonction utilitaire pour valider un token existant
// ==========================================

function validateToken(tokenToValidate) {
  try {
    const decoded = jwt.verify(tokenToValidate, JWT_SECRET, {
      issuer: JWT_ISSUER
    });

    console.log('\n✅ Token valide!');
    console.log('Payload:', JSON.stringify(decoded, null, 2));
    return true;
  } catch (error) {
    console.log('\n❌ Token invalide:', error.message);
    return false;
  }
}

// Si un argument spécial est fourni, valider un token existant
if (args[0] === '--validate' && args[1]) {
  validateToken(args[1]);
  process.exit(0);
}
