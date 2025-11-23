export const PORTAL_CONFIG = {
  name: 'Recipient Portal',
  title: '📦 Recipient Portal',
  gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  description: 'Suivi et réception de vos livraisons',
  features: [
    {
      icon: '📍',
      title: 'Suivi en temps réel',
      desc: 'Suivez vos colis en direct',
      locked: false
    },
    {
      icon: '🔔',
      title: 'Notifications',
      desc: 'Alertes de livraison instantanées',
      locked: false
    },
    {
      icon: '📜',
      title: 'Historique complet',
      desc: 'Accédez à tout votre historique',
      locked: (tier: string) => tier === 'free'
    },
    {
      icon: '🔄',
      title: 'Gestion des retours',
      desc: 'Gérez facilement vos retours',
      locked: (tier: string) => tier !== 'enterprise'
    }
  ]
};
