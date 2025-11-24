/**
 * Script de Seed pour la Collection Pricing
 *
 * Ce script initialise la collection 'pricing' avec les prix
 * pour tous les types de comptes RT Technologie.
 *
 * Structure des prix basée sur les spécifications:
 * - EXPEDITEUR (Industriel): 499€/mois
 * - TRANSPORTEUR: gratuit si invité OU 499€/mois si premium
 * - PLATEFORME_LOGISTIQUE: 199€/mois ou gratuit si invité
 * - COMMISSIONNAIRE: prix à définir
 * - COMMISSIONNAIRE_AGRÉÉ: upgrade seulement
 * - DOUANE: admin seulement
 *
 * Usage:
 *   node seed-pricing.js
 *
 * Service: subscriptions-contracts v2.4.0
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Si le modèle Pricing n'est pas dans le même dossier, ajuster le chemin
const Pricing = require('../models/Pricing');

// URI MongoDB depuis les variables d'environnement
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://...';

/**
 * Données de pricing initiales
 */
const initialPricingData = [
  // ==========================================
  // 1. EXPEDITEUR (Industriel)
  // ==========================================
  {
    accountType: 'EXPEDITEUR',
    displayName: 'Industriel (Expéditeur)',
    basePrice: 499,
    currency: 'EUR',
    billingPeriod: 'monthly',
    variants: [
      // Pas de variante "invité" pour EXPEDITEUR
      // C'est toujours payant car c'est le type "créateur"
    ],
    promotions: [
      {
        code: 'LAUNCH2025',
        discountType: 'percentage',
        discountValue: 50,
        validFrom: new Date('2025-11-24'),
        validUntil: new Date('2025-12-31'),
        maxUses: 100,
        usedCount: 0,
        isActive: true
      }
    ],
    isActive: true,
    metadata: {
      description: 'Compte Industriel permettant de créer des commandes de transport',
      features: [
        'Création de commandes de transport',
        'Gestion des expéditions',
        'Suivi des livraisons',
        'Accès e-CMR',
        'Tableau de bord analytique'
      ],
      portalUrl: 'https://main.dbg6okncuyyiw.amplifyapp.com'
    }
  },

  // ==========================================
  // 2. TRANSPORTEUR
  // ==========================================
  {
    accountType: 'TRANSPORTEUR',
    displayName: 'Transporteur',
    basePrice: 49,
    currency: 'EUR',
    billingPeriod: 'monthly',
    variants: [
      {
        name: 'TRANSPORTEUR_INVITE',
        price: 0,
        currency: 'EUR',
        conditions: {
          invitedBy: 'EXPEDITEUR'
        },
        features: [
          'Réception de missions',
          'Signature e-CMR',
          'Suivi GPS',
          'Notifications'
        ],
        description: 'Transporteur invité par un industriel (gratuit)',
        isActive: true
      },
      {
        name: 'TRANSPORTEUR_PREMIUM',
        price: 499,
        currency: 'EUR',
        conditions: {
          hasFeatures: ['create_orders']
        },
        features: [
          'Toutes les fonctionnalités INVITE',
          'Création de commandes de transport',
          'Gestion multi-clients',
          'Analytique avancée',
          'API access'
        ],
        description: 'Transporteur avec fonctionnalités industrielles',
        isActive: true
      }
    ],
    promotions: [],
    isActive: true,
    metadata: {
      description: 'Compte Transporteur pour gérer les missions de transport',
      features: [
        'Réception de missions',
        'Signature digitale e-CMR',
        'Suivi GPS en temps réel',
        'Gestion des livraisons'
      ],
      portalUrl: 'https://transporter.rt-technologie.com'
    }
  },

  // ==========================================
  // 3. PLATEFORME_LOGISTIQUE
  // ==========================================
  {
    accountType: 'PLATEFORME_LOGISTIQUE',
    displayName: 'Plateforme Logistique',
    basePrice: 199,
    currency: 'EUR',
    billingPeriod: 'monthly',
    variants: [
      {
        name: 'PLATEFORME_LOGISTIQUE_INVITE',
        price: 0,
        currency: 'EUR',
        conditions: {
          invitedBy: 'EXPEDITEUR'
        },
        features: [
          'Gestion des stocks',
          'Réception/expédition',
          'Signature e-CMR',
          'Suivi des palettes'
        ],
        description: 'Plateforme logistique invitée par un industriel (gratuit)',
        isActive: true
      },
      {
        name: 'PLATEFORME_LOGISTIQUE_PREMIUM',
        price: 199,
        currency: 'EUR',
        conditions: {},
        features: [
          'Toutes les fonctionnalités INVITE',
          'Multi-clients',
          'WMS basique',
          'Analytique',
          'Intégrations API'
        ],
        description: 'Plateforme logistique standard',
        isActive: true
      }
    ],
    promotions: [],
    isActive: true,
    metadata: {
      description: 'Compte Plateforme Logistique pour la gestion d\'entrepôt',
      features: [
        'Gestion des stocks',
        'Réception et expédition',
        'Signature e-CMR',
        'Suivi des palettes',
        'Inventaire'
      ],
      portalUrl: 'https://logistics.rt-technologie.com'
    }
  },

  // ==========================================
  // 4. COMMISSIONNAIRE (Transitaire)
  // ==========================================
  {
    accountType: 'COMMISSIONNAIRE',
    displayName: 'Commissionnaire de Transport',
    basePrice: 299,
    currency: 'EUR',
    billingPeriod: 'monthly',
    variants: [
      {
        name: 'COMMISSIONNAIRE_INVITE',
        price: 0,
        currency: 'EUR',
        conditions: {
          invitedBy: 'EXPEDITEUR'
        },
        features: [
          'Gestion des transports',
          'Coordination transporteurs',
          'Signature e-CMR',
          'Suivi multi-modal'
        ],
        description: 'Commissionnaire invité par un industriel (gratuit)',
        isActive: true
      },
      {
        name: 'COMMISSIONNAIRE_PREMIUM',
        price: 299,
        currency: 'EUR',
        conditions: {},
        features: [
          'Toutes les fonctionnalités INVITE',
          'Multi-clients',
          'Gestion multi-transporteurs',
          'Optimisation de routes',
          'Analytique avancée'
        ],
        description: 'Commissionnaire standard',
        isActive: true
      }
    ],
    promotions: [],
    isActive: true,
    metadata: {
      description: 'Compte Commissionnaire pour l\'organisation de transports',
      features: [
        'Organisation de transports',
        'Coordination des transporteurs',
        'Signature e-CMR',
        'Suivi multi-modal',
        'Gestion documentaire'
      ],
      portalUrl: 'https://forwarder.rt-technologie.com'
    }
  },

  // ==========================================
  // 5. COMMISSIONNAIRE_AGRÉÉ (Upgrade seulement)
  // ==========================================
  {
    accountType: 'COMMISSIONNAIRE_AGRÉÉ',
    displayName: 'Commissionnaire Agréé en Douane',
    basePrice: 599,
    currency: 'EUR',
    billingPeriod: 'monthly',
    variants: [],
    promotions: [],
    isActive: true,
    metadata: {
      description: 'Commissionnaire agréé pour les opérations douanières (upgrade seulement)',
      features: [
        'Toutes les fonctionnalités COMMISSIONNAIRE',
        'Déclarations en douane',
        'Gestion des régimes douaniers',
        'Certificats d\'origine',
        'Intégrations douane EU',
        'Support prioritaire'
      ],
      upgradeOnly: true,
      upgradeFrom: ['COMMISSIONNAIRE'],
      portalUrl: 'https://forwarder.rt-technologie.com'
    }
  },

  // ==========================================
  // 6. DOUANE (Admin seulement)
  // ==========================================
  {
    accountType: 'DOUANE',
    displayName: 'Administration Douanière',
    basePrice: 0,
    currency: 'EUR',
    billingPeriod: 'monthly',
    variants: [],
    promotions: [],
    isActive: true,
    metadata: {
      description: 'Compte administration douanière (admin seulement)',
      features: [
        'Consultation des déclarations',
        'Validation des documents',
        'Suivi des régimes douaniers',
        'Audit trail complet',
        'Exports réglementaires'
      ],
      adminOnly: true,
      portalUrl: 'https://customs.rt-technologie.com'
    }
  }
];

