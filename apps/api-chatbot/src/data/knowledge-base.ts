// Articles de base de connaissances

export const initialKnowledgeArticles = [
  {
    title: "Guide d'intégration API - Démarrage rapide",
    summary: "Guide complet pour intégrer l'API RT Technologie à votre système en moins de 30 minutes",
    content: `# Guide d'intégration API

## Prérequis
- Compte RT Technologie actif
- Clés API (obtenues depuis votre dashboard)
- Environnement de développement avec support HTTP/REST

## Étapes d'intégration

### 1. Obtenir vos clés API
Connectez-vous à votre dashboard > Paramètres > API & Intégrations > Générer nouvelle clé

### 2. Authentification
Toutes les requêtes doivent inclure votre API key dans le header Authorization :
\`\`\`
Authorization: Bearer VOTRE_API_KEY
\`\`\`

### 3. Endpoints principaux
- Auth API : https://auth-api.rt-technologie.com
- Orders API : https://orders-api.rt-technologie.com
- Tracking API : https://tracking-api.rt-technologie.com
- Planning API : https://planning-api.rt-technologie.com

### 4. Exemple de requête
\`\`\`javascript
fetch('https://orders-api.rt-technologie.com/api/v1/orders', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
\`\`\`

### 5. Webhooks (optionnel)
Configurez des webhooks pour recevoir des notifications en temps réel :
- Événements disponibles : order.created, order.updated, delivery.completed
- URL de callback à configurer dans votre dashboard

## Support
Documentation complète : docs.rt-technologie.com
Support : support@rt-technologie.com`,
    category: "Intégration",
    tags: ["api", "intégration", "démarrage", "guide"],
    botTypes: ["helpbot"],
    author: "RT Support Team",
    status: "published",
  },

  {
    title: "Résolution des erreurs API courantes",
    summary: "Solutions aux erreurs les plus fréquentes rencontrées lors de l'utilisation de l'API",
    content: `# Résolution des erreurs API

## Erreur 401 - Unauthorized
**Cause** : Token d'authentification invalide ou expiré
**Solution** :
- Vérifiez que votre API key est correcte
- Assurez-vous que le header Authorization est bien formaté : \`Bearer YOUR_KEY\`
- Régénérez une nouvelle clé si nécessaire

## Erreur 403 - Forbidden
**Cause** : Permissions insuffisantes
**Solution** :
- Vérifiez que votre compte a les permissions requises
- Certains endpoints nécessitent des rôles spécifiques
- Contactez votre administrateur pour obtenir les accès

## Erreur 404 - Not Found
**Cause** : Ressource inexistante ou URL incorrecte
**Solution** :
- Vérifiez l'URL de l'endpoint
- Assurez-vous que l'ID de la ressource existe
- Consultez la documentation pour l'URL correcte

## Erreur 429 - Too Many Requests
**Cause** : Limite de taux dépassée
**Solution** :
- Ralentissez vos requêtes
- Implémentez un système de retry avec backoff exponentiel
- Contactez-nous pour augmenter votre quota si nécessaire

## Erreur 500 - Server Error
**Cause** : Erreur côté serveur
**Solution** :
- Réessayez après quelques secondes
- Vérifiez le status des services sur status.rt-technologie.com
- Si le problème persiste, créez un ticket de support`,
    category: "Débogage",
    tags: ["erreur", "api", "débogage", "troubleshooting"],
    botTypes: ["helpbot"],
    author: "RT Support Team",
    status: "published",
  },

  {
    title: "Configuration optimale du Planning de chargement",
    summary: "Bonnes pratiques pour configurer et utiliser efficacement le module de planning",
    content: `# Configuration du Planning de chargement

## Configuration initiale

### 1. Définir vos quais
- Créez tous vos quais avec leurs caractéristiques
- Définissez les horaires d'ouverture
- Indiquez les équipements disponibles (transpalette, chariot, etc.)

### 2. Configurer les créneaux
- Durée standard d'un créneau (recommandé : 30-60 min)
- Temps de battement entre créneaux (recommandé : 15 min)
- Créneaux simultanés par quai (selon votre capacité)

### 3. Règles métier
- Délai minimum de réservation (ex: 24h avant)
- Autoriser ou non les modifications
- Gestion des absences et jours fériés

## Bonnes pratiques

### Optimisation
- Regroupez les livraisons par zone géographique
- Priorisez les chargements complets
- Utilisez l'IA pour suggérer les meilleurs créneaux

### Communication
- Activez les notifications automatiques
- Envoyez des rappels 24h avant
- Configurez les emails de confirmation

### Suivi
- Consultez le dashboard de statistiques
- Analysez le taux d'occupation
- Identifiez les créneaux sous-utilisés`,
    category: "Planning",
    tags: ["planning", "configuration", "optimisation", "quai"],
    botTypes: ["planif-ia", "quai-wms"],
    author: "RT Planning Expert",
    status: "published",
  },

  {
    title: "Guide complet de l'eCMR (CMR électronique)",
    summary: "Tout savoir sur le CMR électronique : génération, signature, archivage et conformité légale",
    content: `# Guide eCMR - CMR Électronique

## Qu'est-ce que l'eCMR ?
L'eCMR (electronic Consignment Note) est la version digitale de la lettre de voiture CMR, ayant la même valeur légale que le document papier depuis le protocole additionnel de 2008.

## Avantages
- ✓ Réduction des erreurs de saisie
- ✓ Signature électronique sécurisée
- ✓ Archivage automatique
- ✓ Traçabilité complète
- ✓ Gain de temps administratif
- ✓ Écologique (zéro papier)

## Comment générer un eCMR

### Depuis le transporteur
1. Commandes > Sélectionner transport
2. Documents > Générer eCMR
3. Vérifier les informations pré-remplies
4. Valider la génération

### Informations requises
- Expéditeur et destinataire
- Lieu et date de chargement/livraison
- Description de la marchandise
- Poids et volume
- Instructions spéciales

## Signature électronique

### Au chargement
- Le chauffeur signe sur tablette/smartphone
- L'expéditeur valide le chargement
- Le document est horodaté

### À la livraison
- Le destinataire vérifie la marchandise
- Signature électronique de réception
- Option de noter des réserves

## Conformité légale
L'eCMR RT Technologie est conforme :
- Protocole eCMR de Genève
- Règlement eIDAS sur la signature électronique
- RGPD pour les données personnelles

## Archivage
- Conservation 10 ans minimum
- Accès instantané depuis votre dashboard
- Export PDF à tout moment
- Sauvegarde sécurisée et chiffrée`,
    category: "Documents",
    tags: ["ecmr", "cmr", "signature", "documents", "légal"],
    botTypes: ["routier", "expedition", "copilote"],
    author: "RT Legal Team",
    status: "published",
  },

  {
    title: "Optimisation du taux de remplissage avec Affret.IA",
    summary: "Utilisez l'intelligence artificielle pour optimiser le remplissage de vos véhicules et réduire vos coûts",
    content: `# Optimisation du taux de remplissage

## Principe
Le taux de remplissage mesure l'utilisation effective de l'espace disponible dans un véhicule. Un taux optimal réduit les coûts et l'impact environnemental.

## Calcul automatique

### Données requises
- Dimensions des colis (L x l x h)
- Poids de chaque colis
- Fragilité et contraintes d'empilement
- Type de véhicule disponible

### L'IA analyse
- Optimisation 3D du chargement
- Respect des contraintes de poids
- Ordre de chargement/déchargement
- Équilibrage de la charge

## Résultats fournis
- Taux de remplissage volumique (%)
- Taux de remplissage pondéral (%)
- Plan de chargement 3D
- Type de véhicule recommandé

## Bonnes pratiques

### Augmenter le taux de remplissage
- Groupez les livraisons par zone
- Utilisez le groupage intelligent
- Optimisez les emballages
- Privilégiez les palettes standardisées

### Seuils recommandés
- Excellent : > 85%
- Bon : 70-85%
- Acceptable : 60-70%
- À améliorer : < 60%

## Économies potentielles
Un passage de 60% à 80% de taux de remplissage = 25% de réduction des coûts de transport

## Fonctionnalités avancées
- Suggestion de groupages
- Comparaison de scénarios
- Calcul d'impact CO2
- Historique et analytics`,
    category: "Optimisation",
    tags: ["affret-ia", "optimisation", "remplissage", "ia", "économie"],
    botTypes: ["freight-ia"],
    author: "RT IA Team",
    status: "published",
  },

  {
    title: "Gestion des palettes EUR et EPAL",
    summary: "Guide complet pour gérer les échanges de palettes entre transporteurs et chargeurs",
    content: `# Gestion des palettes

## Types de palettes

### EUR (Europe)
- Dimensions : 120 x 80 cm
- Poids : ~25 kg
- Charge max : 1500 kg
- Marquage : EUR dans un ovale

### EPAL (European Pallet Association)
- Mêmes dimensions que EUR
- Certification EPAL
- Contrôle qualité renforcé
- Échangeable avec EUR

## Principe d'échange
Le système d'échange de palettes fonctionne sur la base du "poids pour poids" : une palette livrée = une palette reprise.

## Enregistrement dans RT

### Au chargement
- Nombre de palettes chargées
- Type (EUR/EPAL/autres)
- État (bon/moyen/mauvais)

### À la livraison
- Palettes livrées
- Palettes reprises
- Calcul automatique du solde

## Suivi du solde

### Tableau de bord
- Solde par client/fournisseur
- Historique des échanges
- Alertes sur déséquilibres

### Régularisation
- Échange physique
- Compensation financière
- Accord de compensation

## Valorisation
- Palette EUR neuve : 10-15€
- Palette EUR occasion : 5-10€
- Palette EPAL : +20% vs EUR

## Litiges
En cas de désaccord :
1. Vérifier les BL signés
2. Consulter l'historique photo
3. Médiation via la plateforme
4. Arbitrage si nécessaire`,
    category: "Palettes",
    tags: ["palettes", "eur", "epal", "échange", "gestion"],
    botTypes: ["routier", "quai-wms", "expedition"],
    author: "RT Operations",
    status: "published",
  },

  {
    title: "Système de scoring des transporteurs",
    summary: "Comprendre le système de notation des transporteurs pour choisir les meilleurs partenaires",
    content: `# Scoring des transporteurs

## Score sur 100 points

### Critères de notation

#### Ponctualité (30 points)
- % de livraisons à l'heure
- Respect des créneaux
- Notifications en cas de retard

#### Qualité (25 points)
- Taux d'incidents
- État des marchandises
- Respect des consignes

#### Satisfaction (20 points)
- Notes clients
- Feedbacks positifs
- Réclamations

#### Prix (15 points)
- Compétitivité tarifaire
- Transparence
- Stabilité des prix

#### Communication (10 points)
- Réactivité
- Qualité des échanges
- Proactivité

## Interprétation

### 90-100 : Excellence
Transporteur premium, fiabilité maximale

### 75-89 : Très bon
Transporteur de confiance, recommandé

### 60-74 : Bon
Transporteur correct, quelques améliorations possibles

### < 60 : À améliorer
Suivi renforcé nécessaire

## Utilisation

### Lors de la sélection
- Filtrez par score minimum
- Comparez plusieurs transporteurs
- Vérifiez les détails du scoring

### Suivi
- Évolution du score dans le temps
- Identification des tendances
- Actions correctives si baisse

## Avantages pour les transporteurs
- Visibilité accrue si bon score
- Plus de commandes
- Tarifs préférentiels possibles
- Reconnaissance de la qualité

## Transparence
Chaque transporteur peut consulter :
- Son score détaillé
- Les critères de notation
- Les axes d'amélioration
- L'historique d'évolution`,
    category: "Scoring",
    tags: ["scoring", "transporteur", "notation", "qualité", "sélection"],
    botTypes: ["freight-ia", "expedition"],
    author: "RT Quality Team",
    status: "published",
  },

  {
    title: "Réglementation des temps de conduite et de repos",
    summary: "Guide sur la réglementation européenne des temps de conduite pour les chauffeurs routiers",
    content: `# Temps de conduite et de repos

## Règlement CE 561/2006

### Temps de conduite journalier
- Maximum : 9 heures
- Extension possible : 10h (2 fois par semaine)
- Conduite continue max : 4h30

### Pauses obligatoires
Après 4h30 de conduite :
- 45 minutes consécutives
- OU 15 min + 30 min

### Repos journalier
- Repos normal : 11 heures
- Repos réduit : 9h (3x par semaine)

### Repos hebdomadaire
- Repos normal : 45 heures
- Repos réduit : 24h (compensé ultérieurement)

## Suivi dans l'application

### Chronomètre automatique
- Décompte du temps de conduite
- Alertes avant limite
- Pause automatique lors des arrêts

### Notifications
- Alerte 15 min avant 4h30
- Rappel de pause
- Suggestion de repos

### Historique
- Journal de bord automatique
- Export pour contrôle
- Conformité garantie

## Sanctions
- Infraction mineure : 135€
- Infraction grave : 1500€
- Immobilisation du véhicule possible
- Retrait de points sur le permis

## Bonnes pratiques
- Planifiez vos pauses à l'avance
- Utilisez les aires de repos sécurisées
- Synchronisez avec votre tachygraphe
- Anticipez les imprévus`,
    category: "Réglementation",
    tags: ["conduite", "repos", "réglementation", "temps", "chauffeur"],
    botTypes: ["copilote", "routier"],
    author: "RT Compliance",
    status: "published",
  },

  {
    title: "Gestion des incidents et réclamations",
    summary: "Procédure pour signaler et gérer efficacement les incidents de transport",
    content: `# Gestion des incidents

## Types d'incidents

### Lors du transport
- Retard de livraison
- Marchandise endommagée
- Perte partielle ou totale
- Non-respect des consignes

### À la réception
- Quantité incorrecte
- Produit non conforme
- Emballage détérioré
- Livraison refusée

## Procédure de signalement

### 1. Constatation
- Documenter l'incident (photos, vidéos)
- Noter tous les détails
- Faire constater par le livreur si possible

### 2. Déclaration
- Signaler immédiatement dans l'app
- Remplir le formulaire d'incident
- Joindre les preuves

### 3. Réserves sur documents
- Indiquer sur le BL/CMR
- Être précis et factuel
- Faire signer les réserves

## Traitement

### Analyse
- Examen des preuves
- Vérification du contexte
- Audition des parties

### Résolution
- Proposition de solution
- Négociation amiable
- Compensation si justifié

### Délais
- Accusé réception : immédiat
- Premier retour : 24-48h
- Résolution : 5-10 jours

## Prévention
- Formation des équipes
- Emballages adaptés
- Instructions claires
- Suivi renforcé

## Médiation
En cas de désaccord :
- Service médiation RT
- Expert indépendant
- Arbitrage commercial`,
    category: "Incidents",
    tags: ["incident", "réclamation", "litige", "procédure"],
    botTypes: ["all"],
    author: "RT Claims Team",
    status: "published",
  },

  {
    title: "Sécurité des données et conformité RGPD",
    summary: "Comment RT Technologie protège vos données et respecte le RGPD",
    content: `# Sécurité et RGPD

## Protection des données

### Chiffrement
- SSL/TLS pour tous les échanges
- Données au repos chiffrées (AES-256)
- Clés gérées de manière sécurisée

### Accès
- Authentification forte
- 2FA disponible
- Gestion fine des permissions
- Logs d'accès conservés

### Infrastructure
- Hébergement en Europe (AWS)
- Redondance des données
- Sauvegardes quotidiennes
- Plan de continuité d'activité

## Conformité RGPD

### Vos droits
- Accès à vos données
- Rectification
- Effacement
- Portabilité
- Opposition au traitement

### Nos engagements
- Minimisation des données
- Conservation limitée
- Transparence totale
- DPO dédié

### Exercer vos droits
- Via votre dashboard
- Email : privacy@rt-technologie.com
- Réponse sous 30 jours

## Certifications
- ISO 27001 (Sécurité)
- SOC 2 Type II
- Hébergeur certifié HDS

## Audits
- Audit de sécurité annuel
- Tests d'intrusion réguliers
- Veille sur les vulnérabilités
- Bug bounty program

## En cas d'incident
- Notification sous 72h
- Communication transparente
- Mesures correctives immédiates
- Support dédié`,
    category: "Sécurité",
    tags: ["sécurité", "rgpd", "données", "conformité", "protection"],
    botTypes: ["all"],
    author: "RT Security Team",
    status: "published",
  },
];
