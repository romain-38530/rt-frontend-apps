/**
 * Test complet de tous les templates email AWS SES
 * Envoie un exemple de chaque template configuré
 * Usage: node scripts/test-all-email-templates.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_EMAIL = 'r.tardy@rt-groupe.com';
const REGION = 'eu-central-1';

console.log(`\n🚀 Test AWS SES - Tous les templates email`);
console.log(`📧 Destination: ${TEST_EMAIL}`);
console.log(`🌍 Region: ${REGION}\n`);

const templates = [
  // === API-ADMIN ===
  {
    name: 'CRM - Prospect',
    fromEmail: 'commerciaux@symphonia-controltower.com',
    fromName: 'Equipe Commerciale SYMPHONI.A',
    subject: '[TEST] CRM - Email prospect commercial',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h1>Template CRM</h1><p>api-admin</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><div style="background:#dbeafe;border:1px solid #3b82f6;padding:15px;border-radius:8px;margin:15px 0;"><strong>Exemple email CRM prospect</strong><p>Bonjour [Nom du prospect],</p><p>Suite à notre échange, je me permets de vous contacter...</p></div><p><strong>From:</strong> commerciaux@symphonia-controltower.com</p></div></div></body></html>`
  },
  {
    name: 'Analytics Report',
    fromEmail: 'reports@symphonia-controltower.com',
    fromName: 'SYMPHONI.A Analytics',
    subject: '[TEST] Analytics - Rapport hebdomadaire',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h1>Rapport Analytics</h1><p>api-admin</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><div style="background:#ede9fe;border:1px solid #8b5cf6;padding:15px;border-radius:8px;margin:15px 0;"><strong>Statistiques de la semaine</strong><p>Commandes: 142 (+12%)</p><p>Transporteurs actifs: 38</p><p>Taux de livraison: 98.2%</p></div><p><strong>From:</strong> reports@symphonia-controltower.com</p></div></div></body></html>`
  },

  // === API-SALES-AGENTS ===
  {
    name: 'Agent Commercial - Invitation',
    fromEmail: 'agents@symphonia-controltower.com',
    fromName: 'RT Transport Solutions',
    subject: '[TEST] Agent Commercial - Invitation partenaire',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h1>Invitation Partenaire</h1><p>api-sales-agents</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><div style="background:#fef3c7;border:1px solid #f59e0b;padding:15px;border-radius:8px;margin:15px 0;"><strong>Invitation Agent Commercial</strong><p>Vous êtes invité à rejoindre le réseau RT Transport Solutions</p><p>Cliquez ici pour activer votre compte agent</p></div><p><strong>From:</strong> agents@symphonia-controltower.com</p></div></div></body></html>`
  },

  // === API-AUTH ===
  {
    name: 'Auth - Invitation Logisticien',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Auth - Invitation portail logisticien',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h1>Invitation Portail Logisticien</h1><p>api-auth</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><div style="background:#dbeafe;border:1px solid #2563eb;padding:15px;border-radius:8px;margin:15px 0;"><strong>Activation de compte</strong><p>Industriel ABC vous invite à rejoindre son espace logisticien</p><p>Niveau d'accès: Consultation + Signature</p></div><a href="#" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:10px 0;">Activer mon compte</a><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },

  // === API-SUPPLIER ===
  {
    name: 'Supplier - Notification',
    fromEmail: 'notifications@symphonia-controltower.com',
    fromName: 'RT Technologie',
    subject: '[TEST] Supplier - Notification fournisseur',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h1>Notification Fournisseur</h1><p>api-supplier</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><div style="background:#d1fae5;border:1px solid #10b981;padding:15px;border-radius:8px;margin:15px 0;"><strong>Nouvelle commande à préparer</strong><p>Référence: ORD-2024-00142</p><p>Date d'enlèvement: 15/01/2024</p><p>Destination: Lyon</p></div><p><strong>From:</strong> notifications@symphonia-controltower.com</p></div></div></body></html>`
  },
  {
    name: 'Supplier - Invitation',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'RT Technologie',
    subject: '[TEST] Supplier - Invitation portail expediteur',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h1>Invitation Portail Expéditeur</h1><p>api-supplier</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><div style="background:#e0e7ff;border:1px solid #667eea;padding:15px;border-radius:8px;margin:15px 0;"><strong>Accès au suivi en temps réel</strong><p>Suivez vos expéditions en direct</p><p>Confirmez les rendez-vous transporteur</p><p>Consultez les documents de transport</p></div><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },

  // === API-ORDERS - Notifications ===
  {
    name: 'Orders - Dispatch Invitation',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Orders - Invitation transport',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h1>Nouvelle Opportunité de Transport</h1><p>api-orders</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><div style="background:#dbeafe;border:1px solid #3b82f6;padding:15px;border-radius:8px;margin:15px 0;"><strong>Trajet: Paris → Marseille</strong><p>Date: 20/01/2024</p><p>Marchandise: 12 palettes - 8,5T</p><p>Prix proposé: 850€ HT</p></div><a href="#" style="display:inline-block;background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:5px;">Accepter</a><a href="#" style="display:inline-block;background:#ef4444;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:5px;">Refuser</a><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },
  {
    name: 'Orders - Billing',
    fromEmail: 'billing@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Orders - Pre-facturation transporteur',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#059669,#047857);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h1>Pré-facturation Mensuelle</h1><p>api-orders</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><div style="background:#d1fae5;border:1px solid #059669;padding:15px;border-radius:8px;margin:15px 0;"><strong>Récapitulatif Janvier 2024</strong><p>Transports effectués: 42</p><p>Montant total: 18 540,00 € HT</p><p>Commission RT: 1 854,00 € HT</p></div><a href="#" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;margin:10px 0;">Voir le détail</a><p><strong>From:</strong> billing@symphonia-controltower.com</p></div></div></body></html>`
  },

  // === API-ORDERS - Portal Invitations ===
  {
    name: 'Portal - Invitation Destinataire',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Portal - Invitation portail destinataire',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h1>Portail Destinataire</h1><p>api-orders</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><p>Bonjour Jean Dupont,</p><p>Vous avez été désigné comme <strong>destinataire</strong> pour une commande de transport.</p><div style="background:#e0e7ff;padding:10px 20px;border-radius:4px;font-weight:bold;display:inline-block;margin:10px 0;">ORD-2024-00142</div><ul><li>Suivre la livraison en temps réel</li><li>Confirmer la réception</li><li>Signer le bon de livraison</li></ul><a href="#" style="display:inline-block;background:#667eea;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;margin:10px 0;">Accéder au portail</a><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },

  // === API-ORDERS - Delivery ===
  {
    name: 'Delivery - Confirmation',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Delivery - Livraison confirmee',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1>✅ Livraison Confirmée</h1><p>api-orders</p></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>La commande <strong>ORD-2024-00142</strong> a été livrée avec succès.</p><div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;"><p><strong>Réceptionné par:</strong> Marie Martin</p><p><strong>Date/Heure:</strong> 15/01/2024 14:32</p><p><strong>État:</strong> ✅ Parfait état</p></div><p>📝 La preuve de livraison (POD) a été générée avec signature électronique.</p><a href="#" style="display:inline-block;background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Voir les détails</a><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },
  {
    name: 'Delivery - Incident',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Delivery - Incident livraison',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:#ef4444;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1>⚠️ Incident Livraison</h1><p>Sévérité: Majeur</p></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>Un incident a été signalé pour la commande <strong>ORD-2024-00142</strong>.</p><div style="background:#fee2e2;border-left:4px solid #ef4444;padding:15px;margin:15px 0;"><p><strong>Type:</strong> Marchandise endommagée</p><p><strong>Signalé par:</strong> Pierre Durand</p><p><strong>Description:</strong> 2 cartons écrasés lors du transport</p></div><p>Référence incident: <code>issue_abc123</code></p><a href="#" style="display:inline-block;background:#667eea;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Gérer l'incident</a><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },

  // === API-ORDERS - Documents ===
  {
    name: 'Document - Upload notification',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Document - CMR depose',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1>📄 Nouveau Document</h1><p>api-orders</p></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>Un nouveau document a été déposé pour la commande <strong>ORD-2024-00142</strong>.</p><div style="background:#e0e7ff;padding:15px;border-radius:8px;margin:15px 0;"><p><strong>Type:</strong> CMR (Lettre de voiture)</p><p><strong>Fichier:</strong> CMR_ORD-2024-00142.pdf</p><p><strong>Déposé par:</strong> Transport Express (carrier)</p><p><strong>Date:</strong> 15/01/2024 16:45</p></div><a href="#" style="display:inline-block;background:#667eea;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Voir le document</a><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },
  {
    name: 'Document - Rejection',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Document - Document rejete',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:#dc2626;color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1>❌ Document Rejeté</h1><p>api-orders</p></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>Votre document pour la commande <strong>ORD-2024-00142</strong> a été rejeté.</p><p><strong>Document:</strong> CMR_ORD-2024-00142.pdf</p><div style="background:#fee2e2;border-left:4px solid #dc2626;padding:15px;margin:15px 0;"><strong>Motif du rejet:</strong><br>Signature manquante - Le document CMR doit être signé par l'expéditeur</div><p>Merci de déposer un nouveau document conforme.</p><a href="#" style="display:inline-block;background:#667eea;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Déposer un nouveau document</a><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },

  // === API-ORDERS - Tracking ===
  {
    name: 'Tracking - Status update',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Tracking - En route vers livraison',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:#dd6b20;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"><h2>🎯 Mise à jour de votre livraison</h2></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>Bonjour Jean Dupont,</p><p>Votre commande <strong>ORD-2024-00142</strong> a un nouveau statut:</p><div style="text-align:center;"><span style="background:#dd6b20;color:white;padding:10px 20px;border-radius:20px;display:inline-block;font-weight:bold;margin:15px 0;">🎯 Arrivé à destination</span></div><div style="background:#e2e8f0;padding:15px;border-radius:8px;margin:15px 0;"><p><strong>📍 Enlèvement:</strong> Paris</p><p><strong>🎯 Livraison:</strong> Marseille</p><p><strong>⏰ ETA:</strong> 15/01/2024 15:30</p><p><strong>🚚 Transporteur:</strong> Transport Express</p></div><a href="#" style="display:inline-block;background:#667eea;color:white;padding:12px 25px;text-decoration:none;border-radius:8px;margin-top:15px;">Suivre en temps réel</a><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },
  {
    name: 'Tracking - ETA update',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Tracking - ETA mise a jour',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:#dd6b20;color:white;padding:20px;text-align:center;border-radius:8px;"><h2>⏰ Mise à jour ETA</h2></div><div style="background:#fffaf0;padding:30px;border-radius:8px;margin-top:10px;"><p>Bonjour Jean Dupont,</p><p>L'heure d'arrivée estimée pour votre commande <strong>ORD-2024-00142</strong> a été retardée de 45 minutes.</p><p><strong>Nouvelle ETA:</strong> 15/01/2024 16:15</p><p><strong>Raison:</strong> Trafic dense sur A7</p><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },
  {
    name: 'Tracking - Ping request',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Tracking - Demande de pointage',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#ed8936,#dd6b20);color:white;padding:25px;text-align:center;border-radius:8px 8px 0 0;"><div style="font-size:48px;margin-bottom:10px;">📍</div><h2>Demande de pointage</h2></div><div style="background:#fffaf0;padding:30px;border-radius:0 0 8px 8px;"><p>Bonjour Transport Express,</p><p><strong>Industriel ABC</strong> (Donneur d'ordre) demande une mise à jour de position pour le transport en cours.</p><div style="background:white;padding:15px;border-radius:8px;border-left:4px solid #ed8936;margin:15px 0;"><p><strong>Commande:</strong> ORD-2024-00142</p><p><strong>Trajet:</strong> Paris → Marseille</p><p><strong>Statut actuel:</strong> En route vers livraison</p></div><p>Merci de mettre à jour votre position pour permettre un suivi en temps réel.</p><a href="#" style="display:inline-block;background:#38a169;color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;margin:15px 0;">📍 Mettre à jour ma position</a><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },

  // === API-ORDERS - Closure ===
  {
    name: 'Closure - Order completed',
    fromEmail: 'noreply@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] Closure - Commande cloturee',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;"><h1>✅ Commande Clôturée</h1><p>api-orders</p></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"><p>La commande <strong>ORD-2024-00142</strong> a été clôturée avec succès.</p><div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;"><p><strong>Référence:</strong> ORD-2024-00142</p><p><strong>Trajet:</strong> Paris → Marseille</p><p><strong>Livraison:</strong> 15/01/2024</p><p><strong>Transporteur:</strong> Transport Express</p></div><p>📁 Cette commande sera automatiquement archivée dans 30 jours et conservée 10 ans conformément aux obligations légales.</p><p>Tous les documents (CMR, POD, factures) sont disponibles dans votre espace.</p><p><strong>From:</strong> noreply@symphonia-controltower.com</p></div></div></body></html>`
  },

  // === API-ORDERS - AI Reports ===
  {
    name: 'AI Report - Monthly analysis',
    fromEmail: 'reports@symphonia-controltower.com',
    fromName: 'SYMPHONI.A',
    subject: '[TEST] AI Report - Analyse mensuelle Janvier 2024',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;"><div style="max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:20px;border-radius:8px 8px 0 0;"><h1 style="margin:0;">Rapport d'Analyse Mensuel</h1><p style="margin:5px 0 0 0;opacity:0.9;">Janvier 2024</p></div><div style="background:#f8fafc;padding:20px;border-radius:0 0 8px 8px;"><p>Bonjour Industriel ABC,</p><p>Votre rapport d'analyse mensuel est disponible sur SYMPHONI.A.</p><div style="background:white;padding:15px;border-radius:8px;margin:15px 0;"><h3 style="margin-top:0;">Résumé</h3><p>Performance globale excellente avec une amélioration de 15% du taux de livraison à l'heure.</p></div><div style="background:white;padding:15px;border-radius:8px;margin:15px 0;"><h3 style="margin-top:0;">Points clés</h3><ul><li>142 commandes traitées (+23% vs N-1)</li><li>Taux de livraison: 98.2%</li><li>Score moyen transporteurs: 4.6/5</li></ul></div><div style="background:#eff6ff;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #3b82f6;"><strong>Recommandation principale:</strong><p style="margin:10px 0 0 0;">Optimiser les créneaux de livraison pour réduire les temps d'attente de 12%</p></div><p><strong>From:</strong> reports@symphonia-controltower.com</p></div></div></body></html>`
  }
];

function sendEmail(template, index) {
  const messageJson = {
    Subject: { Data: template.subject, Charset: 'UTF-8' },
    Body: { Html: { Data: template.html, Charset: 'UTF-8' } }
  };

  const tempFile = path.join(__dirname, `temp-msg-${index}.json`);
  fs.writeFileSync(tempFile, JSON.stringify(messageJson));

  const destJson = { ToAddresses: [TEST_EMAIL] };
  const destFile = path.join(__dirname, `temp-dest-${index}.json`);
  fs.writeFileSync(destFile, JSON.stringify(destJson));

  const fromAddress = `${template.fromName} <${template.fromEmail}>`;
  const cmd = `aws ses send-email --region ${REGION} --from "${fromAddress}" --destination file://${destFile} --message file://${tempFile}`;

  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const parsed = JSON.parse(result);
    console.log(`✅ ${template.name}`);
    fs.unlinkSync(tempFile);
    fs.unlinkSync(destFile);
    return true;
  } catch (error) {
    fs.unlinkSync(tempFile);
    fs.unlinkSync(destFile);
    const stderr = error.stderr || error.message;
    const match = stderr.match(/error[:\s]+(.+?)(\n|$)/i) || stderr.match(/(.+?)(\n|$)/);
    console.error(`❌ ${template.name}: ${match ? match[1].trim() : 'Erreur'}`);
    return false;
  }
}

async function runTests() {
  console.log('─'.repeat(60));
  console.log(`Envoi de ${templates.length} templates...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < templates.length; i++) {
    const result = sendEmail(templates[i], i);
    if (result) {
      success++;
    } else {
      failed++;
    }
    // Petit délai entre chaque envoi
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`\n📊 Résultats: ${success}/${templates.length} emails envoyés`);

  if (failed > 0) {
    console.log(`⚠️  ${failed} échec(s)`);
  } else {
    console.log('🎉 Tous les templates ont été envoyés!');
  }

  console.log(`\n📬 Vérifiez votre boîte: ${TEST_EMAIL}`);
  console.log('\nTemplates envoyés:');
  console.log('  - CRM, Analytics (api-admin)');
  console.log('  - Agent Commercial (api-sales-agents)');
  console.log('  - Invitation Logisticien (api-auth)');
  console.log('  - Notifications, Invitations (api-supplier)');
  console.log('  - Dispatch, Billing, Portal, Delivery, Documents, Tracking, Closure, AI Reports (api-orders)');
  console.log('');
}

runTests();
