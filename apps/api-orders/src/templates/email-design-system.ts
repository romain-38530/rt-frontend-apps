/**
 * SYMPHONI.A Email Design System
 * Design professionnel et ergonomique pour tous les emails
 */

// Couleurs de la charte graphique SYMPHONI.A
export const COLORS = {
  // Couleurs principales
  primary: '#6366f1',        // Indigo - couleur principale SYMPHONI.A
  primaryDark: '#4f46e5',    // Indigo fonce
  primaryLight: '#818cf8',   // Indigo clair

  // Couleurs d'accent
  accent: '#8b5cf6',         // Violet
  accentDark: '#7c3aed',

  // Couleurs de statut
  success: '#10b981',        // Vert emeraude
  successDark: '#059669',
  successLight: '#d1fae5',
  successBorder: '#a7f3d0',

  warning: '#f59e0b',        // Ambre
  warningDark: '#d97706',
  warningLight: '#fef3c7',
  warningBorder: '#fcd34d',

  error: '#ef4444',          // Rouge
  errorDark: '#dc2626',
  errorLight: '#fee2e2',
  errorBorder: '#fecaca',

  info: '#3b82f6',           // Bleu
  infoDark: '#2563eb',
  infoLight: '#dbeafe',
  infoBorder: '#93c5fd',

  // Neutres
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Fond des emails
  background: '#f8fafc',
  cardBackground: '#ffffff',
  footerBackground: '#f1f5f9'
};

// Configuration des liens
export const LINKS = {
  portalUrl: process.env.PORTAL_URL || 'https://portail.symphonia-controltower.com',
  webAppUrl: process.env.WEB_APP_URL || 'https://app.symphonia-controltower.com',
  supportEmail: 'support@symphonia-controltower.com',
  replyEmail: process.env.SES_REPLY_TO || 'reply@inbound.symphonia-controltower.com',
  logoUrl: 'https://symphonia-controltower.com/logo-email.png',
  unsubscribeUrl: 'https://portail.symphonia-controltower.com/preferences'
};

// Types de templates
export type EmailTemplateType =
  | 'notification'      // Notifications generales
  | 'action_required'   // Necessite une action
  | 'alert'            // Alertes/urgences
  | 'success'          // Confirmations positives
  | 'reminder'         // Rappels
  | 'invoice'          // Facturation
  | 'invitation';      // Invitations

// Interface pour les parametres du template
export interface EmailTemplateParams {
  type: EmailTemplateType;
  title: string;
  subtitle?: string;
  preheader?: string;  // Texte visible dans l'apercu email
  recipientName?: string;
  content: string;     // HTML du contenu principal
  ctaButton?: {
    text: string;
    url: string;
    color?: string;
  };
  secondaryButton?: {
    text: string;
    url: string;
  };
  infoBox?: {
    icon?: string;
    title: string;
    content: string;
    color?: 'info' | 'warning' | 'success' | 'error';
  };
  footer?: {
    reference?: string;
    additionalInfo?: string;
  };
  showUnsubscribe?: boolean;
}

// Obtenir le gradient selon le type
function getHeaderGradient(type: EmailTemplateType): string {
  switch (type) {
    case 'success':
      return `linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%)`;
    case 'alert':
      return `linear-gradient(135deg, ${COLORS.error} 0%, ${COLORS.errorDark} 100%)`;
    case 'reminder':
    case 'action_required':
      return `linear-gradient(135deg, ${COLORS.warning} 0%, ${COLORS.warningDark} 100%)`;
    case 'invoice':
      return `linear-gradient(135deg, ${COLORS.info} 0%, ${COLORS.infoDark} 100%)`;
    case 'invitation':
      return `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`;
    default:
      return `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`;
  }
}

// Obtenir l'icone selon le type
function getHeaderIcon(type: EmailTemplateType): string {
  switch (type) {
    case 'success': return '<span style="font-size: 28px; margin-right: 12px;">✅</span>';
    case 'alert': return '<span style="font-size: 28px; margin-right: 12px;">🚨</span>';
    case 'reminder': return '<span style="font-size: 28px; margin-right: 12px;">🔔</span>';
    case 'action_required': return '<span style="font-size: 28px; margin-right: 12px;">⚡</span>';
    case 'invoice': return '<span style="font-size: 28px; margin-right: 12px;">📄</span>';
    case 'invitation': return '<span style="font-size: 28px; margin-right: 12px;">✉️</span>';
    default: return '<span style="font-size: 28px; margin-right: 12px;">📬</span>';
  }
}

