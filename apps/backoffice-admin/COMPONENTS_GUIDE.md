# Guide des Composants - Backoffice Admin

## Comment utiliser les nouveaux composants

### 1. StatCard - Cartes de Statistiques

```tsx
import { StatCard } from '../components/StatCard';
import { Users } from 'lucide-react';

<StatCard
  title="Utilisateurs"
  value="8,456"
  subtitle="Total"
  icon={Users}
  trend={{ value: 8.2, isPositive: true }}
  color="success"
/>
```

**Props**:
- `title`: string - Titre de la statistique
- `value`: string | number - Valeur principale
- `subtitle`: string (optionnel) - Sous-titre
- `icon`: LucideIcon - Icone de lucide-react
- `trend`: { value: number, isPositive: boolean } (optionnel) - Tendance
- `color`: 'primary' | 'success' | 'warning' | 'danger' | 'purple'

### 2. DashboardCard - Conteneur de Widget

```tsx
import { DashboardCard } from '../components/DashboardCard';
import { TrendingUp } from 'lucide-react';

<DashboardCard
  title="Activite mensuelle"
  subtitle="Evolution des organisations"
  icon={TrendingUp}
  action={{
    label: 'Voir details',
    onClick: () => console.log('clicked')
  }}
>
  {/* Votre contenu ici */}
</DashboardCard>
```

**Props**:
- `title`: string - Titre du widget
- `subtitle`: string (optionnel) - Description
- `icon`: LucideIcon (optionnel) - Icone
- `action`: { label: string, onClick: () => void } (optionnel) - Action
- `children`: ReactNode - Contenu
- `className`: string (optionnel) - Classes CSS additionnelles

### 3. ActivityChart - Graphiques

```tsx
import { ActivityChart } from '../components/ActivityChart';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Fev', value: 300 },
  { name: 'Mar', value: 600 },
];

<ActivityChart
  data={data}
  type="area"
  color="#0a66ff"
/>
```

**Props**:
- `data`: Array<{ name: string, value: number, value2?: number }>
- `type`: 'line' | 'area' (defaut: 'area')
- `color`: string (defaut: '#0a66ff')

### 4. Sidebar - Navigation

```tsx
import { Sidebar } from '../components/Sidebar';

<Sidebar
  isOpen={sidebarOpen}
  onToggle={() => setSidebarOpen(!sidebarOpen)}
/>
```

**Props**:
- `isOpen`: boolean (optionnel, defaut: true) - Etat ouvert/ferme
- `onToggle`: () => void (optionnel) - Callback toggle

**Navigation Items**:
Editer le fichier `components/Sidebar.tsx` pour ajouter/modifier les liens:

```tsx
const navItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Building2, label: 'Organisations', href: '/orgs' },
  // Ajoutez vos liens ici
];
```

### 5. Header - En-tete

```tsx
import { Header } from '../components/Header';

<Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
```

**Props**:
- `onMenuToggle`: () => void (optionnel) - Callback pour toggle sidebar mobile

**Personnaliser les notifications**:
Editer `components/Header.tsx`:

```tsx
const notifications = [
  {
    id: 1,
    title: 'Nouvelle organisation',
    message: 'Acme Corp a cree un compte',
    time: '5 min'
  },
  // Ajoutez vos notifications
];
```

## Classes CSS Utilitaires

### Buttons Modernes

```tsx
// Primary Button
<button className="btn-modern-primary">
  <Icon size={20} />
  <span>Action</span>
</button>

// Secondary Button
<button className="btn-modern-secondary">
  Action
</button>

// Outline Button
<button className="btn-modern-outline">
  Action
</button>
```

### Badges

```tsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-danger">Suspended</span>
<span className="badge badge-info">Premium</span>
<span className="badge badge-secondary">Regular</span>
```

### Cards

```tsx
// Card basique
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Titre</h3>
    <p className="card-subtitle">Description</p>
  </div>
  {/* Contenu */}
</div>

// Dashboard Card (utiliser le composant)
<div className="dashboard-card">
  {/* Contenu */}
</div>

// Feature Card
<div className="feature-card">
  {/* Contenu avec hover effect */}
</div>
```

