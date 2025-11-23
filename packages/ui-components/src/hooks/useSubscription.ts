import { useState, useEffect } from 'react';
import { SubscriptionTier, UserSubscription } from '../types/subscription';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger l'abonnement depuis le localStorage
    if (typeof window !== 'undefined') {
      const storedSubscription = localStorage.getItem('userSubscription');
      if (storedSubscription) {
        setSubscription(JSON.parse(storedSubscription));
      } else {
        // Par défaut, abonnement gratuit
        const defaultSubscription: UserSubscription = {
          tier: 'free',
          startDate: new Date().toISOString(),
          autoRenew: false,
          status: 'active'
        };
        setSubscription(defaultSubscription);
        localStorage.setItem('userSubscription', JSON.stringify(defaultSubscription));
      }
      setLoading(false);
    }
  }, []);

  const updateSubscription = (tier: SubscriptionTier) => {
    const newSubscription: UserSubscription = {
      tier,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
      autoRenew: true,
      status: 'active'
    };

    setSubscription(newSubscription);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userSubscription', JSON.stringify(newSubscription));
    }
  };

  const cancelSubscription = () => {
    if (subscription) {
      const updatedSubscription: UserSubscription = {
        ...subscription,
        autoRenew: false,
        status: 'cancelled'
      };
      setSubscription(updatedSubscription);
      if (typeof window !== 'undefined') {
        localStorage.setItem('userSubscription', JSON.stringify(updatedSubscription));
      }
    }
  };

  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false;

    // Logique pour vérifier si l'utilisateur a accès à une fonctionnalité
    // En fonction de son tier d'abonnement
    const tierLevels = { free: 0, pro: 1, enterprise: 2 };
    const userLevel = tierLevels[subscription.tier];

    // Pour l'instant, on retourne true si l'abonnement est actif
    return subscription.status === 'active';
  };

  return {
    subscription,
    loading,
    updateSubscription,
    cancelSubscription,
    hasFeature
  };
};
