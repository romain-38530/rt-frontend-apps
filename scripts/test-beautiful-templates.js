/**
 * Test templates email professionnels et attractifs
 * Design moderne, encodage UTF-8 correct, call-to-action clairs
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_EMAIL = 'r.tardy@rt-groupe.com';
const REGION = 'eu-central-1';

console.log(`\n🚀 Test Templates Email Professionnels`);
console.log(`📧 Destination: ${TEST_EMAIL}\n`);

// Helper pour encoder correctement les caracteres speciaux
function encodeHtml(str) {
  return str
    .replace(/é/g, '&#233;')
    .replace(/è/g, '&#232;')
    .replace(/ê/g, '&#234;')
    .replace(/à/g, '&#224;')
    .replace(/â/g, '&#226;')
    .replace(/ù/g, '&#249;')
    .replace(/û/g, '&#251;')
    .replace(/ô/g, '&#244;')
    .replace(/î/g, '&#238;')
    .replace(/ï/g, '&#239;')
    .replace(/ç/g, '&#231;')
    .replace(/œ/g, '&#339;')
    .replace(/€/g, '&#8364;')
    .replace(/°/g, '&#176;')
    .replace(/'/g, '&#39;');
}

const templates = [
  // ============================================
  // 1. CRM - Premier contact commercial
  // ============================================
  {
    name: '1. CRM - Premier contact',
    fromEmail: 'commerciaux@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[SYMPHONI.A] Optimisez votre logistique transport',
    html: encodeHtml(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header avec gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 40px 30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">SYMPHONI.A</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">La plateforme qui révolutionne votre logistique</p>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1a1a2e;margin:0 0 20px;font-size:22px;font-weight:600;">Bonjour,</h2>
              <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;font-size:15px;">
                Vous gérez des transports régulièrement ? Découvrez comment <strong style="color:#667eea;">SYMPHONI.A</strong> peut transformer votre quotidien logistique.
              </p>

              <!-- Points forts -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:25px 0;">
                <tr>
                  <td style="padding:15px;background:#f8f9ff;border-radius:12px;border-left:4px solid #667eea;">
                    <table cellpadding="0" cellspacing="0">
                      <tr><td style="padding:8px 0;color:#1a1a2e;font-size:14px;">✅ <strong>Dispatch intelligent</strong> - Trouvez le bon transporteur en 2 clics</td></tr>
                      <tr><td style="padding:8px 0;color:#1a1a2e;font-size:14px;">✅ <strong>Tracking temps réel</strong> - Suivez vos livraisons GPS en direct</td></tr>
                      <tr><td style="padding:8px 0;color:#1a1a2e;font-size:14px;">✅ <strong>Documents digitalisés</strong> - CMR, POD, factures dématérialisés</td></tr>
                      <tr><td style="padding:8px 0;color:#1a1a2e;font-size:14px;">✅ <strong>Analytics IA</strong> - Rapports et optimisations automatiques</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Principal -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <a href="https://symphonia-controltower.com/demo" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:600;font-size:15px;box-shadow:0 4px 15px rgba(102,126,234,0.4);">
                      Demander une démo gratuite →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#718096;font-size:13px;text-align:center;margin:20px 0 0;">
                Rejoignez les 200+ entreprises qui optimisent leur transport avec SYMPHONI.A
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:25px 40px;text-align:center;border-top:1px solid #e8ecf4;">
              <p style="color:#667eea;font-weight:600;margin:0 0 5px;font-size:14px;">SYMPHONI.A by RT Technologie</p>
              <p style="color:#a0aec0;margin:0;font-size:12px;">La solution TMS nouvelle génération</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)
  },

  // ============================================
  // 2. Invitation Transporteur - Nouvelle offre
  // ============================================
  {
    name: '2. Dispatch - Nouvelle offre transport',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[SYMPHONI.A] 🚚 Nouvelle offre de transport - Paris → Lyon',
    html: encodeHtml(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header urgent -->
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:30px 40px;text-align:center;">
              <p style="color:rgba(255,255,255,0.9);margin:0 0 5px;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Nouvelle opportunité</p>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Offre de Transport</h1>
            </td>
          </tr>
          <!-- Badge prix -->
          <tr>
            <td style="padding:0;text-align:center;">
              <div style="display:inline-block;background:#10b981;color:#fff;padding:12px 30px;border-radius:0 0 12px 12px;font-size:18px;font-weight:700;">
                850 € HT
              </div>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:35px 40px;">
              <!-- Trajet visuel -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:25px;margin-bottom:25px;">
                <tr>
                  <td width="45%" style="text-align:center;">
                    <p style="color:#667eea;font-size:12px;text-transform:uppercase;margin:0 0 5px;font-weight:600;">Départ</p>
                    <p style="color:#1a1a2e;font-size:20px;font-weight:700;margin:0;">PARIS</p>
                    <p style="color:#718096;font-size:13px;margin:5px 0 0;">20 Jan. 2024 - 08h00</p>
                  </td>
                  <td width="10%" style="text-align:center;">
                    <span style="font-size:24px;">→</span>
                  </td>
                  <td width="45%" style="text-align:center;">
                    <p style="color:#10b981;font-size:12px;text-transform:uppercase;margin:0 0 5px;font-weight:600;">Arrivée</p>
                    <p style="color:#1a1a2e;font-size:20px;font-weight:700;margin:0;">LYON</p>
                    <p style="color:#718096;font-size:13px;margin:5px 0 0;">20 Jan. 2024 - 14h00</p>
                  </td>
                </tr>
              </table>

              <!-- Détails -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Marchandise</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">12 palettes - 8,5 tonnes</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Type</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">Bâché / Tautliner</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Distance</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">~465 km</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#718096;font-size:13px;">Référence</span>
                    <span style="color:#667eea;font-size:14px;font-weight:600;float:right;">ORD-2024-00142</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="padding-right:2%;">
                    <a href="#" style="display:block;background:#10b981;color:#ffffff;text-decoration:none;padding:16px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;">
                      ✓ Accepter l'offre
                    </a>
                  </td>
                  <td width="48%" style="padding-left:2%;">
                    <a href="#" style="display:block;background:#f1f5f9;color:#64748b;text-decoration:none;padding:16px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;">
                      ✗ Décliner
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#f59e0b;font-size:13px;text-align:center;margin:20px 0 0;font-weight:500;">
                ⏰ Cette offre expire dans 24 heures
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;margin:0;font-size:12px;">SYMPHONI.A - Plateforme de gestion logistique</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)
  },

  // ============================================
  // 3. Livraison confirmée
  // ============================================
  {
    name: '3. Delivery - Livraison confirmee',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[SYMPHONI.A] ✅ Livraison confirmée - ORD-2024-00142',
    html: encodeHtml(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header succès -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
              <div style="width:70px;height:70px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 15px;line-height:70px;">
                <span style="font-size:36px;">✓</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Livraison Confirmée</h1>
              <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;">Votre commande a été livrée avec succès</p>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:35px 40px;">
              <!-- Référence -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:25px;text-align:center;">
                <tr>
                  <td>
                    <p style="color:#059669;font-size:12px;text-transform:uppercase;margin:0 0 5px;font-weight:600;">Référence commande</p>
                    <p style="color:#1a1a2e;font-size:22px;font-weight:700;margin:0;">ORD-2024-00142</p>
                  </td>
                </tr>
              </table>

              <!-- Détails livraison -->
              <h3 style="color:#1a1a2e;font-size:16px;margin:0 0 15px;font-weight:600;">Détails de la livraison</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Réceptionné par</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">Marie Martin</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Date et heure</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">15 Jan. 2024 à 14h32</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">État marchandise</span>
                    <span style="color:#10b981;font-size:14px;font-weight:600;float:right;">✓ Parfait état</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#718096;font-size:13px;">Signature</span>
                    <span style="color:#10b981;font-size:14px;font-weight:600;float:right;">✓ Électronique validée</span>
                  </td>
                </tr>
              </table>

              <!-- Info POD -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:10px;padding:15px 20px;margin-bottom:25px;">
                <tr>
                  <td>
                    <p style="color:#3b82f6;margin:0;font-size:14px;">
                      <strong>📄 Preuve de livraison (POD)</strong><br>
                      <span style="color:#64748b;">Document généré avec signature électronique certifiée</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:14px 35px;border-radius:50px;font-weight:600;font-size:14px;">
                      Voir tous les documents →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;margin:0;font-size:12px;">SYMPHONI.A by RT Technologie</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)
  },

  // ============================================
  // 4. Tracking - Mise à jour statut
  // ============================================
  {
    name: '4. Tracking - En cours de livraison',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[SYMPHONI.A] 🚚 Votre colis arrive bientôt',
    html: encodeHtml(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);padding:35px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🚚 En cours de livraison</h1>
              <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;">Votre commande est en route vers sa destination</p>
            </td>
          </tr>
          <!-- Timeline -->
          <tr>
            <td style="padding:35px 40px;">
              <!-- Progress bar -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
                <tr>
                  <td>
                    <div style="background:#e2e8f0;height:6px;border-radius:3px;overflow:hidden;">
                      <div style="background:linear-gradient(90deg,#10b981,#3b82f6);width:75%;height:100%;"></div>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
                      <tr>
                        <td width="25%" style="text-align:left;"><span style="color:#10b981;font-size:11px;font-weight:600;">✓ Enlevé</span></td>
                        <td width="25%" style="text-align:center;"><span style="color:#10b981;font-size:11px;font-weight:600;">✓ En transit</span></td>
                        <td width="25%" style="text-align:center;"><span style="color:#3b82f6;font-size:11px;font-weight:600;">● Livraison</span></td>
                        <td width="25%" style="text-align:right;"><span style="color:#a0aec0;font-size:11px;">Livré</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ETA box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-radius:12px;padding:20px;margin-bottom:25px;text-align:center;">
                <tr>
                  <td>
                    <p style="color:#92400e;font-size:12px;text-transform:uppercase;margin:0 0 5px;font-weight:600;">Arrivée estimée</p>
                    <p style="color:#78350f;font-size:28px;font-weight:700;margin:0;">Aujourd'hui 15h30</p>
                  </td>
                </tr>
              </table>

              <!-- Trajet -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:25px;">
                <tr>
                  <td width="45%">
                    <p style="color:#64748b;font-size:11px;text-transform:uppercase;margin:0 0 3px;">Départ</p>
                    <p style="color:#1a1a2e;font-size:16px;font-weight:600;margin:0;">Paris (75)</p>
                  </td>
                  <td width="10%" style="text-align:center;"><span style="color:#3b82f6;font-size:20px;">→</span></td>
                  <td width="45%" style="text-align:right;">
                    <p style="color:#64748b;font-size:11px;text-transform:uppercase;margin:0 0 3px;">Destination</p>
                    <p style="color:#1a1a2e;font-size:16px;font-weight:600;margin:0;">Lyon (69)</p>
                  </td>
                </tr>
              </table>

              <!-- Transporteur -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Transporteur</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">Transport Express</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#718096;font-size:13px;">Référence</span>
                    <span style="color:#667eea;font-size:14px;font-weight:600;float:right;">ORD-2024-00142</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);color:#ffffff;text-decoration:none;padding:14px 35px;border-radius:50px;font-weight:600;font-size:14px;">
                      📍 Suivre en temps réel
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;margin:0;font-size:12px;">SYMPHONI.A - Suivi de livraison en temps réel</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)
  },

  // ============================================
  // 5. Invitation portail destinataire
  // ============================================
  {
    name: '5. Portal - Invitation destinataire',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[SYMPHONI.A] Suivez votre livraison en direct',
    html: encodeHtml(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%);padding:40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Portail Destinataire</h1>
              <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;">Accédez au suivi de votre livraison</p>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:35px 40px;">
              <h2 style="color:#1a1a2e;margin:0 0 20px;font-size:20px;font-weight:600;">Bonjour Jean Dupont,</h2>
              <p style="color:#4a5568;line-height:1.7;margin:0 0 25px;font-size:15px;">
                Une livraison est prévue pour vous. Accédez à votre espace personnel pour suivre votre colis en temps réel.
              </p>

              <!-- Référence -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-radius:12px;padding:20px;margin-bottom:25px;text-align:center;">
                <tr>
                  <td>
                    <p style="color:#7c3aed;font-size:12px;text-transform:uppercase;margin:0 0 5px;font-weight:600;">Commande</p>
                    <p style="color:#1a1a2e;font-size:20px;font-weight:700;margin:0;">ORD-2024-00142</p>
                  </td>
                </tr>
              </table>

              <!-- Fonctionnalités -->
              <h3 style="color:#1a1a2e;font-size:15px;margin:0 0 15px;font-weight:600;">Votre espace vous permet de :</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:30px;vertical-align:top;"><span style="color:#8b5cf6;font-size:16px;">📍</span></td>
                        <td style="color:#4a5568;font-size:14px;">Suivre la position du camion en temps réel</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:30px;vertical-align:top;"><span style="color:#8b5cf6;font-size:16px;">⏰</span></td>
                        <td style="color:#4a5568;font-size:14px;">Voir l'heure d'arrivée estimée (ETA)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:30px;vertical-align:top;"><span style="color:#8b5cf6;font-size:16px;">✍️</span></td>
                        <td style="color:#4a5568;font-size:14px;">Signer électroniquement le bon de livraison</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:30px;vertical-align:top;"><span style="color:#8b5cf6;font-size:16px;">📄</span></td>
                        <td style="color:#4a5568;font-size:14px;">Télécharger vos documents (CMR, POD)</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:600;font-size:15px;box-shadow:0 4px 15px rgba(139,92,246,0.4);">
                      Accéder à mon espace →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#a0aec0;font-size:12px;text-align:center;margin:20px 0 0;">
                Ce lien est valable 7 jours. Aucune inscription requise.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;margin:0;font-size:12px;">SYMPHONI.A by RT Technologie</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)
  },

  // ============================================
  // 6. Incident livraison
  // ============================================
  {
    name: '6. Incident - Probleme signale',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[SYMPHONI.A] ⚠️ Incident signalé - ORD-2024-00142',
    html: encodeHtml(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header alerte -->
          <tr>
            <td style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);padding:35px 40px;text-align:center;">
              <div style="width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 15px;line-height:60px;">
                <span style="font-size:28px;">⚠️</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Incident Signalé</h1>
            </td>
          </tr>
          <!-- Badge sévérité -->
          <tr>
            <td style="padding:0;text-align:center;">
              <div style="display:inline-block;background:#fef2f2;color:#dc2626;padding:8px 20px;border-radius:0 0 10px 10px;font-size:13px;font-weight:600;border:1px solid #fecaca;border-top:none;">
                Sévérité : MAJEUR
              </div>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:35px 40px;">
              <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;font-size:15px;">
                Un incident a été signalé pour la commande <strong style="color:#1a1a2e;">ORD-2024-00142</strong>.
              </p>

              <!-- Détails incident -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:12px;border-left:4px solid #ef4444;padding:20px;margin-bottom:25px;">
                <tr>
                  <td>
                    <p style="color:#991b1b;font-weight:600;margin:0 0 10px;font-size:14px;">Type : Marchandise endommagée</p>
                    <p style="color:#7f1d1d;margin:0;font-size:14px;line-height:1.6;">
                      <strong>Description :</strong><br>
                      2 cartons présentent des traces d'écrasement. Emballage déchiré sur une palette.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Infos -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Signalé par</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">Pierre Durand (Destinataire)</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Date</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">15 Jan. 2024 à 14h45</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#718096;font-size:13px;">Ref. incident</span>
                    <span style="color:#ef4444;font-size:14px;font-weight:600;float:right;">INC-2024-00089</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="display:inline-block;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:#ffffff;text-decoration:none;padding:14px 35px;border-radius:50px;font-weight:600;font-size:14px;">
                      Gérer cet incident →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;margin:0;font-size:12px;">SYMPHONI.A - Gestion des incidents</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)
  },

  // ============================================
  // 7. Document déposé
  // ============================================
  {
    name: '7. Document - CMR depose',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[SYMPHONI.A] 📄 Nouveau document - CMR disponible',
    html: encodeHtml(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:35px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">📄 Nouveau Document</h1>
              <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;">Un document a été ajouté à votre commande</p>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:35px 40px;">
              <!-- Document card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:25px;margin-bottom:25px;">
                <tr>
                  <td style="text-align:center;">
                    <div style="width:70px;height:70px;background:#e0e7ff;border-radius:12px;margin:0 auto 15px;line-height:70px;">
                      <span style="font-size:32px;">📋</span>
                    </div>
                    <p style="color:#667eea;font-size:12px;text-transform:uppercase;margin:0 0 5px;font-weight:600;">Document</p>
                    <p style="color:#1a1a2e;font-size:20px;font-weight:700;margin:0;">CMR - Lettre de voiture</p>
                  </td>
                </tr>
              </table>

              <!-- Détails -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Commande</span>
                    <span style="color:#667eea;font-size:14px;font-weight:600;float:right;">ORD-2024-00142</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Déposé par</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">Transport Express</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Date</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">15 Jan. 2024 à 16h45</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#718096;font-size:13px;">Statut</span>
                    <span style="color:#f59e0b;font-size:14px;font-weight:600;float:right;">⏳ En attente de validation</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="padding-right:2%;">
                    <a href="#" style="display:block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:14px;text-align:center;">
                      Voir le document
                    </a>
                  </td>
                  <td width="48%" style="padding-left:2%;">
                    <a href="#" style="display:block;background:#10b981;color:#ffffff;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:14px;text-align:center;">
                      ✓ Valider
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;margin:0;font-size:12px;">SYMPHONI.A - Gestion documentaire</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)
  },

  // ============================================
  // 8. Rapport IA mensuel
  // ============================================
  {
    name: '8. AI Report - Analyse mensuelle',
    fromEmail: 'reports@symphonia-controltower.com',
    fromName: 'SYMPHONI.A Analytics',
    subject: '[SYMPHONI.A] 📊 Votre rapport d\'analyse - Janvier 2024',
    html: encodeHtml(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:40px;text-align:center;">
              <p style="color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 5px;">Rapport d'analyse</p>
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Janvier 2024</h1>
              <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;">Généré par l'IA SYMPHONI.A</p>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:35px 40px;">
              <p style="color:#4a5568;line-height:1.7;margin:0 0 25px;font-size:15px;">
                Bonjour <strong style="color:#1a1a2e;">Industriel ABC</strong>,<br>
                Voici le résumé de vos performances logistiques du mois.
              </p>

              <!-- KPIs -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td width="32%" style="padding:5px;">
                    <div style="background:#f0fdf4;border-radius:12px;padding:20px;text-align:center;">
                      <p style="color:#059669;font-size:28px;font-weight:700;margin:0;">142</p>
                      <p style="color:#64748b;font-size:12px;margin:5px 0 0;">Commandes</p>
                      <p style="color:#10b981;font-size:11px;margin:3px 0 0;">+23% vs N-1</p>
                    </div>
                  </td>
                  <td width="32%" style="padding:5px;">
                    <div style="background:#eff6ff;border-radius:12px;padding:20px;text-align:center;">
                      <p style="color:#2563eb;font-size:28px;font-weight:700;margin:0;">98.2%</p>
                      <p style="color:#64748b;font-size:12px;margin:5px 0 0;">Taux livraison</p>
                      <p style="color:#3b82f6;font-size:11px;margin:3px 0 0;">+2.1 pts</p>
                    </div>
                  </td>
                  <td width="32%" style="padding:5px;">
                    <div style="background:#fef3c7;border-radius:12px;padding:20px;text-align:center;">
                      <p style="color:#d97706;font-size:28px;font-weight:700;margin:0;">4.6/5</p>
                      <p style="color:#64748b;font-size:12px;margin:5px 0 0;">Score moyen</p>
                      <p style="color:#f59e0b;font-size:11px;margin:3px 0 0;">Stable</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Résumé -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px;">
                <tr>
                  <td>
                    <h3 style="color:#1a1a2e;font-size:15px;margin:0 0 10px;font-weight:600;">Résumé IA</h3>
                    <p style="color:#4a5568;font-size:14px;line-height:1.6;margin:0;">
                      Performance globale excellente avec une amélioration de 15% du taux de livraison à l'heure.
                      Les délais moyens ont été réduits de 2h grâce à l'optimisation des itinéraires.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Recommandation -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;border-left:4px solid #3b82f6;padding:20px;margin-bottom:25px;">
                <tr>
                  <td>
                    <p style="color:#1e40af;font-weight:600;margin:0 0 8px;font-size:14px;">💡 Recommandation IA</p>
                    <p style="color:#3b82f6;font-size:14px;line-height:1.6;margin:0;">
                      Optimisez les créneaux de livraison sur la zone Lyon-Marseille pour réduire les temps d'attente de 12%.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);color:#ffffff;text-decoration:none;padding:14px 35px;border-radius:50px;font-weight:600;font-size:14px;">
                      Voir le rapport complet →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;margin:0;font-size:12px;">SYMPHONI.A Analytics - Rapports générés par IA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)
  },

  // ============================================
  // 9. Pré-facturation
  // ============================================
  {
    name: '9. Billing - Pre-facturation mensuelle',
    fromEmail: 'billing@symphonia-controltower.com',
    fromName: 'SYMPHONI.A Facturation',
    subject: '[SYMPHONI.A] 💰 Votre pré-facture Janvier 2024',
    html: encodeHtml(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669 0%,#047857 100%);padding:35px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Pré-facturation Mensuelle</h1>
              <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;">Janvier 2024</p>
            </td>
          </tr>
          <!-- Montant -->
          <tr>
            <td style="padding:0;text-align:center;">
              <div style="display:inline-block;background:#f0fdf4;padding:20px 40px;border-radius:0 0 16px 16px;border:1px solid #bbf7d0;border-top:none;">
                <p style="color:#059669;font-size:12px;text-transform:uppercase;margin:0 0 5px;font-weight:600;">Montant total</p>
                <p style="color:#047857;font-size:36px;font-weight:700;margin:0;">18 540,00 €</p>
                <p style="color:#64748b;font-size:13px;margin:5px 0 0;">HT</p>
              </div>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:35px 40px;">
              <p style="color:#4a5568;line-height:1.7;margin:0 0 25px;font-size:15px;">
                Bonjour <strong style="color:#1a1a2e;">Transport Express</strong>,<br>
                Voici le récapitulatif de vos prestations du mois.
              </p>

              <!-- Détails -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="padding:15px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:14px;">Transports effectués</span>
                    <span style="color:#1a1a2e;font-size:16px;font-weight:600;float:right;">42 missions</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:14px;">Montant brut</span>
                    <span style="color:#1a1a2e;font-size:16px;font-weight:600;float:right;">19 500,00 €</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:14px;">Commission RT (5%)</span>
                    <span style="color:#ef4444;font-size:16px;font-weight:600;float:right;">- 960,00 €</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:15px 0;">
                    <span style="color:#1a1a2e;font-size:16px;font-weight:700;">Net à percevoir</span>
                    <span style="color:#059669;font-size:20px;font-weight:700;float:right;">18 540,00 €</span>
                  </td>
                </tr>
              </table>

              <!-- Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:10px;padding:15px 20px;margin-bottom:25px;">
                <tr>
                  <td>
                    <p style="color:#059669;margin:0;font-size:13px;">
                      ✓ Paiement prévu sous 30 jours fin de mois
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="padding-right:2%;">
                    <a href="#" style="display:block;background:linear-gradient(135deg,#059669 0%,#047857 100%);color:#ffffff;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:14px;text-align:center;">
                      Voir le détail
                    </a>
                  </td>
                  <td width="48%" style="padding-left:2%;">
                    <a href="#" style="display:block;background:#f1f5f9;color:#64748b;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:14px;text-align:center;">
                      Télécharger PDF
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;margin:0;font-size:12px;">SYMPHONI.A - Facturation et paiements</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)
  },

  // ============================================
  // 10. Commande clôturée
  // ============================================
  {
    name: '10. Closure - Commande cloturee',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[SYMPHONI.A] ✅ Commande clôturée - ORD-2024-00142',
    html: encodeHtml(`<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background-color:#f4f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px;text-align:center;">
              <div style="width:70px;height:70px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 15px;line-height:70px;">
                <span style="font-size:36px;">✓</span>
              </div>
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Commande Clôturée</h1>
            </td>
          </tr>
          <!-- Contenu -->
          <tr>
            <td style="padding:35px 40px;">
              <!-- Référence -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:25px;text-align:center;">
                <tr>
                  <td>
                    <p style="color:#059669;font-size:12px;text-transform:uppercase;margin:0 0 5px;font-weight:600;">Référence</p>
                    <p style="color:#1a1a2e;font-size:22px;font-weight:700;margin:0;">ORD-2024-00142</p>
                  </td>
                </tr>
              </table>

              <p style="color:#4a5568;line-height:1.7;margin:0 0 25px;font-size:15px;">
                Cette commande a été clôturée avec succès. Tous les documents sont validés et archivés.
              </p>

              <!-- Récap -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Trajet</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">Paris → Lyon</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Transporteur</span>
                    <span style="color:#1a1a2e;font-size:14px;font-weight:600;float:right;">Transport Express</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #e8ecf4;">
                    <span style="color:#718096;font-size:13px;">Livraison</span>
                    <span style="color:#10b981;font-size:14px;font-weight:600;float:right;">15 Jan. 2024 ✓</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#718096;font-size:13px;">Documents</span>
                    <span style="color:#10b981;font-size:14px;font-weight:600;float:right;">CMR ✓ POD ✓</span>
                  </td>
                </tr>
              </table>

              <!-- Info archivage -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:10px;padding:15px 20px;margin-bottom:25px;">
                <tr>
                  <td>
                    <p style="color:#3b82f6;margin:0;font-size:13px;">
                      📁 Cette commande sera archivée dans 30 jours et conservée 10 ans (obligations légales).
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="#" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;padding:14px 35px;border-radius:50px;font-weight:600;font-size:14px;">
                      Accéder aux documents →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:20px 40px;text-align:center;">
              <p style="color:#a0aec0;margin:0;font-size:12px;">SYMPHONI.A by RT Technologie</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)
  }
];

function sendEmail(template, index) {
  const messageJson = {
    Subject: { Data: template.subject, Charset: 'UTF-8' },
    Body: { Html: { Data: template.html, Charset: 'UTF-8' } }
  };

  const tempFile = path.join(__dirname, `temp-beautiful-${index}.json`);
  fs.writeFileSync(tempFile, JSON.stringify(messageJson));

  const destJson = { ToAddresses: [TEST_EMAIL] };
  const destFile = path.join(__dirname, `temp-dest-beautiful-${index}.json`);
  fs.writeFileSync(destFile, JSON.stringify(destJson));

  const fromAddress = `${template.fromName} <${template.fromEmail}>`;
  const cmd = `aws ses send-email --region ${REGION} --from "${fromAddress}" --destination file://${destFile} --message file://${tempFile}`;

  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(`✅ ${template.name}`);
    fs.unlinkSync(tempFile);
    fs.unlinkSync(destFile);
    return true;
  } catch (error) {
    try { fs.unlinkSync(tempFile); } catch(e) {}
    try { fs.unlinkSync(destFile); } catch(e) {}
    console.error(`❌ ${template.name}`);
    return false;
  }
}

async function runTests() {
  console.log('─'.repeat(60));
  console.log(`Envoi de ${templates.length} templates professionnels...\n`);

  let success = 0;
  for (let i = 0; i < templates.length; i++) {
    if (sendEmail(templates[i], i)) success++;
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`\n📊 Résultats: ${success}/${templates.length} emails envoyés`);
  console.log(`📬 Vérifiez votre boîte: ${TEST_EMAIL}\n`);
}

runTests();