/**
 * Fonction principale de seed
 */
async function seedPricing() {
  try {
    console.log('🌱 Démarrage du seed de la collection pricing...\n');

    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à MongoDB Atlas\n');

    // Supprimer les anciennes données (optionnel - à commenter si vous voulez garder)
    console.log('🗑️  Suppression des anciennes données pricing...');
    const deleteResult = await Pricing.deleteMany({});
    console.log(`   ${deleteResult.deletedCount} documents supprimés\n`);

    // Insérer les nouvelles données
    console.log('📝 Insertion des nouvelles données pricing...\n');

    for (const pricingData of initialPricingData) {
      const pricing = new Pricing(pricingData);
      await pricing.save();

      console.log(`✅ ${pricingData.accountType.padEnd(25)} - ${pricingData.basePrice}€/${pricingData.billingPeriod}`);
      console.log(`   ${pricingData.displayName}`);

      if (pricingData.variants.length > 0) {
        console.log(`   Variantes: ${pricingData.variants.length}`);
        pricingData.variants.forEach(variant => {
          console.log(`      - ${variant.name}: ${variant.price}€`);
        });
      }

      if (pricingData.promotions.length > 0) {
        console.log(`   Promotions: ${pricingData.promotions.length}`);
        pricingData.promotions.forEach(promo => {
          console.log(`      - ${promo.code}: -${promo.discountValue}${promo.discountType === 'percentage' ? '%' : '€'}`);
        });
      }

      console.log('');
    }

    // Vérification
    console.log('🔍 Vérification des données insérées...');
    const count = await Pricing.countDocuments();
    console.log(`   Total: ${count} types de comptes avec pricing\n`);

    // Afficher un résumé
    console.log('📊 RÉSUMÉ DES PRIX:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const allPricing = await Pricing.find({}).sort({ basePrice: -1 });

    for (const pricing of allPricing) {
      console.log(`\n${pricing.displayName} (${pricing.accountType})`);
      console.log(`   Prix de base: ${pricing.basePrice}€/${pricing.billingPeriod}`);

      if (pricing.variants.length > 0) {
        console.log('   Variantes:');
        pricing.variants.forEach(v => {
          const conditions = Object.entries(v.conditions).map(([k, v]) => `${k}=${v}`).join(', ');
          console.log(`      ${v.name}: ${v.price}€ (conditions: ${conditions || 'aucune'})`);
        });
      }

      if (pricing.metadata?.upgradeOnly) {
        console.log('   ⚠️  Upgrade seulement - Ne peut pas être créé directement');
      }

      if (pricing.metadata?.adminOnly) {
        console.log('   ⚠️  Admin seulement');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seed de pricing terminé avec succès!\n');

    // Test rapide de calcul de prix
    console.log('🧪 Test de calcul de prix...\n');

    const testCases = [
      {
        accountType: 'TRANSPORTEUR',
        conditions: { invitedBy: 'EXPEDITEUR' },
        description: 'Transporteur invité par un industriel'
      },
      {
        accountType: 'TRANSPORTEUR',
        conditions: { hasFeatures: ['create_orders'] },
        description: 'Transporteur premium avec création de commandes'
      },
      {
        accountType: 'EXPEDITEUR',
        conditions: {},
        description: 'Industriel standard'
      },
      {
        accountType: 'PLATEFORME_LOGISTIQUE',
        conditions: { invitedBy: 'EXPEDITEUR' },
        description: 'Plateforme logistique invitée'
      }
    ];

    for (const testCase of testCases) {
      const pricing = await Pricing.findOne({ accountType: testCase.accountType });
      const result = pricing.calculatePrice(testCase.conditions);

      console.log(`${testCase.description}:`);
      console.log(`   Prix original: ${result.originalPrice}€`);
      console.log(`   Prix final: ${result.finalPrice}€`);
      if (result.appliedVariant) {
        console.log(`   Variante appliquée: ${result.appliedVariant.name}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('📡 Connexion MongoDB fermée');
  }
}

/**
 * Fonction utilitaire pour ajouter une promotion
 * Usage: node seed-pricing.js add-promo TRANSPORTEUR SUMMER50 percentage 50 2025-06-01 2025-08-31
 */
async function addPromotion(accountType, code, discountType, discountValue, validFrom, validUntil, maxUses = null) {
  try {
    await mongoose.connect(MONGODB_URI);

    const pricing = await Pricing.findOne({ accountType: accountType.toUpperCase() });

    if (!pricing) {
      throw new Error(`Pricing non trouvé pour ${accountType}`);
    }

    await pricing.addPromotion({
      code,
      discountType,
      discountValue: parseFloat(discountValue),
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      maxUses: maxUses ? parseInt(maxUses) : null,
      isActive: true
    });

    console.log(`✅ Promotion ${code} ajoutée à ${accountType}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

/**
 * Fonction utilitaire pour mettre à jour un prix
 * Usage: node seed-pricing.js update-price TRANSPORTEUR 59 "Ajustement inflation 2025"
 */
async function updatePrice(accountType, newPrice, reason) {
  try {
    await mongoose.connect(MONGODB_URI);

    const pricing = await Pricing.findOne({ accountType: accountType.toUpperCase() });

    if (!pricing) {
      throw new Error(`Pricing non trouvé pour ${accountType}`);
    }

    await pricing.updatePrice(parseFloat(newPrice), 'seed-script', reason);

    console.log(`✅ Prix de ${accountType} mis à jour: ${newPrice}€`);
    console.log(`   Raison: ${reason}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

// Execution du script
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'add-promo' && args.length >= 7) {
    // node seed-pricing.js add-promo TRANSPORTEUR SUMMER50 percentage 50 2025-06-01 2025-08-31 100
    addPromotion(args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
  } else if (args[0] === 'update-price' && args.length >= 4) {
    // node seed-pricing.js update-price TRANSPORTEUR 59 "Ajustement inflation"
    updatePrice(args[1], args[2], args.slice(3).join(' '));
  } else {
    // Seed normal
    seedPricing()
      .then(() => {
        console.log('✅ Script terminé');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Script échoué:', error);
        process.exit(1);
      });
  }
}

module.exports = { seedPricing, addPromotion, updatePrice };
