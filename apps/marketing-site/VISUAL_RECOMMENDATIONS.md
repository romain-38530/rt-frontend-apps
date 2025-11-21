# Recommandations Visuelles - Site Marketing RT Technologie

## Vue d'ensemble

Ce document détaille toutes les recommandations visuelles pour optimiser l'impact marketing du site RT Technologie. Il complète le guide de contenu et les textes marketing.

---

## 1. Éléments Graphiques Manquants

### À créer en priorité

#### Logo & Identité Visuelle

**Logo principal**
- Format vectoriel (SVG)
- Versions : couleur, blanc, noir, monochrome
- Déclinaisons : horizontal, vertical, carré (favicon)
- Espaces de respiration définis (zone de protection)

**Favicon**
- 32x32px, 16x16px (ICO)
- 180x180px (Apple Touch Icon)
- 192x192px, 512x512px (Android PWA)

**Illustrations custom**
```
Priority 1 - Homepage Hero:
- Illustration isométrique représentant un processus automatisé
- Style moderne, couleurs indigo/purple
- Animation subtile (optionnelle)
- Format : SVG, 800x600px minimum

Priority 2 - Étapes du processus:
- 4 illustrations pour "Comment ça marche"
- Style uniforme, icônes vectorielles
- Couleurs de la charte
- Format : SVG, 400x400px

Priority 3 - Fonctionnalités:
- 6 illustrations pour "Pourquoi nous choisir"
- Style flat design ou isométrique
- Format : SVG, 300x300px
```

---

## 2. Images Recommandées par Section

### Homepage

#### Hero Section
**Image principale (droite du hero)**
- **Type :** Mockup de l'interface d'inscription
- **Suggestion :** Screenshot de l'étape 1 avec overlay de checkmarks animés
- **Alternative :** Illustration abstraite représentant l'automation
- **Dimensions :** 1200x800px minimum
- **Format :** WebP (avec fallback PNG)

#### Social Proof
**Logos clients (optionnel)**
- **Quantité :** 6-8 logos
- **Style :** Grayscale avec effet hover couleur
- **Dimensions :** 200x80px chacun
- **Format :** SVG de préférence

#### Comment ça marche
**4 icônes vectorielles**
1. Shield (vérification TVA)
2. FileText (auto-remplissage)
3. Check (choix offre)
4. Lock (signature)

**Style :** Lucide Icons (déjà implémenté) ✓

#### Pourquoi nous choisir
**6 icônes vectorielles**
- Déjà implémenté avec Lucide Icons ✓
- Possibilité d'ajouter des illustrations custom en arrière-plan

#### Fonctionnalités détaillées
**Illustration processus (droite)**
- **Type :** Gradient card avec icônes empilées
- **Déjà implémenté** ✓
- **Amélioration possible :** Animation de transition entre étapes

#### Tarifs
**Pas d'image nécessaire**
- Les cartes sont suffisamment visuelles avec la typographie

#### Témoignages
**Photos clients ou avatars**
- **Option actuelle :** Initiales dans cercle coloré ✓
- **Option premium :** Photos professionnelles réelles
- **Dimensions si photos :** 80x80px, format rond
- **Format :** WebP optimisé

#### Footer
**Pas d'image nécessaire**
- Typographie et structure suffisantes

---

### Page Onboarding

#### Étape 1 - Vérification TVA
**Illustration recommandée**
- **Type :** Animation de vérification (loading spinner → checkmark)
- **Implémentation :** CSS animation ou Lottie
- **Couleurs :** Indigo-600 primary

**Icône d'information**
- Déjà présent dans bandeau bleu ✓

#### Étape 2 - Données entreprise
**Icône de succès**
- Déjà implémenté (SVG checkmark vert) ✓

**Suggestion d'amélioration**
- Animation de "remplissage" des champs (effet typewriter)

#### Étape 3 - Représentant légal
**Icône représentant une personne**
- À ajouter : User icon de Lucide
- Taille : 48x48px
- Couleur : Indigo-600

#### Étape 4 - Abonnement
**Illustrations des plans**
- Possibilité d'ajouter des icônes spécifiques par type :
  - Transporteur : Truck icon
  - Industriel : Factory icon
  - Logisticien : Warehouse icon

#### Étape 5 - Finalisation
**Illustration de contrat**
- À ajouter : FileCheck icon
- Animation : Document qui se "signe" (optionnel)