// Couleur du bouton selon le type
function getButtonColor(type: EmailTemplateType): string {
  switch (type) {
    case 'success': return COLORS.success;
    case 'alert': return COLORS.error;
    case 'reminder':
    case 'action_required': return COLORS.warning;
    case 'invoice': return COLORS.info;
    default: return COLORS.primary;
  }
}

// Couleur de l'info box
function getInfoBoxColors(color: 'info' | 'warning' | 'success' | 'error'): { bg: string; border: string; accent: string } {
  switch (color) {
    case 'success': return { bg: COLORS.successLight, border: COLORS.successBorder, accent: COLORS.success };
    case 'warning': return { bg: COLORS.warningLight, border: COLORS.warningBorder, accent: COLORS.warning };
    case 'error': return { bg: COLORS.errorLight, border: COLORS.errorBorder, accent: COLORS.error };
    default: return { bg: COLORS.infoLight, border: COLORS.infoBorder, accent: COLORS.info };
  }
}

/**
 * Genere le template HTML complet d'un email
 */
export function generateEmailTemplate(params: EmailTemplateParams): string {
  const headerGradient = getHeaderGradient(params.type);
  const headerIcon = getHeaderIcon(params.type);
  const buttonColor = params.ctaButton?.color || getButtonColor(params.type);

  // Preheader (texte invisible pour apercu)
  const preheaderHtml = params.preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden;">${params.preheader}</div>`
    : '';

  // Info box optionnelle
  let infoBoxHtml = '';
  if (params.infoBox) {
    const colors = getInfoBoxColors(params.infoBox.color || 'info');
    infoBoxHtml = `
      <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-left: 4px solid ${colors.accent}; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-weight: 600; color: ${COLORS.gray800}; display: flex; align-items: center;">
          ${params.infoBox.icon ? `<span style="margin-right: 8px;">${params.infoBox.icon}</span>` : ''}
          ${params.infoBox.title}
        </p>
        <p style="margin: 8px 0 0 0; color: ${COLORS.gray700}; font-size: 14px;">${params.infoBox.content}</p>
      </div>
    `;
  }

  // Bouton CTA principal
  let ctaButtonHtml = '';
  if (params.ctaButton) {
    ctaButtonHtml = `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${params.ctaButton.url}"
           style="display: inline-block; background: ${buttonColor}; color: white; padding: 14px 32px;
                  text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          ${params.ctaButton.text}
        </a>
      </div>
    `;
  }

  // Bouton secondaire
  let secondaryButtonHtml = '';
  if (params.secondaryButton) {
    secondaryButtonHtml = `
      <div style="text-align: center; margin: 16px 0;">
        <a href="${params.secondaryButton.url}"
           style="color: ${COLORS.primary}; text-decoration: underline; font-size: 14px;">
          ${params.secondaryButton.text}
        </a>
      </div>
    `;
  }

  // Footer avec reference
  let footerInfoHtml = '';
  if (params.footer?.reference) {
    footerInfoHtml = `<p style="margin: 0 0 8px 0; font-weight: 500;">Reference: ${params.footer.reference}</p>`;
  }
  if (params.footer?.additionalInfo) {
    footerInfoHtml += `<p style="margin: 0 0 8px 0;">${params.footer.additionalInfo}</p>`;
  }

  // Lien de desinscription
  const unsubscribeHtml = params.showUnsubscribe
    ? `<p style="margin: 16px 0 0 0;"><a href="${LINKS.unsubscribeUrl}" style="color: ${COLORS.gray500}; text-decoration: underline;">Gerer mes preferences email</a></p>`
    : '';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${params.title}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { padding: 14px 32px !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${preheaderHtml}

  <!-- Email Container -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Main Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: ${COLORS.white}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">

          <!-- Header -->
          <tr>
            <td style="background: ${headerGradient}; padding: 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700; display: flex; align-items: center;">
                      ${headerIcon}${params.title}
                    </h1>
                    ${params.subtitle ? `<p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${params.subtitle}</p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              ${params.recipientName ? `<p style="margin: 0 0 20px 0; font-size: 16px; color: ${COLORS.gray700};">Bonjour <strong>${params.recipientName}</strong>,</p>` : ''}

              <div style="color: ${COLORS.gray700}; font-size: 15px; line-height: 1.7;">
                ${params.content}
              </div>

              ${infoBoxHtml}
              ${ctaButtonHtml}
              ${secondaryButtonHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${COLORS.footerBackground}; padding: 24px 40px; border-top: 1px solid ${COLORS.gray200};">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <p style="margin: 0 0 12px 0; font-weight: 700; font-size: 18px; color: ${COLORS.primary};">
                      SYMPHONI.A
                    </p>

                    ${footerInfoHtml}

                    <p style="margin: 12px 0 0 0; font-size: 12px; color: ${COLORS.gray500};">
                      Message automatique - Ne pas repondre directement<br>
                      Contact: <a href="mailto:${LINKS.supportEmail}" style="color: ${COLORS.primary};">${LINKS.supportEmail}</a>
                    </p>

                    ${unsubscribeHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Legal Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px;">
          <tr>
            <td style="padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: ${COLORS.gray500};">
                &copy; ${new Date().getFullYear()} SYMPHONI.A - Plateforme de gestion logistique intelligente<br>
                Tous droits reserves
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Templates pre-construits pour cas courants
 */
export const EmailTemplates = {
  /**
   * Invitation transporteur a une course
   */
  carrierInvitation(params: {
    carrierName: string;
    orderReference: string;
    pickupCity: string;
    deliveryCity: string;
    pickupDate: string;
    price?: string;
    responseUrl: string;
    expiresIn: string;
  }): string {
    return generateEmailTemplate({
      type: 'action_required',
      title: 'Nouvelle Demande de Transport',
      subtitle: `Reference: ${params.orderReference}`,
      preheader: `${params.pickupCity} vers ${params.deliveryCity} - Reponse requise`,
      recipientName: params.carrierName,
      content: `
        <p>Vous avez recu une nouvelle demande de transport. Voici les details:</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.gray50}; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200};">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Trajet</span><br>
                    <span style="font-weight: 600; font-size: 16px; color: ${COLORS.gray800};">
                      📍 ${params.pickupCity} → ${params.deliveryCity}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200};">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Date d'enlevement</span><br>
                    <span style="font-weight: 600; color: ${COLORS.gray800};">📅 ${params.pickupDate}</span>
                  </td>
                </tr>
                ${params.price ? `
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Prix propose</span><br>
                    <span style="font-weight: 700; font-size: 18px; color: ${COLORS.success};">💰 ${params.price}</span>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
        </table>
      `,
      infoBox: {
        icon: '⏱️',
        title: 'Delai de reponse',
        content: `Vous avez ${params.expiresIn} pour accepter ou refuser cette demande. Passe ce delai, elle sera proposee au transporteur suivant.`,
        color: 'warning'
      },
      ctaButton: {
        text: 'Voir la demande et repondre',
        url: params.responseUrl,
        color: COLORS.primary
      },
      footer: {
        reference: params.orderReference
      }
    });
  },

  /**
   * Rappel avant expiration
   */
  timeoutReminder(params: {
    carrierName: string;
    orderReference: string;
    minutesRemaining: number;
    responseUrl: string;
  }): string {
    return generateEmailTemplate({
      type: 'reminder',
      title: 'Rappel - Reponse Requise',
      subtitle: `Reference: ${params.orderReference}`,
      preheader: `Plus que ${params.minutesRemaining} minutes pour repondre`,
      recipientName: params.carrierName,
      content: `
        <p>Une demande de transport vous attend et expire bientot.</p>
      `,
      infoBox: {
        icon: '⏰',
        title: `Temps restant: ${params.minutesRemaining} minutes`,
        content: 'Passé ce délai, la demande sera automatiquement transmise au transporteur suivant.',
        color: 'warning'
      },
      ctaButton: {
        text: 'Repondre maintenant',
        url: params.responseUrl,
        color: COLORS.warning
      },
      footer: {
        reference: params.orderReference
      }
    });
  },

  /**
   * Confirmation d'acceptation transporteur
   */
  carrierConfirmation(params: {
    carrierName: string;
    orderReference: string;
    pickupCity: string;
    deliveryCity: string;
    pickupDate: string;
    clientName: string;
  }): string {
    return generateEmailTemplate({
      type: 'success',
      title: 'Transport Confirme',
      subtitle: `Reference: ${params.orderReference}`,
      preheader: `Votre transport ${params.pickupCity} - ${params.deliveryCity} est confirme`,
      recipientName: params.carrierName,
      content: `
        <p>Excellente nouvelle ! Le transport a ete confirme avec succes.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.successLight}; border-radius: 12px; overflow: hidden; border: 1px solid ${COLORS.successBorder};">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Client</span><br>
                    <span style="font-weight: 600; color: ${COLORS.gray800};">🏢 ${params.clientName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Trajet</span><br>
                    <span style="font-weight: 600; color: ${COLORS.gray800};">📍 ${params.pickupCity} → ${params.deliveryCity}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Date d'enlevement</span><br>
                    <span style="font-weight: 600; color: ${COLORS.gray800};">📅 ${params.pickupDate}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p>Vous recevrez les instructions detaillees et les contacts sur site prochainement.</p>
      `,
      ctaButton: {
        text: 'Acceder au portail',
        url: `${LINKS.portalUrl}/orders`,
        color: COLORS.success
      },
      footer: {
        reference: params.orderReference
      }
    });
  },

  /**
   * Notification d'incident
   */
  issueNotification(params: {
    recipientName: string;
    orderReference: string;
    issueType: string;
    issueSeverity: string;
    issueDescription: string;
    carrierName: string;
    pickupCity?: string;
    deliveryCity?: string;
    originalEta?: string;
    role: 'recipient' | 'supplier';
  }): string {
    const severityLabels: Record<string, string> = {
      low: 'Mineur',
      medium: 'Moyen',
      high: 'Important',
      critical: 'Critique'
    };

    const issueTypeLabels: Record<string, string> = {
      delay: 'Retard',
      breakdown: 'Panne vehicule',
      damage: 'Marchandise endommagee',
      shortage: 'Manquant',
      accident: 'Accident',
      other: 'Autre incident'
    };

    const roleMessage = params.role === 'recipient'
      ? 'votre livraison'
      : 'l\'expedition de votre marchandise';

    return generateEmailTemplate({
      type: 'alert',
      title: 'Alerte Incident Transport',
      subtitle: `Reference: ${params.orderReference}`,
      preheader: `${issueTypeLabels[params.issueType] || 'Incident'} signale sur ${params.orderReference}`,
      recipientName: params.recipientName,
      content: `
        <p>Un incident a ete signale concernant ${roleMessage}.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.errorLight}; border-radius: 12px; overflow: hidden; border: 1px solid ${COLORS.errorBorder};">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 12px 0; font-weight: 700; font-size: 16px; color: ${COLORS.errorDark};">
                ⚠️ ${issueTypeLabels[params.issueType] || 'Incident'} - Severite: ${severityLabels[params.issueSeverity] || 'Moyen'}
              </p>
              <p style="margin: 0; padding: 12px; background: white; border-radius: 8px; font-style: italic; color: ${COLORS.gray700};">
                "${params.issueDescription}"
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: ${COLORS.gray500}; font-size: 13px;">Transporteur</span><br>
              <span style="font-weight: 600; color: ${COLORS.gray800};">🚛 ${params.carrierName}</span>
            </td>
          </tr>
          ${params.pickupCity && params.deliveryCity ? `
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: ${COLORS.gray500}; font-size: 13px;">Trajet</span><br>
              <span style="font-weight: 600; color: ${COLORS.gray800};">📍 ${params.pickupCity} → ${params.deliveryCity}</span>
            </td>
          </tr>
          ` : ''}
          ${params.originalEta ? `
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: ${COLORS.gray500}; font-size: 13px;">ETA initiale</span><br>
              <span style="font-weight: 600; color: ${COLORS.gray800};">📅 ${params.originalEta}</span>
            </td>
          </tr>
          ` : ''}
        </table>
      `,
      infoBox: {
        icon: '📌',
        title: 'Suivi en cours',
        content: 'Notre equipe suit cet incident de pres. Vous recevrez des mises a jour regulieres jusqu\'a resolution.',
        color: 'info'
      },
      footer: {
        reference: params.orderReference
      }
    });
  },

  /**
   * Relance transporteur pour point de situation
   */
  followUpReminder(params: {
    carrierName: string;
    orderReference: string;
    issueDescription: string;
    followUpCount: number;
    hoursElapsed: number;
    pickupCity?: string;
    deliveryCity?: string;
  }): string {
    return generateEmailTemplate({
      type: 'action_required',
      title: 'Point de Situation Requis',
      subtitle: `Relance #${params.followUpCount} - ${params.orderReference}`,
      preheader: `Mise a jour requise concernant l'incident sur ${params.orderReference}`,
      recipientName: params.carrierName,
      content: `
        <p>Suite a l'incident signale il y a <strong>${params.hoursElapsed} heure(s)</strong>, nous sollicitons un point de situation concernant cette livraison.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.warningLight}; border-radius: 12px; overflow: hidden; border: 1px solid ${COLORS.warningBorder};">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: ${COLORS.gray800};">Incident initial:</p>
              <p style="margin: 0; font-style: italic; color: ${COLORS.gray700};">"${params.issueDescription}"</p>
            </td>
          </tr>
        </table>
      `,
      infoBox: {
        icon: '📋',
        title: 'Informations requises',
        content: `
          <ul style="margin: 8px 0 0 0; padding-left: 20px;">
            <li>Votre situation actuelle</li>
            <li>Estimation de la reprise/resolution</li>
            <li>Nouvelle ETA si applicable</li>
          </ul>
        `,
        color: 'warning'
      },
      footer: {
        reference: params.orderReference,
        additionalInfo: params.pickupCity && params.deliveryCity
          ? `Trajet: ${params.pickupCity} → ${params.deliveryCity}`
          : undefined
      }
    });
  },

  /**
   * Notification d'escalade
   */
  escalationNotification(params: {
    recipientName: string;
    orderReference: string;
    issueDescription: string;
    carrierName: string;
    followUpCount: number;
    hoursElapsed: number;
  }): string {
    return generateEmailTemplate({
      type: 'alert',
      title: 'Escalade Incident',
      subtitle: `Reference: ${params.orderReference}`,
      preheader: `Incident escalade apres ${params.followUpCount} relances sans resolution`,
      recipientName: params.recipientName,
      content: `
        <p>L'incident concernant votre transport n'a pas pu etre resolu malgre nos relances repetees aupres du transporteur.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.errorLight}; border-radius: 12px; overflow: hidden; border: 1px solid ${COLORS.errorBorder};">
          <tr>
            <td style="padding: 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.errorBorder};">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Incident</span><br>
                    <span style="color: ${COLORS.gray800};">${params.issueDescription}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.errorBorder};">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Transporteur</span><br>
                    <span style="color: ${COLORS.gray800};">🚛 ${params.carrierName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.errorBorder};">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Relances envoyees</span><br>
                    <span style="font-weight: 600; color: ${COLORS.errorDark};">${params.followUpCount}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: ${COLORS.gray500}; font-size: 13px;">Duree de l'incident</span><br>
                    <span style="font-weight: 600; color: ${COLORS.errorDark};">${params.hoursElapsed} heures</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
      infoBox: {
        icon: '⚠️',
        title: 'Action Requise',
        content: 'Notre equipe prend en charge cet incident en priorite. Vous serez contacte directement pour trouver une solution.',
        color: 'error'
      },
      footer: {
        reference: params.orderReference,
        additionalInfo: 'Contact urgence: ' + LINKS.supportEmail
      }
    });
  },

  /**
   * Notification de resolution
   */
  resolutionNotification(params: {
    recipientName: string;
    orderReference: string;
    resolution: string;
  }): string {
    return generateEmailTemplate({
      type: 'success',
      title: 'Incident Resolu',
      subtitle: `Reference: ${params.orderReference}`,
      preheader: `Bonne nouvelle ! L'incident sur ${params.orderReference} est resolu`,
      recipientName: params.recipientName,
      content: `
        <p>Excellente nouvelle ! L'incident concernant votre transport a ete resolu.</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.successLight}; border-radius: 12px; overflow: hidden; border: 1px solid ${COLORS.successBorder};">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: ${COLORS.gray800};">Resolution:</p>
              <p style="margin: 0; font-style: italic; color: ${COLORS.gray700};">"${params.resolution}"</p>
            </td>
          </tr>
        </table>

        <p>La livraison reprend son cours normal. Vous recevrez une notification lors de la livraison effective.</p>
      `,
      footer: {
        reference: params.orderReference,
        additionalInfo: 'Merci de votre confiance'
      }
    });
  },

  /**
   * Invitation au portail
   */
  portalInvitation(params: {
    recipientName: string;
    recipientEmail: string;
    role: 'supplier' | 'recipient' | 'carrier' | 'logistician';
    inviterName: string;
    companyName: string;
    activationUrl: string;
    expiresIn: string;
  }): string {
    const roleLabels: Record<string, string> = {
      supplier: 'Fournisseur',
      recipient: 'Destinataire',
      carrier: 'Transporteur',
      logistician: 'Logisticien'
    };

    const roleDescriptions: Record<string, string> = {
      supplier: 'Suivez vos expeditions, validez les enlevements et consultez les documents en temps reel.',
      recipient: 'Suivez vos livraisons, confirmez les receptions et accedez a vos documents.',
      carrier: 'Gerez vos transports, mettez a jour les statuts et telechargez vos documents.',
      logistician: 'Supervisez les flux logistiques et coordonnez les operations.'
    };

    return generateEmailTemplate({
      type: 'invitation',
      title: 'Invitation SYMPHONI.A',
      subtitle: `Acces ${roleLabels[params.role]}`,
      preheader: `${params.inviterName} vous invite a rejoindre SYMPHONI.A`,
      recipientName: params.recipientName,
      content: `
        <p><strong>${params.inviterName}</strong> de <strong>${params.companyName}</strong> vous invite a rejoindre la plateforme SYMPHONI.A en tant que <strong>${roleLabels[params.role]}</strong>.</p>

        <p style="margin: 24px 0;">${roleDescriptions[params.role]}</p>

        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.gray50}; border-radius: 12px;">
          <tr>
            <td style="padding: 20px;">
              <p style="margin: 0 0 8px 0; color: ${COLORS.gray500}; font-size: 13px;">Votre compte sera cree avec:</p>
              <p style="margin: 0; font-weight: 600; color: ${COLORS.gray800};">📧 ${params.recipientEmail}</p>
            </td>
          </tr>
        </table>
      `,
      infoBox: {
        icon: '⏱️',
        title: 'Lien valide ' + params.expiresIn,
        content: 'Cliquez sur le bouton ci-dessous pour activer votre compte et definir votre mot de passe.',
        color: 'info'
      },
      ctaButton: {
        text: 'Activer mon compte',
        url: params.activationUrl,
        color: COLORS.accent
      },
      footer: {
        additionalInfo: 'Si vous n\'avez pas demande cette invitation, ignorez cet email.'
      }
    });
  },

  /**
   * Notification facture
   */
  invoiceNotification(params: {
    recipientName: string;
    orderReference: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    status: 'uploaded' | 'validated' | 'accepted' | 'rejected' | 'payment_sent';
    viewUrl: string;
    rejectionReason?: string;
  }): string {
    const statusConfig: Record<string, { title: string; type: EmailTemplateType; message: string }> = {
      uploaded: {
        title: 'Nouvelle Facture Recue',
        type: 'notification',
        message: 'Une nouvelle facture a ete deposee et est en attente de validation.'
      },
      validated: {
        title: 'Facture Validee',
        type: 'success',
        message: 'Votre facture a ete validee et est en cours de traitement.'
      },
      accepted: {
        title: 'Facture Acceptee',
        type: 'success',
        message: 'Votre facture a ete acceptee. Le paiement sera effectue selon les conditions convenues.'
      },
      rejected: {
        title: 'Facture Refusee',
        type: 'alert',
        message: 'Votre facture n\'a pas pu etre validee. Veuillez consulter le motif ci-dessous.'
      },
      payment_sent: {
        title: 'Paiement Effectue',
        type: 'success',
        message: 'Le paiement de votre facture a ete effectue.'
      }
    };

    const config = statusConfig[params.status];

    let content = `
      <p>${config.message}</p>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; background: ${COLORS.gray50}; border-radius: 12px;">
        <tr>
          <td style="padding: 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200};">
                  <span style="color: ${COLORS.gray500}; font-size: 13px;">Numero de facture</span><br>
                  <span style="font-weight: 600; color: ${COLORS.gray800};">📄 ${params.invoiceNumber}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.gray200};">
                  <span style="color: ${COLORS.gray500}; font-size: 13px;">Montant</span><br>
                  <span style="font-weight: 700; font-size: 18px; color: ${COLORS.primary};">💰 ${params.amount}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: ${COLORS.gray500}; font-size: 13px;">Echeance</span><br>
                  <span style="font-weight: 600; color: ${COLORS.gray800};">📅 ${params.dueDate}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const infoBox = params.status === 'rejected' && params.rejectionReason
      ? {
          icon: '❌',
          title: 'Motif du refus',
          content: params.rejectionReason,
          color: 'error' as const
        }
      : undefined;

    return generateEmailTemplate({
      type: config.type,
      title: config.title,
      subtitle: `Reference: ${params.orderReference}`,
      preheader: `${config.title} - ${params.invoiceNumber}`,
      recipientName: params.recipientName,
      content,
      infoBox,
      ctaButton: {
        text: 'Voir la facture',
        url: params.viewUrl
      },
      footer: {
        reference: params.orderReference
      }
    });
  }
};

export default { generateEmailTemplate, EmailTemplates, COLORS, LINKS };
