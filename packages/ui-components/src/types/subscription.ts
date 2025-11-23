export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    users?: number;
    storage?: string;
    api_calls?: number;
    support?: string;
  };
  highlighted?: boolean;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Accès limité aux fonctionnalités de base',
      'Jusqu\'à 10 commandes par mois',
      'Support par email',
      'Tableaux de bord basiques',
      '1 utilisateur'
    ],
    limits: {
      users: 1,
      storage: '1 GB',
      api_calls: 1000,
      support: 'email'
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Toutes les fonctionnalités de base',
      'Commandes illimitées',
      'Support prioritaire',
      'Tableaux de bord avancés',
      'Jusqu\'à 10 utilisateurs',
      'Intégrations API',
      'Rapports personnalisés',
      'Notifications en temps réel'
    ],
    limits: {
      users: 10,
      storage: '50 GB',
      api_calls: 100000,
      support: 'priority'
    },
    highlighted: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Entreprise',
    price: 199,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Toutes les fonctionnalités Pro',
      'Utilisateurs illimités',
      'Support dédié 24/7',
      'Gestionnaire de compte dédié',
      'SLA garanti',
      'Personnalisation complète',
      'Formation sur site',
      'Intégration sur mesure',
      'Stockage illimité',
      'API calls illimitées'
    ],
    limits: {
      storage: 'Illimité',
      support: 'dedicated'
    }
  }
};
