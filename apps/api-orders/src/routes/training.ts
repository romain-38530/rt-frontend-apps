/**
 * Routes pour la gestion des modules de formation SYMPHONI.A
 */
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import TrainingModule from '../models/TrainingModule';

const router = Router();

// GET /training/modules - Liste des modules de formation
router.get('/modules', async (req: Request, res: Response) => {
  try {
    const { portal, category, status = 'published' } = req.query;

    const filter: any = { status };

    // Filtrer par portail
    if (portal) {
      filter.$or = [
        { portals: portal },
        { portals: 'all' }
      ];
    }

    if (category) {
      filter.category = category;
    }

    const modules = await TrainingModule.find(filter).sort({ order: 1, createdAt: -1 });

    // Grouper par catégorie
    const grouped = modules.reduce((acc: any, mod) => {
      if (!acc[mod.category]) {
        acc[mod.category] = [];
      }
      acc[mod.category].push({
        id: mod.moduleId,
        moduleId: mod.moduleId,
        title: mod.title,
        description: mod.description,
        category: mod.category,
        icon: mod.icon,
        duration: mod.duration,
        lessonsCount: mod.lessons.length,
        portals: mod.portals,
        tags: mod.tags,
        prerequisites: mod.prerequisites
      });
      return acc;
    }, {});

    res.json({
      modules: modules.map(m => ({
        id: m.moduleId,
        moduleId: m.moduleId,
        title: m.title,
        description: m.description,
        category: m.category,
        icon: m.icon,
        duration: m.duration,
        lessonsCount: m.lessons.length,
        portals: m.portals,
        tags: m.tags,
        prerequisites: m.prerequisites
      })),
      byCategory: grouped,
      total: modules.length
    });
  } catch (error) {
    console.error('Error fetching training modules:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des modules' });
  }
});

// GET /training/modules/:moduleId - Détail d'un module
router.get('/modules/:moduleId', async (req: Request, res: Response) => {
  try {
    const module = await TrainingModule.findOne({ moduleId: req.params.moduleId });
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    res.json({
      id: module.moduleId,
      ...module.toObject()
    });
  } catch (error) {
    console.error('Error fetching training module:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du module' });
  }
});

// GET /training/categories - Liste des catégories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const { portal } = req.query;

    const filter: any = { status: 'published' };
    if (portal) {
      filter.$or = [
        { portals: portal },
        { portals: 'all' }
      ];
    }

    const categories = await TrainingModule.distinct('category', filter);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// POST /training/modules - Créer un module (admin)
router.post('/modules', async (req: Request, res: Response) => {
  try {
    const { title, description, category, portals, icon, duration, lessons, prerequisites, tags } = req.body;

    const moduleId = `mod_${uuidv4()}`;

    const module = new TrainingModule({
      moduleId,
      title,
      description,
      category,
      portals: portals || ['all'],
      icon,
      duration: duration || 30,
      lessons: (lessons || []).map((l: any, index: number) => ({
        lessonId: `les_${uuidv4()}`,
        title: l.title,
        description: l.description,
        contentType: l.contentType || 'video',
        contentUrl: l.contentUrl,
        duration: l.duration || 10,
        order: index
      })),
      prerequisites,
      tags,
      status: 'published',
      createdBy: req.headers['x-user-id'] as string || 'system'
    });

    await module.save();

    res.status(201).json({
      id: module.moduleId,
      ...module.toObject()
    });
  } catch (error) {
    console.error('Error creating training module:', error);
    res.status(500).json({ error: 'Erreur lors de la création du module' });
  }
});

// PUT /training/modules/:moduleId - Mettre à jour un module
router.put('/modules/:moduleId', async (req: Request, res: Response) => {
  try {
    const { title, description, category, portals, icon, duration, lessons, prerequisites, tags, status } = req.body;

    const module = await TrainingModule.findOne({ moduleId: req.params.moduleId });
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    if (title) module.title = title;
    if (description) module.description = description;
    if (category) module.category = category;
    if (portals) module.portals = portals;
    if (icon) module.icon = icon;
    if (duration) module.duration = duration;
    if (prerequisites) module.prerequisites = prerequisites;
    if (tags) module.tags = tags;
    if (status) module.status = status;

    if (lessons) {
      module.lessons = lessons.map((l: any, index: number) => ({
        lessonId: l.lessonId || `les_${uuidv4()}`,
        title: l.title,
        description: l.description,
        contentType: l.contentType || 'video',
        contentUrl: l.contentUrl,
        duration: l.duration || 10,
        order: index
      }));
    }

    await module.save();

    res.json({
      id: module.moduleId,
      ...module.toObject()
    });
  } catch (error) {
    console.error('Error updating training module:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du module' });
  }
});

// DELETE /training/modules/:moduleId - Supprimer un module
router.delete('/modules/:moduleId', async (req: Request, res: Response) => {
  try {
    const module = await TrainingModule.findOneAndDelete({ moduleId: req.params.moduleId });
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    res.json({ success: true, message: 'Module supprimé' });
  } catch (error) {
    console.error('Error deleting training module:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du module' });
  }
});

