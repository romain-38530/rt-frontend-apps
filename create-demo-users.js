// Script de création des utilisateurs de démo pour MongoDB
// À exécuter avec : node create-demo-users.js

const bcrypt = require('bcryptjs');

// Fonction pour hasher les mots de passe
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Utilisateurs de démo
const demoUsers = [
  {
    email: 'industry@demo.symphoni-a.com',
    password: 'Industry2024!',
    role: 'manufacturer',
    portal: 'web-industry',
    firstName: 'Jean',
    lastName: 'Industriel',
    company: 'Industries Demo SA',
    phone: '+33 1 23 45 67 89',
    subscription: {
      tier: 'pro',
      status: 'active',
      startDate: new Date(),
      features: ['production', 'orders', 'planning']
    }
  },
  {
    email: 'supplier@demo.symphoni-a.com',
    password: 'Supplier2024!',
    role: 'supplier',
    portal: 'web-supplier',
    firstName: 'Marie',
    lastName: 'Fournisseur',
    company: 'Fournisseurs Demo SARL',
    phone: '+33 1 23 45 67 90',
    subscription: {
      tier: 'pro',
      status: 'active',
      startDate: new Date(),
      features: ['catalog', 'inventory', 'orders']
    }
  },
  {
    email: 'transporter@demo.symphoni-a.com',
    password: 'Transport2024!',
    role: 'transporter',
    portal: 'web-transporter',
    firstName: 'Pierre',
    lastName: 'Transporteur',
    company: 'Transports Demo Express',
    phone: '+33 1 23 45 67 91',
    subscription: {
      tier: 'enterprise',
      status: 'active',
      startDate: new Date(),
      features: ['tracking', 'ecmr', 'vigilance', 'planning']
    }
  },
  {
    email: 'forwarder@demo.symphoni-a.com',
    password: 'Forwarder2024!',
    role: 'forwarder',
    portal: 'web-forwarder',
    firstName: 'Sophie',
    lastName: 'Transitaire',
    company: 'Transitaires Demo International',
    phone: '+33 1 23 45 67 92',
    subscription: {
      tier: 'pro',
      status: 'active',
      startDate: new Date(),
      features: ['orders', 'planning', 'palettes']
    }
  },
  {
    email: 'logistician@demo.symphoni-a.com',
    password: 'Logistics2024!',
    role: 'logistician',
    portal: 'web-logistician',
    firstName: 'Thomas',
    lastName: 'Logisticien',
    company: 'Logistique Demo Pro',
    phone: '+33 1 23 45 67 93',
    subscription: {
      tier: 'enterprise',
      status: 'active',
      startDate: new Date(),
      features: ['dashboard', 'analytics', 'optimization', 'tms-sync']
    }
  },
  {
    email: 'recipient@demo.symphoni-a.com',
    password: 'Recipient2024!',
    role: 'recipient',
    portal: 'web-recipient',
    firstName: 'Emma',
    lastName: 'Destinataire',
    company: 'Destinataires Demo',
    phone: '+33 1 23 45 67 94',
    subscription: {
      tier: 'free',
      status: 'active',
      startDate: new Date(),
      features: ['notifications']
    }
  },
  {
    email: 'admin@demo.symphoni-a.com',
    password: 'Admin2024!',
    role: 'admin',
    portal: 'backoffice-admin',
    firstName: 'Admin',
    lastName: 'SYMPHONI.A',
    company: 'SYMPHONI.A',
    phone: '+33 1 23 45 67 95',
    isAdmin: true,
    permissions: ['*'],
    subscription: {
      tier: 'enterprise',
      status: 'active',
      startDate: new Date(),
      features: ['all']
    }
  }
];

// Fonction principale
async function createDemoUsers() {
  console.log('🔧 Création des utilisateurs de démo...\n');

  const usersWithHashedPasswords = [];

  for (const user of demoUsers) {
    const hashedPassword = await hashPassword(user.password);

    const userDoc = {
      ...user,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
      status: 'active'
    };

    delete userDoc.password; // Ne pas afficher le mot de passe dans les logs
    usersWithHashedPasswords.push({
      ...userDoc,
      password: hashedPassword
    });

    console.log(`✅ ${user.email} (${user.role})`);
  }

  console.log('\n📄 Fichier JSON généré : demo-users.json');
  console.log('📋 Commande d\'import MongoDB :');
  console.log('mongoimport --uri "YOUR_MONGODB_URI" --collection users --file demo-users.json --jsonArray\n');

  // Écrire le fichier JSON
  const fs = require('fs');
  fs.writeFileSync(
    'demo-users.json',
    JSON.stringify(usersWithHashedPasswords, null, 2)
  );

  console.log('✅ Terminé !\n');
}

// Connexion MongoDB et insertion
async function insertUsersToMongoDB() {
  const { MongoClient } = require('mongodb');

  // Remplacer par votre URI MongoDB
  const uri = process.env.MONGODB_URI || 'mongodb+srv://stagingrt:7Cqk9t2CipmVPrwp@stagingrt.4cxw6.mongodb.net/';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connecté à MongoDB\n');

    const database = client.db('auth-service');
    const users = database.collection('users');

    // Hasher les mots de passe
    const usersToInsert = [];
    for (const user of demoUsers) {
      const hashedPassword = await hashPassword(user.password);
      usersToInsert.push({
        ...user,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        status: 'active'
      });
    }

    // Supprimer les utilisateurs existants avec ces emails
    await users.deleteMany({
      email: { $in: demoUsers.map(u => u.email) }
    });

    // Insérer les nouveaux utilisateurs
    const result = await users.insertMany(usersToInsert);
    console.log(`✅ ${result.insertedCount} utilisateurs insérés avec succès!\n`);

    // Afficher les emails créés
    usersToInsert.forEach(user => {
      console.log(`   📧 ${user.email} - ${user.role} (${user.subscription.tier})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await client.close();
  }
}

// Exécution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--mongodb')) {
    insertUsersToMongoDB();
  } else {
    createDemoUsers();
  }
}

module.exports = { demoUsers, createDemoUsers, insertUsersToMongoDB };
