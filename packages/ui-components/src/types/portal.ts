export type PortalType = 'supplier' | 'recipient' | 'transporter' | 'logistician' | 'forwarder' | 'industry';

export interface PortalConfig {
  id: PortalType;
  name: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  url: string;
  features: string[];
}

export const PORTALS: Record<PortalType, PortalConfig> = {
  supplier: {
    id: 'supplier',
    name: 'Fournisseur',
    title: 'Supplier Portal',
    description: 'Gestion de vos approvisionnements et commandes',
    icon: '🏪',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    url: '/supplier',
    features: [
      'Gestion des commandes',
      'Suivi des livraisons',
      'Catalogue produits',
      'Facturation automatique'
    ]
  },
  recipient: {
    id: 'recipient',
    name: 'Destinataire',
    title: 'Recipient Portal',
    description: 'Suivi et réception de vos livraisons',
    icon: '📦',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    url: '/recipient',
    features: [
      'Suivi des colis',
      'Notifications de livraison',
      'Historique des réceptions',
      'Gestion des retours'
    ]
  },
  transporter: {
    id: 'transporter',
    name: 'Transporteur',
    title: 'Transporter Portal',
    description: 'Gestion des transports et des livraisons',
    icon: '🚚',
    gradient: 'linear-gradient(135deg, #22c1c3 0%, #fdbb2d 100%)',
    url: '/transporter',
    features: [
      'Planning des tournées',
      'Optimisation des routes',
      'Gestion de la flotte',
      'e-CMR électronique'
    ]
  },
  logistician: {
    id: 'logistician',
    name: 'Logisticien',
    title: 'Logistician Portal',
    description: 'Optimisation logistique et gestion des flux',
    icon: '📊',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    url: '/logistician',
    features: [
      'Tableau de bord analytique',
      'Gestion des stocks',
      'Optimisation des flux',
      'Rapports personnalisés'
    ]
  },
  forwarder: {
    id: 'forwarder',
    name: 'Transitaire',
    title: 'Forwarder Portal',
    description: 'Coordination des expéditions internationales',
    icon: '🌍',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    url: '/forwarder',
    features: [
      'Gestion multimodale',
      'Documentation douanière',
      'Tracking international',
      'Gestion des prestataires'
    ]
  },
  industry: {
    id: 'industry',
    name: 'Industrie',
    title: 'Industry Portal',
    description: 'Vigilance, planification, suivi et Affret.IA',
    icon: '🏭',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    url: '/industry',
    features: [
      'Vigilance et alertes',
      'Planification avancée',
      'e-CMR intégré',
      'Intelligence artificielle Affret.IA'
    ]
  }
};