---

### Page Signature Électronique

**Déjà bien conçue ✓**

**Améliorations possibles :**
- Preview PDF plus grand sur desktop
- Illustration "confiance" (badges de sécurité)
- Animation de la signature (effet encre)

---

## 3. Palette de Couleurs Détaillée

### Couleurs Primaires

```css
/* Indigo - Couleur principale */
--indigo-50:  #EEF2FF;
--indigo-100: #E0E7FF;
--indigo-200: #C7D2FE;
--indigo-300: #A5B4FC;
--indigo-400: #818CF8;
--indigo-500: #6366F1;
--indigo-600: #4F46E5; /* PRIMARY */
--indigo-700: #4338CA;
--indigo-800: #3730A3;
--indigo-900: #312E81;

/* Purple - Couleur secondaire */
--purple-50:  #FAF5FF;
--purple-100: #F3E8FF;
--purple-200: #E9D5FF;
--purple-300: #D8B4FE;
--purple-400: #C084FC;
--purple-500: #A855F7;
--purple-600: #9333EA; /* SECONDARY */
--purple-700: #7E22CE;
--purple-800: #6B21A8;
--purple-900: #581C87;
```

### Couleurs de Statut

```css
/* Success - Vert */
--green-50:  #F0FDF4;
--green-100: #DCFCE7;
--green-500: #10B981; /* SUCCESS */
--green-600: #059669;
--green-700: #047857;

/* Warning - Orange */
--orange-50:  #FFF7ED;
--orange-100: #FFEDD5;
--orange-500: #F97316; /* WARNING */
--orange-600: #EA580C;

/* Error - Rouge */
--red-50:  #FEF2F2;
--red-100: #FEE2E2;
--red-500: #EF4444; /* ERROR */
--red-600: #DC2626;
--red-700: #B91C1C;

/* Info - Bleu */
--blue-50:  #EFF6FF;
--blue-100: #DBEAFE;
--blue-500: #3B82F6; /* INFO */
--blue-600: #2563EB;
```

### Couleurs Neutres

```css
/* Grays */
--gray-50:  #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563; /* TEXT SECONDARY */
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827; /* TEXT PRIMARY */
```

### Dégradés

```css
/* Hero gradient */
background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #9333EA 100%);

/* Card gradient */
background: linear-gradient(135deg, #EEF2FF 0%, #FAF5FF 100%);

/* Button hover gradient */
background: linear-gradient(135deg, #4338CA 0%, #7E22CE 100%);
```

---

## 4. Typographie Détaillée

### Fonte Principale

