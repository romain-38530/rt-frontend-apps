# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE
## Finalisation de la Plateforme SYMPHONI.A

---

| **Informations Projet** | |
|------------------------|---|
| **Nom du projet** | SYMPHONI.A - Control Tower Transport & Logistique |
| **Version du document** | 1.0 |
| **Date de création** | 8 Janvier 2026 |
| **Dernière mise à jour** | 8 Janvier 2026 |
| **Statut** | En cours de validation |
| **Classification** | Confidentiel |

| **Intervenants** | **Rôle** |
|------------------|----------|
| RT SARL | Maître d'ouvrage |
| Équipe Technique RT | Maître d'œuvre |
| Utilisateurs finaux | Industries, Transporteurs, Logisticiens |

---

## TABLE DES MATIÈRES

1. [Introduction](#1-introduction)
2. [Présentation du Projet](#2-présentation-du-projet)
3. [Périmètre et Objectifs](#3-périmètre-et-objectifs)
4. [État des Lieux](#4-état-des-lieux)
5. [Exigences Fonctionnelles](#5-exigences-fonctionnelles)
6. [Exigences Techniques](#6-exigences-techniques)
7. [Spécifications Détaillées](#7-spécifications-détaillées)
8. [Architecture et Infrastructure](#8-architecture-et-infrastructure)
9. [Sécurité et Conformité](#9-sécurité-et-conformité)
10. [Planning et Jalons](#10-planning-et-jalons)
11. [Critères de Recette](#11-critères-de-recette)
12. [Gestion des Risques](#12-gestion-des-risques)
13. [Annexes](#13-annexes)

---

## 1. INTRODUCTION

### 1.1 Objet du Document

Le présent cahier des charges a pour objet de définir les spécifications fonctionnelles et techniques nécessaires à la finalisation de la plateforme SYMPHONI.A. Il constitue le document de référence pour l'ensemble des travaux de développement, de test et de mise en production.

### 1.2 Documents de Référence

| Référence | Titre | Version |
|-----------|-------|---------|
| REF-001 | Spécifications Fonctionnelles Générales | 2.3 |
| REF-002 | Architecture Technique | 1.5 |
| REF-003 | Charte Graphique SYMPHONI.A | 1.2 |
| REF-004 | Politique de Sécurité | 1.0 |

### 1.3 Glossaire

| Terme | Définition |
|-------|------------|
| **AFFRET.IA** | Module d'affrètement intelligent utilisant l'intelligence artificielle |
| **CloudFront** | Service de diffusion de contenu (CDN) d'Amazon Web Services |
| **eCMR** | Lettre de voiture électronique (Convention CMR dématérialisée) |
| **TMS** | Transport Management System (Système de gestion du transport) |
| **Vigilance** | Module de vérification de conformité des transporteurs |
| **WebSocket** | Protocole de communication bidirectionnelle en temps réel |

---

## 2. PRÉSENTATION DU PROJET

### 2.1 Contexte

SYMPHONI.A est une plateforme SaaS B2B de gestion du transport et de la logistique. Elle interconnecte les différents acteurs de la chaîne logistique (industriels, transporteurs, logisticiens) au travers de portails web dédiés.

### 2.2 Enjeux Stratégiques

- **Digitalisation** : Dématérialisation des processus de transport
- **Optimisation** : Réduction des coûts logistiques de 15 à 25%
- **Traçabilité** : Suivi en temps réel des marchandises
- **Conformité** : Respect des obligations réglementaires (devoir de vigilance, eCMR)

### 2.3 Portails de la Plateforme

| Portail | Cible | URL de Production | Statut |
|---------|-------|-------------------|--------|
| Espace Industrie | Donneurs d'ordres | industrie.symphonia-controltower.com | Opérationnel |
| Espace Transporteur | Transporteurs routiers | transporteur.symphonia-controltower.com | Opérationnel |
| Espace Logisticien | Prestataires logistiques | logisticien.symphonia-controltower.com | Opérationnel |
| Site Vitrine | Prospects, grand public | symphonia-controltower.com | Opérationnel |
| Back-office | Administrateurs | admin.symphonia-controltower.com | Opérationnel |

---

## 3. PÉRIMÈTRE ET OBJECTIFS

### 3.1 Périmètre du Projet

Le présent cahier des charges couvre les travaux de finalisation suivants :

**Inclus dans le périmètre :**
- Correction des dysfonctionnements API identifiés
- Intégration des fonctionnalités temps réel (WebSocket)
- Développement des interactions inter-univers manquantes
- Harmonisation de l'interface utilisateur
- Tests de recette et mise en production

**Exclus du périmètre :**
- Développement de nouvelles fonctionnalités majeures
- Migration de données existantes
- Formation des utilisateurs finaux

### 3.2 Objectifs Quantifiés

| Objectif | Indicateur | Cible |
|----------|------------|-------|
| Disponibilité | Uptime | > 99,5% |
| Performance | Temps de chargement | < 3 secondes |
| Qualité | Taux de bugs critiques | 0 |
| Couverture | Tests automatisés | > 70% |
| Accessibilité | Conformité WCAG | Niveau AA |

---

## 4. ÉTAT DES LIEUX

### 4.1 Inventaire des Services Backend

L'infrastructure backend est composée de 23 microservices exposés via Amazon CloudFront :

| Service | Identifiant CloudFront | État | Criticité |
|---------|------------------------|------|-----------|
| Authentification | d2swp5s4jfg8ri | Opérationnel | Critique |
| Autorisation | ddaywxps9n701 | Opérationnel | Critique |
| Commandes | dh9acecfz0wg0 | Opérationnel | Critique |
| Planning | dpw23bg2dclr1 | Opérationnel | Haute |
| Sites de Planning | dyb8rmhhukzt6 | Opérationnel | Haute |
| Rendez-vous | d28uezz0327lfm | Non intégré | Moyenne |
| Tracking | d2mn43ccfvt3ub | Opérationnel | Haute |
| Géolocalisation | du5xhabwwbfp9 | Opérationnel | Haute |
| eCMR | d28q05cx5hmg9q | Opérationnel | Haute |
| Signature eCMR | d2ehvhc99fi3bj | Opérationnel | Haute |
| Documents | d8987l284s9q4 | Opérationnel | Moyenne |
| Palettes | d2o4ng8nutcmou | Opérationnel | Moyenne |
| Palettes Circulaires | djlfoe9zmrj66 | Opérationnel | Basse |
| Stockage | d1ea8wbaf6ws9i | Opérationnel | Moyenne |
| AFFRET.IA | d393yiia4ig3bw | Opérationnel | Haute |
| Scoring | d1uyscmpcwc65a | Opérationnel | Moyenne |
| Vigilance | d23m3oa6ef3tr1 | Opérationnel | Haute |
| Facturation | d1ciol606nbfs0 | Opérationnel | Haute |
| Abonnements | d39uizi9hzozo8 | Opérationnel | Haute |
| Tarification | d35kjzzin322yz | Opérationnel | Moyenne |
| Facturation Abonnements | d1zeelzdka3pib | Opérationnel | Moyenne |
| Notifications | d2t9age53em7o5 | Opérationnel | Haute |
| WebSocket | d2aodzk1jwptdr | Non intégré | Haute |
| Chatbot | de1913kh0ya48 | Opérationnel | Basse |
| KPI | d57lw7v3zgfpy | Opérationnel | Moyenne |
| Formation | d39f1h56c4jwz4 | Opérationnel | Basse |
| Agents Commerciaux | d3tr75b4e76icu | Opérationnel | Basse |
| Synchronisation TMS | d1yk7yneclf57m | Partiel | Moyenne |
| Transporteurs | d39uizi9hzozo8 | Opérationnel | Haute |

### 4.2 État des Portails Frontend

#### 4.2.1 Espace Industrie

| Critère | Valeur |
|---------|--------|
| Nombre de pages | 36 |
| État du build | Succès |
| Couverture API | 100% |
| Dernière mise à jour | 8 janvier 2026 |

**Fonctionnalités principales :**
- AFFRET.IA (6 onglets : Tableau de bord, Sessions, Nouvelle recherche, Bourse, Tracking IA, Vigilance)
- Gestion des commandes et suivi
- Planning et rendez-vous transporteurs
- Facturation et pré-factures
- Scoring et évaluation transporteurs
- Grilles tarifaires

#### 4.2.2 Espace Transporteur

| Critère | Valeur |
|---------|--------|
| Nombre de pages | 30 |
| État du build | Succès |
| Couverture API | 95% |
| Dernière mise à jour | 8 janvier 2026 |

**Fonctionnalités principales :**
- Bourse de fret avec système d'anonymisation
- Gestion des propositions AFFRET.IA
- Conformité et devoir de vigilance
- Référencement partenaires industriels
- Tracking GPS temps réel
- Facturation et pré-factures

#### 4.2.3 Espace Logisticien

| Critère | Valeur |
|---------|--------|
| Nombre de pages | 25 (estimé) |
| État du build | Succès |
| Couverture API | 90% |
| Dernière mise à jour | 8 janvier 2026 |

### 4.3 Anomalies Identifiées

| ID | Description | Sévérité | Portail |
|----|-------------|----------|---------|
| ANO-001 | API Rendez-vous non intégrée | Moyenne | Tous |
| ANO-002 | WebSocket non connecté | Haute | Tous |
| ANO-003 | Synchronisation TMS incomplète | Moyenne | Transporteur |
| ANO-004 | Feedback post-livraison absent | Moyenne | Industrie, Transporteur |
| ANO-005 | Chat direct non implémenté | Basse | Tous |

---

## 5. EXIGENCES FONCTIONNELLES

### 5.1 Exigences Priorité Haute (P1)

#### EF-001 : Notifications Temps Réel

**Description :** Mise en place d'un système de notifications push en temps réel sur l'ensemble des portails.

**Critères d'acceptation :**
- Les notifications sont reçues dans un délai inférieur à 2 secondes
- Un indicateur visuel signale l'état de la connexion temps réel
- Les notifications sont persistées et consultables dans un historique
- L'utilisateur peut paramétrer ses préférences de notification

**Cas d'usage couverts :**
| Événement | Destinataire | Canal |
|-----------|--------------|-------|
| Nouvelle commande | Transporteur | WebSocket + Email |
| Proposition reçue | Industriel | WebSocket |
| Attribution AFFRET.IA | Transporteur | WebSocket + SMS |
| Document expirant | Transporteur | WebSocket + Email |
| Livraison confirmée | Industriel | WebSocket |

#### EF-002 : Gestion des Rendez-vous

**Description :** Intégration complète de l'API de gestion des rendez-vous transporteurs.

**Critères d'acceptation :**
- Création, modification et annulation de rendez-vous
- Système de check-in/check-out chauffeur
- Notification automatique des parties prenantes
- Visualisation calendrier des créneaux disponibles

**Endpoints à intégrer :**
```
GET    /api/v1/appointments          Liste des rendez-vous
POST   /api/v1/appointments          Création d'un rendez-vous
PUT    /api/v1/appointments/:id      Modification
DELETE /api/v1/appointments/:id      Annulation
POST   /api/v1/appointments/:id/checkin   Enregistrement arrivée
POST   /api/v1/appointments/:id/checkout  Enregistrement départ
```

#### EF-003 : Synchronisation TMS

**Description :** Finalisation de l'intégration bidirectionnelle avec les systèmes TMS externes.

**Critères d'acceptation :**
- Configuration des connexions TMS (Shippeo, Transporeon, etc.)
- Mapping personnalisable des champs de données
- Journal de synchronisation consultable
- Mécanisme de retry automatique en cas d'échec
- Tableau de bord de l'état des synchronisations

### 5.2 Exigences Priorité Moyenne (P2)

#### EF-004 : Module de Messagerie Intégrée

**Description :** Système de chat permettant la communication directe entre les acteurs d'une commande.

**Critères d'acceptation :**
- Conversations liées aux commandes ou sessions AFFRET.IA
- Historique des échanges persistant
- Support des pièces jointes (images, PDF)
- Indicateur de lecture des messages
- Notifications temps réel des nouveaux messages

**Modèle de données :**

```
Conversation
├── id: string
├── type: 'order' | 'session' | 'support'
├── referenceId: string
├── participants: Participant[]
├── lastMessage: Message
├── unreadCount: number
├── createdAt: datetime
└── updatedAt: datetime

Message
├── id: string
├── conversationId: string
├── senderId: string
├── senderType: 'industry' | 'transporter' | 'logistician'
├── content: string
├── attachments: Attachment[]
├── readBy: string[]
└── createdAt: datetime
```

#### EF-005 : Évaluation Post-Livraison

**Description :** Système d'évaluation mutuelle après chaque livraison effectuée.

**Critères d'acceptation :**
- Déclenchement automatique à la confirmation de livraison
- Évaluation bidirectionnelle (Industriel ↔ Transporteur)
- Agrégation des notes dans le scoring global
- Possibilité de laisser un commentaire
- Délai de 7 jours pour soumettre l'évaluation

**Critères d'évaluation :**

*Industriel évalue le Transporteur :*
| Critère | Pondération |
|---------|-------------|
| Ponctualité | 25% |
| État de la marchandise | 30% |
| Communication | 20% |
| Professionnalisme | 25% |

*Transporteur évalue l'Industriel :*
| Critère | Pondération |
|---------|-------------|
| Préparation marchandise | 25% |
| Accessibilité du site | 25% |
| Temps d'attente | 25% |
| Respect délais paiement | 25% |

### 5.3 Exigences Priorité Basse (P3)

#### EF-006 : Module de Sous-traitance

**Description :** Permettre aux transporteurs de sous-traiter des missions à des partenaires.

**Critères d'acceptation :**
- Option de sous-traitance disponible après acceptation d'une mission
- Notification préalable à l'industriel (selon paramétrage)
- Traçabilité complète de la chaîne de sous-traitance
- Responsabilité maintenue au transporteur principal

#### EF-007 : Harmonisation Interface Utilisateur

**Description :** Uniformisation de l'expérience utilisateur entre les portails.

**Critères d'acceptation :**
- Application cohérente de la charte graphique
- Composants UI identiques entre les portails
- Comportements et animations uniformes
- Responsive design validé sur mobile, tablette et desktop

---

## 6. EXIGENCES TECHNIQUES

### 6.1 Exigences de Performance

| Indicateur | Objectif | Méthode de mesure |
|------------|----------|-------------------|
| Temps de chargement initial | < 3s | Lighthouse, WebPageTest |
| Time to Interactive (TTI) | < 5s | Lighthouse |
| First Contentful Paint (FCP) | < 1,5s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2,5s | Lighthouse |
| Score Lighthouse Performance | > 80 | Lighthouse |

### 6.2 Exigences de Compatibilité

**Navigateurs supportés :**
| Navigateur | Version minimale |
|------------|------------------|
| Google Chrome | 90+ |
| Mozilla Firefox | 88+ |
| Microsoft Edge | 90+ |
| Safari | 14+ |

**Résolutions supportées :**
| Dispositif | Largeur minimale |
|------------|------------------|
| Mobile | 320px |
| Tablette | 768px |
| Desktop | 1024px |
| Large Desktop | 1440px |

### 6.3 Exigences de Qualité du Code

| Critère | Objectif |
|---------|----------|
| Couverture de tests unitaires | > 70% |
| Couverture de tests E2E | Parcours critiques |
| Analyse statique (ESLint) | 0 erreur |
| Vérification des types (TypeScript) | 0 erreur |
| Vulnérabilités npm | 0 critique, 0 haute |

---

## 7. SPÉCIFICATIONS DÉTAILLÉES

### 7.1 Spécification : Module WebSocket

#### 7.1.1 Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Client Web    │◄──────────────────►│  API Gateway    │
│   (React/Next)  │                    │  (WebSocket)    │
└─────────────────┘                    └────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │  Message Broker │
                                       │    (Redis)      │
                                       └────────┬────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
           ┌────────▼────────┐        ┌────────▼────────┐        ┌────────▼────────┐
           │ Orders Service  │        │ AFFRET.IA Svc   │        │ Vigilance Svc   │
           └─────────────────┘        └─────────────────┘        └─────────────────┘
```

#### 7.1.2 Format des Messages

```typescript
interface WebSocketMessage {
  id: string;                    // Identifiant unique du message
  type: 'notification' | 'alert' | 'update' | 'chat';
  channel: 'orders' | 'affretia' | 'vigilance' | 'tracking' | 'chat';
  timestamp: string;             // ISO 8601
  payload: {
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  };
}
```

#### 7.1.3 Gestion de la Connexion

| État | Comportement |
|------|--------------|
| Connexion établie | Affichage indicateur vert |
| Déconnexion | Tentative de reconnexion automatique (backoff exponentiel) |
| Reconnexion en cours | Affichage indicateur orange |
| Échec après 5 tentatives | Passage en mode polling (fallback) |

### 7.2 Spécification : API Feedback

#### 7.2.1 Endpoints

```
POST   /api/v1/feedback
GET    /api/v1/feedback/order/:orderId
GET    /api/v1/feedback/carrier/:carrierId/stats
GET    /api/v1/feedback/industrial/:industrialId/stats
```

#### 7.2.2 Schéma de Données

```typescript
interface Feedback {
  id: string;
  orderId: string;
  fromType: 'industrial' | 'carrier';
  fromId: string;
  toType: 'industrial' | 'carrier';
  toId: string;
  ratings: {
    criterion: string;
    score: number;        // 1 à 5
    weight: number;       // Pondération en %
  }[];
  overallScore: number;   // Calculé automatiquement
  comment?: string;
  createdAt: string;
}
```

### 7.3 Spécification : Module Chat

#### 7.3.1 Endpoints

```
POST   /api/v1/chat/conversations           Créer une conversation
GET    /api/v1/chat/conversations           Lister mes conversations
GET    /api/v1/chat/conversations/:id       Détail d'une conversation
GET    /api/v1/chat/conversations/:id/messages   Messages d'une conversation
POST   /api/v1/chat/conversations/:id/messages   Envoyer un message
PUT    /api/v1/chat/messages/:id/read       Marquer comme lu
POST   /api/v1/chat/messages/:id/attachments    Ajouter une pièce jointe
```

#### 7.3.2 Règles Métier

| Règle | Description |
|-------|-------------|
| RG-CHAT-001 | Une conversation est automatiquement créée pour chaque commande |
| RG-CHAT-002 | Seuls les participants d'une commande peuvent accéder à sa conversation |
| RG-CHAT-003 | Les pièces jointes sont limitées à 10 Mo |
| RG-CHAT-004 | Les formats acceptés sont : PDF, JPG, PNG, DOCX |
| RG-CHAT-005 | L'historique est conservé 2 ans après clôture de la commande |

---

## 8. ARCHITECTURE ET INFRASTRUCTURE

### 8.1 Stack Technologique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | Next.js | 16.1.1 |
| Langage | TypeScript | 5.x |
| Styles | Tailwind CSS | 3.x |
| État | React Hooks + Context | - |
| Temps réel | WebSocket natif | - |
| Hébergement Frontend | AWS Amplify | - |
| Hébergement Backend | AWS Elastic Beanstalk | - |
| CDN | Amazon CloudFront | - |
| Base de données | MongoDB Atlas | 7.x |
| Stockage fichiers | Amazon S3 | - |
| Cache | Redis | 7.x |

### 8.2 Structure du Monorepo

```
rt-frontend-apps/
├── apps/
│   ├── web-industry/              # Portail Industriels (36 pages)
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── components/
│   │   └── .env.production
│   ├── web-transporter/           # Portail Transporteurs (30 pages)
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── components/
│   │   └── .env.production
│   ├── web-logistician/           # Portail Logisticiens
│   ├── marketing-site/            # Site vitrine
│   └── backoffice-admin/          # Back-office administration
├── packages/
│   ├── ui-components/             # Composants UI partagés
│   ├── utils/                     # Utilitaires partagés
│   └── types/                     # Types TypeScript partagés
├── config/
│   └── eslint/                    # Configuration ESLint
└── CAHIER_DES_CHARGES_FINALISATION.md
```

### 8.3 Environnements

| Environnement | Usage | URL |
|---------------|-------|-----|
| Développement | Développement local | localhost:3000 |
| Staging | Tests et validation | staging.symphonia-controltower.com |
| Production | Environnement client | *.symphonia-controltower.com |

---

## 9. SÉCURITÉ ET CONFORMITÉ

### 9.1 Exigences de Sécurité

| Exigence | Description | Priorité |
|----------|-------------|----------|
| SEC-001 | Authentification JWT avec refresh token | Critique |
| SEC-002 | Chiffrement HTTPS obligatoire (TLS 1.3) | Critique |
| SEC-003 | Protection CSRF sur tous les formulaires | Haute |
| SEC-004 | Validation des entrées utilisateur | Haute |
| SEC-005 | Audit logs des actions sensibles | Moyenne |
| SEC-006 | Rate limiting sur les API | Haute |

### 9.2 Conformité Réglementaire

| Réglementation | Exigence | Statut |
|----------------|----------|--------|
| RGPD | Consentement, droit à l'oubli, portabilité | À valider |
| Loi Sapin II | Devoir de vigilance transporteurs | Implémenté |
| eCMR | Convention CMR dématérialisée | Implémenté |
| Factur-X | Format de facturation électronique | À implémenter |

### 9.3 Protection des Données

| Donnée | Classification | Mesures |
|--------|----------------|---------|
| Identifiants utilisateur | Confidentiel | Hashage bcrypt |
| Données personnelles | Sensible | Chiffrement AES-256 |
| Documents commerciaux | Confidentiel | Stockage S3 chiffré |
| Logs applicatifs | Interne | Rétention 1 an |

---

## 10. PLANNING ET JALONS

### 10.1 Macro-Planning

```
Semaine 1 (S1) │ Semaine 2 (S2) │ Semaine 3 (S3) │ Semaine 4 (S4)
──────────────────────────────────────────────────────────────────
   P1: WebSocket, RDV, TMS        P2: Chat, Feedback, UI         Tests et Documentation
   ════════════════════          ═══════════════════════         ═══════════════════════
```

### 10.2 Planning Détaillé

#### Semaine 1 : Exigences Priorité Haute

| Jour | Tâche | Livrable |
|------|-------|----------|
| Lundi | WebSocket - Configuration connexion | Connexion établie |
| Mardi | WebSocket - Réception notifications | Notifications fonctionnelles |
| Mercredi | API Rendez-vous - Intégration GET/POST | CRUD opérationnel |
| Jeudi | API Rendez-vous - Check-in/Check-out | Flux complet |
| Vendredi | TMS Sync - Configuration et mapping | Interface admin |

#### Semaine 2 : Exigences Priorité Moyenne

| Jour | Tâche | Livrable |
|------|-------|----------|
| Lundi | Module Chat - Backend | API fonctionnelle |
| Mardi | Module Chat - Frontend | Interface utilisateur |
| Mercredi | Module Feedback - Backend | API fonctionnelle |
| Jeudi | Module Feedback - Frontend | Interface utilisateur |
| Vendredi | Harmonisation UI - Composants | Bibliothèque unifiée |

#### Semaine 3 : Tests et Corrections

| Jour | Tâche | Livrable |
|------|-------|----------|
| Lundi | Module Sous-traitance | Fonctionnalité complète |
| Mardi | Tests unitaires | Couverture > 70% |
| Mercredi | Tests E2E | Parcours critiques validés |
| Jeudi | Corrections bugs | Zéro bug bloquant |
| Vendredi | Tests de charge | Rapport de performance |

#### Semaine 4 : Documentation et Mise en Production

| Jour | Tâche | Livrable |
|------|-------|----------|
| Lundi | Documentation API | Swagger/OpenAPI |
| Mardi | Documentation utilisateur | Guides par portail |
| Mercredi | Audit accessibilité | Rapport WCAG |
| Jeudi | Audit sécurité | Rapport OWASP |
| Vendredi | Mise en production | Déploiement validé |

### 10.3 Jalons

| Jalon | Date | Critère de validation |
|-------|------|----------------------|
| J1 - Temps réel opérationnel | Fin S1 | WebSocket fonctionnel sur tous les portails |
| J2 - Fonctionnalités P2 livrées | Fin S2 | Chat et Feedback opérationnels |
| J3 - Recette validée | Fin S3 | 0 anomalie bloquante |
| J4 - Mise en production | Fin S4 | Déploiement effectué |

---

## 11. CRITÈRES DE RECETTE

### 11.1 Critères Fonctionnels

| ID | Critère | Méthode de validation |
|----|---------|----------------------|
| CF-001 | Tous les builds compilent sans erreur | Exécution `npm run build` |
| CF-002 | Toutes les pages sont accessibles | Navigation manuelle |
| CF-003 | Les API retournent des données cohérentes | Tests automatisés |
| CF-004 | Les interactions cross-univers fonctionnent | Tests E2E |
| CF-005 | Les notifications temps réel sont reçues < 2s | Tests de performance |

### 11.2 Critères de Performance

| ID | Critère | Seuil | Méthode |
|----|---------|-------|---------|
| CP-001 | Temps de chargement initial | < 3s | Lighthouse |
| CP-002 | Time to Interactive | < 5s | Lighthouse |
| CP-003 | Score Lighthouse | > 80 | Lighthouse |
| CP-004 | Absence de memory leaks | 0 détecté | Chrome DevTools |

### 11.3 Critères de Qualité

| ID | Critère | Seuil |
|----|---------|-------|
| CQ-001 | Couverture tests | > 70% |
| CQ-002 | Erreurs critiques sécurité | 0 |
| CQ-003 | Conformité WCAG | Niveau AA |
| CQ-004 | Documentation à jour | 100% |

### 11.4 Procédure de Recette

1. **Recette unitaire** : Validation de chaque fonctionnalité individuellement
2. **Recette d'intégration** : Validation des flux inter-modules
3. **Recette utilisateur** : Validation par des utilisateurs représentatifs
4. **Recette de performance** : Validation des temps de réponse
5. **Recette de sécurité** : Audit des vulnérabilités

---

## 12. GESTION DES RISQUES

### 12.1 Matrice des Risques

| ID | Risque | Probabilité | Impact | Criticité | Mitigation |
|----|--------|-------------|--------|-----------|------------|
| R-001 | Indisponibilité API backend | Moyenne | Élevé | Haute | Mock data fallback + monitoring |
| R-002 | Incompatibilité WebSocket navigateurs | Faible | Moyen | Moyenne | Fallback polling HTTP |
| R-003 | Dégradation performance | Moyenne | Moyen | Moyenne | Cache + lazy loading |
| R-004 | Régression fonctionnelle | Moyenne | Élevé | Haute | Tests E2E automatisés |
| R-005 | Dépassement délais | Moyenne | Moyen | Moyenne | Priorisation et découpage |

### 12.2 Plan de Contingence

| Risque | Action de contingence |
|--------|----------------------|
| R-001 | Activation du mode dégradé avec données en cache |
| R-002 | Basculement automatique sur polling toutes les 5 secondes |
| R-003 | Désactivation des fonctionnalités non critiques |
| R-004 | Rollback vers la version précédente |
| R-005 | Report des fonctionnalités P3 |

---

## 13. ANNEXES

### Annexe A : Liste des Pages par Portail

#### A.1 Espace Industrie (36 pages)

```
/                          Page d'accueil / Tableau de bord
/404                       Page d'erreur
/affret-ia                 Module AFFRET.IA (6 onglets)
/billing                   Facturation
/borne-chauffeur           Borne d'accueil chauffeurs
/chatbot                   Assistant virtuel
/copilote-chauffeur        Application chauffeur
/dashboard                 Tableau de bord détaillé
/delegation-logistique     Délégation à un logisticien
/dispatch-config           Configuration du dispatch
/ecmr                      Lettres de voiture électroniques
/grille-tarifaire-config   Configuration grilles tarifaires
/icpe-partenaires          Gestion ICPE partenaires
/kpi                       Indicateurs de performance
/login                     Connexion
/logisticians              Gestion des logisticiens
/notifications             Centre de notifications
/orders                    Liste des commandes
/orders/[id]               Détail d'une commande
/orders/[id]/documents     Documents d'une commande
/orders/[id]/tracking      Suivi d'une commande
/orders/edit               Édition de commande
/palettes                  Gestion des palettes
/planning                  Planning des livraisons
/pricing-grids             Grilles tarifaires
/privacy                   Politique de confidentialité
/production                Planning de production
/rdv-transporteurs         Rendez-vous transporteurs
/scoring                   Scoring transporteurs
/storage                   Stockage
/storage-market            Marketplace stockage
/subscription              Gestion de l'abonnement
/team                      Gestion de l'équipe
/training                  Modules de formation
/transporteurs             Gestion des transporteurs référencés
```

#### A.2 Espace Transporteur (30 pages)

```
/                          Page d'accueil
/404                       Page d'erreur
/billing                   Facturation et pré-factures
/bourse                    Bourse de fret AFFRET.IA
/chatbot                   Assistant virtuel
/documents                 Gestion documentaire
/ecmr                      Lettres de voiture électroniques
/grille-tarifaire          Mes grilles tarifaires
/inscription               Inscription nouveau transporteur
/kpi                       Indicateurs de performance
/login                     Connexion
/mes-affectations          Mes missions attribuées
/mes-propositions          Mes propositions AFFRET.IA
/notifications             Centre de notifications
/orders                    Mes commandes
/orders/[id]               Détail d'une commande
/palettes                  Gestion des palettes
/planning                  Mon planning
/referencement             Mon référencement industriels
/scoring                   Mon score et classement
/storage                   Stockage
/subscription              Mon abonnement
/team                      Mon équipe
/tms-sync                  Synchronisation TMS
/tracking                  Tracking GPS
/training                  Modules de formation
/upgrade                   Mise à niveau abonnement
/upgrade/success           Confirmation mise à niveau
/vigilance                 Conformité et vigilance
```

### Annexe B : Variables d'Environnement

```env
# ==========================================
# AUTHENTIFICATION
# ==========================================
NEXT_PUBLIC_AUTH_API_URL=https://d2swp5s4jfg8ri.cloudfront.net
NEXT_PUBLIC_AUTHZ_API_URL=https://ddaywxps9n701.cloudfront.net

# ==========================================
# SERVICES MÉTIER PRINCIPAUX
# ==========================================
NEXT_PUBLIC_ORDERS_API_URL=https://dh9acecfz0wg0.cloudfront.net
NEXT_PUBLIC_PLANNING_API_URL=https://dpw23bg2dclr1.cloudfront.net
NEXT_PUBLIC_PLANNING_SITES_API_URL=https://dyb8rmhhukzt6.cloudfront.net
NEXT_PUBLIC_APPOINTMENTS_API_URL=https://d28uezz0327lfm.cloudfront.net

# ==========================================
# TRACKING ET GÉOLOCALISATION
# ==========================================
NEXT_PUBLIC_TRACKING_API_URL=https://d2mn43ccfvt3ub.cloudfront.net
NEXT_PUBLIC_GEO_TRACKING_API_URL=https://du5xhabwwbfp9.cloudfront.net

# ==========================================
# DOCUMENTS
# ==========================================
NEXT_PUBLIC_ECMR_API_URL=https://d28q05cx5hmg9q.cloudfront.net
NEXT_PUBLIC_ECMR_SIGNATURE_API_URL=https://d2ehvhc99fi3bj.cloudfront.net
NEXT_PUBLIC_DOCUMENTS_API_URL=https://d8987l284s9q4.cloudfront.net

# ==========================================
# INTELLIGENCE ARTIFICIELLE
# ==========================================
NEXT_PUBLIC_AFFRET_IA_API_URL=https://d393yiia4ig3bw.cloudfront.net
NEXT_PUBLIC_SCORING_API_URL=https://d1uyscmpcwc65a.cloudfront.net
NEXT_PUBLIC_VIGILANCE_API_URL=https://d23m3oa6ef3tr1.cloudfront.net

# ==========================================
# FACTURATION ET ABONNEMENTS
# ==========================================
NEXT_PUBLIC_BILLING_API_URL=https://d1ciol606nbfs0.cloudfront.net
NEXT_PUBLIC_SUBSCRIPTIONS_API_URL=https://d39uizi9hzozo8.cloudfront.net
NEXT_PUBLIC_SUBSCRIPTIONS_PRICING_API_URL=https://d35kjzzin322yz.cloudfront.net
NEXT_PUBLIC_SUBSCRIPTION_INVOICING_API_URL=https://d1zeelzdka3pib.cloudfront.net

# ==========================================
# COMMUNICATION
# ==========================================
NEXT_PUBLIC_NOTIFICATIONS_API_URL=https://d2t9age53em7o5.cloudfront.net
NEXT_PUBLIC_WEBSOCKET_API_URL=https://d2aodzk1jwptdr.cloudfront.net
NEXT_PUBLIC_CHATBOT_API_URL=https://de1913kh0ya48.cloudfront.net

# ==========================================
# AUTRES SERVICES
# ==========================================
NEXT_PUBLIC_KPI_API_URL=https://d57lw7v3zgfpy.cloudfront.net
NEXT_PUBLIC_STORAGE_MARKET_API_URL=https://d1ea8wbaf6ws9i.cloudfront.net
NEXT_PUBLIC_TRAINING_API_URL=https://d39f1h56c4jwz4.cloudfront.net
NEXT_PUBLIC_PALETTES_API_URL=https://d2o4ng8nutcmou.cloudfront.net
NEXT_PUBLIC_PALETTES_CIRCULAR_API_URL=https://djlfoe9zmrj66.cloudfront.net
NEXT_PUBLIC_TMS_SYNC_API_URL=https://d1yk7yneclf57m.cloudfront.net
NEXT_PUBLIC_CARRIERS_API_URL=https://d39uizi9hzozo8.cloudfront.net
```

### Annexe C : Diagramme des Interactions Cross-Univers

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SYMPHONI.A                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│   INDUSTRIE   │         │ TRANSPORTEUR  │         │  LOGISTICIEN  │
│               │         │               │         │               │
│ • Commandes   │◄───────►│ • Propositions│◄───────►│ • Délégation  │
│ • AFFRET.IA   │         │ • Missions    │         │ • ICPE        │
│ • Vigilance   │         │ • Vigilance   │         │ • Planning    │
│ • Scoring     │         │ • Scoring     │         │               │
│ • Facturation │         │ • Facturation │         │               │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                         │
        │    ┌────────────────────┼────────────────────┐    │
        │    │                    │                    │    │
        │    ▼                    ▼                    ▼    │
        │  ┌─────────────────────────────────────────────┐  │
        │  │              INTERACTIONS                    │  │
        │  │                                              │  │
        │  │  • Référencement    (Industrie ↔ Transport) │  │
        │  │  • Attribution      (AFFRET.IA)             │  │
        │  │  • Contre-offres    (Négociation)           │  │
        │  │  • Feedback         (Post-livraison)        │  │
        │  │  • Chat             (Messagerie)            │  │
        │  │  • Sous-traitance   (Transport ↔ Logist.)  │  │
        │  │                                              │  │
        │  └─────────────────────────────────────────────┘  │
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │      BACK-OFFICE        │
                    │                         │
                    │  • Administration       │
                    │  • Support              │
                    │  • Analytics            │
                    └─────────────────────────┘
```

---

## SIGNATURES

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| Maître d'ouvrage | | | |
| Maître d'œuvre | | | |
| Responsable technique | | | |
| Responsable qualité | | | |

---

*Document généré le 8 janvier 2026*
*Version 1.0 - En attente de validation*
