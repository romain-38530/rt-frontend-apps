import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Carrier from './models/Carrier';
import FreightRequest from './models/FreightRequest';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bourse-maritime';

const sampleCarriers = [
  {
    companyId: 'carrier-001',
    company: {
      name: 'Mediterranean Shipping Company (MSC)',
      registrationNumber: 'MSC-CH-2024',
      country: 'Switzerland',
      address: 'Chemin Rieu 12-14, 1208 Geneva, Switzerland',
      email: 'contact@msc.com',
      phone: '+41 22 703 88 88',
      website: 'https://www.msc.com'
    },
    fleet: {
      vesselCount: 45,
      totalCapacity: 850000,
      vesselTypes: ['container ship', 'feeder vessel'],
      vessels: [
        {
          name: 'MSC Oscar',
          imo: 'IMO9676000',
          type: 'container ship',
          flag: 'Panama',
          capacity: 19224,
          yearBuilt: 2015,
          status: 'active'
        },
        {
          name: 'MSC Maya',
          imo: 'IMO9676012',
          type: 'container ship',
          flag: 'Panama',
          capacity: 19224,
          yearBuilt: 2015,
          status: 'active'
        }
      ]
    },
    certifications: [
      {
        type: 'ISO 9001',
        number: 'ISO9001-2024-MSC',
        issuedBy: 'DNV GL',
        issuedDate: new Date('2024-01-15'),
        validUntil: new Date('2027-01-15'),
        status: 'valid'
      },
      {
        type: 'ISO 14001',
        number: 'ISO14001-2024-MSC',
        issuedBy: 'DNV GL',
        issuedDate: new Date('2024-01-15'),
        validUntil: new Date('2027-01-15'),
        status: 'valid'
      }
    ],
    routes: [
      {
        origin: 'Rotterdam',
        destination: 'Singapore',
        frequency: 'weekly',
        avgTransitTime: 28
      },
      {
        origin: 'Hamburg',
        destination: 'Shanghai',
        frequency: 'weekly',
        avgTransitTime: 32
      },
      {
        origin: 'Le Havre',
        destination: 'New York',
        frequency: 'bi-weekly',
        avgTransitTime: 12
      }
    ],
    ratings: {
      overall: 4.7,
      reliability: 4.8,
      communication: 4.6,
      pricing: 4.5,
      totalReviews: 234
    },
    verified: true,
    verifiedAt: new Date('2024-01-10'),
    verifiedBy: 'admin@symphoni-a.com',
    stats: {
      completedJobs: 456,
      totalVolume: 12500000,
      onTimeDelivery: 96.5,
      cancelledJobs: 8,
      disputedJobs: 2
    },
    preferences: {
      cargoTypes: ['container', 'breakbulk'],
      regions: ['Europe', 'Asia', 'North America'],
      minContractValue: 50000,
      paymentTerms: ['30 days', '60 days', 'LC']
    }
  },
  {
    companyId: 'carrier-002',
    company: {
      name: 'Maersk Line',
      registrationNumber: 'MAERSK-DK-2024',
      country: 'Denmark',
      address: 'Esplanaden 50, 1098 Copenhagen, Denmark',
      email: 'contact@maersk.com',
      phone: '+45 33 63 33 63',
      website: 'https://www.maersk.com'
    },
    fleet: {
      vesselCount: 52,
      totalCapacity: 920000,
      vesselTypes: ['container ship', 'tanker'],
      vessels: [
        {
          name: 'Maersk Mc-Kinney Møller',
          imo: 'IMO9619907',
          type: 'container ship',
          flag: 'Denmark',
          capacity: 18270,
          yearBuilt: 2013,
          status: 'active'
        }
      ]
    },
    certifications: [
      {
        type: 'ISO 9001',
        number: 'ISO9001-2024-MAERSK',
        issuedBy: 'Lloyd\'s Register',
        issuedDate: new Date('2024-02-01'),
        validUntil: new Date('2027-02-01'),
        status: 'valid'
      }
    ],
    routes: [
      {
        origin: 'Singapore',
        destination: 'Los Angeles',
        frequency: 'weekly',
        avgTransitTime: 18
      },
      {
        origin: 'Rotterdam',
        destination: 'Dubai',
        frequency: 'weekly',
        avgTransitTime: 16
      }
    ],
    ratings: {
      overall: 4.8,
      reliability: 4.9,
      communication: 4.7,
      pricing: 4.6,
      totalReviews: 312
    },
    verified: true,
    verifiedAt: new Date('2024-01-05'),
    verifiedBy: 'admin@symphoni-a.com',
    stats: {
      completedJobs: 578,
      totalVolume: 15800000,
      onTimeDelivery: 97.2,
      cancelledJobs: 5,
      disputedJobs: 1
    },
    preferences: {
      cargoTypes: ['container', 'tanker'],
      regions: ['Europe', 'Asia', 'North America', 'Middle East'],
      minContractValue: 75000,
      paymentTerms: ['30 days', 'LC']
    }
  },
  {
    companyId: 'carrier-003',
    company: {
      name: 'CMA CGM',
      registrationNumber: 'CMACGM-FR-2024',
      country: 'France',
      address: '4 Quai d\'Arenc, 13002 Marseille, France',
      email: 'contact@cma-cgm.com',
      phone: '+33 4 88 91 90 00',
      website: 'https://www.cma-cgm.com'
    },
    fleet: {
      vesselCount: 38,
      totalCapacity: 680000,
      vesselTypes: ['container ship', 'roro vessel'],
      vessels: [
        {
          name: 'CMA CGM Antoine De Saint Exupery',
          imo: 'IMO9454436',
          type: 'container ship',
          flag: 'France',
          capacity: 20776,
          yearBuilt: 2018,
          status: 'active'
        }
      ]
    },
    certifications: [
      {
        type: 'ISO 9001',
        number: 'ISO9001-2024-CMACGM',
        issuedBy: 'Bureau Veritas',
        issuedDate: new Date('2024-01-20'),
        validUntil: new Date('2027-01-20'),
        status: 'valid'
      }
    ],
    routes: [
      {
        origin: 'Le Havre',
        destination: 'Santos',
        frequency: 'bi-weekly',
        avgTransitTime: 21
      },
      {
        origin: 'Marseille',
        destination: 'Alexandria',
        frequency: 'weekly',
        avgTransitTime: 8
      }
    ],
    ratings: {
      overall: 4.5,
      reliability: 4.6,
      communication: 4.4,
      pricing: 4.5,
      totalReviews: 189
    },
    verified: true,
    verifiedAt: new Date('2024-01-15'),
    verifiedBy: 'admin@symphoni-a.com',
    stats: {
      completedJobs: 342,
      totalVolume: 9200000,
      onTimeDelivery: 94.8,
      cancelledJobs: 12,
      disputedJobs: 3
    },
    preferences: {
      cargoTypes: ['container', 'roro', 'breakbulk'],
      regions: ['Europe', 'Africa', 'South America'],
      minContractValue: 40000,
      paymentTerms: ['30 days', '60 days']
    }
  }
];

