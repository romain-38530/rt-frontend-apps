/**
 * Service de gestion des limites d'abonnement
 * Vérifie les quotas de sous-utilisateurs selon le plan
 */

import mongoose from 'mongoose';
import SubUser from '../models/SubUser';
import User from '../models/User';

export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise' | 'trial';

/**
 * Limites de sous-utilisateurs par plan
 */
export const SUBUSER_LIMITS: Record<SubscriptionPlan, number> = {
  trial: 1,
  starter: 2,
  pro: 10,
  enterprise: -1 // -1 = illimité
};

/**
 * Labels des plans pour affichage
 */
export const PLAN_LABELS: Record<SubscriptionPlan, { fr: string; en: string }> = {
  trial: { fr: 'Essai', en: 'Trial' },
  starter: { fr: 'Starter', en: 'Starter' },
  pro: { fr: 'Pro', en: 'Pro' },
  enterprise: { fr: 'Enterprise', en: 'Enterprise' }
};

export interface SubscriptionLimitResult {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  plan: SubscriptionPlan;
  remaining: number;
  message?: string;
}

/**
 * Récupère le plan d'abonnement d'un utilisateur
 * TODO: Intégrer avec le vrai système de subscription
 */
export async function getUserPlan(userId: mongoose.Types.ObjectId | string): Promise<SubscriptionPlan> {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return 'trial';
    }

    // TODO: Récupérer le vrai plan depuis la collection Subscription
    // Pour l'instant, on utilise un mapping basé sur les rôles
    if (user.roles?.includes('super_admin') || user.roles?.includes('admin')) {
      return 'enterprise';
    }

    if (user.roles?.includes('manager')) {
      return 'pro';
    }

    // Par défaut, starter
    return 'starter';
  } catch (error) {
    return 'starter';
  }
}

/**
 * Vérifie si un utilisateur peut créer un nouveau sous-utilisateur
 */
export async function canCreateSubUser(parentUserId: mongoose.Types.ObjectId | string): Promise<SubscriptionLimitResult> {
  const plan = await getUserPlan(parentUserId);
  const maxAllowed = SUBUSER_LIMITS[plan];

  // Enterprise = illimité
  if (maxAllowed === -1) {
    const currentCount = await SubUser.countDocuments({
      parentUserId,
      status: { $ne: 'inactive' }
    });

    return {
      allowed: true,
      currentCount,
      maxAllowed: -1,
      plan,
      remaining: -1
    };
  }

  const currentCount = await SubUser.countDocuments({
    parentUserId,
    status: { $ne: 'inactive' }
  });

  const remaining = maxAllowed - currentCount;
  const allowed = currentCount < maxAllowed;

  return {
    allowed,
    currentCount,
    maxAllowed,
    plan,
    remaining: Math.max(0, remaining),
    message: allowed
      ? undefined
      : `Limite de ${maxAllowed} membres atteinte pour le plan ${PLAN_LABELS[plan].fr}. Passez au plan supérieur pour ajouter plus de membres.`
  };
}

/**
 * Récupère les informations de limite pour affichage
 */
export async function getSubUserLimitInfo(parentUserId: mongoose.Types.ObjectId | string): Promise<SubscriptionLimitResult> {
  const plan = await getUserPlan(parentUserId);
  const maxAllowed = SUBUSER_LIMITS[plan];

  const currentCount = await SubUser.countDocuments({
    parentUserId,
    status: { $ne: 'inactive' }
  });

  if (maxAllowed === -1) {
    return {
      allowed: true,
      currentCount,
      maxAllowed: -1,
      plan,
      remaining: -1
    };
  }

  return {
    allowed: currentCount < maxAllowed,
    currentCount,
    maxAllowed,
    plan,
    remaining: Math.max(0, maxAllowed - currentCount)
  };
}

/**
 * Vérifie si l'utilisateur a accès à une fonctionnalité premium
 */
export async function hasPremiumAccess(userId: mongoose.Types.ObjectId | string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === 'pro' || plan === 'enterprise';
}

/**
 * Message d'upgrade pour les limites atteintes
 */
export function getUpgradeMessage(plan: SubscriptionPlan, lang: 'fr' | 'en' = 'fr'): string {
  const nextPlan = plan === 'trial' || plan === 'starter' ? 'Pro' : 'Enterprise';

  const messages = {
    fr: `Passez au plan ${nextPlan} pour ajouter plus de membres à votre équipe.`,
    en: `Upgrade to ${nextPlan} plan to add more team members.`
  };

  return messages[lang];
}
