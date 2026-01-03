import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Supplier from '../models/Supplier';
import SupplierOrder from '../models/SupplierOrder';
import LoadingSlot from '../models/LoadingSlot';
import SupplierSignature from '../models/SupplierSignature';
import SupplierChat from '../models/SupplierChat';

dotenv.config();

/**
 * Script de seed pour peupler la base de données avec des données de test
 */
async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-supplier'
    );
    console.log('Connected to MongoDB');

    // Nettoyer les collections existantes
    console.log('Cleaning existing data...');
    await Supplier.deleteMany({});
    await SupplierOrder.deleteMany({});
    await LoadingSlot.deleteMany({});
    await SupplierSignature.deleteMany({});
    await SupplierChat.deleteMany({});

    // Créer des fournisseurs de test
    console.log('Creating test suppliers...');

    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 3);

    const supplier1 = await Supplier.create({
      industrialId: 'IND-2024-0001',
      companyName: 'Fournisseur Acier Premium',
      siret: '12345678901234',
      address: {
        street: '123 Avenue de la Métallurgie',
        city: 'Lyon',
        postalCode: '69001',
        country: 'France'
      },
      contacts: [
        {
          name: 'Jean Dupont',
          role: 'logistique',
          email: 'j.dupont@acier-premium.fr',
          phone: '0123456789',
          isPrimary: true
        },
        {
          name: 'Marie Martin',
          role: 'production',
          email: 'm.martin@acier-premium.fr',
          phone: '0123456790',
          isPrimary: false
        }
      ],
      status: 'active',
      activatedAt: new Date(),
      settings: {
        notifications: true,
        language: 'fr'
      },
      subscription: {
        tier: 'pro',
        validUntil
      }
    });

    const supplier2 = await Supplier.create({
      industrialId: 'IND-2024-0001',
      companyName: 'Composants Électroniques SA',
      siret: '98765432109876',
      address: {
        street: '456 Rue de la Technologie',
        city: 'Toulouse',
        postalCode: '31000',
        country: 'France'
      },
      contacts: [
        {
          name: 'Pierre Durand',
          role: 'logistique',
          email: 'p.durand@composants-elec.fr',
          phone: '0234567891',
          isPrimary: true
        }
      ],
      status: 'active',
      activatedAt: new Date(),
      settings: {
        notifications: true,
        language: 'fr'
      },
      subscription: {
        tier: 'free',
        validUntil
      }
    });

    const supplier3 = await Supplier.create({
      industrialId: 'IND-2024-0002',
      companyName: 'Plastiques Industriels SARL',
      siret: '11223344556677',
      address: {
        street: '789 Boulevard des Polymères',
        city: 'Marseille',
        postalCode: '13001',
        country: 'France'
      },
      contacts: [
        {
          name: 'Sophie Bernard',
          role: 'planning',
          email: 's.bernard@plastiques-ind.fr',
          phone: '0345678912',
          isPrimary: true
        }
      ],
      status: 'invited',
      invitationToken: 'test-token-123',
      settings: {
        notifications: true,
        language: 'fr'
      },
      subscription: {
        tier: 'free',
        validUntil
      }
    });

    console.log(`Created ${3} suppliers`);

    // Créer des commandes de test
    console.log('Creating test orders...');

    const order1 = await SupplierOrder.create({
      orderId: 'ORD-2024-0001',
      supplierId: supplier1.supplierId,
      industrialId: 'IND-2024-0001',
      status: 'to_prepare',
      goods: {
        description: 'Tôles d\'acier galvanisé 2mm',
        weight: 2500,
        pallets: 5,
        volume: 12.5,
        specialInstructions: 'Manutention avec soin, palettes fragiles'
      },
      transportInfo: {
        carrierId: 'TRANS-001',
        vehicleType: 'Semi-remorque',
        driverName: 'Michel Legrand',
        driverPhone: '0612345678',
        licensePlate: 'AB-123-CD'
      },
      timeline: [
        {
          status: 'to_prepare',
          timestamp: new Date(),
          actor: 'system',
          notes: 'Commande créée'
        }
      ]
    });

    const order2 = await SupplierOrder.create({
      orderId: 'ORD-2024-0002',
      supplierId: supplier2.supplierId,
      industrialId: 'IND-2024-0001',
      status: 'ready',
      goods: {
        description: 'Circuits imprimés PCB',
        weight: 150,
        pallets: 2,
        volume: 1.2
      },
      transportInfo: {
        carrierId: 'TRANS-002',
        vehicleType: 'Fourgon',
        driverName: 'Alain Petit',
        driverPhone: '0623456789'
      },
      timeline: [
        {
          status: 'to_prepare',
          timestamp: new Date(Date.now() - 86400000),
          actor: 'system',
          notes: 'Commande créée'
        },
        {
          status: 'ready',
          timestamp: new Date(),
          actor: supplier2.supplierId,
          notes: 'Marchandise prête pour chargement'
        }
      ]
    });

    const order3 = await SupplierOrder.create({
      orderId: 'ORD-2024-0003',
      supplierId: supplier1.supplierId,
      industrialId: 'IND-2024-0001',
      status: 'in_progress',
      loadingSlot: {
        date: new Date(Date.now() + 86400000),
        startTime: '09:00',
        endTime: '11:00',
        dockId: 'DOCK-A1'
      },
      goods: {
        description: 'Profilés aluminium',
        weight: 1800,
        pallets: 4,
        volume: 8.5
      },
      timeline: [
        {
          status: 'to_prepare',
          timestamp: new Date(Date.now() - 172800000),
          actor: 'system',
          notes: 'Commande créée'
        },
        {
          status: 'ready',
          timestamp: new Date(Date.now() - 86400000),
          actor: supplier1.supplierId,
          notes: 'Marchandise prête'
        },
        {
          status: 'in_progress',
          timestamp: new Date(),
          actor: supplier1.supplierId,
          notes: 'Chargement en cours'
        }
      ]
    });

    console.log(`Created ${3} orders`);

    // Créer des créneaux de chargement
    console.log('Creating test loading slots...');

    await LoadingSlot.create({
      supplierId: supplier1.supplierId,
      orderId: order1.orderId,
      proposedBy: 'industrial',
      date: new Date(Date.now() + 172800000), // Dans 2 jours
      startTime: '08:00',
      endTime: '10:00',
      dockId: 'DOCK-B2',
      status: 'proposed'
    });

    await LoadingSlot.create({
      supplierId: supplier2.supplierId,
      orderId: order2.orderId,
      proposedBy: 'system',
      date: new Date(Date.now() + 86400000), // Demain
      startTime: '14:00',
      endTime: '16:00',
      dockId: 'DOCK-C1',
      status: 'accepted',
      response: {
        action: 'accept',
        respondedAt: new Date(),
        respondedBy: supplier2.supplierId
      }
    });

    console.log(`Created ${2} loading slots`);

    // Créer une signature de test
    console.log('Creating test signature...');

    await SupplierSignature.create({
      orderId: order3.orderId,
      supplierId: supplier1.supplierId,
      type: 'loading',
      method: 'smartphone',
      signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
      signerName: 'Jean Dupont',
      signerRole: 'Chef d\'équipe logistique',
      location: {
        lat: 45.7640,
        lng: 4.8357
      },
      timestamp: new Date(),
      deviceInfo: 'iPhone 13, iOS 16.0',
      verified: true
    });

    console.log('Created 1 signature');

    // Créer une conversation de test
    console.log('Creating test chat...');

    await SupplierChat.create({
      supplierId: supplier1.supplierId,
      participants: [
        {
          id: supplier1.supplierId,
          type: 'supplier',
          name: supplier1.companyName
        },
        {
          id: 'IND-2024-0001',
          type: 'industrial',
          name: 'Industriel Client SA'
        },
        {
          id: 'TRANS-001',
          type: 'transporter',
          name: 'Transport Express'
        }
      ],
      orderId: order1.orderId,
      messages: [
        {
          senderId: 'IND-2024-0001',
          senderType: 'industrial',
          content: 'Bonjour, pouvez-vous confirmer la disponibilité pour le chargement demain?',
          timestamp: new Date(Date.now() - 3600000),
          read: true
        },
        {
          senderId: supplier1.supplierId,
          senderType: 'supplier',
          content: 'Bonjour, oui la marchandise sera prête. Le chargement peut avoir lieu à partir de 8h.',
          timestamp: new Date(Date.now() - 1800000),
          read: true
        },
        {
          senderId: 'TRANS-001',
          senderType: 'transporter',
          content: 'Parfait, j\'arriverai vers 9h00. Merci!',
          timestamp: new Date(Date.now() - 900000),
          read: false
        }
      ],
      status: 'active'
    });

    console.log('Created 1 chat');

    console.log('\n=== Seed completed successfully! ===\n');
    console.log('Summary:');
    console.log(`- Suppliers: ${await Supplier.countDocuments()}`);
    console.log(`- Orders: ${await SupplierOrder.countDocuments()}`);
    console.log(`- Loading Slots: ${await LoadingSlot.countDocuments()}`);
    console.log(`- Signatures: ${await SupplierSignature.countDocuments()}`);
    console.log(`- Chats: ${await SupplierChat.countDocuments()}`);
    console.log('\nTest accounts:');
    console.log(`1. ${supplier1.companyName} (${supplier1.supplierId}) - Active`);
    console.log(`2. ${supplier2.companyName} (${supplier2.supplierId}) - Active`);
    console.log(`3. ${supplier3.companyName} (${supplier3.supplierId}) - Invited (token: test-token-123)`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Exécuter le seed
seed();
