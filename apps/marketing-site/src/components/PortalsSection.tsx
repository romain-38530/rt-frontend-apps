import { ArrowRight, Check, Factory, Truck, MapPin, Building, Ship, Package } from 'lucide-react';

const portals = [
  {
    name: 'Industriel',
    icon: Factory,
    description: 'Gérez vos commandes et optimisez vos flux logistiques',
    color: 'from-blue-500 to-blue-700',
    url: process.env.NEXT_PUBLIC_INDUSTRY_URL || 'https://industry.rttechnologie.com',
    features: ['Gestion des commandes', 'Multi-transporteurs', 'Grilles tarifaires']
  },
  {
    name: 'Transporteur',
    icon: Truck,
    description: 'Pilotez vos missions et optimisez vos tournées',
    color: 'from-green-500 to-green-700',
    url: process.env.NEXT_PUBLIC_TRANSPORTER_URL || 'https://transporter.rttechnologie.com',
    features: ['Planning intelligent', 'App chauffeur', 'Géolocalisation']
  },
  {
    name: 'Destinataire',
    icon: MapPin,
    description: 'Suivez vos livraisons en temps réel',
    color: 'from-purple-500 to-purple-700',
    url: process.env.NEXT_PUBLIC_RECIPIENT_URL || 'https://recipient.rttechnologie.com',
    features: ['Suivi temps réel', 'Notifications', 'Historique']
  },
  {
    name: 'Fournisseur',
    icon: Building,
    description: 'Gérez vos expéditions et commandes clients',
    color: 'from-orange-500 to-orange-700',
    url: process.env.NEXT_PUBLIC_SUPPLIER_URL || 'https://supplier.rttechnologie.com',
    features: ['Gestion stocks', 'Expéditions', 'Intégrations']
  },
  {
    name: 'Transitaire',
    icon: Ship,
    description: 'Orchestrez vos opérations de transit',
    color: 'from-indigo-500 to-indigo-700',
    url: process.env.NEXT_PUBLIC_FORWARDER_URL || 'https://forwarder.rttechnologie.com',
    features: ['Multi-modal', 'Documentation', 'Douane']
  },
  {
    name: 'Logisticien',
    icon: Package,
    description: 'Gérez votre entrepôt et vos clients',
    color: 'from-pink-500 to-pink-700',
    url: process.env.NEXT_PUBLIC_LOGISTICIAN_URL || 'https://logistician.rttechnologie.com',
    features: ['Multi-clients', 'WMS', 'Marketplace']
  },
];

export default function PortalsSection() {
  return (
    <section id="portals" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Accédez à votre portail
          </h2>
          <p className="text-xl text-gray-600">
            Choisissez le portail adapté à votre rôle dans la chaîne logistique
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portals.map((portal, idx) => (
            <a
              key={idx}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-indigo-300 hover:-translate-y-1"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${portal.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <portal.icon className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition">
                {portal.name}
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {portal.description}
              </p>
              <ul className="space-y-2 mb-6">
                {portal.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-center text-sm text-gray-700">
                    <Check className="text-green-500 w-4 h-4 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-2 transition-transform">
                Accéder au portail
                <ArrowRight className="ml-2" size={20} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