**System Font Stack (actuel)**
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
```

**Recommandation : Fonte Custom**
```css
/* Primary */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* Alternative premium */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
```

### Hiérarchie

```css
/* H1 - Hero titles */
.h1 {
  font-size: 3rem;      /* 48px */
  line-height: 1.2;     /* 58px */
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* H2 - Section titles */
.h2 {
  font-size: 2.25rem;   /* 36px */
  line-height: 1.3;     /* 47px */
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* H3 - Subsection titles */
.h3 {
  font-size: 1.5rem;    /* 24px */
  line-height: 1.4;     /* 34px */
  font-weight: 600;
}

/* Body Large */
.body-large {
  font-size: 1.25rem;   /* 20px */
  line-height: 1.6;     /* 32px */
  font-weight: 400;
}

/* Body Regular */
.body {
  font-size: 1rem;      /* 16px */
  line-height: 1.5;     /* 24px */
  font-weight: 400;
}

/* Body Small */
.body-small {
  font-size: 0.875rem;  /* 14px */
  line-height: 1.5;     /* 21px */
  font-weight: 400;
}

/* Caption */
.caption {
  font-size: 0.75rem;   /* 12px */
  line-height: 1.4;     /* 17px */
  font-weight: 400;
}
```

### Poids des Fontes

```
Regular (400) : Body text
Medium (500)  : Emphasis
Semibold (600): Subsection titles
Bold (700)    : Section titles
Extrabold (800): Hero titles
```

---

## 5. Composants UI Détaillés

### Boutons

#### Bouton Primaire
```css
.btn-primary {
  background: #4F46E5;
  color: white;
  padding: 1rem 2rem;        /* 16px 32px */
  border-radius: 0.5rem;     /* 8px */
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.btn-primary:hover {
  background: #4338CA;
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### Bouton Secondaire
```css
.btn-secondary {
  background: white;
  color: #4F46E5;
  border: 2px solid #4F46E5;
  padding: calc(1rem - 2px) calc(2rem - 2px);
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #4F46E5;
  color: white;
}
```

#### Bouton Tertiaire
```css
.btn-tertiary {
  background: transparent;
  color: #4F46E5;
  padding: 1rem 2rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-tertiary:hover {
  background: #EEF2FF;
}
```

### Cards

#### Card Standard
```css
.card {
  background: white;
  border-radius: 1rem;       /* 16px */
  padding: 2rem;             /* 32px */
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.3s;
}

.card:hover {
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  transform: translateY(-4px);
}
```

#### Card avec Gradient
```css
.card-gradient {
  background: linear-gradient(135deg, #EEF2FF 0%, #FAF5FF 100%);
  border-radius: 1rem;
  padding: 2rem;
  border: 2px solid #E0E7FF;
  transition: all 0.3s;
}

.card-gradient:hover {
  border-color: #4F46E5;
}
```

### Badges

```css
/* Success Badge */
.badge-success {
  background: #DCFCE7;
  color: #047857;
  padding: 0.25rem 0.75rem;  /* 4px 12px */
  border-radius: 9999px;     /* full */
  font-size: 0.875rem;       /* 14px */
  font-weight: 500;
}

/* Info Badge */
.badge-info {
  background: #DBEAFE;
  color: #2563EB;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Warning Badge */
.badge-warning {
  background: #FFEDD5;
  color: #EA580C;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}
```

### Inputs & Forms

```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;     /* 12px 16px */
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;     /* 8px */
  font-size: 1rem;
  transition: all 0.2s;
  background: white;
}

.input:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.input:disabled {
  background: #F3F4F6;
  cursor: not-allowed;
}

.input.error {
  border-color: #EF4444;
}

.input.success {
  border-color: #10B981;
}
```

### Labels

```css
.label {
  display: block;
  font-size: 0.875rem;       /* 14px */
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;     /* 8px */
}

.label-required::after {
  content: " *";
  color: #EF4444;
}
```

---

## 6. Iconographie

### Système d'Icônes : Lucide React

**Déjà implémenté ✓**

```javascript
import {
  ArrowRight, Check, Shield, Zap, FileText,
  Clock, Users, Globe, Lock, TrendingUp
} from 'lucide-react';
```

### Icônes Principales par Contexte

**Navigation & Actions**
- ArrowRight : Progression, CTA
- ArrowLeft : Retour
- X : Fermer
- Menu : Menu mobile
- ChevronDown : Dropdown

**Statut & Feedback**
- Check : Succès, validation
- AlertCircle : Information
- AlertTriangle : Avertissement
- XCircle : Erreur

**Fonctionnalités**
- Shield : Sécurité, vérification
- FileText : Documents, contrats
- Lock : Sécurité, confidentialité
- Zap : Rapidité, performance
- Users : Équipe, support
- Clock : Temps, durée
- TrendingUp : Croissance, stats

### Tailles Standards

```css
/* Small - 16px */
.icon-sm { width: 1rem; height: 1rem; }

/* Medium - 20px */
.icon-md { width: 1.25rem; height: 1.25rem; }

/* Large - 24px */
.icon-lg { width: 1.5rem; height: 1.5rem; }

/* Extra Large - 32px */
.icon-xl { width: 2rem; height: 2rem; }
```

---

## 7. Animations & Transitions

### Principes
- Durée : 200-300ms (rapide), 400-600ms (moyen)
- Easing : ease-in-out ou cubic-bezier(0.4, 0, 0.2, 1)
- Performance : utiliser transform et opacity (GPU accelerated)

### Animations Standards

#### Hover sur Boutons
```css
.btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.15);
}
```

#### Hover sur Cards
```css
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}
```

#### Apparition de Contenu (Fade In)
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.6s ease-out;
}
```

#### Slide In (pour modals, sidebars)
```css
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}
```

#### Pulse (pour indicateurs)
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

#### Spin (pour loaders)
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}
```

### Micro-interactions

**Checkmark qui apparaît**
```css
@keyframes checkmark {
  0% {
    transform: scale(0) rotate(-45deg);
  }
  50% {
    transform: scale(1.2) rotate(-45deg);
  }
  100% {
    transform: scale(1) rotate(-45deg);
  }
}

.checkmark-appear {
  animation: checkmark 0.4s ease-out;
}
```

---

## 8. Responsive Breakpoints

### Breakpoints Standards

```css
/* Mobile First Approach */

/* Small devices (phones, 640px and up) */
@media (min-width: 640px) { }

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) { }

/* Large devices (desktops, 1024px and up) */
@media (min-width: 1024px) { }

/* Extra large devices (large desktops, 1280px and up) */
@media (min-width: 1280px) { }

/* 2XL devices (larger desktops, 1536px and up) */
@media (min-width: 1536px) { }
```

### Adaptations par Section

**Hero Section**
```
Mobile (<640px)   : Stack vertical, image cachée
Tablet (640-1024) : Stack vertical, image visible
Desktop (>1024)   : 2 colonnes side-by-side
```

**Grilles de Cards**
```
Mobile (<640px)   : 1 colonne
Tablet (640-1024) : 2 colonnes
Desktop (>1024)   : 3-4 colonnes
```

**Navigation**
```
Mobile (<768px)   : Menu hamburger
Desktop (>768px)  : Menu horizontal
```

---

## 9. Accessibilité Visuelle

### Contraste des Couleurs

**Ratios WCAG 2.1 Level AA**

```
Texte normal (≥16px) : 4.5:1 minimum
Texte large (≥18px)  : 3:1 minimum
Composants UI        : 3:1 minimum
```

**Vérification des contrastes actuels :**
- White sur Indigo-600 : ✓ 8.6:1 (excellent)
- Gray-900 sur White : ✓ 14.7:1 (excellent)
- Gray-600 sur White : ✓ 7.3:1 (excellent)
- Indigo-600 sur White : ✓ 8.6:1 (excellent)

### Focus States

**Tous les éléments interactifs doivent avoir un focus visible**

```css
/* Focus ring standard */
*:focus {
  outline: 2px solid #4F46E5;
  outline-offset: 2px;
}

/* Focus ring doux (préféré) */
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3);
}
```

### Taille des Cibles Tactiles

**Minimum recommandé : 44x44px**

```css
/* Boutons et liens */
.btn, .link {
  min-height: 44px;
  min-width: 44px;
}
```

### Textes Alternatifs

**Toutes les images doivent avoir un alt**

```jsx
// Bon
<img src="/logo.png" alt="RT Technologie Logo" />

// Bon (image décorative)
<img src="/pattern.svg" alt="" role="presentation" />

// Mauvais
<img src="/photo.jpg" />
```

---

## 10. Optimisation des Images

### Formats Recommandés

**WebP avec fallback PNG/JPG**
```html
<picture>
  <source srcset="/hero.webp" type="image/webp" />
  <source srcset="/hero.jpg" type="image/jpeg" />
  <img src="/hero.jpg" alt="Description" />
</picture>
```

**SVG pour icônes et logos**
- Vectoriel, scalable
- Poids très léger
- Colorisable via CSS

### Compression

**Objectifs :**
- Photos : < 200KB par image
- Icônes SVG : < 10KB
- Favicon : < 5KB

**Outils recommandés :**
- TinyPNG / Squoosh (PNG/JPG)
- SVGO (SVG)
- ImageOptim (batch)

### Lazy Loading

```jsx
// Images below the fold
<img
  src="/image.jpg"
  alt="Description"
  loading="lazy"
/>

// Next.js Image component (recommandé)
<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  placeholder="blur"
/>
```

### Responsive Images

```html
<img
  srcset="
    /image-400.jpg 400w,
    /image-800.jpg 800w,
    /image-1200.jpg 1200w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  src="/image-800.jpg"
  alt="Description"
/>
```

---

## 11. Moodboard & Inspiration

### Sites de Référence

**Design moderne SaaS**
- Stripe.com (hero, animations)
- Linear.app (typographie, espacement)
- Notion.so (clarté, hiérarchie)
- Vercel.com (gradients, dark mode)
- Framer.com (animations, micro-interactions)

**Onboarding flows**
- Typeform (progression visuelle)
- Calendly (simplicité)
- Loom (réassurance)

**Couleurs & Gradients**
- Coolors.co/palettes
- Gradient Hunt
- UI Gradients

### Tendances 2025

**✓ À adopter**
- Glassmorphism subtil
- Gradients doux
- Animations micro-interactions
- Espaces blancs généreux
- Typographie oversize
- Illustrations 3D (optionnel)

**✗ À éviter**
- Skeuomorphisme lourd
- Animations excessives
- Couleurs trop saturées
- Surcharge visuelle
- Polices trop fantaisistes

---

## 12. Dark Mode (Future)

### Palette Dark Mode

```css
:root[data-theme="dark"] {
  /* Backgrounds */
  --bg-primary: #111827;     /* gray-900 */
  --bg-secondary: #1F2937;   /* gray-800 */
  --bg-tertiary: #374151;    /* gray-700 */

  /* Text */
  --text-primary: #F9FAFB;   /* gray-50 */
  --text-secondary: #D1D5DB; /* gray-300 */

  /* Borders */
  --border-color: #374151;   /* gray-700 */

  /* Brand (reste inchangé) */
  --indigo-600: #4F46E5;
  --purple-600: #9333EA;
}
```

### Adaptation des Composants

**Bouton primaire**
```css
[data-theme="dark"] .btn-primary {
  background: #6366F1;  /* indigo-500 */
}

[data-theme="dark"] .btn-primary:hover {
  background: #4F46E5;  /* indigo-600 */
}
```

**Cards**
```css
[data-theme="dark"] .card {
  background: #1F2937;  /* gray-800 */
  border: 1px solid #374151;  /* gray-700 */
}
```

---

## 13. Email Templates Visuels

### Structure de Base

```html
<!-- Structure de base email HTML -->
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
        <!-- Header -->
        <tr>
          <td style="padding: 20px; background: #4F46E5;">
            <img src="logo.png" alt="RT Technologie" height="40" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 40px; background: white;">
            <h1 style="color: #111827; font-size: 24px;">Title</h1>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">
              Content here
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 20px 0;">
                  <a href="#" style="
                    background: #4F46E5;
                    color: white;
                    padding: 14px 28px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    display: inline-block;
                  ">
                    Call to Action
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 20px; background: #F9FAFB; text-align: center;">
            <p style="color: #6B7280; font-size: 14px;">
              © 2025 RT Technologie. Tous droits réservés.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

### Bonnes Pratiques Email

✓ **À faire**
- Utiliser des tables pour le layout
- Inline CSS pour tous les styles
- Largeur max 600px
- Images avec alt text
- Fond clair par défaut
- CTA visible et cliquable

✗ **À éviter**
- CSS externe ou <style> (filtré)
- JavaScript (non supporté)
- Vidéos (compatibilité limitée)
- Animations complexes
- Background images (Outlook)

---

## 14. Assets à Produire - Checklist

### Logos & Branding
- [ ] Logo vectoriel principal (SVG)
- [ ] Logo horizontal (SVG)
- [ ] Logo vertical (SVG)
- [ ] Logo monochrome (SVG)
- [ ] Favicon (ICO + PNG multiples tailles)
- [ ] Apple Touch Icon (180x180)
- [ ] Android PWA icons (192x192, 512x512)

### Illustrations
- [ ] Hero homepage (1200x800)
- [ ] 4 illustrations "Comment ça marche" (400x400)
- [ ] 6 illustrations "Pourquoi nous choisir" (300x300)
- [ ] Illustration processus onboarding (800x600)
- [ ] Pattern background hero (1920x1080)

### Photos
- [ ] 3 photos témoignages clients (80x80, rond)
- [ ] Photo équipe support (optionnel, 400x400)
- [ ] Photos cas d'usage (optionnel, diverses)

### Icônes Custom
- [ ] Icône vérification TVA
- [ ] Icône auto-remplissage
- [ ] Icône contrat PDF
- [ ] Icône signature eIDAS
- [ ] Icône email automatique

### Templates Email
- [ ] Template email bienvenue
- [ ] Template email rappel
- [ ] Template email activation
- [ ] Template email formation
- [ ] Template email feedback

### Animations (optionnel)
- [ ] Animation hero (Lottie JSON)
- [ ] Animation loading (Lottie JSON)
- [ ] Animation success checkmark (CSS ou Lottie)
- [ ] Animation progression form (CSS)

### Documents Marketing
- [ ] Brochure PDF (8-12 pages)
- [ ] One-pager produit (1 page A4)
- [ ] Présentation PowerPoint (20 slides)
- [ ] Infographie processus (PNG, 1200x3000)

---

## 15. Outils & Ressources

### Design
- **Figma** : Design système, prototypes
- **Adobe Illustrator** : Logos, illustrations vectorielles
- **Adobe Photoshop** : Retouche photos
- **Sketch** : Alternative à Figma (Mac only)

### Illustrations
- **Undraw** : Illustrations gratuites customisables
- **Storyset** : Illustrations animées
- **Humaaans** : Personnages modulaires
- **Blush** : Collections d'illustrations
- **Freepik** : Banque d'illustrations premium

### Icônes
- **Lucide Icons** : Déjà utilisé ✓
- **Heroicons** : Alternative de Tailwind
- **Feather Icons** : Minimalistes
- **Phosphor Icons** : Variété de styles

### Photos Stock
- **Unsplash** : Gratuit, haute qualité
- **Pexels** : Gratuit, varié
- **Freepik** : Premium, professionnel
- **Adobe Stock** : Premium, très large

### Couleurs
- **Coolors** : Générateur de palettes
- **Color Hunt** : Palettes tendances
- **Adobe Color** : Roue chromatique
- **Contrast Checker** : Vérifier accessibilité

### Animations
- **LottieFiles** : Animations JSON
- **Framer Motion** : Library React
- **GSAP** : Animations JS avancées
- **Animate.css** : Animations CSS prêtes

### Optimisation Images
- **TinyPNG** : Compression PNG/JPG
- **Squoosh** : Compression + conversion
- **SVGO** : Optimisation SVG
- **ImageOptim** : Batch optimization (Mac)

### Fonts
- **Google Fonts** : Gratuit, performant
- **Adobe Fonts** : Premium, Creative Cloud
- **Font Squirrel** : Gratuit, commercial ok

---

## 16. Budget Visuel Estimé

### Design Initial (Année 1)

**Design système & UI Kit**
- Création identité visuelle : 3000-5000 EUR
- Design système Figma : 2000-3000 EUR
- Prototypes interactifs : 1000-2000 EUR
**Sous-total : 6000-10 000 EUR**

**Illustrations custom**
- Pack illustrations homepage : 1500-2500 EUR
- Icônes custom (set de 20) : 500-1000 EUR
- Animations Lottie (x3) : 1000-2000 EUR
**Sous-total : 3000-5500 EUR**

**Photos & Médias**
- Session photo équipe : 1000-1500 EUR
- Photos stock (licence) : 500 EUR
- Vidéos explicatives : 3000-5000 EUR
**Sous-total : 4500-7000 EUR**

**Assets marketing**
- Brochure PDF design : 1000 EUR
- Présentation PowerPoint : 500 EUR
- Templates email : 800 EUR
**Sous-total : 2300 EUR**

**Total Design Année 1 : 15 800 - 24 800 EUR**

### Maintenance (Année 2+)
- Mises à jour design : 5000 EUR/an
- Nouvelles illustrations : 2000 EUR/an
- Photos actualisées : 1000 EUR/an
**Total Année 2+ : 8000 EUR/an**

---

## 17. Timeline de Production

### Phase 1 - Fondations (2 semaines)
- Semaine 1 : Audit existant, brainstorming, moodboard
- Semaine 2 : Charte graphique, palette, typographie

### Phase 2 - Assets Principaux (3 semaines)
- Semaine 3 : Logo, favicon, identité visuelle
- Semaine 4 : Illustrations homepage
- Semaine 5 : Icônes et micro-illustrations

### Phase 3 - Intégration (2 semaines)
- Semaine 6 : Intégration homepage
- Semaine 7 : Intégration pages secondaires

### Phase 4 - Polissage (1 semaine)
- Semaine 8 : Animations, micro-interactions, QA

**Total : 8 semaines (2 mois)**

---

## Conclusion

Ces recommandations visuelles complètent le guide marketing et permettront de créer une expérience visuelle cohérente, moderne et performante pour RT Technologie.

**Priorités immédiates :**
1. Logo et favicon professionnels
2. Illustrations hero homepage
3. Icônes custom pour processus
4. Photos/avatars témoignages
5. Templates email HTML

**Prochaines étapes :**
1. Valider le budget et timeline
2. Sélectionner designer/agence
3. Produire les assets prioritaires
4. Intégrer progressivement
5. Tester et itérer

---

**Version** : 1.0
**Date** : Novembre 2025
**Statut** : Prêt pour production
