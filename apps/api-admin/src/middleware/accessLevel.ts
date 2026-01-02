/**
 * Middleware de contrôle d'accès par niveau
 * Gère les niveaux: admin, editor, reader
 */

import { Request, Response, NextFunction } from 'express';
import { AccessLevel } from '../models/SubUser';

export interface AccessControlRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles?: string[];
    accessLevel?: AccessLevel;
    parentUserId?: string;
    isSubUser?: boolean;
  };
}

/**
 * Hiérarchie des niveaux d'accès
 * admin > editor > reader
 */
const ACCESS_HIERARCHY: Record<AccessLevel, number> = {
  admin: 3,
  editor: 2,
  reader: 1
};

/**
 * Vérifie si l'utilisateur a le niveau d'accès requis
 * @param requiredLevel - Niveau minimum requis
 */
export function requireAccess(requiredLevel: AccessLevel) {
  return (req: AccessControlRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      });
    }

    // Si c'est un utilisateur principal (pas un sous-utilisateur), il a tous les droits
    if (!user.isSubUser) {
      return next();
    }

    // Vérifier le niveau d'accès du sous-utilisateur
    const userLevel = user.accessLevel || 'reader';
    const userHierarchy = ACCESS_HIERARCHY[userLevel] || 0;
    const requiredHierarchy = ACCESS_HIERARCHY[requiredLevel] || 0;

    if (userHierarchy < requiredHierarchy) {
      return res.status(403).json({
        success: false,
        error: 'Niveau d\'accès insuffisant',
        required: requiredLevel,
        current: userLevel
      });
    }

    next();
  };
}

/**
 * Middleware pour bloquer les lecteurs (read-only)
 * Autorise admin et editor
 */
export const requireEditor = requireAccess('editor');

/**
 * Middleware pour autoriser uniquement les admins
 */
export const requireAdmin = requireAccess('admin');

/**
 * Middleware pour vérifier si l'utilisateur peut modifier des sous-utilisateurs
 * Seuls les utilisateurs principaux et les sous-utilisateurs admin peuvent le faire
 */
export function canManageSubUsers(req: AccessControlRequest, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Non authentifié'
    });
  }

  // Utilisateur principal peut toujours gérer
  if (!user.isSubUser) {
    return next();
  }

  // Sous-utilisateur doit être admin
  if (user.accessLevel !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Seuls les administrateurs peuvent gérer les membres de l\'équipe'
    });
  }

  next();
}

/**
 * Middleware pour vérifier si l'utilisateur peut supprimer
 * Seuls les utilisateurs principaux et les sous-utilisateurs admin peuvent supprimer
 */
export function canDelete(req: AccessControlRequest, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Non authentifié'
    });
  }

  // Utilisateur principal peut toujours supprimer
  if (!user.isSubUser) {
    return next();
  }

  // Sous-utilisateur doit être admin pour supprimer
  if (user.accessLevel !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Niveau d\'accès insuffisant pour supprimer'
    });
  }

  next();
}

/**
 * Helper pour vérifier le niveau d'accès dans le code
 */
export function hasAccess(userLevel: AccessLevel | undefined, requiredLevel: AccessLevel): boolean {
  const userHierarchy = ACCESS_HIERARCHY[userLevel || 'reader'] || 0;
  const requiredHierarchy = ACCESS_HIERARCHY[requiredLevel] || 0;
  return userHierarchy >= requiredHierarchy;
}

/**
 * Labels pour affichage
 */
export const ACCESS_LEVEL_LABELS: Record<AccessLevel, { fr: string; en: string }> = {
  admin: { fr: 'Administrateur', en: 'Administrator' },
  editor: { fr: 'Éditeur', en: 'Editor' },
  reader: { fr: 'Lecteur', en: 'Reader' }
};

/**
 * Descriptions des niveaux
 */
export const ACCESS_LEVEL_DESCRIPTIONS: Record<AccessLevel, { fr: string; en: string }> = {
  admin: {
    fr: 'Accès complet : lecture, création, modification, suppression et gestion des membres',
    en: 'Full access: read, create, edit, delete and manage team members'
  },
  editor: {
    fr: 'Lecture, création et modification (pas de suppression ni gestion des membres)',
    en: 'Read, create and edit (no delete or team management)'
  },
  reader: {
    fr: 'Consultation uniquement (lecture seule)',
    en: 'View only (read-only)'
  }
};