### Forms

```tsx
<div className="form-group">
  <label className="form-label">Label</label>
  <input className="form-input" type="text" placeholder="..." />
</div>

// Ou version moderne
<input className="input-modern" type="text" placeholder="..." />
```

### Tables

```tsx
<div className="table-container">
  <table className="table">
    <thead>
      <tr>
        <th>Colonne 1</th>
        <th>Colonne 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data 1</td>
        <td>Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Animations

### Classes d'animation

```tsx
// Fade in
<div className="animate-fade-in">
  Contenu
</div>

// Slide in (avec delai)
<div
  className="animate-slide-in"
  style={{ animationDelay: '0.1s' }}
>
  Contenu
</div>

// Scale in
<div className="animate-scale-in">
  Contenu
</div>
```

### Loading Spinner

```tsx
<span className="loading"></span>

// Avec texte
<div className="flex items-center gap-2">
  <span className="loading"></span>
  <span>Chargement...</span>
</div>
```

## Layout

### Structure de page type

```tsx
export default function MyPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Titre Page
          </h1>
          <p className="text-gray-600 mt-2">Description</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-modern-secondary">Action 1</button>
          <button className="btn-modern-primary">Action 2</button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vos widgets */}
      </div>
    </div>
  );
}
```

### Grid Layouts

```tsx
// 1 colonne mobile, 2 desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* items */}
</div>

// 1 mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* items */}
</div>

// 1 mobile, 2 tablet, 4 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* items */}
</div>
```

## Icones (Lucide React)

```tsx
import {
  Home,
  Building2,
  Users,
  Settings,
  TrendingUp,
  Activity,
  Package,
  DollarSign,
  Truck,
  Eye,
  Edit,
  Trash,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Bell,
  Menu,
  X,
  LogOut
} from 'lucide-react';

// Utilisation
<Home size={20} className="text-gray-600" />
<Building2 size={24} />
<Users size={16} className="text-primary-500" />
```

## Couleurs Tailwind

```tsx
// Primary (Bleu)
bg-primary-50    text-primary-500    border-primary-600

// Success (Vert)
bg-success-50    text-success-700    border-success-500

// Warning (Orange)
bg-warning-50    text-warning-700    border-warning-500

// Danger (Rouge)
bg-danger-50     text-danger-700     border-danger-500

// Gray (Neutre)
bg-gray-50       text-gray-600       border-gray-200

// Purple (Accent)
bg-purple-50     text-purple-600     border-purple-500
```

## Exemple Page Complete

```tsx
import { Building2, Plus, Download } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { DashboardCard } from '../components/DashboardCard';

export default function MyPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero/Header */}
      <div className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Ma Page</h1>
        <p className="text-lg opacity-90">Description de ma page</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Metric 1"
          value="1,234"
          icon={Building2}
          color="primary"
        />
        {/* Plus de stats */}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Widget 1" icon={Building2}>
          {/* Contenu */}
        </DashboardCard>
        <DashboardCard title="Widget 2" icon={Building2}>
          {/* Contenu */}
        </DashboardCard>
      </div>
    </div>
  );
}
```

## Bonnes Pratiques

1. **Coherence**: Utilisez les composants fournis pour garantir la coherence
2. **Responsive**: Testez toujours sur mobile, tablet et desktop
3. **Accessibilite**: Ajoutez des labels et ARIA attributes
4. **Performance**: Evitez les re-renders inutiles
5. **Loading states**: Affichez toujours un spinner pendant le chargement
6. **Empty states**: Gerez les cas ou il n'y a pas de donnees
7. **Error handling**: Affichez des messages d'erreur clairs
8. **Animations**: Utilisez avec moderation pour ne pas surcharger
9. **Icons**: Utilisez Lucide React pour la coherence
10. **Colors**: Respectez la palette de couleurs definie

## Support

Pour toute question ou probleme avec les composants, consultez :
- Le code source des composants dans `components/`
- Les exemples dans `pages/index.tsx` et `pages/orgs/index.tsx`
- La documentation Tailwind CSS : https://tailwindcss.com
- La documentation Lucide : https://lucide.dev
- La documentation Recharts : https://recharts.org