// POST /training/seed - Initialiser les modules de base
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const existingCount = await TrainingModule.countDocuments();
    if (existingCount > 0) {
      return res.json({ message: 'Modules déjà initialisés', count: existingCount });
    }

    const baseModules = [
      // PRISE EN MAIN
      {
        moduleId: 'mod_dashboard',
        title: 'Navigation et Tableau de Bord',
        description: 'Maîtrisez l\'interface SYMPHONI.A : navigation, widgets, personnalisation',
        category: 'Prise en main',
        portals: ['all'],
        icon: '🏠',
        duration: 20,
        order: 1,
        lessons: [
          {
            lessonId: 'les_1',
            title: 'Découverte de l\'interface',
            contentType: 'video',
            duration: 8,
            order: 0,
            content: `# Mode Opératoire : Découverte de l'interface SYMPHONI.A

## Objectif
Comprendre l'organisation de l'interface et naviguer efficacement dans l'application.

## Étapes

### 1. Connexion à l'application
- Accédez à l'URL de votre portail SYMPHONI.A
- Saisissez votre email et mot de passe
- Cliquez sur "Connexion"

### 2. Vue d'ensemble du tableau de bord
Le tableau de bord est divisé en plusieurs zones :
- **En-tête** : Logo, barre de recherche, notifications, profil
- **Menu latéral gauche** : Navigation principale vers les modules
- **Zone centrale** : Widgets et indicateurs clés (KPIs)
- **Pied de page** : Version, support, liens utiles

### 3. Menu de navigation
Le menu latéral contient les sections principales :
- 🏠 Tableau de bord
- 📝 Commandes
- 🚚 Affrètement
- 📄 Documents
- 📊 Analytics
- ⚙️ Paramètres

### 4. Barre de recherche globale
- Cliquez sur la barre de recherche ou utilisez le raccourci Ctrl+K
- Recherchez par numéro de commande, transporteur, ou destination
- Les résultats s'affichent en temps réel

### 5. Centre de notifications
- Cliquez sur l'icône cloche 🔔 en haut à droite
- Visualisez les alertes, rappels et messages
- Marquez comme lu ou accédez directement à l'élément concerné

## Points clés
✅ L'interface est responsive et s'adapte à tous les écrans
✅ Les widgets du tableau de bord sont personnalisables
✅ La recherche globale permet de trouver rapidement toute information`
          },
          {
            lessonId: 'les_2',
            title: 'Personnalisation du tableau de bord',
            contentType: 'interactive',
            duration: 7,
            order: 1,
            content: `# Mode Opératoire : Personnalisation du tableau de bord

## Objectif
Configurer votre tableau de bord pour afficher les informations les plus pertinentes pour votre activité.

## Étapes

### 1. Activer le mode édition
- Cliquez sur l'icône ⚙️ en haut à droite du tableau de bord
- Sélectionnez "Personnaliser le tableau de bord"
- Le mode édition s'active (bordures pointillées visibles)

### 2. Ajouter un widget
- Cliquez sur le bouton "+ Ajouter un widget"
- Parcourez les widgets disponibles :
  - **Commandes du jour** : Résumé des commandes à traiter
  - **Statut des transports** : Vue temps réel des livraisons
  - **KPIs performance** : Indicateurs clés (taux de livraison, retards)
  - **Alertes** : Incidents et notifications urgentes
  - **Calendrier** : RDV et échéances à venir
- Cliquez sur le widget souhaité pour l'ajouter

### 3. Déplacer un widget
- Maintenez le clic sur la barre de titre du widget
- Glissez-déposez à l'emplacement désiré
- Les autres widgets se réorganisent automatiquement

### 4. Redimensionner un widget
- Positionnez le curseur sur le coin inférieur droit du widget
- Le curseur devient une flèche diagonale ↘
- Glissez pour agrandir ou réduire

### 5. Supprimer un widget
- Cliquez sur l'icône ✕ dans le coin supérieur droit du widget
- Confirmez la suppression

### 6. Enregistrer la configuration
- Cliquez sur "Enregistrer" pour sauvegarder vos modifications
- Votre configuration est mémorisée pour les prochaines connexions

## Astuces
💡 Créez plusieurs configurations selon vos besoins (vue quotidienne, vue hebdomadaire)
💡 Les widgets se rafraîchissent automatiquement toutes les 5 minutes
💡 Utilisez les widgets d'alertes en position visible pour ne rien manquer`
          },
          {
            lessonId: 'les_3',
            title: 'Quiz de validation',
            contentType: 'quiz',
            duration: 5,
            order: 2,
            content: `# Quiz : Navigation et Tableau de Bord

## Questions

### Question 1
**Quel raccourci clavier permet d'accéder à la recherche globale ?**
- A) Ctrl+F
- B) Ctrl+K ✓
- C) Ctrl+S
- D) Alt+R

### Question 2
**Où se trouve le centre de notifications ?**
- A) Dans le menu latéral gauche
- B) En bas de page
- C) En haut à droite (icône cloche) ✓
- D) Dans les paramètres

### Question 3
**Comment activer le mode édition du tableau de bord ?**
- A) Double-cliquer sur un widget
- B) Cliquer sur l'icône ⚙️ puis "Personnaliser" ✓
- C) Utiliser le menu Fichier
- D) Appuyer sur F2

### Question 4
**Quels éléments peut-on personnaliser sur le tableau de bord ?**
- A) Ajouter/supprimer des widgets ✓
- B) Déplacer les widgets ✓
- C) Redimensionner les widgets ✓
- D) Toutes les réponses ci-dessus ✓

### Question 5
**À quelle fréquence les widgets se rafraîchissent-ils automatiquement ?**
- A) Toutes les minutes
- B) Toutes les 5 minutes ✓
- C) Toutes les 10 minutes
- D) Jamais (manuel uniquement)

## Score requis
Minimum 4/5 bonnes réponses pour valider le module.`
          }
        ],
        tags: ['débutant', 'interface']
      },
      {
        moduleId: 'mod_profile',
        title: 'Profil et Paramètres',
        description: 'Configurez votre compte, notifications et préférences',
        category: 'Prise en main',
        portals: ['all'],
        icon: '⚙️',
        duration: 15,
        order: 2,
        lessons: [
          {
            lessonId: 'les_4',
            title: 'Configuration du profil',
            contentType: 'video',
            duration: 5,
            order: 0,
            content: `# Mode Opératoire : Configuration du profil

## Objectif
Configurer correctement votre profil utilisateur pour une utilisation optimale de SYMPHONI.A.

## Étapes

### 1. Accéder à votre profil
- Cliquez sur votre avatar en haut à droite
- Sélectionnez "Mon profil" dans le menu déroulant

### 2. Informations personnelles
Renseignez ou modifiez :
- **Nom et Prénom** : Utilisés dans les communications
- **Email** : Email de connexion et notifications
- **Téléphone** : Pour les alertes SMS (optionnel)
- **Photo de profil** : Cliquez sur l'avatar pour uploader une image

### 3. Informations professionnelles
- **Fonction** : Votre poste dans l'entreprise
- **Service** : Département ou équipe
- **Langue préférée** : Français, English, Deutsch, Español
- **Fuseau horaire** : Pour l'affichage des dates/heures

### 4. Signature email
- Personnalisez votre signature pour les emails envoyés via SYMPHONI.A
- Incluez nom, fonction, téléphone et logo si souhaité

### 5. Enregistrer les modifications
- Cliquez sur "Enregistrer" en bas du formulaire
- Un message de confirmation s'affiche

## Bonnes pratiques
✅ Utilisez une photo de profil professionnelle
✅ Maintenez vos coordonnées à jour
✅ Vérifiez que le fuseau horaire correspond à votre localisation`
          },
          {
            lessonId: 'les_5',
            title: 'Gestion des notifications',
            contentType: 'video',
            duration: 5,
            order: 1,
            content: `# Mode Opératoire : Gestion des notifications

## Objectif
Configurer les notifications pour recevoir les alertes importantes sans être submergé.

## Étapes

### 1. Accéder aux paramètres de notification
- Allez dans Profil > Notifications
- Ou cliquez sur ⚙️ Paramètres > Notifications

### 2. Types de notifications disponibles
Configurez chaque type individuellement :

| Type | Description | Canaux disponibles |
|------|-------------|-------------------|
| Nouvelles commandes | Création de commande | Email, Push, SMS |
| Statut commande | Changements d'état | Email, Push |
| Alertes retard | Retards détectés | Email, Push, SMS |
| Incidents | Problèmes signalés | Email, Push, SMS |
| Documents | Nouveaux documents | Email, Push |
| Facturation | Factures et paiements | Email |

### 3. Choisir les canaux
Pour chaque type de notification :
- **Email** : Réception dans votre boîte mail
- **Push** : Notification dans l'application
- **SMS** : Message texte (nécessite numéro de téléphone)

### 4. Définir les horaires
- **24/7** : Notifications à tout moment
- **Heures ouvrées** : Uniquement en semaine, 8h-18h
- **Personnalisé** : Définissez vos propres plages horaires

### 5. Notifications groupées
- Activez le regroupement pour éviter trop de notifications
- Choisissez la fréquence : Immédiat, Toutes les heures, Quotidien

## Recommandations
💡 Activez les SMS pour les alertes critiques (retards, incidents)
💡 Utilisez le mode "Heures ouvrées" pour préserver votre équilibre
💡 Le regroupement quotidien est idéal pour les rapports`
          },
          {
            lessonId: 'les_6',
            title: 'Sécurité du compte',
            contentType: 'document',
            duration: 5,
            order: 2,
            content: `# Mode Opératoire : Sécurité du compte

## Objectif
Protéger votre compte SYMPHONI.A contre les accès non autorisés.

## Étapes

### 1. Changer le mot de passe
- Allez dans Profil > Sécurité
- Cliquez sur "Modifier le mot de passe"
- Saisissez l'ancien mot de passe
- Saisissez le nouveau mot de passe (2 fois)
- Respectez les critères :
  - Minimum 12 caractères
  - Au moins 1 majuscule
  - Au moins 1 chiffre
  - Au moins 1 caractère spécial (!@#$%^&*)

### 2. Activer l'authentification à deux facteurs (2FA)
- Dans Sécurité, activez "Authentification à deux facteurs"
- Choisissez la méthode :
  - **Application** : Google Authenticator, Authy (recommandé)
  - **SMS** : Code par message texte
- Scannez le QR code avec votre application
- Saisissez le code de vérification
- Sauvegardez les codes de récupération !

### 3. Gérer les sessions actives
- Visualisez toutes les sessions connectées
- Informations affichées : Appareil, Localisation, Date
- Déconnectez les sessions suspectes en cliquant sur "Révoquer"

### 4. Historique de connexion
- Consultez l'historique des connexions
- Vérifiez les tentatives échouées
- Signalez toute activité suspecte au support

### 5. Récupération de compte
Configurez les options de récupération :
- Email secondaire de récupération
- Questions de sécurité (déconseillé)
- Numéro de téléphone de récupération

## Règles de sécurité
🔒 Ne partagez jamais votre mot de passe
🔒 Changez votre mot de passe tous les 90 jours
🔒 Utilisez un mot de passe unique pour SYMPHONI.A
🔒 Activez impérativement le 2FA
🔒 Déconnectez-vous des ordinateurs partagés`
          }
        ],
        tags: ['débutant', 'configuration']
      },

      // GESTION DES COMMANDES - INDUSTRIE
      {
        moduleId: 'mod_orders_create',
        title: 'Création de Commandes',
        description: 'Apprenez à créer des commandes de transport étape par étape',
        category: 'Gestion des Commandes',
        portals: ['industry', 'logistician'],
        icon: '📝',
        duration: 30,
        order: 3,
        lessons: [
          {
            lessonId: 'les_7',
            title: 'Création simple',
            contentType: 'video',
            duration: 10,
            order: 0,
            content: `# Mode Opératoire : Création simple d'une commande

## Objectif
Créer une commande de transport standard en quelques étapes simples.

## Prérequis
- Être connecté au portail Industrie ou Logisticien
- Avoir les informations de chargement et livraison

## Étapes

### 1. Accéder à la création de commande
- Menu latéral > Commandes > "+ Nouvelle commande"
- Ou raccourci clavier : Ctrl+N

### 2. Informations de base
Renseignez les champs obligatoires :
- **Référence client** : Votre numéro interne (ex: CMD-2024-001)
- **Type de marchandise** : Palette, Vrac, Colis, etc.
- **Poids total** : En kg
- **Nombre de colis/palettes** : Quantité

### 3. Point de chargement
- **Adresse** : Saisissez ou recherchez dans le carnet d'adresses
- **Contact** : Nom et téléphone du contact sur site
- **Date souhaitée** : Date de chargement
- **Créneau horaire** : Matin (8h-12h), Après-midi (14h-18h), ou précis
- **Instructions** : Quai, code portail, restrictions

### 4. Point de livraison
- **Adresse destinataire** : Saisissez ou recherchez
- **Contact livraison** : Nom et téléphone
- **Date souhaitée** : Date de livraison estimée
- **Créneau horaire** : Plage de livraison
- **Instructions** : Étage, digicode, particularités

### 5. Options de transport
- **Véhicule requis** : Fourgon, PL, Semi, etc.
- **Équipement** : Hayon, transpalette, sangles
- **ADR** : Si marchandises dangereuses
- **Température** : Si transport frigorifique

### 6. Validation
- Cliquez sur "Créer la commande"
- Un numéro SYMPHONI.A est attribué automatiquement
- La commande passe au statut "En attente d'affrètement"

## Astuces
💡 Enregistrez vos adresses fréquentes dans le carnet
💡 Utilisez les modèles pour les commandes récurrentes
💡 Le champ Instructions est visible par le transporteur`
          },
          {
            lessonId: 'les_8',
            title: 'Options avancées',
            contentType: 'video',
            duration: 10,
            order: 1,
            content: `# Mode Opératoire : Options avancées de commande

## Objectif
Maîtriser les options avancées pour des besoins de transport spécifiques.

## Options disponibles

### 1. Multi-points (Groupage)
Ajoutez plusieurs points de chargement/livraison :
- Cliquez sur "+ Ajouter un point"
- Définissez l'ordre des étapes
- Spécifiez la marchandise par étape
- Utile pour : tournées, ramasses multiples, livraisons groupées

### 2. Contraintes de délai
- **Impératif** : Livraison obligatoire à la date exacte
- **Au plus tôt** : À partir de cette date
- **Au plus tard** : Date limite non négociable
- **Flexible** : Fenêtre de +/- X jours

### 3. Exigences véhicule détaillées
- **Dimensions plateau** : Longueur, largeur minimales
- **Capacité** : Poids max, volume
- **Type de plancher** : Bois, antidérapant
- **Bâche** : Tautliner, savoyarde, rideau coulissant

### 4. Documents requis
Sélectionnez les documents attendus :
- ☐ CMR signée
- ☐ Bon de livraison
- ☐ Photo chargement
- ☐ Photo déchargement
- ☐ Certificat d'origine

### 5. Facturation
- **Incoterm** : EXW, DAP, DDP, etc.
- **Mode de paiement** : Comptant, 30 jours
- **Référence comptable** : Code analytique, centre de coût

### 6. Tags et catégorisation
- Ajoutez des tags personnalisés (Urgent, VIP, Export)
- Facilitez le filtrage et le reporting

### 7. Notifications personnalisées
- Choisissez qui reçoit les alertes
- Ajoutez des destinataires en copie
- Personnalisez les événements déclencheurs

## Modèles de commande
- Créez des modèles pour les flux récurrents
- Menu > Commandes > Modèles > Créer un modèle
- Pré-remplissez adresses, contraintes, documents

## Bonnes pratiques
✅ Utilisez les tags pour catégoriser vos flux
✅ Les modèles gagnent du temps sur les commandes répétitives
✅ Précisez toujours les contraintes d'accès site`
          },
          {
            lessonId: 'les_9',
            title: 'Import en masse',
            contentType: 'interactive',
            duration: 10,
            order: 2,
            content: `# Mode Opératoire : Import en masse de commandes

## Objectif
Importer plusieurs commandes depuis un fichier Excel ou CSV.

## Formats supportés
- Excel (.xlsx, .xls)
- CSV (séparateur ; ou ,)
- Format EDIFACT (sur demande)

## Étapes

### 1. Télécharger le modèle
- Menu > Commandes > Import
- Cliquez sur "Télécharger le modèle Excel"
- Deux modèles disponibles :
  - **Simple** : Commandes point à point
  - **Avancé** : Multi-points et options

### 2. Structure du fichier
Colonnes obligatoires :
| Colonne | Description | Exemple |
|---------|-------------|---------|
| reference_client | Votre référence | CMD001 |
| type_marchandise | Type de cargo | Palette |
| poids_kg | Poids total | 500 |
| nb_colis | Nombre d'unités | 10 |
| chargement_adresse | Adresse complète | 1 rue de Paris, 75001 Paris |
| chargement_date | Date YYYY-MM-DD | 2024-12-15 |
| livraison_adresse | Adresse complète | 5 avenue Lyon, 69001 Lyon |
| livraison_date | Date YYYY-MM-DD | 2024-12-16 |

Colonnes optionnelles :
| Colonne | Description |
|---------|-------------|
| chargement_contact | Nom du contact |
| chargement_telephone | Téléphone |
| chargement_instructions | Instructions spéciales |
| livraison_contact | Nom du contact |
| livraison_telephone | Téléphone |
| livraison_instructions | Instructions |
| vehicule_type | Type requis |
| tags | Tags séparés par , |

### 3. Importer le fichier
- Menu > Commandes > Import
- Glissez-déposez ou cliquez pour sélectionner
- Le système analyse le fichier

### 4. Vérification et mapping
- SYMPHONI.A affiche un aperçu des données
- Vérifiez le mapping des colonnes
- Corrigez les erreurs signalées en rouge
- Lignes en vert = prêtes à importer

### 5. Lancer l'import
- Cliquez sur "Importer X commandes"
- Progression affichée en temps réel
- Rapport final avec succès/échecs

### 6. Traitement des erreurs
Causes d'erreur courantes :
- Adresse non reconnue → Vérifiez le format
- Date invalide → Utilisez YYYY-MM-DD
- Champ obligatoire manquant → Complétez

## Astuces
💡 Testez d'abord avec 5-10 lignes
💡 Utilisez l'autocomplétion d'adresses dans Excel
💡 Sauvegardez vos fichiers sources
💡 Importez max 500 commandes par fichier`
          }
        ],
        tags: ['commandes', 'création']
      },
      {
        moduleId: 'mod_orders_track',
        title: 'Suivi des Commandes',
        description: 'Suivez vos commandes en temps réel avec la tour de contrôle',
        category: 'Gestion des Commandes',
        portals: ['industry', 'logistician', 'supplier'],
        icon: '📍',
        duration: 25,
        order: 4,
        lessons: [
          {
            lessonId: 'les_10',
            title: 'Tour de contrôle',
            contentType: 'video',
            duration: 8,
            order: 0,
            content: `# Mode Opératoire : Tour de contrôle

## Objectif
Superviser l'ensemble de vos opérations transport en temps réel.

## Accès
Menu > Commandes > Tour de contrôle

## Interface de la tour de contrôle

### 1. Vue d'ensemble (Dashboard)
- **Compteurs en temps réel** :
  - Commandes du jour : X
  - En cours de transport : X
  - Livrées aujourd'hui : X
  - En retard : X (rouge)
  - Incidents ouverts : X

### 2. Liste des commandes
Tableau avec colonnes :
| Colonne | Description |
|---------|-------------|
| N° Commande | Identifiant SYMPHONI.A |
| Réf. Client | Votre référence |
| Statut | État actuel (code couleur) |
| Transporteur | Nom du transporteur |
| Chargement | Date et lieu |
| Livraison | Date et lieu |
| ETA | Heure estimée d'arrivée |

### 3. Codes couleur des statuts
- 🔵 **Bleu** : En attente d'affrètement
- 🟡 **Jaune** : Affrété, en attente chargement
- 🟠 **Orange** : Chargé, en transit
- 🟢 **Vert** : Livré
- 🔴 **Rouge** : En retard / Incident
- ⚫ **Gris** : Annulé

### 4. Filtres rapides
- Par statut : Tous, En cours, Livrés, Problèmes
- Par date : Aujourd'hui, Semaine, Mois, Personnalisé
- Par transporteur : Sélection multiple
- Par client/destinataire

### 5. Vue cartographique
- Cliquez sur l'icône 🗺️ pour afficher la carte
- Visualisez tous les transports en cours
- Icônes colorées selon le statut
- Cliquez sur un véhicule pour voir les détails

### 6. Actions rapides
Depuis la liste, pour chaque commande :
- 👁️ Voir détail
- 📍 Voir sur carte
- 📞 Contacter transporteur
- ⚠️ Signaler incident
- 📄 Voir documents

## Bonnes pratiques
✅ Consultez la tour de contrôle chaque matin
✅ Filtrez sur "Problèmes" pour prioriser les urgences
✅ Utilisez la vue carte pour les tournées`
          },
          {
            lessonId: 'les_11',
            title: 'Alertes et notifications',
            contentType: 'video',
            duration: 7,
            order: 1,
            content: `# Mode Opératoire : Alertes et notifications de suivi

## Objectif
Configurer et gérer les alertes pour être informé des événements importants.

## Types d'alertes automatiques

### 1. Alertes de retard
Déclenchées quand :
- ETA dépasse l'heure de livraison prévue
- Retard > seuil configuré (par défaut 30 min)
- Immobilisation prolongée détectée

### 2. Alertes de statut
- Chargement effectué
- Départ du site de chargement
- Arrivée sur site de livraison
- Livraison confirmée
- POD (Proof of Delivery) reçue

### 3. Alertes incidents
- Déclaration d'incident par le transporteur
- Réserves émises
- Refus de livraison
- Avarie signalée

### 4. Alertes documents
- CMR signée disponible
- Photo ajoutée
- Document manquant après livraison

## Configuration des alertes

### Par commande
- Ouvrez le détail de la commande
- Onglet "Notifications"
- Cochez les événements souhaités
- Ajoutez des destinataires

### Par défaut (profil)
- Paramètres > Notifications > Suivi
- Définissez vos préférences globales
- Toutes nouvelles commandes hériteront de ces réglages

## Gestion des alertes

### Centre de notifications
- Cliquez sur 🔔 en haut à droite
- Badge rouge = alertes non lues
- Liste chronologique des événements

### Actions sur une alerte
- Marquer comme lu
- Accéder directement à la commande
- Archiver
- Transférer par email

### Historique
- Menu > Notifications > Historique
- Filtrez par type, date, commande
- Exportez au format Excel

## Escalade automatique

SYMPHONI.A peut escalader automatiquement :
- Si aucune action sous 30 min → Notification manager
- Si retard > 2h → Alerte SMS client final
- Si incident critique → Email direction

Configuration dans : Paramètres > Règles d'escalade

## Astuces
💡 Activez les alertes SMS pour les retards critiques
💡 Utilisez les règles d'escalade pour ne rien manquer
💡 Archivez régulièrement pour garder une boîte propre`
          },
          {
            lessonId: 'les_12',
            title: 'Suivi GPS',
            contentType: 'interactive',
            duration: 10,
            order: 2,
            content: `# Mode Opératoire : Suivi GPS en temps réel

## Objectif
Localiser les véhicules en temps réel et suivre les trajets.

## Prérequis
- Le transporteur doit avoir activé le partage GPS
- Application mobile SYMPHONI.A installée sur le téléphone du chauffeur
- Ou boîtier télématique connecté

## Accès au suivi GPS

### 1. Depuis une commande
- Ouvrez le détail de la commande
- Cliquez sur l'onglet "Tracking"
- La carte affiche la position actuelle

### 2. Depuis la tour de contrôle
- Vue carte globale avec tous les véhicules
- Cliquez sur un véhicule pour le sélectionner

## Informations affichées

### Position du véhicule
- 📍 Marqueur sur la carte
- Adresse approximative
- Dernière mise à jour (horodatage)
- Précision GPS (mètres)

### Données de trajet
- Distance parcourue
- Distance restante
- ETA (heure d'arrivée estimée)
- Itinéraire prévu (trait bleu)
- Trajet effectué (trait vert)

### Statut véhicule
- 🟢 En mouvement
- 🟡 À l'arrêt < 15 min
- 🔴 Immobilisé > 15 min
- ⚫ GPS inactif

## Fonctionnalités avancées

### Historique de trajet
- Cliquez sur "Voir l'historique"
- Timeline des positions
- Replay animé du trajet
- Export GPX/KML

### Géofencing (zones)
- Créez des zones géographiques
- Alertes entrée/sortie de zone
- Utile pour : sites sensibles, zones interdites

### Partage de position
- Générez un lien de suivi pour le client final
- Le client suit sans connexion à SYMPHONI.A
- Lien valable X heures (configurable)

## Résolution des problèmes GPS

### Signal faible
- Véhicule dans zone sans réseau
- Tunnel, parking souterrain
- → Attendre retour du signal

### GPS désactivé
- Chauffeur a coupé l'application
- → Contacter le transporteur

### Décalage de position
- Normal : décalage jusqu'à 50m
- En mouvement : mise à jour toutes les 30 sec
- À l'arrêt : mise à jour toutes les 5 min

## Bonnes pratiques
✅ Vérifiez le suivi GPS au départ
✅ Utilisez le partage pour informer vos clients
✅ Analysez les trajets pour optimiser les tournées`
          }
        ],
        tags: ['suivi', 'temps-réel']
      },

      // AFFRETEMENT
      {
        moduleId: 'mod_dispatch_manual',
        title: 'Affrètement Manuel',
        description: 'Sélectionnez et assignez manuellement les transporteurs',
        category: 'Affrètement',
        portals: ['industry', 'logistician', 'forwarder'],
        icon: '🚚',
        duration: 25,
        order: 5,
        lessons: [
          {
            lessonId: 'les_13',
            title: 'Recherche de transporteurs',
            contentType: 'video',
            duration: 8,
            order: 0,
            content: `# Mode Opératoire : Recherche de transporteurs

## Objectif
Trouver les transporteurs adaptés à votre besoin de transport.

## Accès
- Depuis une commande : Bouton "Affréter"
- Menu > Affrètement > Recherche transporteur

## Critères de recherche

### 1. Critères géographiques
- **Zone de départ** : Département, région, pays
- **Zone d'arrivée** : Idem
- **Rayon d'action** : km autour d'une ville

### 2. Critères véhicule
- **Type** : Fourgon, Porteur, Semi, etc.
- **Tonnage** : Capacité minimum requise
- **Équipements** : Hayon, frigo, ADR

### 3. Critères de disponibilité
- **Date de chargement** : Disponible ce jour
- **Fenêtre horaire** : Matin, après-midi

### 4. Critères qualité
- **Note minimum** : 3★, 4★, 5★
- **Certifications** : ISO, OEA, GDP
- **Historique** : Transporteurs déjà utilisés

## Résultats de recherche

### Liste des transporteurs
Pour chaque transporteur :
- **Nom et raison sociale**
- **Note moyenne** : ⭐⭐⭐⭐⭐
- **Nombre de missions** : Avec votre entreprise
- **Véhicules disponibles** : Types et quantités
- **Tarif indicatif** : €/km ou forfait

### Filtres rapides
- 🌟 Favoris uniquement
- ✅ Homologués
- 📍 Proximité géographique
- 💰 Prix croissant

### Tri des résultats
- Par pertinence (défaut)
- Par note
- Par prix
- Par distance
- Par nombre de missions réalisées

## Actions disponibles

- **Voir la fiche** : Détails complets du transporteur
- **Demander un devis** : Envoyer une demande de prix
- **Contacter** : Téléphone ou email direct
- **Ajouter aux favoris** : ⭐

## Astuces
💡 Utilisez les filtres pour affiner rapidement
💡 Consultez les avis des autres donneurs d'ordres
💡 Les transporteurs favoris apparaissent en priorité`
          },
          {
            lessonId: 'les_14',
            title: 'Comparaison et sélection',
            contentType: 'video',
            duration: 9,
            order: 1,
            content: `# Mode Opératoire : Comparaison et sélection des transporteurs

## Objectif
Comparer les offres et sélectionner le meilleur transporteur.

## Demande de devis

### 1. Envoyer une demande
- Depuis les résultats de recherche
- Sélectionnez plusieurs transporteurs (checkbox)
- Cliquez sur "Demander des devis"
- La demande est envoyée simultanément

### 2. Contenu de la demande
Le transporteur reçoit :
- Détails du transport (origine, destination)
- Dates et contraintes
- Type de marchandise
- Exigences véhicule
- Date limite de réponse

## Tableau comparatif

### Vue comparative
Une fois les devis reçus, affichez le comparatif :

| Critère | Transport A | Transport B | Transport C |
|---------|-------------|-------------|-------------|
| Prix | 450€ | 520€ | 480€ |
| Délai | J+1 | J+1 | J+2 |
| Note | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Véhicule | PL 19T | Semi | PL 19T |
| Assurance | 100k€ | 200k€ | 100k€ |

### Indicateurs colorés
- 🟢 Meilleur sur ce critère
- 🟡 Dans la moyenne
- 🔴 Moins bon

### Score global
SYMPHONI.A calcule un score pondéré :
- Prix : 40%
- Fiabilité : 30%
- Délai : 20%
- Équipement : 10%

## Consultation des fiches

### Fiche transporteur détaillée
- **Informations légales** : SIREN, attestations
- **Flotte** : Types et nombre de véhicules
- **Zones couvertes** : Carte des trajets habituels
- **Historique** : Missions réalisées avec vous
- **Avis** : Commentaires des donneurs d'ordres
- **Documents** : Assurance, licences, certifications

### Historique de collaboration
- Nombre de missions
- Taux de service (livraisons OK / total)
- Incidents passés
- Évolution des tarifs

## Sélection finale

### Critères de décision
Considérez :
1. **Rapport qualité/prix**
2. **Fiabilité historique**
3. **Adéquation véhicule**
4. **Disponibilité confirmée**
5. **Assurance suffisante**

### Négociation
- Cliquez sur "Négocier" pour contre-proposer
- Échangez via la messagerie intégrée
- L'historique est conservé

## Bonnes pratiques
✅ Comparez au moins 3 devis
✅ Ne choisissez pas que sur le prix
✅ Vérifiez les assurances pour cargaisons de valeur
✅ Privilégiez les transporteurs avec historique positif`
          },
          {
            lessonId: 'les_15',
            title: 'Attribution et confirmation',
            contentType: 'interactive',
            duration: 8,
            order: 2,
            content: `# Mode Opératoire : Attribution et confirmation

## Objectif
Attribuer définitivement le transport et obtenir la confirmation.

## Processus d'attribution

### 1. Sélectionner le transporteur
- Dans le tableau comparatif, cliquez sur "Sélectionner"
- Ou depuis la fiche : "Attribuer ce transport"

### 2. Vérification avant attribution
Le système vérifie :
- ✅ Disponibilité confirmée
- ✅ Assurance valide
- ✅ Documents à jour
- ✅ Pas de litige en cours

### 3. Conditions d'attribution
Confirmez ou modifiez :
- **Prix négocié** : Montant final convenu
- **Délai de paiement** : 30/45/60 jours
- **Conditions particulières** : Texte libre
- **Documents requis** : CMR, photos, etc.

### 4. Envoi de la demande
- Cliquez sur "Envoyer l'attribution"
- Le transporteur reçoit une notification
- Délai de réponse : généralement 24h

## Confirmation du transporteur

### Réponse positive
Le transporteur confirme :
- Acceptation du prix
- Véhicule assigné (immatriculation)
- Chauffeur désigné (nom, téléphone)
- Confirmation des dates

### Réponse négative
En cas de refus :
- Motif indiqué
- Vous pouvez sélectionner un autre transporteur
- L'historique est conservé

### Pas de réponse
Si délai dépassé :
- Alerte automatique
- Option : relancer ou annuler
- Contacter directement le transporteur

## Confirmation de mission

### Ordre de transport
Une fois confirmé, SYMPHONI.A génère :
- **Ordre de transport** : Document PDF
- **Détails mission** : Récapitulatif complet
- **Contacts** : Expéditeur, destinataire

### Informations transmises au transporteur
- Adresses complètes avec coordonnées GPS
- Contacts sur chaque site
- Instructions de chargement/livraison
- Documents à présenter
- Consignes particulières

### Notification des parties
- **Transporteur** : Email + notification app
- **Expéditeur** : Confirmation du transporteur assigné
- **Destinataire** : Avis de passage (optionnel)

## Modification après attribution

### Changements possibles
- Modifier les dates (avec accord)
- Ajuster les instructions
- Changer le contact
- Annuler (avec conditions)

### Annulation
- Avant J-2 : Généralement sans frais
- J-1 ou J : Frais possibles (selon contrat)
- Le jour même : Frais d'annulation

## Suivi post-attribution
La commande passe au statut "Affrété" :
- Visible dans la tour de contrôle
- Suivi temps réel activable
- Alertes automatiques configurées

## Astuces
💡 Vérifiez les coordonnées du chauffeur
💡 Transmettez les instructions spéciales clairement
💡 Configurez les alertes de suivi dès l'attribution`
          }
        ],
        tags: ['affrètement', 'transporteurs']
      },
      {
        moduleId: 'mod_dispatch_ai',
        title: 'Affrètement IA (Affret.IA)',
        description: 'Utilisez l\'intelligence artificielle pour l\'affrètement automatique',
        category: 'Affrètement',
        portals: ['industry', 'logistician', 'forwarder'],
        icon: '🤖',
        duration: 35,
        order: 6,
        lessons: [
          {
            lessonId: 'les_16',
            title: 'Configuration Affret.IA',
            contentType: 'video',
            duration: 10,
            order: 0,
            content: `# Mode Opératoire : Configuration Affret.IA

## Objectif
Configurer le module d'intelligence artificielle pour l'affrètement automatique.

## Présentation d'Affret.IA

### Qu'est-ce qu'Affret.IA ?
- Module d'affrètement intelligent
- Analyse automatique des transporteurs
- Attribution optimisée selon vos critères
- Apprentissage continu de vos préférences

### Avantages
- ⏱️ Gain de temps : affrètement en secondes
- 📈 Optimisation : meilleur rapport qualité/prix
- 🎯 Précision : matching intelligent
- 📊 Analyse : reporting automatique

## Configuration initiale

### 1. Activer Affret.IA
- Menu > Paramètres > Modules > Affret.IA
- Cliquez sur "Activer"
- Acceptez les conditions d'utilisation

### 2. Définir le pool de transporteurs
Choisissez les transporteurs éligibles :
- ☑️ Tous les transporteurs homologués
- ☑️ Uniquement les favoris
- ☑️ Par zone géographique
- ☑️ Par certification requise

### 3. Paramétrer les critères de base
| Critère | Poids | Description |
|---------|-------|-------------|
| Prix | 40% | Importance du tarif |
| Fiabilité | 30% | Historique de performance |
| Délai | 15% | Respect des délais |
| Proximité | 15% | Distance du transporteur |

### 4. Règles d'exclusion
Définissez les exclusions automatiques :
- Note < 3 étoiles
- Incident grave < 6 mois
- Assurance expirée
- Documents manquants

## Modes de fonctionnement

### Mode assisté (recommandé pour débuter)
- Affret.IA propose les 3 meilleurs transporteurs
- Vous validez manuellement le choix
- Apprentissage de vos préférences

### Mode automatique
- Attribution automatique au meilleur match
- Notification de confirmation
- Intervention humaine sur exception uniquement

### Mode cascade
- Envoi séquentiel aux transporteurs
- Si refus, passage au suivant
- Configurable : délai entre chaque

## Personnalisation avancée

### Règles conditionnelles
Créez des règles métier :
- SI transport > 1000€ ALORS validation manuelle
- SI ADR ALORS transporteurs certifiés uniquement
- SI client VIP ALORS note minimum 4.5★

### Blacklist / Whitelist
- **Whitelist** : Transporteurs prioritaires par client
- **Blacklist** : Transporteurs exclus pour certains flux

### Horaires d'activation
- Actif 24/7
- Heures ouvrées uniquement
- Planning personnalisé

## Test de configuration

Avant de passer en production :
1. Testez sur quelques commandes
2. Vérifiez les propositions d'Affret.IA
3. Ajustez les poids si nécessaire
4. Validez avec votre équipe

## Astuces
💡 Commencez en mode assisté pour calibrer
💡 Ajustez les poids selon vos priorités réelles
💡 Revoyez la configuration trimestriellement`
          },
          {
            lessonId: 'les_17',
            title: 'Critères de scoring',
            contentType: 'document',
            duration: 10,
            order: 1,
            content: `# Mode Opératoire : Critères de scoring Affret.IA

## Objectif
Comprendre et paramétrer les critères de notation des transporteurs.

## Le score Affret.IA

### Calcul du score global
Score = Σ (Critère × Poids) / 100

Exemple :
- Prix : 85/100 × 40% = 34 points
- Fiabilité : 90/100 × 30% = 27 points
- Délai : 95/100 × 15% = 14.25 points
- Proximité : 80/100 × 15% = 12 points
- **Score total : 87.25/100**

## Détail des critères

### 1. Critère Prix (recommandé : 30-50%)
**Ce qui est mesuré :**
- Tarif proposé vs prix du marché
- Historique des prix avec ce transporteur
- Cohérence tarifaire

**Calcul :**
- Prix le plus bas = 100 points
- +10% = 90 points
- +20% = 80 points
- etc.

### 2. Critère Fiabilité (recommandé : 25-35%)
**Ce qui est mesuré :**
- Taux de livraison réussie
- Respect des engagements
- Historique des incidents

**Calcul :**
- Taux service 100% = 100 points
- Taux service 95% = 95 points
- Chaque incident grave : -10 points
- Chaque incident mineur : -2 points

### 3. Critère Délai (recommandé : 10-20%)
**Ce qui est mesuré :**
- Ponctualité historique
- Respect des créneaux
- Réactivité aux demandes

**Calcul :**
- 100% ponctuel = 100 points
- Retard moyen < 30 min = 90 points
- Retard moyen < 1h = 75 points
- Retard moyen > 1h = 50 points

### 4. Critère Proximité (recommandé : 5-15%)
**Ce qui est mesuré :**
- Distance du transporteur au point de chargement
- Couverture géographique habituelle

**Calcul :**
- < 50 km = 100 points
- 50-100 km = 85 points
- 100-200 km = 70 points
- > 200 km = 50 points

### 5. Critère Qualité de service (optionnel)
**Ce qui est mesuré :**
- Note moyenne attribuée
- Satisfaction des destinataires
- Qualité des documents

### 6. Critère Capacité (optionnel)
**Ce qui est mesuré :**
- Disponibilité de véhicules
- Flexibilité horaire
- Capacité à absorber des volumes

## Paramétrage des poids

### Profils prédéfinis

**Économique :**
| Critère | Poids |
|---------|-------|
| Prix | 60% |
| Fiabilité | 25% |
| Délai | 10% |
| Proximité | 5% |

**Qualité Premium :**
| Critère | Poids |
|---------|-------|
| Prix | 20% |
| Fiabilité | 45% |
| Délai | 25% |
| Proximité | 10% |

**Urgence :**
| Critère | Poids |
|---------|-------|
| Prix | 15% |
| Fiabilité | 20% |
| Délai | 50% |
| Proximité | 15% |

### Personnalisation par flux
Créez des profils de scoring par :
- Type de client
- Type de marchandise
- Destination géographique
- Valeur de la commande

## Analyse et optimisation

### Dashboard scoring
- Visualisez les scores moyens
- Identifiez les critères discriminants
- Comparez les transporteurs

### Recommandations IA
Affret.IA suggère des ajustements :
- "Le critère prix est prépondérant, considérez augmenter la fiabilité"
- "Transporteur X a un excellent score mais est rarement sélectionné"

## Bonnes pratiques
✅ Équilibrez prix et fiabilité
✅ Adaptez les poids à votre activité
✅ Revoyez les scores mensuellement
✅ Testez différentes configurations`
          },
          {
            lessonId: 'les_18',
            title: 'Mode cascade automatique',
            contentType: 'video',
            duration: 8,
            order: 2,
            content: `# Mode Opératoire : Mode cascade automatique

## Objectif
Configurer l'envoi séquentiel automatique aux transporteurs.

## Principe du mode cascade

### Fonctionnement
1. Affret.IA classe les transporteurs par score
2. Envoie la demande au n°1
3. Si pas de réponse/refus → passe au n°2
4. Continue jusqu'à acceptation ou fin de liste

### Avantages
- Automatisation complète
- Pas de temps perdu en attente
- Maximise les chances d'affrètement
- Traçabilité complète

## Configuration

### 1. Activer le mode cascade
- Paramètres > Affret.IA > Mode cascade
- Activez l'option "Cascade automatique"

### 2. Délais de réponse
Définissez le temps d'attente par niveau :

| Niveau | Délai | Description |
|--------|-------|-------------|
| N°1 | 2h | Meilleur score |
| N°2 | 1h30 | Deuxième meilleur |
| N°3 | 1h | Troisième |
| N°4+ | 45min | Suivants |

### 3. Nombre maximum de tentatives
- Minimum recommandé : 5
- Maximum : 10-15
- Au-delà : alerte pour traitement manuel

### 4. Messages personnalisés
Personnalisez le message à chaque niveau :
- Niveau 1 : Message standard
- Niveau 3+ : "Urgent - Réponse souhaitée rapidement"
- Dernier niveau : "Dernière proposition avant annulation"

## Règles avancées

### Conditions de passage au suivant
- Pas de réponse dans le délai
- Refus explicite
- Prix proposé trop élevé (> seuil)
- Véhicule non disponible

### Exclusions dynamiques
Pendant la cascade, excluez :
- Transporteurs ayant déjà refusé ce client
- Transporteurs en surcharge (>X missions/jour)
- Transporteurs avec incident récent

### Arrêt de la cascade
La cascade s'arrête si :
- Un transporteur accepte
- Tous les transporteurs ont été sollicités
- Le délai global est dépassé
- Annulation manuelle

## Monitoring en temps réel

### Dashboard cascade
Visualisez pour chaque commande :
- Transporteur actuel (numéro dans la liste)
- Temps restant avant passage au suivant
- Historique des refus/non-réponses
- Score des transporteurs restants

### Intervention manuelle
À tout moment, vous pouvez :
- Passer immédiatement au suivant
- Forcer un transporteur spécifique
- Arrêter la cascade
- Relancer depuis le début

## Notifications

### Pour vous (donneur d'ordres)
- Début de cascade
- Chaque changement de niveau
- Acceptation finale
- Échec (aucun transporteur)

### Pour le transporteur
- Réception de la demande
- Rappel avant expiration
- Confirmation d'annulation (si passé au suivant)

## Rapport de cascade

Après affrètement, consultez :
- Nombre de transporteurs sollicités
- Temps total d'affrètement
- Raisons des refus
- Analyse des tendances

## Astuces
💡 Des délais courts accélèrent l'affrètement
💡 Prévoyez un plan B avec traitement manuel
💡 Analysez les refus pour améliorer le scoring
💡 Ajustez les délais selon les heures (plus courts en journée)`
          },
          {
            lessonId: 'les_19',
            title: 'Analyse des performances',
            contentType: 'interactive',
            duration: 7,
            order: 3,
            content: `# Mode Opératoire : Analyse des performances Affret.IA

## Objectif
Mesurer et optimiser l'efficacité de l'affrètement automatique.

## Accès aux analytics
Menu > Affret.IA > Tableau de bord

## KPIs principaux

### 1. Taux d'affrètement automatique
- Commandes affrétées par Affret.IA / Total commandes
- Objectif : > 80%
- Tendance : ↑ ↓ stable

### 2. Temps moyen d'affrètement
- Du lancement à la confirmation
- Comparaison : manuel vs automatique
- Benchmark : < 2h pour automatique

### 3. Taux d'acceptation premier choix
- Acceptation par le transporteur n°1
- Indicateur de qualité du scoring
- Objectif : > 60%

### 4. Économies réalisées
- Différence prix Affret.IA vs prix moyen manuel
- Calculé sur les 30 derniers jours
- En € et en %

## Rapports disponibles

### Rapport quotidien
- Commandes traitées aujourd'hui
- Répartition par statut
- Alertes et exceptions
- Top 5 transporteurs du jour

### Rapport hebdomadaire
- Évolution des KPIs
- Analyse des refus
- Transporteurs les plus sollicités
- Recommandations d'optimisation

### Rapport mensuel
- Synthèse complète
- Comparatif M-1
- Coûts et économies
- Objectifs vs réalisé

## Analyse détaillée

### Performance par transporteur
| Transporteur | Sollicitations | Acceptations | Taux | Score moyen |
|--------------|----------------|--------------|------|-------------|
| Transport A | 45 | 38 | 84% | 92 |
| Transport B | 32 | 25 | 78% | 88 |
| Transport C | 28 | 15 | 54% | 75 |

### Analyse des refus
Raisons principales :
- 🔴 Indisponibilité véhicule : 40%
- 🟠 Prix non accepté : 25%
- 🟡 Délai trop court : 20%
- ⚪ Autres : 15%

### Performance par flux
Analysez par :
- Zone géographique
- Type de marchandise
- Client donneur d'ordres
- Période (jour, semaine, mois)

## Optimisation

### Recommandations automatiques
Affret.IA suggère :
- "Augmentez le poids 'fiabilité' pour le client X (taux d'incident élevé)"
- "Ajoutez Transport Y au pool (bon taux d'acceptation zone Nord)"
- "Retirez Transport Z (3 refus consécutifs)"

### Actions correctives
- Ajuster les critères de scoring
- Modifier le pool de transporteurs
- Revoir les délais de cascade
- Contacter les transporteurs problématiques

## Export des données

### Formats disponibles
- Excel (.xlsx)
- CSV
- PDF (rapports formatés)
- API (intégration BI)

### Données exportables
- Historique des affrètements
- Scores détaillés
- Statistiques transporteurs
- Logs de cascade

## Tableau de bord personnalisé

### Widgets disponibles
- Graphique évolution des KPIs
- Camembert répartition des refus
- Tableau top transporteurs
- Alertes en cours
- Prévisions IA

### Personnalisation
- Glissez-déposez les widgets
- Filtrez par période
- Enregistrez vos vues favorites

## Bonnes pratiques
✅ Consultez le dashboard quotidiennement
✅ Analysez les tendances sur 4 semaines minimum
✅ Agissez sur les recommandations IA
✅ Partagez les rapports avec votre équipe`
          }
        ],
        tags: ['IA', 'automatisation', 'affrètement']
      },

      // TRANSPORTEUR
      {
        moduleId: 'mod_carrier_accept',
        title: 'Acceptation des Missions',
        description: 'Consultez et acceptez les demandes de transport',
        category: 'Portail Transporteur',
        portals: ['transporter'],
        icon: '✅',
        duration: 20,
        order: 7,
        lessons: [
          {
            lessonId: 'les_20',
            title: 'Liste des demandes',
            contentType: 'video',
            duration: 7,
            order: 0,
            content: `# Mode Opératoire : Liste des demandes de transport

## Objectif
Consulter et gérer les demandes de transport reçues.

## Accès
Menu > Missions > Demandes entrantes

## Interface de la liste

### Vue d'ensemble
La page affiche :
- **Compteur** : X nouvelles demandes
- **Liste chronologique** : Plus récentes en haut
- **Filtres rapides** : Par date, zone, type

### Informations par demande
Chaque ligne affiche :
| Élément | Description |
|---------|-------------|
| N° Demande | Identifiant unique |
| Client | Nom du donneur d'ordres |
| Trajet | Origine → Destination |
| Date | Date de chargement souhaitée |
| Type véhicule | Requis pour cette mission |
| Délai réponse | Temps restant |
| Statut | Nouvelle, Vue, En attente |

### Indicateurs visuels
- 🔴 Nouveau : Pas encore consulté
- 🟡 Vu : Consulté mais pas de réponse
- 🟢 Répondu : Devis envoyé
- ⚫ Expiré : Délai dépassé

## Filtres et recherche

### Filtres disponibles
- **Par date** : Aujourd'hui, Cette semaine, Ce mois
- **Par zone** : Département de départ
- **Par type** : Véhicule requis
- **Par client** : Donneur d'ordres spécifique

### Recherche rapide
- Par numéro de demande
- Par ville de départ/arrivée
- Par référence client

## Actions disponibles

### Depuis la liste
- 👁️ **Voir détail** : Ouvrir la demande
- ✅ **Répondre** : Envoyer un devis
- ❌ **Refuser** : Décliner la demande
- 📁 **Archiver** : Masquer de la liste

### Tri des demandes
- Par date de réponse (urgent en premier)
- Par proximité géographique
- Par client (favoris en premier)
- Par montant estimé

## Notifications

### Alertes automatiques
- Nouvelle demande reçue
- Rappel avant expiration
- Attribution confirmée

### Configuration
- Paramètres > Notifications
- Choisissez : Email, SMS, Push

## Bonnes pratiques
✅ Consultez la liste plusieurs fois par jour
✅ Répondez dans les délais pour améliorer votre score
✅ Utilisez les filtres pour prioriser
✅ Refusez proprement plutôt que d'ignorer`
          },
          {
            lessonId: 'les_21',
            title: 'Détails et tarification',
            contentType: 'video',
            duration: 7,
            order: 1,
            content: `# Mode Opératoire : Détails et tarification

## Objectif
Analyser une demande et proposer un tarif adapté.

## Consultation du détail

### Informations transport
- **Origine** : Adresse complète, contact, instructions
- **Destination** : Adresse complète, contact, instructions
- **Dates** : Chargement et livraison souhaités
- **Créneaux** : Horaires de disponibilité sites

### Informations marchandise
- **Nature** : Type de marchandise
- **Conditionnement** : Palettes, vrac, colis
- **Quantité** : Nombre et dimensions
- **Poids** : Poids total en kg
- **Particularités** : ADR, température, fragile

### Exigences véhicule
- **Type requis** : Fourgon, PL, Semi
- **Équipements** : Hayon, sangles, transpalette
- **Certifications** : ADR, GDP, etc.

### Documents demandés
- ☐ CMR signée
- ☐ Photos chargement/déchargement
- ☐ Bon de livraison
- ☐ Certificats spécifiques

## Calcul du tarif

### Éléments à considérer
1. **Distance** : km aller + retour à vide éventuel
2. **Temps** : Heures de conduite + attente site
3. **Véhicule** : Coût journalier du type requis
4. **Carburant** : Consommation estimée
5. **Péages** : Autoroutes sur le trajet
6. **Manutention** : Si requise

### Formule de base
Prix = (Distance × €/km) + Péages + Frais fixes

### Aide au calcul
SYMPHONI.A propose :
- Distance estimée (via calcul d'itinéraire)
- Péages estimés
- Prix du marché pour ce trajet

### Marge et négociation
- Appliquez votre marge habituelle
- Tenez compte de la concurrence
- Considérez la relation client

## Envoi du devis

### Renseigner le tarif
- **Prix total** : Montant HT
- **Validité** : Durée de validité du devis
- **Conditions** : Délai de paiement, inclusions

### Options additionnelles
Proposez des options :
- ☐ Assurance complémentaire
- ☐ Express (livraison J+0)
- ☐ Service premium

### Message personnalisé
Ajoutez un commentaire :
"Disponible avec semi bâché. Chargement possible dès 6h."

## Suivi du devis

### Après envoi
- Statut : "Devis envoyé"
- Notification si accepté/refusé
- Possibilité de modifier avant réponse

### Historique
- Tous vos devis sont archivés
- Consultez les prix passés pour ce client
- Analysez votre taux de conversion

## Bonnes pratiques
✅ Vérifiez bien toutes les contraintes avant de chiffrer
✅ Proposez un prix compétitif mais rentable
✅ Soyez réactif : la rapidité compte
✅ Personnalisez votre réponse`
          },
          {
            lessonId: 'les_22',
            title: 'Acceptation et confirmation',
            contentType: 'interactive',
            duration: 6,
            order: 2,
            content: `# Mode Opératoire : Acceptation et confirmation

## Objectif
Accepter une mission et confirmer les détails d'exécution.

## Notification d'attribution

### Réception de l'attribution
Vous recevez :
- Email de confirmation
- Notification push
- Mise à jour dans la liste des missions

### Contenu de l'attribution
- Détails complets du transport
- Prix convenu
- Conditions particulières
- Délai pour confirmer

## Processus de confirmation

### 1. Vérifier les informations
Contrôlez avant d'accepter :
- ✅ Dates et horaires possibles
- ✅ Véhicule disponible
- ✅ Chauffeur disponible
- ✅ Équipements requis en ordre
- ✅ Documents et autorisations OK

### 2. Affecter les ressources
Renseignez :
- **Véhicule** : Immatriculation
- **Chauffeur** : Nom et téléphone
- **Équipements** : Confirmation disponibilité

### 3. Confirmer la mission
- Cliquez sur "Confirmer la mission"
- La mission passe au statut "Confirmée"
- Le client est notifié automatiquement

## Informations transmises au client

### Après confirmation
Le client reçoit :
- Confirmation de prise en charge
- Nom du chauffeur
- N° de téléphone chauffeur
- Immatriculation véhicule
- ETA de chargement

## Modification après confirmation

### Changements possibles
Vous pouvez modifier :
- Véhicule (si même type)
- Chauffeur
- Heure d'arrivée prévue

### Changements nécessitant accord
Contactez le client pour :
- Modification de date
- Changement de type véhicule
- Report de livraison

## Annulation

### Procédure d'annulation
Si vous devez annuler :
1. Menu > Missions > Ma mission
2. Cliquez sur "Annuler"
3. Sélectionnez le motif
4. Confirmez l'annulation

### Conséquences
- Le client est notifié immédiatement
- Impact possible sur votre score
- Pénalités selon délai d'annulation

### Motifs acceptables
- Panne véhicule (justificatif requis)
- Accident
- Conditions météo extrêmes
- Force majeure

## Préparation de la mission

### Checklist avant départ
- ☐ Documents du véhicule à jour
- ☐ Carte conducteur valide
- ☐ Équipements requis chargés
- ☐ Itinéraire consulté
- ☐ Coordonnées des contacts enregistrées

### Application mobile
- Téléchargez l'app SYMPHONI.A
- Connectez-vous avec vos identifiants
- Accédez à la mission depuis l'app
- Activez le partage GPS

## Bonnes pratiques
✅ Confirmez rapidement pour rassurer le client
✅ Vérifiez la disponibilité réelle avant confirmation
✅ Annulez le plus tôt possible si nécessaire
✅ Communiquez proactivement en cas de changement`
          }
        ],
        tags: ['transporteur', 'missions']
      },
      {
        moduleId: 'mod_carrier_execution',
        title: 'Exécution du Transport',
        description: 'Gérez l\'exécution : RDV, chargement, livraison, POD',
        category: 'Portail Transporteur',
        portals: ['transporter'],
        icon: '📦',
        duration: 30,
        order: 8,
        lessons: [
          {
            lessonId: 'les_23',
            title: 'Prise de RDV',
            contentType: 'video',
            duration: 8,
            order: 0,
            content: `# Mode Opératoire : Prise de rendez-vous

## Objectif
Prendre les rendez-vous de chargement et livraison.

## Accès
- Menu > Missions > Ma mission en cours
- Ou depuis l'application mobile

## RDV de chargement

### 1. Consulter les créneaux
La mission indique :
- Date souhaitée par le client
- Créneaux possibles (ex: 8h-12h)
- Instructions d'accès au site

### 2. Contacter l'expéditeur
Options disponibles :
- 📞 Appel direct (numéro affiché)
- 💬 Message via SYMPHONI.A
- 📧 Email automatique

### 3. Confirmer le RDV
- Sélectionnez la date et l'heure
- Enregistrez le RDV dans SYMPHONI.A
- Le client est notifié automatiquement

### 4. Informations à obtenir
- Heure exacte d'arrivée
- Quai ou zone de chargement
- Temps de chargement prévu
- Documents à présenter

## RDV de livraison

### 1. Vérifier les contraintes
Le destinataire peut avoir :
- Créneaux imposés
- Jours de fermeture
- Procédures spécifiques

### 2. Prendre le RDV
- Après confirmation du chargement
- Via l'outil de RDV intégré
- Ou contact direct destinataire

### 3. Confirmer dans l'application
- Renseignez date et heure
- Ajoutez des notes si nécessaire
- Validez le RDV

## Gestion des créneaux

### Vue calendrier
- Visualisez tous vos RDV
- Évitez les conflits horaires
- Optimisez vos tournées

### Modifications
Si besoin de modifier un RDV :
1. Contactez le site concerné
2. Convenez d'un nouveau créneau
3. Mettez à jour dans SYMPHONI.A
4. Le client est notifié

### Annulation de RDV
- Prévenez au plus tôt
- Indiquez le motif
- Proposez une alternative si possible

## Rappels automatiques

### Notifications envoyées
- J-1 : Rappel du RDV lendemain
- H-2 : Rappel 2h avant
- Arrivée : Notification au site

### Configuration
Personnalisez vos rappels dans :
Paramètres > Notifications > RDV

## Intégration calendrier

### Synchronisation
- Exportez vers Google Calendar
- Exportez vers Outlook
- Format iCal disponible

### Partage avec le chauffeur
- Le chauffeur voit les RDV sur l'app mobile
- Alertes push activées
- Navigation intégrée

## Bonnes pratiques
✅ Prenez les RDV dès confirmation de mission
✅ Prévoyez une marge pour les imprévus
✅ Confirmez le RDV la veille
✅ Arrivez 15 min avant le créneau`
          },
          {
            lessonId: 'les_24',
            title: 'Confirmation chargement',
            contentType: 'video',
            duration: 8,
            order: 1,
            content: `# Mode Opératoire : Confirmation de chargement

## Objectif
Confirmer le chargement et envoyer les informations au client.

## Arrivée sur site

### 1. Signaler l'arrivée
Via l'application mobile :
- Cliquez sur "Arrivé sur site"
- La géolocalisation confirme la position
- Le client est notifié

### 2. Présentation
À la réception :
- Présentez votre mission SYMPHONI.A
- Montrez le numéro de commande
- Présentez vos documents véhicule

## Processus de chargement

### 1. Vérification marchandise
Avant chargement, vérifiez :
- ✅ Conformité avec la commande
- ✅ Quantité correcte
- ✅ État apparent de la marchandise
- ✅ Emballage intact
- ✅ Étiquetage présent

### 2. Réserves éventuelles
Si anomalie constatée :
- Signalez immédiatement à l'expéditeur
- Photographiez le problème
- Notez les réserves sur la CMR
- Informez votre exploitation

### 3. Chargement
Pendant le chargement :
- Vérifiez la répartition des charges
- Assurez l'arrimage
- Contrôlez le calage

## Confirmation dans l'application

### 1. Renseigner les informations
- Heure de début de chargement
- Heure de fin de chargement
- Quantité chargée (palettes, colis, poids)

### 2. Documents
Scannez ou photographiez :
- CMR signée par l'expéditeur
- Bon de chargement
- Liste de colisage

### 3. Photos (si requis)
Prenez des photos :
- Vue d'ensemble du chargement
- Détail de l'arrimage
- État de la marchandise

### 4. Valider le chargement
- Cliquez sur "Confirmer chargement"
- Le statut passe à "Chargé - En transit"
- Le client est notifié avec ETA livraison

## Notification au client

### Informations transmises
Le client reçoit :
- Confirmation de chargement
- Heure de départ effective
- ETA livraison mise à jour
- Documents scannés

### Tracking activé
- Position GPS en temps réel
- Mise à jour automatique de l'ETA
- Alertes si retard détecté

## En cas de problème

### Refus de chargement
Si la marchandise n'est pas conforme :
1. Documentez le problème (photos)
2. Contactez votre exploitation
3. Notifiez dans l'application
4. Attendez les instructions

### Quantité différente
Si quantité différente de prévu :
1. Notez la quantité réelle
2. Faites signer l'expéditeur
3. Informez via l'application
4. Le client décide de la suite

### Site fermé ou inaccessible
1. Photographiez la situation
2. Notifiez dans l'application
3. Contactez le client
4. Documentez le temps d'attente

## Bonnes pratiques
✅ Vérifiez toujours avant de charger
✅ Photographiez les anomalies
✅ Signez et faites signer les documents
✅ Confirmez le chargement immédiatement`
          },
          {
            lessonId: 'les_25',
            title: 'Preuve de livraison (POD)',
            contentType: 'interactive',
            duration: 10,
            order: 2,
            content: `# Mode Opératoire : Preuve de livraison (POD)

## Objectif
Capturer et transmettre la preuve de livraison pour clôturer la mission.

## Qu'est-ce qu'une POD ?

### Définition
POD = Proof of Delivery (Preuve de Livraison)
Document attestant que la marchandise a été livrée et réceptionnée.

### Éléments constitutifs
- Date et heure de livraison
- Signature du réceptionnaire
- Nom du signataire
- Cachet de l'entreprise (si applicable)
- Réserves éventuelles

## Processus de livraison

### 1. Arrivée sur site
Via l'application :
- Cliquez sur "Arrivé sur site livraison"
- Géolocalisation automatique
- Le client est notifié

### 2. Déchargement
- Présentez-vous à la réception
- Procédez au déchargement
- Laissez le destinataire vérifier

### 3. Vérification par le destinataire
Le réceptionnaire contrôle :
- Quantité reçue
- État apparent
- Conformité avec le bon

## Capture de la POD

### Via l'application mobile

#### 1. Ouvrir la capture POD
- Menu > Mission en cours > POD
- Ou bouton rapide "Capturer POD"

#### 2. Informations à renseigner
- **Nom du réceptionnaire** : Prénom Nom
- **Fonction** : (optionnel)
- **Quantité livrée** : Nombre de colis/palettes
- **État** : Conforme / Avec réserves

#### 3. Signature électronique
- Le réceptionnaire signe sur l'écran
- La signature est horodatée et géolocalisée
- Possibilité de retoucher si nécessaire

#### 4. Photos
Prenez obligatoirement :
- Photo du déchargement terminé
- Photo du bon de livraison signé
- Photos des réserves (si applicable)

#### 5. Validation
- Vérifiez toutes les informations
- Cliquez sur "Valider la POD"
- Le document est généré automatiquement

## Gestion des réserves

### Types de réserves
- **Manquant** : Quantité inférieure
- **Avarie** : Marchandise endommagée
- **Erreur** : Produit non conforme

### Procédure avec réserves
1. Cochez "Livraison avec réserves"
2. Sélectionnez le type de réserve
3. Détaillez dans le champ commentaire
4. Photographiez les dommages
5. Faites signer en mentionnant les réserves

### Notification au client
En cas de réserves :
- Le client est alerté immédiatement
- Photos et détails transmis
- Procédure incident déclenchée

## Document POD généré

### Contenu du document
- En-tête SYMPHONI.A
- N° de commande et mission
- Informations transport (origine/destination)
- Détails marchandise
- Signature électronique
- Horodatage et géolocalisation
- Photos jointes
- QR code de vérification

### Diffusion automatique
Le POD est envoyé à :
- Donneur d'ordres
- Expéditeur (si différent)
- Votre espace documentaire

## Consultation ultérieure

### Retrouver une POD
- Menu > Documents > POD
- Recherche par n° commande
- Filtres par date, client

### Téléchargement
- Format PDF
- Envoi par email
- Partage via lien sécurisé

## Bonnes pratiques
✅ Capturez la POD immédiatement après livraison
✅ Faites relire avant signature
✅ Photographiez systématiquement
✅ Mentionnez les réserves clairement
✅ Vérifiez que la signature est lisible`
          },
          {
            lessonId: 'les_26',
            title: 'Gestion des incidents',
            contentType: 'video',
            duration: 4,
            order: 3,
            content: `# Mode Opératoire : Gestion des incidents (Transporteur)

## Objectif
Déclarer et gérer les incidents pendant le transport.

## Types d'incidents

### Incidents véhicule
- 🔧 Panne mécanique
- 🚗 Accident
- 🛞 Crevaison
- ⛽ Panne carburant

### Incidents marchandise
- 📦 Avarie détectée
- 📉 Manquant constaté
- 🔄 Erreur de livraison
- ❌ Refus de réception

### Incidents planning
- ⏰ Retard significatif
- 🚫 Site inaccessible
- 🔒 Site fermé
- 📋 Documents manquants

## Déclaration d'incident

### 1. Depuis l'application mobile
- Menu > Incident > Déclarer
- Ou bouton d'urgence 🆘

### 2. Informations à fournir
- **Type d'incident** : Catégorie
- **Gravité** : Mineur / Majeur / Critique
- **Description** : Détails de la situation
- **Localisation** : Automatique via GPS
- **Photos** : Pièces jointes obligatoires

### 3. Impact sur la mission
Indiquez :
- Retard estimé
- Nécessité d'assistance
- Possibilité de poursuivre

## Procédure par type

### Panne véhicule
1. Sécurisez le véhicule
2. Déclarez dans l'application
3. Appelez l'assistance
4. Tenez le client informé

### Avarie marchandise
1. Photographiez immédiatement
2. Ne déplacez pas si possible
3. Déclarez avec photos
4. Attendez instructions

### Retard significatif
1. Dès que vous savez, déclarez
2. Nouvelle ETA estimée
3. Le client peut prendre des dispositions

## Suivi de l'incident

### Statuts de l'incident
- 🔴 Ouvert : En cours de traitement
- 🟡 En résolution : Actions en cours
- 🟢 Résolu : Clôturé
- ⚫ Annulé : Fausse alerte

### Échanges
- Chat intégré avec le client
- Historique des communications
- Pièces jointes partagées

### Clôture
- Description de la résolution
- Documents finaux
- Validation des parties

## Assistance

### Numéros utiles
Depuis l'app, accédez à :
- Assistance dépannage
- Support SYMPHONI.A
- Contact client direct

### Fonctionnalités d'urgence
- Partage de position en temps réel
- Appel d'urgence intégré
- Notification automatique des proches

## Bonnes pratiques
✅ Déclarez immédiatement, n'attendez pas
✅ Documentez avec photos/vidéos
✅ Communiquez régulièrement
✅ Conservez tous les justificatifs`
          }
        ],
        tags: ['transporteur', 'exécution', 'POD']
      },

      // DOCUMENTS
      {
        moduleId: 'mod_documents',
        title: 'Gestion Documentaire',
        description: 'Gérez CMR, bons de livraison, photos et documents',
        category: 'Documents',
        portals: ['all'],
        icon: '📄',
        duration: 25,
        order: 9,
        lessons: [
          {
            lessonId: 'les_27',
            title: 'Types de documents',
            contentType: 'video',
            duration: 8,
            order: 0,
            content: `# Mode Opératoire : Types de documents

## Objectif
Comprendre les différents types de documents utilisés dans le transport.

## Documents de transport

### CMR (Lettre de Voiture)
**Convention Marchandises Routières**
- Document contractuel obligatoire
- 3 exemplaires : Expéditeur, Transporteur, Destinataire
- Contient : parties, marchandise, trajet, instructions

### Bon de Livraison (BL)
- Preuve de livraison simple
- Liste détaillée des produits
- Signé par le réceptionnaire

### Bordereau d'Expédition
- Récapitulatif des colis
- Poids et dimensions
- Référence commande client

## Documents commerciaux

### Facture transport
- Détail de la prestation
- Montant HT et TTC
- Références du transport

### Bon de commande
- Engagement d'achat de transport
- Conditions tarifaires
- Références client

## Documents réglementaires

### Attestation de capacité
- Autorise l'exercice du transport
- Obligatoire pour le transporteur

### Licence de transport
- Licence communautaire (international)
- Licence intérieure (France)

### Attestation d'assurance
- Couverture responsabilité civile
- Couverture marchandises

### Documents ADR
Pour marchandises dangereuses :
- Déclaration de chargement
- Consignes de sécurité
- Fiches de sécurité produit

## Documents de contrôle

### Disques chronotachygraphes
- Temps de conduite/repos
- Obligatoire (numérique ou papier)

### Carte conducteur
- Identifie le chauffeur
- Enregistre les données de conduite

## Photos et preuves

### Types de photos
- 📸 Chargement : État de la marchandise
- 📸 Arrimage : Sécurisation du chargement
- 📸 Déchargement : Livraison effectuée
- 📸 Anomalies : Dommages constatés

### Utilisation
- Preuve en cas de litige
- Documentation du transport
- Réclamations assurance

## Gestion dans SYMPHONI.A

### Centralisation
Tous les documents au même endroit :
- Menu > Documents
- Filtres par commande, type, date

### Statuts des documents
- 📥 Attendu : Document requis non reçu
- ✅ Reçu : Document uploadé
- ⚠️ À valider : En attente de vérification
- ✓ Validé : Conforme

## Bonnes pratiques
✅ Nommez clairement vos fichiers
✅ Vérifiez la lisibilité des scans
✅ Archivez les originaux papier
✅ Respectez les durées de conservation`
          },
          {
            lessonId: 'les_28',
            title: 'Upload et organisation',
            contentType: 'interactive',
            duration: 10,
            order: 1,
            content: `# Mode Opératoire : Upload et organisation des documents

## Objectif
Téléverser et organiser efficacement vos documents dans SYMPHONI.A.

## Méthodes d'upload

### 1. Depuis une commande
- Ouvrez le détail de la commande
- Onglet "Documents"
- Cliquez sur "+ Ajouter un document"
- Sélectionnez ou glissez-déposez le fichier

### 2. Upload en masse
- Menu > Documents > Import
- Sélectionnez plusieurs fichiers
- SYMPHONI.A détecte automatiquement le type

### 3. Depuis l'application mobile
- Prenez une photo ou scannez
- Cliquez sur "Ajouter au dossier"
- Le document est uploadé instantanément

### 4. Par email
- Envoyez à documents@symphoni-a.com
- Objet : N° de commande
- Le document est rattaché automatiquement

## Formats acceptés

| Format | Extensions | Taille max |
|--------|------------|------------|
| Images | JPG, PNG, TIFF | 10 Mo |
| Documents | PDF | 25 Mo |
| Tableurs | XLS, XLSX | 10 Mo |
| Archives | ZIP | 50 Mo |

## Organisation des documents

### Arborescence automatique
SYMPHONI.A organise par :
- Année > Mois > N° Commande > Type de document

### Catégorisation
Lors de l'upload, sélectionnez le type :
- CMR / Lettre de voiture
- Bon de livraison
- Facture
- Photo
- Autre

### Tags personnalisés
Ajoutez des tags pour faciliter la recherche :
- Urgent
- À traiter
- Litige
- Archivé

## Recherche de documents

### Recherche simple
- Barre de recherche en haut
- Par n° de commande
- Par nom de fichier

### Recherche avancée
Filtrez par :
- Type de document
- Période
- Client/Transporteur
- Tags
- Statut

### OCR (Reconnaissance de texte)
SYMPHONI.A scanne le contenu des PDF :
- Recherche dans le texte des documents
- Extraction automatique des références

## Actions sur les documents

### Visualisation
- Aperçu intégré (PDF, images)
- Zoom et navigation
- Mode plein écran

### Téléchargement
- Document unique : Clic sur "Télécharger"
- Plusieurs documents : Sélection + "Télécharger en ZIP"

### Partage
- Génération de lien sécurisé
- Validité paramétrable (24h, 7j, 30j)
- Envoi par email directement

### Suppression
- Possible si pas de dépendance
- Corbeille avec récupération 30 jours
- Suppression définitive par admin

## Archivage

### Durées de conservation
- Documents transport : 5 ans minimum
- Documents comptables : 10 ans
- Documents sociaux : Durée variable

### Archivage automatique
- Documents > 1 an : Archivés automatiquement
- Restent consultables
- Stockage optimisé

## Bonnes pratiques
✅ Uploadez les documents le jour même
✅ Vérifiez la qualité des scans
✅ Utilisez les bons types de document
✅ Nettoyez régulièrement vos documents temporaires`
          },
          {
            lessonId: 'les_29',
            title: 'Signatures électroniques',
            contentType: 'video',
            duration: 7,
            order: 2,
            content: `# Mode Opératoire : Signatures électroniques

## Objectif
Comprendre et utiliser les signatures électroniques dans SYMPHONI.A.

## Types de signatures

### 1. Signature simple
- Dessin à main levée sur écran tactile
- Valeur probante limitée
- Utilisée pour : POD, bons simples

### 2. Signature avancée
- Liée au signataire de manière univoque
- Données d'identification du signataire
- Utilisée pour : CMR, contrats

### 3. Signature qualifiée
- Certificat électronique qualifié
- Niveau de sécurité maximum
- Équivalente à signature manuscrite
- Utilisée pour : Documents légaux

## Processus de signature

### Côté demandeur
1. Préparez le document à signer
2. Sélectionnez les zones de signature
3. Invitez les signataires
4. Suivez les signatures

### Côté signataire
1. Réception de la demande (email/push)
2. Consultation du document
3. Vérification du contenu
4. Signature (tactile ou certificat)
5. Confirmation

## Signature sur mobile

### Application SYMPHONI.A
- Notification de document à signer
- Ouverture du document
- Zone de signature visible
- Signature au doigt ou stylet
- Validation

### Captation des métadonnées
À chaque signature :
- Date et heure exactes
- Géolocalisation
- Appareil utilisé
- IP de connexion

## Vérification des signatures

### Certificat de signature
Chaque document signé inclut :
- Identité des signataires
- Horodatage certifié
- Chaîne de confiance

### Vérification en ligne
- QR code sur le document
- Scan pour vérifier l'authenticité
- Historique des signatures

## Valeur juridique

### Cadre légal
- Règlement eIDAS (Europe)
- Code civil français (art. 1366-1367)

### Recevabilité
- Signature simple : Preuve à apprécier
- Signature avancée : Présomption de fiabilité
- Signature qualifiée : Force probante

## Cas d'usage

### e-CMR
- Signature expéditeur au chargement
- Signature transporteur
- Signature destinataire à la livraison

### Contrats de transport
- Signature du donneur d'ordres
- Signature du transporteur
- Avenant et modifications

### POD
- Signature du réceptionnaire
- Identification du signataire
- Réserves éventuelles

## Gestion des refus

### Si refus de signer
- Notez le refus dans l'application
- Demandez le motif
- Photographiez si nécessaire
- Alertez votre exploitation

### Signataire absent
- Contactez le responsable du site
- Demandez un autre signataire habilité
- Documentez la situation

## Bonnes pratiques
✅ Vérifiez l'identité du signataire
✅ Faites relire avant signature
✅ Conservez les métadonnées
✅ Archivez les documents signés`
          }
        ],
        tags: ['documents', 'CMR']
      },
      {
        moduleId: 'mod_ecmr',
        title: 'e-CMR - Lettre de Voiture Électronique',
        description: 'Maîtrisez la dématérialisation complète de la CMR',
        category: 'Documents',
        portals: ['industry', 'transporter', 'logistician'],
        icon: '📱',
        duration: 30,
        order: 10,
        lessons: [
          {
            lessonId: 'les_30',
            title: 'Introduction à l\'e-CMR',
            contentType: 'video',
            duration: 10,
            order: 0,
            content: `# Mode Opératoire : Introduction à l'e-CMR

## Objectif
Comprendre l'e-CMR et ses avantages pour votre activité.

## Qu'est-ce que l'e-CMR ?

### Définition
e-CMR = Lettre de Voiture Électronique
Version dématérialisée de la CMR papier traditionnelle.

### Cadre légal
- Protocole e-CMR (2008, addendum à la Convention CMR)
- Ratifié par 30+ pays européens
- France : Applicable depuis 2017

### Équivalence juridique
L'e-CMR a la même valeur que la CMR papier :
- Preuve du contrat de transport
- Preuve de la prise en charge
- Preuve de la livraison

## Avantages de l'e-CMR

### Pour l'expéditeur
- ✅ Réduction des tâches administratives
- ✅ Accès instantané aux documents
- ✅ Suivi en temps réel du statut
- ✅ Archivage automatique

### Pour le transporteur
- ✅ Plus de papier à gérer
- ✅ Signature mobile rapide
- ✅ Transmission immédiate
- ✅ Moins d'erreurs de saisie

### Pour le destinataire
- ✅ Réception anticipée des infos
- ✅ Préparation de la réception
- ✅ Signature simplifiée
- ✅ Accès aux documents 24/7

### Bénéfices globaux
- 📉 Réduction des coûts (impression, envoi)
- ⏱️ Gain de temps (transmission instantanée)
- 🌱 Écologique (zéro papier)
- 🔒 Sécurisé (traçabilité complète)

## Contenu de l'e-CMR

### Cases obligatoires
Identiques à la CMR papier :

| Case | Contenu |
|------|---------|
| 1 | Expéditeur |
| 2 | Destinataire |
| 3 | Lieu de livraison |
| 4 | Lieu/date de chargement |
| 5 | Documents annexés |
| 6-9 | Description marchandise |
| 10-12 | Mentions statistiques |
| 13 | Instructions expéditeur |
| 14-15 | Prescriptions diverses |
| 16 | Transporteur |
| 17-19 | Transporteurs successifs |
| 20-21 | Réserves |
| 22 | Signature expéditeur |
| 23 | Signature transporteur |
| 24 | Signature destinataire |

## Cycle de vie de l'e-CMR

### 1. Création
- Génération par le donneur d'ordres
- Ou création par le transporteur
- Préremplissage depuis la commande

### 2. Signature expéditeur
- Au moment du chargement
- Validation de la prise en charge
- Réserves éventuelles

### 3. Signature transporteur
- Accusé de réception
- Confirmation du chargement

### 4. Transit
- Document accessible à tous
- Mises à jour possibles
- Traçabilité GPS

### 5. Signature destinataire
- À la livraison
- Réserves si nécessaire
- Clôture du document

### 6. Archivage
- Conservation 5 ans minimum
- Accès permanent
- Valeur probante

## Prérequis techniques

### Pour utiliser l'e-CMR
- Compte SYMPHONI.A actif
- Application mobile (chauffeur)
- Connexion internet (ou mode hors-ligne)

### Appareils compatibles
- Smartphones iOS/Android
- Tablettes
- Ordinateurs (web)

## Bonnes pratiques
✅ Formez vos équipes à l'e-CMR
✅ Vérifiez la compatibilité avec vos partenaires
✅ Testez le processus avant généralisation
✅ Gardez un plan B (CMR papier) au début`
          },
          {
            lessonId: 'les_31',
            title: 'Création et signature',
            contentType: 'interactive',
            duration: 12,
            order: 1,
            content: `# Mode Opératoire : Création et signature de l'e-CMR

## Objectif
Créer une e-CMR et collecter les signatures des parties.

## Création de l'e-CMR

### Option 1 : Depuis une commande
1. Ouvrez la commande concernée
2. Menu "Documents" > "Créer e-CMR"
3. Les informations sont préremplies
4. Vérifiez et complétez si nécessaire

### Option 2 : Création directe
1. Menu > Documents > e-CMR > Nouvelle
2. Renseignez manuellement les champs
3. Enregistrez en brouillon ou finalisez

## Champs à renseigner

### Section Expéditeur (1)
- Raison sociale
- Adresse complète
- Téléphone, email

### Section Destinataire (2-3)
- Raison sociale
- Adresse de livraison
- Contact

### Section Chargement (4)
- Adresse de prise en charge
- Date et heure prévues

### Section Marchandise (6-9)
- Nature de la marchandise
- Nombre de colis
- Poids brut
- Volume (si applicable)
- Marques et numéros

### Section Transport (16-17)
- Transporteur principal
- Transporteurs successifs (si plusieurs)
- Véhicule (immatriculation)

### Section Instructions (13-15)
- Instructions spéciales
- Mentions particulières
- Frais de transport

## Processus de signature

### 1. Signature Expéditeur

**Quand ?** Au chargement, avant départ

**Comment ?**
- L'expéditeur ouvre l'e-CMR sur son appareil
- Vérifie les informations
- Ajoute des réserves si nécessaire (case 20)
- Signe électroniquement (case 22)

**Réserves possibles :**
- "Emballage endommagé"
- "Chargement par l'expéditeur"
- "Poids déclaré non vérifié"

### 2. Signature Transporteur

**Quand ?** Après signature expéditeur

**Comment ?**
- Le chauffeur via l'app mobile
- Confirme la prise en charge
- Peut ajouter ses propres réserves (case 18)
- Signe électroniquement (case 23)

### 3. Signature Destinataire

**Quand ?** À la livraison

**Comment ?**
- Le réceptionnaire accède à l'e-CMR
- Via app, lien, ou tablette du chauffeur
- Vérifie la marchandise
- Ajoute des réserves si nécessaire (case 21)
- Signe électroniquement (case 24)

## Gestion des réserves

### Réserves expéditeur (case 20)
- Visible avant départ
- Engage la responsabilité du transporteur

### Réserves transporteur (case 18)
- Au chargement : État de la marchandise
- En transit : Événements particuliers

### Réserves destinataire (case 21)
- À la livraison
- Manquants, avaries, retards
- Délai de 7 jours pour réserves post-livraison

## Modification de l'e-CMR

### Avant clôture
- Modifications possibles par le créateur
- Historique des versions conservé
- Notification aux parties

### Après clôture
- Document figé
- Seuls ajouts : notes, annexes
- Création d'avenant si nécessaire

## Transmission

### Automatique
Chaque partie reçoit automatiquement :
- Notification de création
- Notifications de signature
- Document final signé

### Partage manuel
- Générez un lien de partage
- Envoi par email depuis SYMPHONI.A
- Export PDF

## Cas particuliers

### Refus de signer
1. Documentez le refus dans l'e-CMR
2. Ajoutez une note explicative
3. Conservez des preuves (photos)
4. Alertez votre exploitation

### Problème technique
1. Passez en mode hors-ligne si possible
2. Synchronisez dès que possible
3. Utilisez CMR papier en dernier recours
4. Numérisez ensuite dans le système

## Bonnes pratiques
✅ Créez l'e-CMR avant le chargement
✅ Vérifiez toutes les informations
✅ Collectez les signatures dans l'ordre
✅ Documentez toute anomalie`
          },
          {
            lessonId: 'les_32',
            title: 'Conformité légale',
            contentType: 'document',
            duration: 8,
            order: 2,
            content: `# Mode Opératoire : Conformité légale de l'e-CMR

## Objectif
Assurer la conformité juridique de vos e-CMR.

## Cadre réglementaire

### Convention CMR (1956)
- Base du transport international routier
- 55 pays signataires
- Régit les droits et obligations

### Protocole e-CMR (2008)
- Addendum à la Convention CMR
- Autorise la dématérialisation
- Conditions techniques précisées

### Pays ayant ratifié l'e-CMR
✅ France (2017)
✅ Allemagne
✅ Belgique
✅ Pays-Bas
✅ Espagne
✅ Italie
✅ Pologne
✅ République tchèque
✅ Et 20+ autres pays

### Pays non signataires (attention)
⚠️ Royaume-Uni (post-Brexit)
⚠️ Certains pays d'Europe de l'Est
⚠️ Pays hors Europe

## Exigences légales

### Authentification du document
L'e-CMR doit garantir :
- Intégrité : Non modifié après signature
- Authenticité : Émis par le bon émetteur
- Non-répudiation : Signataire identifié

### Signature électronique
Niveau minimum requis :
- Signature avancée (eIDAS)
- Liée au signataire
- Permet d'identifier le signataire
- Détecte toute modification

### Conservation
- Durée minimum : 5 ans
- Format : Reproductible à l'identique
- Accès : Disponible sur demande

## Mentions obligatoires

### Doivent figurer sur l'e-CMR
- Numéro unique d'identification
- Date et lieu d'établissement
- Toutes les cases 1 à 24 requises
- Signatures électroniques des 3 parties

### Informations techniques
- Horodatage certifié
- Identifiant du système e-CMR
- Chaîne de certification

## Cas de contrôle

### Contrôle routier
Le chauffeur doit pouvoir présenter :
- L'e-CMR sur l'application mobile
- Ou version PDF imprimable
- Mode hors-ligne opérationnel

### Contrôle douanier
- Export de l'e-CMR en PDF certifié
- Vérification via QR code
- Métadonnées accessibles

### Litige commercial
- L'e-CMR fait foi
- Historique des modifications consultable
- Certificat d'authenticité disponible

## Interopérabilité

### Standards reconnus
- UN/CEFACT (Nations Unies)
- IRU (Union Internationale des Transports Routiers)
- GS1 (codification)

### Échange entre systèmes
- APIs standardisées
- Formats XML/JSON normalisés
- Passerelles avec autres prestataires e-CMR

## Archivage légal

### Exigences
- Intégrité garantie dans le temps
- Horodatage qualifié
- Accès contrôlé et tracé

### Solution SYMPHONI.A
- Archivage à valeur probante
- Coffre-fort numérique certifié
- Conservation 10 ans possible

## Responsabilités

### Responsabilité du transporteur
- Correcte saisie des données
- Collecte des signatures
- Conservation du document

### Responsabilité du donneur d'ordres
- Exactitude des informations fournies
- Instructions claires
- Vérification avant validation

## En cas de problème juridique

### Constitution de preuve
1. Exportez l'e-CMR certifiée
2. Incluez le certificat d'authenticité
3. Joignez l'historique des signatures
4. Fournissez les métadonnées

### Contact juridique
- Service juridique SYMPHONI.A disponible
- Documentation fournie sur demande
- Attestation de conformité du système

## Bonnes pratiques
✅ Vérifiez les pays signataires avant transport international
✅ Conservez les documents au-delà du minimum légal
✅ Testez la récupération des archives périodiquement
✅ Formez vos équipes sur les exigences légales`
          }
        ],
        tags: ['e-CMR', 'dématérialisation', 'légal']
      },

      // PALETTES
      {
        moduleId: 'mod_pallets',
        title: 'Gestion des Palettes Europe',
        description: 'Suivez les échanges de palettes et le compte palette',
        category: 'Palettes',
        portals: ['industry', 'transporter', 'supplier'],
        icon: '🎨',
        duration: 20,
        order: 11,
        lessons: [
          {
            lessonId: 'les_33',
            title: 'Compte palette',
            contentType: 'video',
            duration: 7,
            order: 0,
            content: `# Mode Opératoire : Compte palette

## Objectif
Comprendre et gérer votre compte palette dans SYMPHONI.A.

## Qu'est-ce que le compte palette ?

### Définition
Système de comptabilisation des palettes Europe échangées entre les différents acteurs de la chaîne logistique.

### Principe de l'échange
- Palette contre palette (1:1)
- L'expéditeur donne des palettes
- Le transporteur les livre au destinataire
- Le destinataire rend des palettes vides

## Accès au compte palette
Menu > Palettes > Mon compte

## Vue d'ensemble du compte

### Solde actuel
- **Solde créditeur** : Vous avez des palettes en plus
- **Solde débiteur** : Vous devez des palettes
- **Équilibré** : Compte à zéro

### Historique des mouvements
| Date | Type | Partenaire | Entrées | Sorties | Solde |
|------|------|------------|---------|---------|-------|
| 15/12 | Livraison | Client A | 0 | 10 | -10 |
| 16/12 | Retour | Client A | 8 | 0 | -2 |

## Types de mouvements

### Entrées (crédit)
- ➕ Retour de palettes
- ➕ Achat de palettes
- ➕ Avoir de régularisation

### Sorties (débit)
- ➖ Palettes livrées
- ➖ Palettes perdues/cassées
- ➖ Facture de régularisation

## Gestion par partenaire

### Vue par client/transporteur
- Solde individuel par partenaire
- Historique des échanges
- Litiges en cours

### Relances automatiques
- Alerte si solde débiteur > seuil
- Rappel par email
- Escalade si non résolu

## Valorisation des palettes

### Prix de référence
- Palette Europe neuve : ~25-30€
- Palette Europe occasion : ~8-15€
- Palette consigne : Variable

### Impact comptable
- Provisions pour palettes
- Écarts de stock
- Régularisations périodiques

## Bonnes pratiques
✅ Vérifiez votre solde régulièrement
✅ Traitez les écarts rapidement
✅ Documentez les palettes cassées
✅ Anticipez les régularisations`
          },
          {
            lessonId: 'les_34',
            title: 'Échanges au chargement',
            contentType: 'video',
            duration: 7,
            order: 1,
            content: `# Mode Opératoire : Échanges au chargement

## Objectif
Enregistrer correctement les échanges de palettes lors du chargement.

## Processus d'échange standard

### 1. Avant le chargement
- Comptez les palettes à charger
- Préparez les palettes vides à échanger
- Vérifiez l'état des palettes

### 2. Pendant le chargement
- Le chauffeur charge les palettes pleines
- L'expéditeur donne des palettes vides en échange
- Vérification de la qualité des palettes

### 3. Enregistrement
Dans l'application SYMPHONI.A :
- Renseignez le nombre de palettes chargées
- Indiquez le nombre de palettes échangées
- Ajoutez des observations si nécessaire

## Saisie dans l'application

### Depuis la mission (transporteur)
1. Ouvrez la mission
2. Section "Palettes"
3. Renseignez :
   - Palettes chargées : X
   - Palettes récupérées : Y
   - Type : Europe / Autre

### Depuis la commande (expéditeur)
1. Détail de la commande
2. Onglet "Palettes"
3. Confirmez les quantités
4. Validez l'échange

## Types de palettes

### Palette Europe (EPAL)
- Dimensions : 800 x 1200 mm
- Logo EPAL + EUR
- Échangeable 1:1

### Demi-palette Europe
- Dimensions : 800 x 600 mm
- Échange : 2 demi = 1 entière

### Palette industrie
- Dimensions variables
- Non échangeable généralement

## Cas particuliers

### Pas d'échange (différé)
Si l'expéditeur n'a pas de palettes vides :
- Notez "Échange différé"
- Le compte est débité
- À régulariser ultérieurement

### Échange partiel
- Enregistrez le nombre réel échangé
- La différence va au compte

### Palettes refusées
Si palettes non conformes :
- Photographiez les défauts
- Notez le motif de refus
- N'acceptez que les conformes

## Critères de qualité

### Palette acceptable
- Structure intacte
- Pas de planches cassées
- Pas de clous apparents
- Logo visible

### Palette à refuser
- Planches cassées
- Structure déformée
- Humidité excessive
- Contamination

## Documentation

### Sur la CMR
- Case 6 : Nombre de palettes
- Observations : Échange effectué ou différé

### Photos recommandées
- Vue d'ensemble du chargement
- Palettes échangées
- Palettes refusées (si applicable)

## Bonnes pratiques
✅ Comptez toujours avant de signer
✅ Refusez les palettes abîmées
✅ Photographiez les anomalies
✅ Validez l'échange immédiatement dans l'app`
          },
          {
            lessonId: 'les_35',
            title: 'Régularisation',
            contentType: 'interactive',
            duration: 6,
            order: 2,
            content: `# Mode Opératoire : Régularisation des palettes

## Objectif
Régulariser les soldes de palettes et gérer les litiges.

## Quand régulariser ?

### Situations nécessitant régularisation
- Solde débiteur persistant
- Écart constaté lors d'un inventaire
- Palettes perdues ou détériorées
- Fin de relation commerciale

### Fréquence recommandée
- Mensuelle : Clients à fort volume
- Trimestrielle : Clients standard
- Annuelle : Minimum obligatoire

## Processus de régularisation

### 1. État des lieux
- Menu > Palettes > Régularisation
- Sélectionnez le partenaire
- Consultez le solde et l'historique

### 2. Réconciliation
Comparez avec le partenaire :
- Votre solde : X palettes
- Son solde : Y palettes
- Écart : X - Y palettes

### 3. Traitement de l'écart
Options disponibles :
- **Retour physique** : Organisation d'une collecte
- **Facturation** : Facturation au prix convenu
- **Avoir** : Crédit sur le compte
- **Annulation** : Accord mutuel (rare)

## Modes de régularisation

### Retour physique
1. Créez une demande de retour
2. Planifiez la collecte
3. Le transporteur récupère les palettes
4. Validation à réception

### Facturation
1. Créez une facture de régularisation
2. Prix unitaire : €X/palette
3. Envoi au partenaire
4. Paiement selon conditions

### Avoir
1. Créez un avoir
2. Montant : Nb palettes × prix
3. Déduit des prochaines factures

## Gestion des litiges

### Causes de litige
- Désaccord sur les quantités
- Qualité des palettes contestée
- Palettes non rendues

### Processus de résolution
1. Ouvrez un litige dans SYMPHONI.A
2. Joignez les preuves (photos, CMR)
3. Échangez avec le partenaire
4. Trouvez un accord
5. Clôturez le litige

### Médiation
Si pas d'accord :
- Faites appel au support SYMPHONI.A
- Arbitrage basé sur les preuves

## Rapports de régularisation

### Rapport de solde
- État des comptes par partenaire
- Ancienneté des soldes
- Valorisation financière

### Export pour comptabilité
- Format Excel/CSV
- Intégration ERP possible
- Provisions à constituer

## Automatisation

### Alertes configurables
- Solde > X palettes
- Aucune régularisation > Y mois
- Litige non résolu > Z jours

### Régularisation automatique
Paramétrable :
- Facturation auto au-delà d'un seuil
- Relance automatique
- Escalade manager

## Bonnes pratiques
✅ Régularisez régulièrement
✅ Conservez les preuves d'échange
✅ Traitez les litiges rapidement
✅ Anticipez les fins de période comptable`
          }
        ],
        tags: ['palettes', 'Europe', 'échange']
      },

      // ANALYTICS
      {
        moduleId: 'mod_analytics',
        title: 'Tableaux de Bord et Analytics',
        description: 'Analysez vos performances transport avec les KPIs',
        category: 'Analytics',
        portals: ['industry', 'logistician', 'forwarder'],
        icon: '📊',
        duration: 30,
        order: 12,
        lessons: [
          {
            lessonId: 'les_36',
            title: 'KPIs essentiels',
            contentType: 'video',
            duration: 10,
            order: 0,
            content: `# Mode Opératoire : KPIs essentiels du transport

## Objectif
Comprendre et suivre les indicateurs clés de performance.

## Accès aux KPIs
Menu > Analytics > Tableau de bord

## KPIs de performance

### 1. Taux de service (OTIF)
**On Time In Full**
- Formule : Livraisons OK / Total livraisons × 100
- Objectif : > 95%
- Mesure : Respect des délais ET quantités

### 2. Taux de ponctualité
- Livraisons à l'heure / Total × 100
- Objectif : > 90%
- Tolérance : ± 30 minutes généralement

### 3. Taux d'incidents
- Incidents / Total livraisons × 100
- Objectif : < 2%
- Inclut : Avaries, manquants, retards

### 4. Délai moyen de livraison
- Temps entre commande et livraison
- Par zone, par type de transport
- Tendance mensuelle

## KPIs financiers

### 1. Coût moyen par commande
- Total coûts transport / Nb commandes
- Suivi par mois, par client
- Benchmark vs budget

### 2. Coût au km
- Coût total / Km parcourus
- Par type de véhicule
- Comparaison transporteurs

### 3. Taux de remplissage
- Volume utilisé / Capacité totale
- Optimisation des chargements
- Impact sur le coût unitaire

## KPIs opérationnels

### 1. Temps d'affrètement moyen
- Durée entre demande et attribution
- Manuel vs automatique (Affret.IA)
- Par urgence de commande

### 2. Taux d'acceptation transporteur
- Acceptations / Propositions × 100
- Par transporteur
- Indicateur de l'attractivité des missions

### 3. Taux de documents conformes
- Documents reçus à temps / Total requis
- CMR, POD, photos
- Impact sur la facturation

## Visualisation

### Graphiques disponibles
- 📈 Courbes d'évolution
- 📊 Histogrammes comparatifs
- 🥧 Camemberts de répartition
- 📍 Cartes géographiques

### Périodes d'analyse
- Jour / Semaine / Mois / Trimestre / Année
- Comparaison N vs N-1
- Cumul année en cours

## Configuration des objectifs

### Définir les cibles
1. Paramètres > Analytics > Objectifs
2. Pour chaque KPI :
   - Valeur cible
   - Seuil d'alerte (jaune)
   - Seuil critique (rouge)

### Alertes automatiques
- Notification si KPI < objectif
- Email quotidien/hebdo de synthèse
- Dashboard en temps réel

## Bonnes pratiques
✅ Définissez vos objectifs clairement
✅ Suivez les KPIs régulièrement (hebdo minimum)
✅ Analysez les écarts et agissez
✅ Partagez les résultats avec vos équipes`
          },
          {
            lessonId: 'les_37',
            title: 'Rapports personnalisés',
            contentType: 'interactive',
            duration: 12,
            order: 1,
            content: `# Mode Opératoire : Rapports personnalisés

## Objectif
Créer des rapports adaptés à vos besoins d'analyse.

## Accès
Menu > Analytics > Rapports > Créer un rapport

## Création d'un rapport

### 1. Nommer le rapport
- Titre descriptif
- Description (optionnel)
- Catégorie : Opérationnel, Financier, Qualité

### 2. Choisir les données
Sources disponibles :
- Commandes
- Transports
- Incidents
- Documents
- Facturation
- Palettes

### 3. Sélectionner les champs
Glissez-déposez les champs :
- Dimensions : Date, Client, Transporteur, Zone
- Mesures : Nombre, Montant, Poids, Durée

### 4. Appliquer des filtres
Filtrez sur :
- Période (dates)
- Client(s) spécifique(s)
- Transporteur(s)
- Statut
- Zone géographique

### 5. Choisir la visualisation
Types disponibles :
- Tableau de données
- Graphique en barres
- Graphique en courbes
- Camembert
- Carte géographique
- Jauge

## Exemples de rapports

### Rapport performance transporteur
- Données : Transports
- Dimensions : Transporteur, Mois
- Mesures : Nb livraisons, Taux ponctualité, Note
- Visualisation : Tableau + Barres

### Rapport coûts par client
- Données : Facturation
- Dimensions : Client, Mois
- Mesures : Montant total, Nb commandes, Coût moyen
- Visualisation : Courbes

### Rapport incidents par zone
- Données : Incidents
- Dimensions : Région, Type d'incident
- Mesures : Nombre, Pourcentage
- Visualisation : Carte + Camembert

## Fonctionnalités avancées

### Formules calculées
Créez vos propres indicateurs :
- Exemple : Marge = Prix vente - Prix achat
- Pourcentages, moyennes, sommes
- Comparaisons périodiques

### Tableaux croisés dynamiques
- Plusieurs dimensions en ligne/colonne
- Agrégations personnalisées
- Drill-down vers le détail

### Comparaisons
- Période N vs N-1
- Budget vs Réalisé
- Objectif vs Réel

## Planification des rapports

### Envoi automatique
1. Cliquez sur "Planifier"
2. Choisissez la fréquence :
   - Quotidien (ex: 8h00)
   - Hebdomadaire (ex: Lundi 9h)
   - Mensuel (ex: 1er du mois)
3. Destinataires : emails
4. Format : PDF, Excel, ou les deux

### Partage
- Lien de partage (lecture seule)
- Export à la demande
- Intégration dans présentations

## Gestion des rapports

### Mes rapports
- Liste de vos rapports créés
- Favoris pour accès rapide
- Historique des exécutions

### Rapports partagés
- Rapports de l'équipe
- Modèles de l'entreprise
- Rapports standard SYMPHONI.A

## Bonnes pratiques
✅ Créez des rapports pour vos besoins récurrents
✅ Planifiez les rapports importants
✅ Partagez avec les parties prenantes
✅ Revoyez et mettez à jour périodiquement`
          },
          {
            lessonId: 'les_38',
            title: 'Export des données',
            contentType: 'document',
            duration: 8,
            order: 2,
            content: `# Mode Opératoire : Export des données

## Objectif
Exporter vos données pour analyse externe ou archivage.

## Formats d'export disponibles

### Excel (.xlsx)
- Format le plus courant
- Conserve la mise en forme
- Compatible avec tous les tableurs

### CSV (.csv)
- Format universel
- Léger et simple
- Import facile dans autres systèmes

### PDF
- Pour diffusion/impression
- Mise en forme figée
- Incluant graphiques

### JSON/XML
- Pour intégrations techniques
- APIs et systèmes externes

## Types d'exports

### Export de liste
Depuis n'importe quelle liste :
1. Appliquez vos filtres
2. Cliquez sur "Exporter"
3. Choisissez le format
4. Téléchargez

### Export de rapport
Depuis un rapport :
1. Générez le rapport
2. Bouton "Exporter"
3. PDF et/ou Excel
4. Inclut les graphiques

### Export en masse
Pour grands volumes :
1. Menu > Administration > Export
2. Sélectionnez les données
3. Définissez la période
4. Lancez l'export (traitement asynchrone)
5. Téléchargez quand prêt

## Données exportables

### Commandes
- Toutes les commandes
- Filtres : dates, statut, client
- Champs : tous les détails

### Transports
- Historique des transports
- Informations transporteur
- Données de tracking

### Documents
- Liste des documents
- Liens de téléchargement
- Métadonnées

### Facturation
- Factures et pré-factures
- Détail des lignes
- Statuts de paiement

## Intégration avec outils externes

### Connecteurs natifs
- Excel : Connexion directe via Power Query
- Power BI : Connecteur dédié
- Tableau : Export compatible
- Google Sheets : Via CSV

### API d'export
Pour automatisation :
- Endpoints REST disponibles
- Documentation technique
- Authentification par token

## Planification des exports

### Exports récurrents
1. Configurez l'export
2. Planifiez : Quotidien, Hebdo, Mensuel
3. Destination : Email, SFTP, Cloud

### Exemples d'usage
- Export quotidien vers ERP
- Rapport hebdo vers direction
- Archivage mensuel comptable

## Sécurité des exports

### Données sensibles
- Certains champs peuvent être masqués
- Export soumis aux permissions utilisateur
- Traçabilité des exports

### Protection des fichiers
- Mot de passe sur Excel/PDF (optionnel)
- Chiffrement en transit
- Liens temporaires

## Limites et performances

### Tailles maximales
| Type | Limite |
|------|--------|
| Export liste | 50 000 lignes |
| Export rapport | 100 000 lignes |
| Export en masse | 500 000 lignes |

### Temps de traitement
- < 10 000 lignes : Instantané
- 10-50 000 : Quelques secondes
- > 50 000 : Traitement en arrière-plan

## Bonnes pratiques
✅ Filtrez avant d'exporter
✅ Utilisez le bon format selon l'usage
✅ Automatisez les exports récurrents
✅ Archivez les exports importants`
          }
        ],
        tags: ['analytics', 'KPI', 'rapports']
      },
      {
        moduleId: 'mod_ai_reports',
        title: 'Rapports IA',
        description: 'Générez des analyses automatiques avec l\'intelligence artificielle',
        category: 'Analytics',
        portals: ['industry', 'logistician'],
        icon: '🧠',
        duration: 25,
        order: 13,
        lessons: [
          {
            lessonId: 'les_39',
            title: 'Types de rapports IA',
            contentType: 'video',
            duration: 8,
            order: 0,
            content: `# Mode Opératoire : Types de rapports IA

## Objectif
Découvrir les rapports générés par l'intelligence artificielle.

## Accès
Menu > Analytics > Rapports IA

## Rapports disponibles

### 1. Analyse prédictive des volumes
L'IA prédit vos volumes futurs :
- Prévisions à 1, 3, 6 mois
- Par client, par zone
- Saisonnalité détectée
- Confiance de la prédiction

### 2. Détection d'anomalies
L'IA identifie automatiquement :
- Coûts anormalement élevés
- Retards inhabituels
- Comportements atypiques
- Tendances préoccupantes

### 3. Optimisation des coûts
Recommandations pour réduire les coûts :
- Consolidation de commandes
- Changement de transporteur
- Optimisation des tournées
- Négociation tarifaire

### 4. Analyse de performance transporteur
Scoring automatique incluant :
- Fiabilité historique
- Évolution de la qualité
- Comparaison au marché
- Recommandations

### 5. Rapport d'incidents patterns
Identification des récurrences :
- Types d'incidents fréquents
- Zones à risque
- Transporteurs concernés
- Actions préventives suggérées

## Comment fonctionne l'IA ?

### Sources de données
L'IA analyse :
- Historique de vos commandes
- Données de transport
- Incidents passés
- Données marché (anonymisées)

### Algorithmes utilisés
- Machine Learning supervisé
- Détection d'anomalies
- Séries temporelles
- Clustering

### Apprentissage continu
- L'IA s'améliore avec vos données
- Feedback utilisateur pris en compte
- Mise à jour mensuelle des modèles

## Interprétation des rapports

### Niveau de confiance
Chaque prédiction indique :
- 🟢 Haute confiance (>80%)
- 🟡 Confiance moyenne (50-80%)
- 🔴 Faible confiance (<50%)

### Explications
L'IA explique ses conclusions :
- Facteurs principaux identifiés
- Données ayant influencé
- Limites de l'analyse

## Bonnes pratiques
✅ Consultez les rapports IA régulièrement
✅ Validez avec votre connaissance métier
✅ Agissez sur les recommandations prioritaires
✅ Donnez du feedback pour améliorer l'IA`
          },
          {
            lessonId: 'les_40',
            title: 'Configuration et planification',
            contentType: 'interactive',
            duration: 10,
            order: 1,
            content: `# Mode Opératoire : Configuration et planification des rapports IA

## Objectif
Configurer et planifier la génération des rapports IA.

## Configuration initiale

### 1. Activer les rapports IA
- Menu > Paramètres > Modules > Rapports IA
- Activez le module
- Acceptez les conditions d'utilisation

### 2. Définir le périmètre
Choisissez les données à analyser :
- ☑️ Toutes les commandes
- ☑️ Filtrer par client
- ☑️ Filtrer par période
- ☑️ Exclure certaines données

### 3. Configurer les seuils
Pour la détection d'anomalies :
| Paramètre | Seuil par défaut | Personnalisable |
|-----------|------------------|-----------------|
| Écart coût | > 20% | Oui |
| Retard | > 2h | Oui |
| Incidents | > 3/mois | Oui |

## Types de rapport à activer

### Rapport quotidien
- Anomalies du jour
- Alertes prioritaires
- Résumé exécutif

### Rapport hebdomadaire
- Tendances de la semaine
- Comparaison semaine précédente
- Recommandations

### Rapport mensuel
- Analyse complète
- Prédictions mises à jour
- Plan d'action suggéré

## Planification des rapports

### Automatique
1. Menu > Rapports IA > Planification
2. Pour chaque type de rapport :
   - Fréquence : Quotidien/Hebdo/Mensuel
   - Heure de génération : ex. 7h00
   - Destinataires : emails

### À la demande
- Bouton "Générer maintenant"
- Pour une analyse ponctuelle
- Temps de génération : 1-5 min

## Personnalisation des rapports

### Sections à inclure
Cochez les sections souhaitées :
- ☑️ Résumé exécutif
- ☑️ Anomalies détectées
- ☑️ Analyse des tendances
- ☑️ Recommandations IA
- ☑️ Prédictions
- ☑️ Détails et données

### Format de sortie
- PDF : Pour diffusion
- Excel : Pour analyse complémentaire
- Dashboard interactif : Consultation en ligne

## Alertes intelligentes

### Configuration
- Menu > Rapports IA > Alertes
- Définissez les conditions d'alerte
- Canaux : Email, SMS, Push

### Exemples d'alertes
- "Anomalie de coût détectée sur Client X"
- "Prédiction : +30% de volume dans 2 mois"
- "Transporteur Y : qualité en baisse"

## Intégration dashboard

### Widget IA
Ajoutez sur votre tableau de bord :
- Dernières alertes IA
- Score de performance prédit
- Recommandations prioritaires

### Drill-down
Depuis le widget :
- Cliquez pour voir le détail
- Accédez au rapport complet
- Historique des analyses

## Bonnes pratiques
✅ Configurez selon vos priorités métier
✅ Planifiez en dehors des heures de pointe
✅ Limitez les destinataires aux personnes concernées
✅ Revoyez la configuration trimestriellement`
          },
          {
            lessonId: 'les_41',
            title: 'Interprétation des résultats',
            contentType: 'document',
            duration: 7,
            order: 2,
            content: `# Mode Opératoire : Interprétation des résultats IA

## Objectif
Comprendre et exploiter les résultats des analyses IA.

## Structure d'un rapport IA

### 1. Résumé exécutif
- Points clés en quelques lignes
- Indicateurs principaux
- Actions recommandées prioritaires

### 2. Anomalies détectées
Liste des éléments anormaux :
- Nature de l'anomalie
- Gravité (1-5)
- Impact estimé
- Action suggérée

### 3. Analyse des tendances
Graphiques et commentaires :
- Évolution des KPIs
- Comparaisons historiques
- Projections futures

### 4. Recommandations
Actions proposées par l'IA :
- Priorité (Haute/Moyenne/Basse)
- Impact attendu
- Facilité de mise en œuvre

## Lire les prédictions

### Courbe de prédiction
- Trait plein : Données réelles
- Trait pointillé : Prédiction
- Zone grisée : Intervalle de confiance

### Interprétation
- Plus la zone est étroite : Plus l'IA est confiante
- Plus la zone est large : Plus d'incertitude
- Regardez la tendance, pas les valeurs exactes

## Types d'anomalies

### Anomalie de coût
**Signal** : Coût transport > moyenne + 2 écarts-types
**Causes possibles** :
- Tarif exceptionnel
- Erreur de facturation
- Transport urgent

**Action** : Vérifier la facture, renégocier si récurrent

### Anomalie de délai
**Signal** : Retard inhabituel pour ce type de trajet
**Causes possibles** :
- Problème transporteur
- Conditions externes
- Erreur de planning

**Action** : Analyser avec le transporteur

### Anomalie de volume
**Signal** : Volume très différent des prédictions
**Causes possibles** :
- Client en difficulté/croissance
- Saisonnalité non détectée
- Perte/gain de contrat

**Action** : Contacter le client, ajuster les prévisions

## Agir sur les recommandations

### Priorité Haute
- Impact significatif
- À traiter sous 1 semaine
- Exemple : Changer de transporteur défaillant

### Priorité Moyenne
- Impact modéré
- À traiter sous 1 mois
- Exemple : Renégocier un tarif

### Priorité Basse
- Optimisation
- À planifier
- Exemple : Consolider des commandes

## Feedback à l'IA

### Pourquoi donner du feedback ?
- Améliore la précision
- Adapte à votre contexte
- Réduit les faux positifs

### Comment ?
Sur chaque recommandation :
- 👍 Pertinent
- 👎 Non pertinent
- 💬 Commentaire optionnel

## Limites de l'IA

### Ce que l'IA ne sait pas
- Contexte spécifique client
- Événements exceptionnels futurs
- Décisions stratégiques de votre entreprise

### Toujours valider
- Croisez avec votre expérience
- Vérifiez les données sources
- Consultez les équipes terrain

## Bonnes pratiques
✅ Lisez le résumé exécutif en priorité
✅ Concentrez-vous sur les actions à haute priorité
✅ Donnez du feedback régulièrement
✅ N'automatisez pas aveuglément les recommandations`
          }
        ],
        tags: ['IA', 'rapports', 'analyse']
      },

      // FACTURATION
      {
        moduleId: 'mod_invoicing',
        title: 'Pré-facturation et Facturation',
        description: 'Gérez le processus de facturation des transports',
        category: 'Facturation',
        portals: ['industry', 'logistician', 'transporter'],
        icon: '💰',
        duration: 25,
        order: 14,
        lessons: [
          {
            lessonId: 'les_42',
            title: 'Pré-factures automatiques',
            contentType: 'video',
            duration: 8,
            order: 0,
            content: `# Mode Opératoire : Pré-factures automatiques

## Objectif
Comprendre le système de pré-facturation automatique.

## Qu'est-ce qu'une pré-facture ?

### Définition
Document préparatoire à la facture finale, généré automatiquement à la livraison.

### Contenu
- Détail du transport effectué
- Prix convenu lors de l'affrètement
- Frais additionnels éventuels
- Totaux HT et TTC

## Génération automatique

### Déclencheur
La pré-facture est créée quand :
- POD validée (livraison confirmée)
- Documents requis reçus
- Aucun litige en cours

### Délai
- Génération : Sous 24h après livraison
- Notification : Email automatique

## Accès aux pré-factures
Menu > Facturation > Pré-factures

## Contenu de la pré-facture

### En-tête
- N° de pré-facture
- Date d'émission
- Références : Commande, CMR

### Informations transport
- Origine / Destination
- Date de chargement/livraison
- Transporteur / Véhicule

### Détail financier
| Libellé | Quantité | PU HT | Total HT |
|---------|----------|-------|----------|
| Transport Paris-Lyon | 1 | 450,00€ | 450,00€ |
| Frais hayon | 1 | 30,00€ | 30,00€ |
| **Total HT** | | | **480,00€** |
| TVA 20% | | | 96,00€ |
| **Total TTC** | | | **576,00€** |

## Statuts des pré-factures

### 🔵 À valider
- Générée, en attente de vérification
- Action : Vérifier et valider

### 🟡 En attente
- Validée côté fournisseur
- En attente validation client

### 🟢 Validée
- Acceptée par les deux parties
- Prête pour facturation

### 🔴 Contestée
- Litige ouvert
- À traiter avant facturation

## Vérification

### Points à contrôler
- ✅ Références correctes
- ✅ Prix conformes à l'accord
- ✅ Frais additionnels justifiés
- ✅ TVA applicable correcte

### Si erreur détectée
1. Cliquez sur "Contester"
2. Sélectionnez le motif
3. Détaillez l'erreur
4. Envoyez la contestation

## Configuration

### Paramètres de génération
Menu > Paramètres > Facturation :
- Délai de génération
- Validation automatique (si < seuil)
- Destinataires des notifications

## Bonnes pratiques
✅ Vérifiez les pré-factures sous 48h
✅ Traitez les contestations rapidement
✅ Conservez les justificatifs de frais additionnels`
          },
          {
            lessonId: 'les_43',
            title: 'Validation et ajustements',
            contentType: 'interactive',
            duration: 10,
            order: 1,
            content: `# Mode Opératoire : Validation et ajustements

## Objectif
Valider les pré-factures et gérer les ajustements.

## Processus de validation

### 1. Consultation
- Menu > Facturation > Pré-factures
- Filtrez sur "À valider"
- Ouvrez chaque pré-facture

### 2. Vérification
Contrôlez systématiquement :
- Référence commande correcte
- Prix conforme au devis/contrat
- Prestations réellement effectuées
- Frais additionnels justifiés

### 3. Décision
Trois options :
- **Valider** : Tout est conforme
- **Ajuster** : Modifications nécessaires
- **Contester** : Désaccord majeur

## Validation simple

### Validation individuelle
1. Ouvrez la pré-facture
2. Vérifiez les informations
3. Cliquez sur "Valider"
4. La pré-facture passe en "Validée"

### Validation en masse
1. Cochez plusieurs pré-factures
2. Cliquez sur "Valider la sélection"
3. Confirmation globale

## Ajustements

### Types d'ajustements
- Modification du prix
- Ajout de frais
- Suppression de ligne
- Correction de référence

### Procédure d'ajustement
1. Cliquez sur "Ajuster"
2. Sélectionnez la ligne à modifier
3. Indiquez la nouvelle valeur
4. Motif de l'ajustement (obligatoire)
5. Soumettez pour validation

### Workflow d'approbation
- Ajustement < seuil : Auto-approuvé
- Ajustement > seuil : Validation manager
- Le partenaire est notifié

## Contestation

### Motifs de contestation
- Prix non conforme
- Prestation non effectuée
- Quantité incorrecte
- Frais non justifiés
- Erreur de TVA

### Procédure
1. Cliquez sur "Contester"
2. Sélectionnez le motif
3. Détaillez le problème
4. Joignez des preuves si nécessaire
5. Envoyez

### Résolution
- Le partenaire reçoit la contestation
- Échanges via messagerie intégrée
- Accord sur un ajustement
- Clôture de la contestation

## Frais additionnels

### Types courants
| Frais | Description | Justificatif requis |
|-------|-------------|---------------------|
| Attente | > 1h sur site | CMR mention |
| Hayon | Utilisation hayon | À la commande |
| ADR | Transport dangereux | Documents ADR |
| Express | Livraison urgente | Accord écrit |
| Manutention | Aide au chargement | Bon signé |

### Ajout de frais
1. Section "Frais additionnels"
2. "+ Ajouter un frais"
3. Type, montant, justificatif
4. Validation

## Rapprochement

### Avec les commandes
Vérifiez la cohérence :
- Commande → Transport → Pré-facture
- Prix commande = Prix pré-facture

### Avec les documents
- CMR présente et conforme
- POD validée
- Photos si requises

## Bonnes pratiques
✅ Validez ou contestez sous 5 jours
✅ Documentez toujours les ajustements
✅ Gardez une trace des échanges
✅ Utilisez le rapprochement automatique`
          },
          {
            lessonId: 'les_44',
            title: 'Export comptable',
            contentType: 'document',
            duration: 7,
            order: 2,
            content: `# Mode Opératoire : Export comptable

## Objectif
Exporter les données de facturation vers votre comptabilité.

## Types d'exports

### Export factures
- Factures validées
- Format comptable standard
- Pour saisie ou import ERP

### Export pré-factures
- Pré-factures validées
- Pour provisions comptables
- Avant facturation définitive

### Export règlements
- Paiements reçus/effectués
- Rapprochement bancaire
- Lettrage comptable

## Formats disponibles

### Formats standards
| Format | Usage | Compatibilité |
|--------|-------|---------------|
| CSV | Universel | Tous logiciels |
| XLSX | Excel natif | Analyse, import |
| FEC | Fichier Écritures Comptables | Légal France |

### Formats ERP
Connecteurs disponibles :
- SAP
- Sage
- Cegid
- Quadratus
- EBP

## Procédure d'export

### 1. Sélection des données
- Menu > Facturation > Export
- Choisissez le type : Factures/Pré-factures
- Définissez la période

### 2. Filtres
- Par fournisseur/client
- Par statut (validées, payées...)
- Par type de document

### 3. Mapping des comptes
Associez vos comptes comptables :
| Type | Compte par défaut | Votre compte |
|------|-------------------|--------------|
| Achats transport | 624100 | _______ |
| TVA déductible | 445660 | _______ |
| Fournisseurs | 401000 | _______ |

### 4. Génération
- Cliquez sur "Exporter"
- Téléchargez le fichier
- Importez dans votre logiciel

## Automatisation

### Export planifié
1. Paramètres > Export comptable > Planification
2. Fréquence : Quotidien, Hebdo, Mensuel
3. Heure d'exécution
4. Destination : Email, SFTP, Cloud

### Intégration directe
Si connecteur ERP actif :
- Export automatique
- Import dans l'ERP
- Pas de fichier intermédiaire

## Structure des fichiers

### Fichier factures (CSV)
| Champ | Exemple |
|-------|---------|
| Date | 15/12/2024 |
| Journal | AC |
| Compte | 624100 |
| Libellé | Transport CMD-123 |
| Débit | 450,00 |
| Crédit | (vide) |

**Exemple complet d'écriture :**
- Ligne 1 : Date=15/12/2024, Journal=AC, Compte=624100, Libellé=Transport CMD-123, Débit=450,00
- Ligne 2 : Date=15/12/2024, Journal=AC, Compte=445660, Libellé=TVA déd. transport, Débit=90,00
- Ligne 3 : Date=15/12/2024, Journal=AC, Compte=401000, Libellé=Fournisseur XYZ, Crédit=540,00

### Fichier FEC
Conforme à l'article A47 A-1 du LPF :
- 18 champs obligatoires
- Format normé
- Pour contrôle fiscal

## Rapprochement

### Contrôle de cohérence
Avant import, vérifiez :
- Total exports = Total SYMPHONI.A
- Nombre de pièces concordant
- Équilibre débit/crédit

### Lettrage
Utilisez les références :
- N° facture SYMPHONI.A
- N° commande client
- Référence paiement

## Archivage

### Conservation légale
- Factures : 10 ans
- FEC : 6 ans
- Exports : Conservez une copie

### Dans SYMPHONI.A
- Historique des exports
- Re-téléchargement possible
- Traçabilité des opérations

## Bonnes pratiques
✅ Exportez régulièrement (hebdo minimum)
✅ Vérifiez les totaux avant import
✅ Conservez les fichiers d'export
✅ Documentez votre plan comptable dans SYMPHONI.A`
          }
        ],
        tags: ['facturation', 'comptabilité']
      },

      // INCIDENTS
      {
        moduleId: 'mod_incidents',
        title: 'Gestion des Incidents',
        description: 'Déclarez et suivez les incidents de transport',
        category: 'Incidents',
        portals: ['all'],
        icon: '⚠️',
        duration: 20,
        order: 15,
        lessons: [
          {
            lessonId: 'les_45',
            title: 'Déclaration d\'incident',
            contentType: 'video',
            duration: 7,
            order: 0,
            content: `# Mode Opératoire : Déclaration d'incident

## Objectif
Déclarer correctement un incident pour assurer son traitement.

## Accès
- Menu > Incidents > Nouveau
- Ou depuis une commande : "Signaler un incident"

## Types d'incidents

### Incidents marchandise
- 📦 Avarie : Marchandise endommagée
- 📉 Manquant : Quantité inférieure
- 🔄 Erreur : Mauvais produit livré
- ❌ Perte : Marchandise disparue

### Incidents transport
- ⏰ Retard : Livraison hors délai
- 🚫 Non livraison : Impossible de livrer
- 📋 Documents : CMR/POD manquants

### Incidents administratifs
- 💰 Facturation : Écart de prix
- 📝 Données : Erreur d'information

## Formulaire de déclaration

### Informations obligatoires
1. **Commande concernée** : N° de commande
2. **Type d'incident** : Sélection dans la liste
3. **Date de constatation** : Quand l'incident a été détecté
4. **Description** : Détail de l'incident

### Informations complémentaires
- **Gravité** : Mineure / Majeure / Critique
- **Impact financier** : Estimation du préjudice
- **Responsable présumé** : Expéditeur / Transporteur / Destinataire

### Pièces jointes
Obligatoires pour certains types :
- 📸 Photos de l'avarie
- 📄 CMR avec réserves
- 📋 Constat signé

## Classification de gravité

### Incident mineur
- Impact limité
- Résolution simple
- Délai : 5 jours ouvrés

### Incident majeur
- Impact significatif
- Coordination nécessaire
- Délai : 2 jours ouvrés

### Incident critique
- Impact fort (sécurité, client majeur)
- Escalade immédiate
- Délai : Sous 24h

## Notification automatique

### Parties notifiées
- Déclarant : Confirmation
- Responsable présumé : Alerte
- Manager : Si critique
- Client final : Si configuré

### Contenu de la notification
- N° d'incident
- Type et gravité
- Résumé
- Lien vers le dossier

## Délais de déclaration

### Règles à respecter
| Type | Délai maximum |
|------|---------------|
| Avarie visible | À la livraison |
| Avarie cachée | 7 jours |
| Manquant | 7 jours |
| Retard | Jour même |

### Importance des délais
- Recevabilité des réclamations
- Responsabilité du transporteur
- Couverture assurance

## Bonnes pratiques
✅ Déclarez immédiatement
✅ Documentez avec photos
✅ Soyez factuel et précis
✅ Conservez les preuves physiques`
          },
          {
            lessonId: 'les_46',
            title: 'Suivi et résolution',
            contentType: 'video',
            duration: 7,
            order: 1,
            content: `# Mode Opératoire : Suivi et résolution des incidents

## Objectif
Suivre le traitement et résoudre les incidents.

## Accès au suivi
Menu > Incidents > Mes incidents

## Statuts des incidents

### 🔴 Ouvert
- Incident déclaré
- En attente de prise en charge
- Action : Assigner un responsable

### 🟠 En cours
- Responsable assigné
- Investigation en cours
- Action : Suivre l'avancement

### 🟡 En attente
- Information/action externe requise
- Bloqué temporairement
- Action : Relancer si nécessaire

### 🟢 Résolu
- Solution trouvée et appliquée
- Clôture proposée
- Action : Valider la résolution

### ⚫ Clôturé
- Incident traité et validé
- Archivé dans l'historique

## Workflow de traitement

### 1. Assignation
- Le responsable est notifié
- Délai de prise en charge : 24h max
- Si non assigné : Escalade

### 2. Investigation
- Collecte des informations
- Échanges avec les parties
- Identification de la cause

### 3. Proposition de résolution
Options possibles :
- Remboursement
- Avoir commercial
- Remplacement produit
- Indemnisation
- Aucune suite (infondé)

### 4. Validation
- Le déclarant valide la proposition
- Si refus : Négociation ou escalade
- Si accord : Mise en œuvre

### 5. Clôture
- Actions réalisées
- Documentation finale
- Archivage

## Communication

### Messagerie intégrée
- Fil de discussion par incident
- Toutes les parties peuvent participer
- Historique conservé

### Notifications
- Chaque étape notifiée
- Rappels automatiques
- Alertes si dépassement délai

## Tableau de bord incidents

### Vue d'ensemble
- Incidents ouverts : X
- En cours : Y
- En retard : Z (alerte)

### Filtres
- Par statut
- Par type
- Par ancienneté
- Par responsable

## Actions disponibles

### Sur un incident
- Commenter : Ajouter une note
- Assigner : Changer le responsable
- Escalader : Passer au niveau supérieur
- Proposer : Soumettre une solution
- Clôturer : Fermer l'incident

### Actions en masse
- Assigner plusieurs incidents
- Exporter la liste
- Générer un rapport

## Indicateurs de suivi

### Temps de résolution
- Délai moyen par type
- Comparaison aux objectifs
- Tendance mensuelle

### Causes récurrentes
- Top 5 des causes
- Actions préventives
- Évolution dans le temps

## Bonnes pratiques
✅ Répondez dans les délais
✅ Documentez chaque étape
✅ Communiquez régulièrement
✅ Proposez des solutions constructives`
          },
          {
            lessonId: 'les_47',
            title: 'Escalade automatique',
            contentType: 'document',
            duration: 6,
            order: 2,
            content: `# Mode Opératoire : Escalade automatique

## Objectif
Configurer et comprendre le système d'escalade.

## Principe de l'escalade

### Pourquoi escalader ?
- Incident non traité dans les délais
- Gravité nécessitant intervention supérieure
- Blocage dans la résolution

### Niveaux d'escalade
1. **Niveau 1** : Responsable opérationnel
2. **Niveau 2** : Manager d'équipe
3. **Niveau 3** : Direction

## Règles d'escalade automatique

### Par le temps
| Gravité | Niveau 1 | Niveau 2 | Niveau 3 |
|---------|----------|----------|----------|
| Mineure | 5 jours | 10 jours | 15 jours |
| Majeure | 2 jours | 5 jours | 8 jours |
| Critique | 4 heures | 24 heures | 48 heures |

### Par le type
Certains incidents escaladent immédiatement :
- Incident sécurité → Niveau 3
- Client VIP → Niveau 2 minimum
- Montant > X€ → Niveau 2

## Configuration

### Définir les règles
Menu > Paramètres > Incidents > Escalade

### Paramètres disponibles
- Délais par niveau de gravité
- Destinataires par niveau
- Conditions spéciales
- Heures ouvrées vs 24/7

### Notifications d'escalade
Personnalisez les messages :
- Email automatique
- SMS pour niveau critique
- Notification push

## Escalade manuelle

### Quand escalader manuellement ?
- Blocage identifié
- Besoin de validation supérieure
- Situation exceptionnelle

### Procédure
1. Ouvrez l'incident
2. Cliquez sur "Escalader"
3. Sélectionnez le motif
4. Choisissez le destinataire
5. Confirmez

## Gestion des escalades reçues

### Notification
Vous recevez :
- Alerte email prioritaire
- Détail de l'incident
- Historique des actions
- Délai de traitement attendu

### Actions attendues
- Prise en charge immédiate
- Communication avec les parties
- Décision ou délégation
- Mise à jour du statut

## Désescalade

### Quand désescalader ?
- Incident moins grave que prévu
- Résolution en cours au niveau inférieur
- Erreur d'escalade

### Procédure
1. Évaluez la situation
2. Cliquez sur "Désescalader"
3. Indiquez le motif
4. Le niveau inférieur reprend

## Reporting escalades

### Indicateurs suivis
- Nombre d'escalades/mois
- Taux d'escalade par type
- Délai avant escalade
- Résolution après escalade

### Analyse
Les escalades fréquentes indiquent :
- Processus à améliorer
- Formation nécessaire
- Ressources insuffisantes

## Bonnes pratiques
✅ Configurez des délais réalistes
✅ Formez les managers aux escalades
✅ Analysez les causes d'escalade
✅ Revoyez les règles trimestriellement`
          }
        ],
        tags: ['incidents', 'résolution']
      },

      // INTÉGRATIONS
      {
        moduleId: 'mod_integrations',
        title: 'Intégrations et API',
        description: 'Connectez SYMPHONI.A à vos outils (ERP, TMS, WMS)',
        category: 'Intégrations',
        portals: ['industry', 'logistician'],
        icon: '🔗',
        duration: 35,
        order: 16,
        lessons: [
          {
            lessonId: 'les_48',
            title: 'Vue d\'ensemble des intégrations',
            contentType: 'video',
            duration: 10,
            order: 0,
            content: `# Mode Opératoire : Vue d'ensemble des intégrations

## Objectif
Comprendre les possibilités d'intégration de SYMPHONI.A.

## Types d'intégrations

### 1. Intégrations natives
Connecteurs prêts à l'emploi :
- ERP : SAP, Sage, Oracle, Microsoft Dynamics
- TMS : Autres systèmes de transport
- WMS : Systèmes de gestion d'entrepôt
- Comptabilité : Cegid, Quadratus, EBP

### 2. API REST
Pour développements personnalisés :
- Accès à toutes les fonctionnalités
- Documentation complète
- Sandbox de test

### 3. Webhooks
Notifications en temps réel :
- Événements poussés vers vos systèmes
- Configuration flexible
- Retry automatique

### 4. Import/Export fichiers
Pour systèmes legacy :
- Formats CSV, XML, Excel
- Dépôt SFTP
- Planification automatique

## Cas d'usage courants

### ERP → SYMPHONI.A
- Création automatique de commandes
- Synchronisation des clients/fournisseurs
- Mise à jour des références produits

### SYMPHONI.A → ERP
- Retour des statuts de livraison
- Export des factures transport
- Données pour reporting

### TMS existant
- Cohabitation avec SYMPHONI.A
- Échange d'informations
- Migration progressive

## Architecture

### Schéma d'intégration
\`\`\`
[Votre ERP] ←→ [API SYMPHONI.A] ←→ [Base SYMPHONI.A]
                    ↕
              [Webhooks]
                    ↓
            [Vos systèmes]
\`\`\`

### Sécurité
- Authentification OAuth 2.0
- Tokens API sécurisés
- Chiffrement HTTPS
- IP whitelist possible

## Mise en œuvre

### Étapes typiques
1. **Analyse** : Besoins et flux à intégrer
2. **Conception** : Architecture et mapping
3. **Développement** : Configuration/Code
4. **Tests** : Environnement sandbox
5. **Production** : Mise en ligne
6. **Suivi** : Monitoring et maintenance

### Accompagnement
- Documentation technique
- Support développeur
- Équipe intégration disponible

## Monitoring

### Tableau de bord API
- Nombre d'appels
- Taux d'erreur
- Temps de réponse
- Quotas

### Alertes
- Erreurs répétées
- Quota proche du maximum
- Webhook en échec

## Bonnes pratiques
✅ Commencez par un périmètre limité
✅ Testez en sandbox avant production
✅ Prévoyez la gestion des erreurs
✅ Documentez vos intégrations`
          },
          {
            lessonId: 'les_49',
            title: 'API REST',
            contentType: 'document',
            duration: 15,
            order: 1,
            content: `# Mode Opératoire : API REST

## Objectif
Utiliser l'API REST SYMPHONI.A pour vos intégrations.

## Documentation
docs.symphoni-a.com/api

## Authentification

### Obtenir un token
1. Menu > Paramètres > API > Credentials
2. Créez une nouvelle application
3. Notez le Client ID et Client Secret

### Authentification OAuth 2.0
\`\`\`
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
\`\`\`

### Réponse
\`\`\`json
{
  "access_token": "eyJhbGciOiJS...",
  "token_type": "Bearer",
  "expires_in": 3600
}
\`\`\`

### Utilisation du token
\`\`\`
GET /api/v1/orders
Authorization: Bearer eyJhbGciOiJS...
\`\`\`

## Endpoints principaux

### Commandes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /orders | Liste des commandes |
| GET | /orders/{id} | Détail d'une commande |
| POST | /orders | Créer une commande |
| PUT | /orders/{id} | Modifier une commande |
| DELETE | /orders/{id} | Supprimer une commande |

### Transports
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /transports | Liste des transports |
| GET | /transports/{id}/tracking | Position GPS |
| POST | /transports/{id}/status | MAJ statut |

### Documents
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /documents | Liste documents |
| GET | /documents/{id}/download | Télécharger |
| POST | /documents | Uploader |

## Exemples de requêtes

### Créer une commande
\`\`\`
POST /api/v1/orders
Content-Type: application/json
Authorization: Bearer {token}

{
  "reference": "CMD-2024-001",
  "pickup": {
    "address": "1 rue de Paris, 75001 Paris",
    "date": "2024-12-20",
    "contact": "Jean Dupont",
    "phone": "+33612345678"
  },
  "delivery": {
    "address": "5 avenue Lyon, 69001 Lyon",
    "date": "2024-12-21",
    "contact": "Marie Martin",
    "phone": "+33698765432"
  },
  "cargo": {
    "type": "palettes",
    "quantity": 10,
    "weight": 500
  }
}
\`\`\`

### Réponse
\`\`\`json
{
  "id": "ord_abc123",
  "reference": "CMD-2024-001",
  "status": "pending",
  "created_at": "2024-12-15T10:30:00Z"
}
\`\`\`

## Codes de réponse

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Non trouvé |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

## Pagination

### Paramètres
- page : Numéro de page (défaut: 1)
- per_page : Éléments par page (défaut: 20, max: 100)

### Exemple
\`\`\`
GET /api/v1/orders?page=2&per_page=50
\`\`\`

### Réponse
\`\`\`json
{
  "data": [...],
  "meta": {
    "current_page": 2,
    "per_page": 50,
    "total": 234,
    "total_pages": 5
  }
}
\`\`\`

## Rate limiting

### Limites
- 1000 requêtes/heure (standard)
- 5000 requêtes/heure (premium)

### Headers de réponse
\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 850
X-RateLimit-Reset: 1702650000
\`\`\`

## Environnement sandbox

### URL de test
api-sandbox.symphoni-a.com

### Caractéristiques
- Données de test
- Pas d'impact production
- Même API que production

## Bonnes pratiques
✅ Utilisez le sandbox pour les tests
✅ Gérez les erreurs et retries
✅ Respectez les limites de rate
✅ Cachez les données quand possible`
          },
          {
            lessonId: 'les_50',
            title: 'Webhooks',
            contentType: 'interactive',
            duration: 10,
            order: 2,
            content: `# Mode Opératoire : Webhooks

## Objectif
Recevoir des notifications en temps réel via webhooks.

## Qu'est-ce qu'un webhook ?

### Principe
- SYMPHONI.A pousse des événements vers votre serveur
- Pas besoin de polling (interrogation régulière)
- Réaction immédiate aux changements

### Avantages
- Temps réel
- Économie de ressources
- Architecture découplée

## Configuration

### 1. Créer un webhook
Menu > Paramètres > API > Webhooks > Nouveau

### 2. Paramètres
- **URL** : Endpoint de votre serveur (HTTPS requis)
- **Événements** : Types d'événements à recevoir
- **Secret** : Clé pour vérifier la signature
- **Actif** : Oui/Non

### 3. Événements disponibles
| Événement | Description |
|-----------|-------------|
| order.created | Nouvelle commande |
| order.updated | Commande modifiée |
| order.cancelled | Commande annulée |
| transport.status_changed | Changement de statut |
| transport.position_updated | Nouvelle position GPS |
| document.uploaded | Document ajouté |
| incident.created | Nouvel incident |
| invoice.validated | Facture validée |

## Format des notifications

### Structure du payload
\`\`\`json
{
  "id": "evt_abc123",
  "type": "order.created",
  "created_at": "2024-12-15T10:30:00Z",
  "data": {
    "order_id": "ord_xyz789",
    "reference": "CMD-2024-001",
    "status": "pending"
  }
}
\`\`\`

### Headers
\`\`\`
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...
X-Webhook-Id: evt_abc123
X-Webhook-Timestamp: 1702636200
\`\`\`

## Vérification de signature

### Pourquoi vérifier ?
- S'assurer que la requête vient de SYMPHONI.A
- Prévenir les attaques

### Comment vérifier ?
\`\`\`python
import hmac
import hashlib

def verify_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
\`\`\`

## Réponse attendue

### Succès
- Code HTTP 2xx (200, 201, 202)
- Temps de réponse < 30 secondes

### Retry automatique
Si échec (code != 2xx ou timeout) :
- Retry 1 : Après 1 minute
- Retry 2 : Après 5 minutes
- Retry 3 : Après 30 minutes
- Retry 4 : Après 2 heures
- Retry 5 : Après 24 heures

Après 5 échecs : Webhook désactivé + alerte

## Test des webhooks

### Outil de test intégré
1. Configurez votre webhook
2. Cliquez sur "Tester"
3. Choisissez un événement type
4. Envoyez une notification de test

### Logs
- Historique des notifications envoyées
- Réponses de votre serveur
- Erreurs éventuelles

## Bonnes pratiques

### Côté serveur
- Répondez rapidement (< 5s idéalement)
- Traitez en arrière-plan si long
- Idempotence : Gérez les doublons

### Gestion des erreurs
- Loguez les payloads reçus
- Alertez en cas d'échec répété
- Prévoyez un fallback (polling)

### Sécurité
- HTTPS obligatoire
- Vérifiez toujours la signature
- Filtrez par IP si possible

## Bonnes pratiques
✅ Vérifiez systématiquement les signatures
✅ Répondez vite, traitez après
✅ Gérez les doublons (idempotence)
✅ Surveillez les logs d'erreur`
          }
        ],
        tags: ['API', 'ERP', 'intégration']
      },

      // EXPÉDITEUR
      {
        moduleId: 'mod_supplier_portal',
        title: 'Portail Expéditeur',
        description: 'Utilisez le portail pour suivre vos expéditions',
        category: 'Portail Expéditeur',
        portals: ['supplier'],
        icon: '📤',
        duration: 20,
        order: 17,
        lessons: [
          {
            lessonId: 'les_51',
            title: 'Accès et connexion',
            contentType: 'video',
            duration: 5,
            order: 0,
            content: `# Mode Opératoire : Accès au Portail Expéditeur

## Objectif
Accéder au portail expéditeur SYMPHONI.A.

## Invitation

### Réception de l'invitation
Vous recevez un email de votre client contenant :
- Lien d'accès au portail
- Instructions de connexion
- Contact support si besoin

### Première connexion
1. Cliquez sur le lien dans l'email
2. Créez votre mot de passe
3. Renseignez vos informations
4. Acceptez les conditions
5. Accédez au portail

## Connexion

### URL du portail
supplier.symphoni-a.com

### Identifiants
- Email : Votre email professionnel
- Mot de passe : Celui que vous avez créé

### Mot de passe oublié
1. Cliquez sur "Mot de passe oublié"
2. Saisissez votre email
3. Recevez le lien de réinitialisation
4. Créez un nouveau mot de passe

## Interface du portail

### Menu principal
- 🏠 Accueil : Tableau de bord
- 📤 Mes expéditions : Liste des commandes
- 📄 Documents : CMR, BL, photos
- 📞 Contact : Messagerie

### Tableau de bord
- Expéditions du jour
- En cours de transport
- Livrées récemment
- Alertes éventuelles

## Profil et paramètres

### Informations à renseigner
- Nom et prénom
- Téléphone
- Préférences de notification

### Notifications
Choisissez de recevoir :
- Email pour chaque statut
- Résumé quotidien
- Alertes uniquement

## Bonnes pratiques
✅ Gardez vos identifiants confidentiels
✅ Mettez à jour vos coordonnées
✅ Configurez les notifications utiles`
          },
          {
            lessonId: 'les_52',
            title: 'Suivi des expéditions',
            contentType: 'video',
            duration: 8,
            order: 1,
            content: `# Mode Opératoire : Suivi des expéditions

## Objectif
Suivre vos expéditions en temps réel.

## Accès
Menu > Mes expéditions

## Liste des expéditions

### Informations affichées
| Colonne | Description |
|---------|-------------|
| Référence | N° de commande |
| Destination | Adresse de livraison |
| Date chargement | Quand ça part |
| Date livraison | Quand c'est prévu |
| Statut | État actuel |

### Statuts possibles
- 🔵 Planifié : Transport prévu
- 🟡 Chargé : Parti de chez vous
- 🟠 En transit : En route
- 🟢 Livré : Arrivé à destination
- 🔴 Incident : Problème signalé

## Filtres et recherche

### Filtres disponibles
- Par statut
- Par période
- Par destination

### Recherche
- Par référence
- Par ville de destination

## Détail d'une expédition

### Cliquez sur une ligne pour voir :
- Informations complètes
- Historique des statuts
- Position actuelle (si en transit)
- Documents associés

### Tracking GPS
Si disponible :
- Carte avec position du véhicule
- ETA mise à jour
- Distance restante

## Notifications

### Événements notifiés
- Chargement effectué
- Départ du site
- Arrivée prévue sous 1h
- Livraison effectuée
- Incident signalé

### Canaux
- Email
- SMS (si configuré)
- Notification push (app mobile)

## Historique

### Consultez l'historique
- Toutes vos expéditions passées
- Filtrez par période
- Exportez au format Excel

## Bonnes pratiques
✅ Consultez le portail chaque matin
✅ Vérifiez les ETA pour planifier
✅ Réagissez aux alertes`
          },
          {
            lessonId: 'les_53',
            title: 'Communication',
            contentType: 'interactive',
            duration: 7,
            order: 2,
            content: `# Mode Opératoire : Communication

## Objectif
Communiquer efficacement via le portail.

## Messagerie intégrée

### Accès
- Menu > Messages
- Ou depuis une expédition : "Contacter"

### Types de messages
- Question sur une expédition
- Signalement d'un problème
- Demande d'information
- Modification de commande

## Envoyer un message

### 1. Nouveau message
- Cliquez sur "Nouveau message"
- Sélectionnez l'expédition concernée
- Choisissez le sujet

### 2. Rédiger
- Soyez clair et concis
- Incluez les références
- Joignez des fichiers si nécessaire

### 3. Envoyer
- Le destinataire est notifié
- Suivi dans le fil de discussion

## Fil de discussion

### Par expédition
- Tous les échanges au même endroit
- Historique conservé
- Participants : Vous, votre client, transporteur si nécessaire

### Actions
- Répondre à un message
- Ajouter une pièce jointe
- Marquer comme résolu

## Signaler un problème

### Depuis l'expédition
1. Ouvrez l'expédition concernée
2. Cliquez sur "Signaler un problème"
3. Décrivez le problème
4. Joignez des photos si possible
5. Envoyez

### Suivi du problème
- Statut visible dans l'expédition
- Échanges via messagerie
- Notification à la résolution

## Contacts utiles

### Votre client (donneur d'ordres)
- Coordonnées dans la fiche expédition
- Message via le portail

### Support SYMPHONI.A
- Chat en bas à droite
- Email : support@symphoni-a.com
- Pour problèmes techniques uniquement

## Bonnes pratiques
✅ Utilisez la messagerie pour traçabilité
✅ Soyez réactif aux demandes
✅ Documentez les problèmes avec photos`
          }
        ],
        tags: ['expéditeur', 'portail']
      },

      // DESTINATAIRE
      {
        moduleId: 'mod_recipient',
        title: 'Portail Destinataire',
        description: 'Suivez vos livraisons et confirmez la réception',
        category: 'Portail Destinataire',
        portals: ['industry', 'supplier'],
        icon: '📥',
        duration: 15,
        order: 18,
        lessons: [
          {
            lessonId: 'les_54',
            title: 'Suivi des livraisons',
            contentType: 'video',
            duration: 5,
            order: 0,
            content: `# Mode Opératoire : Suivi des livraisons (Destinataire)

## Objectif
Suivre les livraisons attendues en tant que destinataire.

## Accès au suivi

### Option 1 : Lien de tracking
- Reçu par email ou SMS
- Cliquez pour accéder directement
- Pas de compte requis

### Option 2 : Portail destinataire
- Si compte créé
- Toutes vos livraisons au même endroit

## Informations disponibles

### Sur une livraison
- Expéditeur
- Contenu prévu
- Date et créneau de livraison
- Transporteur et véhicule
- Position en temps réel

### Statuts
- 📦 Préparé : Prêt à partir
- 🚚 En transit : En route vers vous
- 📍 Proche : À moins de 30 min
- ✅ Livré : Réceptionné

## Fonctionnalités

### Tracking temps réel
- Carte interactive
- Position actualisée
- ETA dynamique

### Notifications
Recevez des alertes :
- Départ de l'expédition
- Arrivée imminente (1h, 30min)
- Livraison effectuée
- Problème éventuel

### Modification de RDV
Si disponible :
- Demandez un changement de créneau
- Proposez une date alternative
- Le transporteur confirme

## Bonnes pratiques
✅ Vérifiez l'ETA pour être prêt
✅ Activez les notifications
✅ Préparez la zone de réception`
          },
          {
            lessonId: 'les_55',
            title: 'Confirmation de réception',
            contentType: 'interactive',
            duration: 5,
            order: 1,
            content: `# Mode Opératoire : Confirmation de réception

## Objectif
Confirmer la bonne réception de votre livraison.

## À l'arrivée du transporteur

### 1. Vérification
Avant de signer, vérifiez :
- Nombre de colis correct
- État apparent des colis
- Conformité avec le bon de livraison

### 2. Signature
Deux options :
- Signature sur l'appareil du chauffeur
- Signature via votre téléphone (lien reçu)

### 3. Informations à fournir
- Votre nom
- Votre fonction (optionnel)
- Observation si nécessaire

## Signature électronique

### Via le lien reçu
1. Cliquez sur le lien de signature
2. Vérifiez les informations
3. Signez du doigt sur l'écran
4. Confirmez

### Signature refusée
Si vous ne pouvez pas signer :
- Contactez l'expéditeur
- Le chauffeur note le refus
- Alternative : signature d'un collègue

## Réserves

### Quand émettre des réserves ?
- Colis manquant
- Emballage endommagé
- Produit visible abîmé

### Comment ?
1. Avant de signer
2. Notez les réserves précisément
3. Photographiez si possible
4. Faites signer le chauffeur

### Exemples de réserves
- "1 colis manquant sur 10"
- "Palette coin écrasé"
- "Emballage mouillé"

## Après la livraison

### Contrôle détaillé
Dans les heures suivant la livraison :
- Vérifiez le contenu
- Comptez les articles
- Contrôlez la qualité

### Réserves tardives
Si problème découvert après :
- Délai : 7 jours maximum
- Signalez via le portail ou email
- Joignez photos et preuves

## Bonnes pratiques
✅ Vérifiez toujours avant de signer
✅ N'hésitez pas à émettre des réserves
✅ Photographiez les anomalies
✅ Signalez rapidement les problèmes`
          },
          {
            lessonId: 'les_56',
            title: 'Signalement de problèmes',
            contentType: 'video',
            duration: 5,
            order: 2,
            content: `# Mode Opératoire : Signalement de problèmes

## Objectif
Signaler efficacement un problème de livraison.

## Types de problèmes

### À la réception
- Colis manquant
- Colis endommagé
- Mauvais produit
- Quantité incorrecte

### Après la réception
- Produit défectueux
- Avarie cachée
- Non-conformité

## Procédure de signalement

### 1. Depuis le portail ou lien
- Trouvez la livraison concernée
- Cliquez sur "Signaler un problème"

### 2. Remplir le formulaire
- Type de problème (liste déroulante)
- Description détaillée
- Quantité concernée
- Impact (urgent ou non)

### 3. Ajouter des preuves
Pièces jointes recommandées :
- 📸 Photos du problème
- 📄 Bon de livraison annoté
- 📋 Tout document pertinent

### 4. Envoyer
- Le signalement est transmis
- Vous recevez un n° de suivi
- L'expéditeur est alerté

## Suivi du signalement

### Statuts
- 🔵 Reçu : En cours d'analyse
- 🟡 En traitement : Actions en cours
- 🟢 Résolu : Solution appliquée

### Communication
- Répondez aux demandes d'info
- Suivez les échanges
- Validez la résolution

## Délais importants

### Signalement rapide
| Type | Délai recommandé |
|------|------------------|
| Dommage visible | Immédiat (avant signature) |
| Manquant | Sous 24h |
| Avarie cachée | Sous 7 jours |

### Pourquoi c'est important ?
- Recevabilité de la réclamation
- Responsabilité du transporteur
- Indemnisation possible

## Résolution possible

### Options courantes
- Renvoi du produit manquant
- Avoir commercial
- Remboursement
- Échange produit

## Bonnes pratiques
✅ Signalez le plus vite possible
✅ Documentez avec photos
✅ Conservez les emballages si litige
✅ Restez factuel dans la description`
          }
        ],
        tags: ['destinataire', 'réception']
      },

      // MOBILE
      {
        moduleId: 'mod_mobile',
        title: 'Application Mobile',
        description: 'Utilisez SYMPHONI.A sur smartphone et tablette',
        category: 'Mobile',
        portals: ['all'],
        icon: '📱',
        duration: 20,
        order: 19,
        lessons: [
          {
            lessonId: 'les_57',
            title: 'Installation et configuration',
            contentType: 'video',
            duration: 5,
            order: 0,
            content: `# Mode Opératoire : Installation et configuration mobile

## Objectif
Installer et configurer l'application mobile SYMPHONI.A.

## Téléchargement

### iOS (iPhone/iPad)
1. Ouvrez l'App Store
2. Recherchez "SYMPHONI.A"
3. Téléchargez l'application officielle
4. Installez

### Android
1. Ouvrez le Play Store
2. Recherchez "SYMPHONI.A"
3. Téléchargez l'application officielle
4. Installez

## Première connexion

### Identifiants
- Les mêmes que sur le web
- Email + mot de passe

### Validation
- Code de vérification par email/SMS
- Pour sécuriser votre compte

## Configuration initiale

### Permissions requises
Autorisez l'accès à :
- 📍 Localisation : Pour le tracking
- 📸 Appareil photo : Pour les photos/scans
- 🔔 Notifications : Pour les alertes
- 📁 Stockage : Pour les documents

### Paramètres recommandés
- Notifications : Activées
- Localisation : "Toujours" ou "En utilisation"
- Mode économie batterie : Désactivé

## Personnalisation

### Thème
- Clair / Sombre / Automatique

### Langue
- Français, English, Deutsch, Español

### Notifications
Choisissez ce que vous voulez recevoir :
- ☑️ Nouvelles missions
- ☑️ Rappels de RDV
- ☑️ Alertes urgentes
- ☑️ Messages

## Sécurité

### Déconnexion automatique
- Après X minutes d'inactivité
- Configurable dans les paramètres

### Biométrie
- Activez Face ID / Touch ID
- Connexion rapide et sécurisée

## Bonnes pratiques
✅ Gardez l'application à jour
✅ Activez les notifications importantes
✅ Autorisez la localisation pour le tracking
✅ Utilisez la biométrie pour plus de sécurité`
          },
          {
            lessonId: 'les_58',
            title: 'Fonctionnalités mobiles',
            contentType: 'video',
            duration: 8,
            order: 1,
            content: `# Mode Opératoire : Fonctionnalités mobiles

## Objectif
Maîtriser les fonctionnalités de l'application mobile.

## Écran d'accueil

### Widgets
- Missions du jour
- Alertes en cours
- Raccourcis rapides

### Navigation
- Menu hamburger (≡) en haut à gauche
- Barre d'actions en bas
- Recherche rapide

## Fonctionnalités principales

### 1. Gestion des missions
- Liste des missions
- Détail et itinéraire
- Actions : Arrivé, Chargé, Livré

### 2. Scan de documents
- Scanner intégré
- Reconnaissance automatique
- Envoi immédiat

### 3. Photos
- Capture rapide
- Annotation possible
- Association automatique à la mission

### 4. Signature électronique
- Zone de signature tactile
- Capture nom du signataire
- Géolocalisation intégrée

### 5. Navigation GPS
- Lien vers votre app GPS favorite
- Google Maps, Waze, Plans
- Itinéraire optimisé

## Actions rapides

### Depuis l'écran d'accueil
- ➕ Nouvelle photo
- 📋 Scanner un document
- 📍 Partager ma position

### Depuis une mission
- 📞 Appeler le contact
- 🗺️ Naviguer vers l'adresse
- 💬 Envoyer un message

## Notifications push

### Types d'alertes
- Nouvelle mission attribuée
- Rappel de RDV (H-2, H-1)
- Message reçu
- Alerte urgente

### Actions depuis la notification
- Ouvrir directement la mission
- Répondre au message
- Marquer comme lu

## Synchronisation

### Automatique
- Données synchronisées en continu
- Indicateur de connexion visible

### Manuelle
- Tirez vers le bas pour rafraîchir
- Bouton "Synchroniser" dans le menu

## Bonnes pratiques
✅ Gardez l'app ouverte pendant les missions
✅ Utilisez le scan plutôt que les photos classiques
✅ Vérifiez la synchronisation avant de quitter
✅ Chargez votre téléphone avant les tournées`
          },
          {
            lessonId: 'les_59',
            title: 'Mode hors-ligne',
            contentType: 'interactive',
            duration: 7,
            order: 2,
            content: `# Mode Opératoire : Mode hors-ligne

## Objectif
Utiliser l'application sans connexion internet.

## Quand utiliser le mode hors-ligne ?

### Situations courantes
- Zone sans réseau mobile
- Roaming désactivé (étranger)
- Économie de données
- Problème de connexion

## Activation

### Automatique
- L'app détecte la perte de connexion
- Indicateur "Hors-ligne" visible
- Fonctionnalités adaptées

### Préparation (recommandé)
Avant de partir en zone sans réseau :
1. Ouvrez l'app avec connexion
2. Accédez à vos missions du jour
3. Les données sont mises en cache
4. Téléchargez les cartes si nécessaire

## Fonctionnalités disponibles

### ✅ Disponibles hors-ligne
- Consulter les missions en cache
- Prendre des photos
- Scanner des documents
- Capturer des signatures
- Changer le statut de mission

### ❌ Non disponibles
- Rechercher de nouvelles missions
- Envoyer des messages
- Voir la position GPS des autres
- Accéder aux documents non téléchargés

## Synchronisation différée

### Principe
- Actions enregistrées localement
- File d'attente des modifications
- Envoi automatique au retour du réseau

### Indicateur visuel
- Badge "X actions en attente"
- Détail accessible dans Paramètres

## Retour en ligne

### Automatique
- Détection du réseau
- Synchronisation lancée
- Notification de succès

### En cas de conflit
- L'app vous alerte
- Choisissez quelle version garder
- Rare si délai court

## Astuces

### Optimiser le cache
- Téléchargez les missions importantes
- Photos et documents associés
- Cartes de la zone de travail

### Gérer l'espace
- Paramètres > Stockage
- Effacez le cache ancien
- Gardez les données récentes

## Bonnes pratiques
✅ Préparez vos missions avant de partir
✅ Vérifiez le cache des documents nécessaires
✅ Synchronisez dès que possible
✅ Surveillez l'espace de stockage`
          }
        ],
        tags: ['mobile', 'application']
      },

      // BEST PRACTICES
      {
        moduleId: 'mod_best_practices',
        title: 'Bonnes Pratiques',
        description: 'Optimisez votre utilisation de SYMPHONI.A',
        category: 'Bonnes Pratiques',
        portals: ['all'],
        icon: '💡',
        duration: 25,
        order: 20,
        lessons: [
          {
            lessonId: 'les_60',
            title: 'Organisation quotidienne',
            contentType: 'video',
            duration: 8,
            order: 0,
            content: `# Mode Opératoire : Organisation quotidienne

## Objectif
Optimiser votre utilisation quotidienne de SYMPHONI.A.

## Routine matinale

### 1. Connexion (5 min)
- Ouvrez SYMPHONI.A
- Consultez les notifications
- Vérifiez le tableau de bord

### 2. Revue des urgences (10 min)
- Filtrez sur "Problèmes"
- Traitez les incidents critiques
- Répondez aux messages urgents

### 3. Planning du jour (5 min)
- Commandes à traiter
- Livraisons attendues
- RDV planifiés

## Pendant la journée

### Traitement des commandes
- Traitez par ordre de priorité
- Validez les pré-factures en attente
- Suivez les transports en cours

### Gestion des alertes
- Répondez aux alertes sous 30 min
- Escaladez si nécessaire
- Documentez vos actions

### Communication
- Consultez la messagerie régulièrement
- Répondez dans la journée
- Soyez concis et clair

## Fin de journée

### 1. Clôture (10 min)
- Vérifiez les tâches restantes
- Mettez à jour les statuts
- Préparez le lendemain

### 2. Reporting (optionnel)
- Exportez les données nécessaires
- Mettez à jour vos tableaux de bord
- Partagez avec votre équipe

## Conseils de productivité

### Utilisez les filtres
- Créez des vues personnalisées
- Sauvegardez les filtres fréquents
- Un clic pour accéder aux données

### Automatisez
- Rapports planifiés
- Alertes automatiques
- Validation de seuils

### Raccourcis clavier
- Ctrl+K : Recherche globale
- Ctrl+N : Nouvelle commande
- Ctrl+/ : Aide raccourcis

## Bonnes pratiques
✅ Commencez par les urgences
✅ Traitez les alertes rapidement
✅ Gardez votre boîte de réception propre
✅ Utilisez les automatisations`
          },
          {
            lessonId: 'les_61',
            title: 'Raccourcis et astuces',
            contentType: 'document',
            duration: 10,
            order: 1,
            content: `# Mode Opératoire : Raccourcis et astuces

## Objectif
Gagner en efficacité avec les raccourcis et astuces.

## Raccourcis clavier

### Navigation globale
| Raccourci | Action |
|-----------|--------|
| Ctrl+K | Recherche globale |
| Ctrl+H | Accueil |
| Ctrl+N | Nouvelle commande |
| Ctrl+/ | Aide raccourcis |
| Esc | Fermer fenêtre/modal |

### Dans les listes
| Raccourci | Action |
|-----------|--------|
| ↑ / ↓ | Naviguer |
| Enter | Ouvrir l'élément |
| Ctrl+A | Tout sélectionner |
| Ctrl+E | Exporter |
| Ctrl+F | Filtrer |

### Dans les formulaires
| Raccourci | Action |
|-----------|--------|
| Tab | Champ suivant |
| Shift+Tab | Champ précédent |
| Ctrl+S | Enregistrer |
| Ctrl+Enter | Valider et fermer |

## Astuces de recherche

### Recherche globale (Ctrl+K)
- Tapez pour chercher partout
- Préfixez pour filtrer :
  - # : Commandes
  - @ : Contacts
  - ! : Incidents

### Recherche avancée
Dans les listes, utilisez :
- status:livré : Par statut
- date:2024-12-15 : Par date
- client:"Nom Client" : Par client

## Filtres intelligents

### Créer un filtre personnalisé
1. Appliquez vos critères
2. Cliquez sur "Enregistrer le filtre"
3. Nommez-le
4. Retrouvez-le dans vos favoris

### Filtres suggérés
SYMPHONI.A suggère des filtres basés sur :
- Vos habitudes
- Les données fréquentes
- Les tendances

## Tableaux et listes

### Personnalisation des colonnes
- Clic droit sur l'en-tête
- Sélectionnez les colonnes
- Réordonnez par glisser-déposer

### Tri multiple
- Cliquez sur une colonne pour trier
- Shift+Clic pour tri secondaire
- Jusqu'à 3 niveaux de tri

### Export rapide
- Sélectionnez des lignes
- Clic droit > Exporter
- Ou Ctrl+E

## Automatisations

### Templates de commande
- Créez des modèles
- Remplissage automatique
- Gain de temps énorme

### Règles d'alerte
- Paramètres > Alertes
- Définissez vos conditions
- Actions automatiques

## Personnalisation

### Tableau de bord
- Ajoutez/retirez des widgets
- Redimensionnez selon vos besoins
- Plusieurs configurations possibles

### Notifications
- Désactivez les non essentielles
- Groupez par type
- Heures de réception

## Astuces mobile

### Gestes
- Swipe gauche : Actions rapides
- Swipe droite : Marquer comme lu
- Long press : Menu contextuel

### Widgets téléphone
- Ajoutez le widget SYMPHONI.A
- Missions du jour sur l'écran d'accueil
- Alertes en temps réel

## Bonnes pratiques
✅ Apprenez les raccourcis principaux
✅ Créez vos filtres personnalisés
✅ Automatisez les tâches répétitives
✅ Personnalisez votre espace de travail`
          },
          {
            lessonId: 'les_62',
            title: 'FAQ et dépannage',
            contentType: 'interactive',
            duration: 7,
            order: 2,
            content: `# Mode Opératoire : FAQ et dépannage

## Objectif
Résoudre les problèmes courants de manière autonome.

## Problèmes de connexion

### "Impossible de se connecter"
**Causes possibles :**
- Identifiants incorrects
- Compte bloqué
- Problème réseau

**Solutions :**
1. Vérifiez votre email/mot de passe
2. Essayez "Mot de passe oublié"
3. Vérifiez votre connexion internet
4. Videz le cache du navigateur

### "Session expirée"
- Normal après inactivité
- Reconnectez-vous simplement
- Cochez "Rester connecté" si souhaité

## Problèmes d'affichage

### "Page qui ne charge pas"
**Solutions :**
1. Rafraîchissez la page (F5)
2. Videz le cache (Ctrl+Shift+Del)
3. Essayez un autre navigateur
4. Vérifiez votre connexion

### "Données obsolètes"
- Cliquez sur le bouton de rafraîchissement
- Ou F5 pour recharger
- Vérifiez la dernière synchronisation (mobile)

## Problèmes de documents

### "Document non uploadé"
**Vérifiez :**
- Taille < 25 Mo
- Format accepté (PDF, JPG, PNG)
- Connexion stable

**Solutions :**
- Compressez le fichier
- Convertissez en PDF
- Réessayez sur connexion wifi

### "Scan illisible"
- Nettoyez l'objectif de la caméra
- Améliorez l'éclairage
- Tenez le document à plat
- Utilisez le mode HD si disponible

## Problèmes de notifications

### "Je ne reçois pas les notifications"
**Vérifiez :**
1. Paramètres > Notifications > Activées
2. Paramètres téléphone > SYMPHONI.A > Notifications
3. Mode "Ne pas déranger" désactivé

### "Trop de notifications"
- Paramètres > Notifications
- Désactivez les types non essentiels
- Activez le regroupement

## Problèmes GPS/Tracking

### "Position non mise à jour"
**Causes :**
- GPS désactivé sur le téléphone
- App en arrière-plan fermée
- Mode économie d'énergie

**Solutions :**
1. Activez la localisation
2. Autorisez "Toujours" pour SYMPHONI.A
3. Désactivez l'économie de batterie pour l'app

## Questions fréquentes

### "Comment modifier une commande validée ?"
- Impossible si transporteur assigné
- Contactez votre client/fournisseur
- Créez une nouvelle version si nécessaire

### "Comment annuler une facture ?"
- Seul un avoir peut corriger
- Contactez l'émetteur
- Créez un avoir de régularisation

### "Comment changer mon email de connexion ?"
- Profil > Paramètres > Email
- Validation par ancien + nouvel email
- Ou contactez l'administrateur

## Contacter le support

### Avant de contacter
- Notez le message d'erreur exact
- Préparez des captures d'écran
- Essayez les solutions ci-dessus

### Canaux de support
- Chat intégré (en bas à droite)
- Email : support@symphoni-a.com
- Téléphone : Voir dans l'application

### Informations à fournir
- Votre email de connexion
- Description du problème
- Étapes pour reproduire
- Captures d'écran

## Bonnes pratiques
✅ Consultez d'abord cette FAQ
✅ Essayez les solutions de base
✅ Documentez le problème si persistant
✅ Contactez le support avec les détails`
          }
        ],
        tags: ['bonnes pratiques', 'optimisation']
      }
    ];

    // Insérer les modules
    const modules = await TrainingModule.insertMany(
      baseModules.map(m => ({
        ...m,
        status: 'published',
        createdBy: 'system'
      }))
    );

    console.log(`[Training] Seeded ${modules.length} training modules`);

    res.json({
      success: true,
      message: `${modules.length} modules initialisés`,
      count: modules.length
    });
  } catch (error) {
    console.error('Error seeding training modules:', error);
    res.status(500).json({ error: 'Erreur lors de l\'initialisation des modules' });
  }
});

export default router;