const sampleFreightRequests = [
  {
    reference: 'BM-000001',
    shipper: {
      companyId: 'shipper-001',
      companyName: 'Global Trade Corp',
      contactName: 'John Smith',
      contactEmail: 'john.smith@globaltrade.com',
      contactPhone: '+1 555 0100'
    },
    origin: {
      port: 'Rotterdam',
      country: 'Netherlands',
      address: 'Port of Rotterdam, Wilhelminakade 909, 3072 AP Rotterdam',
      coordinates: {
        latitude: 51.9244,
        longitude: 4.4777
      }
    },
    destination: {
      port: 'Singapore',
      country: 'Singapore',
      address: 'Port of Singapore, 460 Alexandra Road, Singapore 119963',
      coordinates: {
        latitude: 1.2644,
        longitude: 103.8228
      }
    },
    cargo: {
      type: 'container',
      description: 'Electronics and consumer goods',
      weight: 24000,
      volume: 68,
      containerType: '40ft HC',
      containerCount: 3,
      hazmat: false
    },
    schedule: {
      loadingDate: new Date('2024-12-15'),
      deliveryDeadline: new Date('2025-01-20'),
      flexibility: 'Moderate - Can adjust by +/- 3 days'
    },
    requirements: {
      incoterm: 'FOB',
      insurance: true,
      customsClearance: false,
      documentation: ['Bill of Lading', 'Commercial Invoice', 'Packing List']
    },
    pricing: {
      targetPrice: 18000,
      currency: 'USD',
      paymentTerms: '30 days from BL date'
    },
    status: 'published',
    bidsCount: 0,
    publishedAt: new Date(),
    closingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  },
  {
    reference: 'BM-000002',
    shipper: {
      companyId: 'shipper-002',
      companyName: 'Euro Imports Ltd',
      contactName: 'Marie Dubois',
      contactEmail: 'marie.dubois@euroimports.com',
      contactPhone: '+33 1 42 86 82 00'
    },
    origin: {
      port: 'Shanghai',
      country: 'China',
      address: 'Shanghai Port, Pudong New Area, Shanghai',
      coordinates: {
        latitude: 31.2304,
        longitude: 121.4737
      }
    },
    destination: {
      port: 'Hamburg',
      country: 'Germany',
      address: 'Port of Hamburg, Neuer Wandrahm 4, 20457 Hamburg',
      coordinates: {
        latitude: 53.5511,
        longitude: 9.9937
      }
    },
    cargo: {
      type: 'container',
      description: 'Automotive parts and machinery',
      weight: 48000,
      volume: 135,
      containerType: '20ft',
      containerCount: 6,
      hazmat: false
    },
    schedule: {
      loadingDate: new Date('2024-12-20'),
      deliveryDeadline: new Date('2025-02-05'),
      flexibility: 'Strict - No flexibility'
    },
    requirements: {
      incoterm: 'CIF',
      insurance: true,
      customsClearance: true,
      documentation: ['Bill of Lading', 'Commercial Invoice', 'Certificate of Origin', 'Packing List']
    },
    pricing: {
      targetPrice: 32000,
      currency: 'EUR',
      paymentTerms: 'LC at sight'
    },
    status: 'published',
    bidsCount: 0,
    publishedAt: new Date(),
    closingDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      Carrier.deleteMany({}),
      FreightRequest.deleteMany({})
    ]);

    // Insert carriers
    console.log('Seeding carriers...');
    const carriers = await Carrier.insertMany(sampleCarriers);
    console.log(`✓ Inserted ${carriers.length} carriers`);

    // Insert freight requests
    console.log('Seeding freight requests...');
    const requests = await FreightRequest.insertMany(sampleFreightRequests);
    console.log(`✓ Inserted ${requests.length} freight requests`);

    console.log('\n=== Seed Data Summary ===');
    console.log(`Carriers: ${carriers.length}`);
    console.log(`Freight Requests: ${requests.length}`);
    console.log('========================\n');

    console.log('Sample Carriers:');
    carriers.forEach(c => {
      console.log(`  - ${c.company.name} (${c.company.country}) - ${c.fleet.vesselCount} vessels - Rating: ${c.ratings.overall}/5`);
    });

    console.log('\nSample Freight Requests:');
    requests.forEach(r => {
      console.log(`  - ${r.reference}: ${r.origin.port} → ${r.destination.port} (${r.cargo.type})`);
    });

    console.log('\nDatabase seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
