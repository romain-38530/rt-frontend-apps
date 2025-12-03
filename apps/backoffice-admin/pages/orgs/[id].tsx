import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Building2,
  Settings,
  CreditCard,
  FileText,
  Calendar,
  Clock,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Save,
  ChevronDown,
  ChevronUp,
  Zap,
  Package,
  Users,
  TrendingUp,
  Shield,
  Bell,
  Mail,
  Phone,
  MapPin,
  Euro,
  Receipt,
  FileCheck,
  Timer,
  Sparkles,
} from 'lucide-react';

const ADMIN_GATEWAY = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://ddaywxps9n701.cloudfront.net';
const SUBSCRIPTIONS_API = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://d39uizi9hzozo8.cloudfront.net';

// Types
interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  siret?: string;
  role: string;
  status: string;
  plan?: string;
  addons?: string[];
  createdAt?: string;
}

interface ContractInfo {
  startDate: string;
  endDate?: string;
  duration: number; // en mois
  autoRenewal: boolean;
  renewalNotice: number; // jours avant fin
  status: 'active' | 'expiring_soon' | 'expired' | 'cancelled';
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  pdfUrl?: string;
}

interface FeatureToggle {
  key: string;
  name: string;
  description: string;
  category: 'core' | 'module' | 'addon';
  enabled: boolean;
  includedInPlan: boolean;
}

// Configuration des fonctionnalités disponibles
const ALL_FEATURES: Omit<FeatureToggle, 'enabled' | 'includedInPlan'>[] = [
  // Core
  { key: 'orders_management', name: 'Gestion des commandes', description: 'Créer et gérer les ordres de transport', category: 'core' },
  { key: 'tracking_basic', name: 'Suivi basique', description: 'Suivi des livraisons en temps réel', category: 'core' },
  { key: 'notifications_email', name: 'Notifications email', description: 'Alertes par email', category: 'core' },
  { key: 'dashboard_basic', name: 'Tableau de bord', description: 'KPIs et statistiques de base', category: 'core' },
  // Modules
  { key: 'affret_ia', name: 'Affret.IA', description: 'Matching intelligent transporteurs', category: 'module' },
  { key: 'tracking_ia', name: 'Tracking IA Premium', description: 'Prédiction ETA et anomalies', category: 'module' },
  { key: 'ecmr_signature', name: 'Signature eCMR', description: 'Signature électronique des CMR', category: 'module' },
  { key: 'prefacturation', name: 'Préfacturation', description: 'Calcul automatique des factures', category: 'module' },
  { key: 'palettes_europe', name: 'Palettes Europe', description: 'Gestion des palettes consignées', category: 'module' },
  { key: 'tms_sync', name: 'TMS Sync Premium', description: 'Synchronisation TMS avancée', category: 'module' },
  { key: 'chatbot_ia', name: 'Chatbot IA', description: 'Assistant intelligent', category: 'module' },
  // Addons
  { key: 'notifications_sms', name: 'Notifications SMS', description: 'Alertes par SMS (0.04€/SMS)', category: 'addon' },
  { key: 'api_access', name: 'Accès API', description: 'API REST pour intégrations', category: 'addon' },
  { key: 'multi_users', name: 'Multi-utilisateurs', description: 'Gestion des droits utilisateurs', category: 'addon' },
  { key: 'white_label', name: 'White Label', description: 'Personnalisation marque', category: 'addon' },
  { key: 'priority_support', name: 'Support Prioritaire', description: 'Support 24/7 dédié', category: 'addon' },
];

// Plans et leurs fonctionnalités incluses
const PLAN_FEATURES: Record<string, string[]> = {
  'INDUSTRY_BASE': ['orders_management', 'tracking_basic', 'notifications_email', 'dashboard_basic', 'multi_users'],
  'INDUSTRY_PREMIUM': ['orders_management', 'tracking_basic', 'notifications_email', 'dashboard_basic', 'multi_users', 'affret_ia', 'tracking_ia', 'ecmr_signature', 'api_access'],
  'TRANSPORTER_BASE': ['orders_management', 'tracking_basic', 'notifications_email', 'dashboard_basic'],
  'TRANSPORTER_PREMIUM': ['orders_management', 'tracking_basic', 'notifications_email', 'dashboard_basic', 'tracking_ia', 'ecmr_signature', 'tms_sync'],
  'LOGISTICIAN_BASE': ['orders_management', 'tracking_basic', 'notifications_email', 'dashboard_basic', 'palettes_europe'],
  'LOGISTICIAN_PREMIUM': ['orders_management', 'tracking_basic', 'notifications_email', 'dashboard_basic', 'palettes_europe', 'prefacturation', 'api_access'],
};

const PLANS = [
  { value: 'INDUSTRY_BASE', label: 'Industriel — Base (499€/mois)', price: 499 },
  { value: 'INDUSTRY_PREMIUM', label: 'Industriel — Premium (799€/mois)', price: 799 },
  { value: 'TRANSPORTER_BASE', label: 'Transporteur — Base (299€/mois)', price: 299 },
  { value: 'TRANSPORTER_PREMIUM', label: 'Transporteur — Premium (499€/mois)', price: 499 },
  { value: 'LOGISTICIAN_BASE', label: 'Logisticien — Base (299€/mois)', price: 299 },
  { value: 'LOGISTICIAN_PREMIUM', label: 'Logisticien — Premium (499€/mois)', price: 499 },
];

export default function OrgDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'billing' | 'contract'>('overview');
  const [org, setOrg] = useState<Organization | null>(null);
  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [features, setFeatures] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('core');

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('admin_jwt');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const headers = getAuthHeaders();

      // Charger les données de l'organisation
      const orgRes = await fetch(`${ADMIN_GATEWAY}/admin/orgs/${id}`, { headers });
      const orgData = await orgRes.json();
      setOrg(orgData);

      // Charger les fonctionnalités activées
      const featuresRes = await fetch(`${ADMIN_GATEWAY}/admin/orgs/${id}/features`, { headers });
      const featuresData = await featuresRes.json();

      // Mapper les fonctionnalités
      const planFeatures = PLAN_FEATURES[orgData.plan] || [];
      const enabledFeatures = new Set([...planFeatures, ...(featuresData.features || [])]);

      setFeatures(ALL_FEATURES.map(f => ({
        ...f,
        enabled: enabledFeatures.has(f.key),
        includedInPlan: planFeatures.includes(f.key),
      })));

      // Charger les infos de contrat (mock si API non dispo)
      try {
        const contractRes = await fetch(`${SUBSCRIPTIONS_API}/api/subscriptions/org/${id}/contract`, { headers });
        if (contractRes.ok) {
          setContract(await contractRes.json());
        } else {
          // Données mock pour démo
          setContract({
            startDate: '2024-01-15',
            endDate: '2025-01-15',
            duration: 12,
            autoRenewal: true,
            renewalNotice: 30,
            status: 'active',
          });
        }
      } catch {
        setContract({
          startDate: '2024-01-15',
          endDate: '2025-01-15',
          duration: 12,
          autoRenewal: true,
          renewalNotice: 30,
          status: 'active',
        });
      }

      // Charger les factures (mock si API non dispo)
      try {
        const invoicesRes = await fetch(`${SUBSCRIPTIONS_API}/api/billing/org/${id}/invoices`, { headers });
        if (invoicesRes.ok) {
          const invoicesData = await invoicesRes.json();
          setInvoices(invoicesData.invoices || []);
        } else {
          // Données mock pour démo
          setInvoices([
            { id: 'INV-2024-001', number: 'FA-2024-001', date: '2024-12-01', dueDate: '2024-12-31', amount: 499, status: 'pending' },
            { id: 'INV-2024-002', number: 'FA-2024-002', date: '2024-11-01', dueDate: '2024-11-30', amount: 499, status: 'paid' },
            { id: 'INV-2024-003', number: 'FA-2024-003', date: '2024-10-01', dueDate: '2024-10-31', amount: 499, status: 'paid' },
            { id: 'INV-2024-004', number: 'FA-2024-004', date: '2024-09-01', dueDate: '2024-09-30', amount: 499, status: 'paid' },
          ]);
        }
      } catch {
        setInvoices([
          { id: 'INV-2024-001', number: 'FA-2024-001', date: '2024-12-01', dueDate: '2024-12-31', amount: 499, status: 'pending' },
          { id: 'INV-2024-002', number: 'FA-2024-002', date: '2024-11-01', dueDate: '2024-11-30', amount: 499, status: 'paid' },
          { id: 'INV-2024-003', number: 'FA-2024-003', date: '2024-10-01', dueDate: '2024-10-31', amount: 499, status: 'paid' },
        ]);
      }
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (key: string) => {
    setFeatures(prev => prev.map(f =>
      f.key === key ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const saveFeatures = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const headers = getAuthHeaders();
      const enabledFeatures = features.filter(f => f.enabled && !f.includedInPlan).map(f => f.key);

      await fetch(`${ADMIN_GATEWAY}/admin/orgs/${id}/features`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ features: enabledFeatures }),
      });

      setSuccess('Fonctionnalités mises à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const saveContract = async () => {
    if (!id || !contract) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const headers = getAuthHeaders();

      await fetch(`${SUBSCRIPTIONS_API}/api/subscriptions/org/${id}/contract`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(contract),
      });

      setSuccess('Contrat mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async () => {
    if (!id || !org) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const headers = getAuthHeaders();

      await fetch(`${ADMIN_GATEWAY}/admin/orgs/${id}/plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan: org.plan, addons: org.addons || [] }),
      });

      // Recharger les fonctionnalités après changement de plan
      await loadData();
      setSuccess('Plan mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const getDaysUntilExpiry = () => {
    if (!contract?.endDate) return null;
    const end = new Date(contract.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getContractStatusBadge = () => {
    const days = getDaysUntilExpiry();
    if (days === null) return { color: 'gray', text: 'Indéterminé' };
    if (days < 0) return { color: 'red', text: 'Expiré' };
    if (days <= 30) return { color: 'orange', text: `Expire dans ${days} jours` };
    if (days <= 90) return { color: 'yellow', text: `Expire dans ${days} jours` };
    return { color: 'green', text: 'Actif' };
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return { color: 'green', text: 'Payée', icon: Check };
      case 'pending': return { color: 'yellow', text: 'En attente', icon: Clock };
      case 'overdue': return { color: 'red', text: 'En retard', icon: AlertTriangle };
      case 'cancelled': return { color: 'gray', text: 'Annulée', icon: X };
      default: return { color: 'gray', text: status, icon: AlertCircle };
    }
  };

  if (!id) return <div className="p-8">Chargement...</div>;
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );
  if (!org) return <div className="p-8 text-red-600">Organisation non trouvée</div>;

  const contractStatus = getContractStatusBadge();
  const featuresByCategory = {
    core: features.filter(f => f.category === 'core'),
    module: features.filter(f => f.category === 'module'),
    addon: features.filter(f => f.category === 'addon'),
  };

  return (
    <>
      <Head>
        <title>{org.name} - Gestion Client | Backoffice</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                {org.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} />
                    {org.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    org.status === 'active' ? 'bg-green-100 text-green-800' :
                    org.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {org.status}
                  </span>
                  {contract && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      contractStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                      contractStatus.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      contractStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      contractStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <Timer size={12} className="inline mr-1" />
                      {contractStatus.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={loadData} className="btn-modern-secondary" disabled={loading}>
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={18} />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex items-center gap-3">
            <Check size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { key: 'overview', label: 'Vue d\'ensemble', icon: Eye },
                { key: 'features', label: 'Fonctionnalités', icon: Sparkles },
                { key: 'billing', label: 'Facturation', icon: Receipt },
                { key: 'contract', label: 'Contrat', icon: FileText },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Plan actuel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Package size={20} className="text-primary-500" />
                      Plan actuel
                    </h3>
                    <select
                      value={org.plan || ''}
                      onChange={(e) => setOrg({ ...org, plan: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">— Sélectionner un plan —</option>
                      {PLANS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={savePlan}
                      disabled={saving}
                      className="mt-4 btn-modern-primary w-full"
                    >
                      <Save size={18} />
                      <span>Enregistrer le plan</span>
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp size={20} className="text-green-500" />
                      Résumé facturation
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Factures en attente</span>
                        <span className="font-semibold text-yellow-600">
                          {invoices.filter(i => i.status === 'pending').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Factures en retard</span>
                        <span className="font-semibold text-red-600">
                          {invoices.filter(i => i.status === 'overdue').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total impayé</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {features.filter(f => f.enabled).length}
                    </div>
                    <div className="text-sm text-blue-800">Fonctionnalités actives</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {invoices.filter(i => i.status === 'paid').length}
                    </div>
                    <div className="text-sm text-green-800">Factures payées</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {contract?.duration || 0}
                    </div>
                    <div className="text-sm text-purple-800">Mois de contrat</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {getDaysUntilExpiry() || 0}
                    </div>
                    <div className="text-sm text-orange-800">Jours restants</div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-gray-600">
                    Activez ou désactivez les fonctionnalités pour ce client.
                    Les fonctionnalités incluses dans le plan sont marquées d'une étoile.
                  </p>
                  <button onClick={saveFeatures} disabled={saving} className="btn-modern-primary">
                    <Save size={18} />
                    <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                  </button>
                </div>

                {/* Core Features */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === 'core' ? null : 'core')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Shield size={20} className="text-blue-500" />
                      <span className="font-semibold">Fonctionnalités de base</span>
                      <span className="text-sm text-gray-500">({featuresByCategory.core.filter(f => f.enabled).length}/{featuresByCategory.core.length})</span>
                    </div>
                    {expandedCategory === 'core' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedCategory === 'core' && (
                    <div className="divide-y divide-gray-100">
                      {featuresByCategory.core.map(feature => (
                        <div key={feature.key} className="flex items-center justify-between p-4 hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{feature.name}</span>
                              {feature.includedInPlan && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Inclus</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{feature.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feature.enabled}
                              onChange={() => toggleFeature(feature.key)}
                              disabled={feature.includedInPlan}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 ${feature.includedInPlan ? 'opacity-50' : ''}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modules */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === 'module' ? null : 'module')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Zap size={20} className="text-purple-500" />
                      <span className="font-semibold">Modules premium</span>
                      <span className="text-sm text-gray-500">({featuresByCategory.module.filter(f => f.enabled).length}/{featuresByCategory.module.length})</span>
                    </div>
                    {expandedCategory === 'module' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedCategory === 'module' && (
                    <div className="divide-y divide-gray-100">
                      {featuresByCategory.module.map(feature => (
                        <div key={feature.key} className="flex items-center justify-between p-4 hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{feature.name}</span>
                              {feature.includedInPlan && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Inclus</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{feature.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feature.enabled}
                              onChange={() => toggleFeature(feature.key)}
                              disabled={feature.includedInPlan}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 ${feature.includedInPlan ? 'opacity-50' : ''}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Addons */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === 'addon' ? null : 'addon')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package size={20} className="text-green-500" />
                      <span className="font-semibold">Options supplémentaires</span>
                      <span className="text-sm text-gray-500">({featuresByCategory.addon.filter(f => f.enabled).length}/{featuresByCategory.addon.length})</span>
                    </div>
                    {expandedCategory === 'addon' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedCategory === 'addon' && (
                    <div className="divide-y divide-gray-100">
                      {featuresByCategory.addon.map(feature => (
                        <div key={feature.key} className="flex items-center justify-between p-4 hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{feature.name}</span>
                              {feature.includedInPlan && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Inclus</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{feature.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feature.enabled}
                              onChange={() => toggleFeature(feature.key)}
                              disabled={feature.includedInPlan}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600 ${feature.includedInPlan ? 'opacity-50' : ''}`}></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Historique des factures</h3>
                  <button className="btn-modern-secondary">
                    <Download size={18} />
                    <span>Exporter</span>
                  </button>
                </div>

                {invoices.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Aucune facture pour le moment</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">N° Facture</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Échéance</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Montant</th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {invoices.map(invoice => {
                          const status = getInvoiceStatusBadge(invoice.status);
                          const StatusIcon = status.icon;
                          return (
                            <tr key={invoice.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <span className="font-mono text-sm font-medium">{invoice.number}</span>
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                {formatDate(invoice.date)}
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                {formatDate(invoice.dueDate)}
                              </td>
                              <td className="px-6 py-4 text-right font-semibold">
                                {formatCurrency(invoice.amount)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                  status.color === 'green' ? 'bg-green-100 text-green-800' :
                                  status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  status.color === 'red' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  <StatusIcon size={14} />
                                  {status.text}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Voir">
                                    <Eye size={16} className="text-gray-600" />
                                  </button>
                                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Télécharger PDF">
                                    <Download size={16} className="text-gray-600" />
                                  </button>
                                  {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                    <button className="p-2 hover:bg-green-100 rounded-lg transition-colors" title="Marquer comme payée">
                                      <Check size={16} className="text-green-600" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Résumé facturation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Check size={20} className="text-green-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0))}
                        </div>
                        <div className="text-sm text-green-800">Total payé</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Clock size={20} className="text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {formatCurrency(invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0))}
                        </div>
                        <div className="text-sm text-yellow-800">En attente</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0))}
                        </div>
                        <div className="text-sm text-red-800">En retard</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Tab */}
            {activeTab === 'contract' && contract && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Infos contrat */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileText size={20} className="text-primary-500" />
                      Informations du contrat
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                        <input
                          type="date"
                          value={contract.startDate}
                          onChange={(e) => setContract({ ...contract, startDate: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                        <input
                          type="date"
                          value={contract.endDate || ''}
                          onChange={(e) => setContract({ ...contract, endDate: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durée (mois)</label>
                        <select
                          value={contract.duration}
                          onChange={(e) => setContract({ ...contract, duration: Number(e.target.value) })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value={1}>1 mois (sans engagement)</option>
                          <option value={12}>12 mois</option>
                          <option value={24}>24 mois</option>
                          <option value={36}>36 mois</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Préavis de renouvellement (jours)</label>
                        <input
                          type="number"
                          value={contract.renewalNotice}
                          onChange={(e) => setContract({ ...contract, renewalNotice: Number(e.target.value) })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Options contrat */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Settings size={20} className="text-primary-500" />
                      Options de renouvellement
                    </h3>

                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contract.autoRenewal}
                          onChange={(e) => setContract({ ...contract, autoRenewal: e.target.checked })}
                          className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Renouvellement automatique</span>
                          <p className="text-sm text-gray-500">Le contrat sera automatiquement renouvelé à son échéance</p>
                        </div>
                      </label>

                      {/* Alerte expiration */}
                      {getDaysUntilExpiry() !== null && getDaysUntilExpiry()! <= 90 && (
                        <div className={`p-4 rounded-lg ${
                          getDaysUntilExpiry()! < 0 ? 'bg-red-100 border border-red-200' :
                          getDaysUntilExpiry()! <= 30 ? 'bg-orange-100 border border-orange-200' :
                          'bg-yellow-100 border border-yellow-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <AlertTriangle size={24} className={
                              getDaysUntilExpiry()! < 0 ? 'text-red-600' :
                              getDaysUntilExpiry()! <= 30 ? 'text-orange-600' :
                              'text-yellow-600'
                            } />
                            <div>
                              <h4 className="font-semibold">
                                {getDaysUntilExpiry()! < 0
                                  ? 'Contrat expiré'
                                  : `Contrat expire dans ${getDaysUntilExpiry()} jours`
                                }
                              </h4>
                              <p className="text-sm">
                                {contract.autoRenewal
                                  ? 'Le contrat sera automatiquement renouvelé.'
                                  : 'Pensez à contacter le client pour le renouvellement.'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={saveContract}
                      disabled={saving}
                      className="btn-modern-primary w-full"
                    >
                      <Save size={18} />
                      <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                    </button>
                  </div>
                </div>

                {/* Timeline contrat */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline du contrat</h3>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                    <div className="space-y-6">
                      <div className="relative flex items-center gap-4 pl-10">
                        <div className="absolute left-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        <div>
                          <div className="font-medium text-gray-900">Début du contrat</div>
                          <div className="text-sm text-gray-500">{formatDate(contract.startDate)}</div>
                        </div>
                      </div>
                      {contract.endDate && (
                        <>
                          <div className="relative flex items-center gap-4 pl-10">
                            <div className="absolute left-2 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
                            <div>
                              <div className="font-medium text-gray-900">Alerte renouvellement</div>
                              <div className="text-sm text-gray-500">
                                {formatDate(new Date(new Date(contract.endDate).getTime() - contract.renewalNotice * 24 * 60 * 60 * 1000).toISOString())}
                              </div>
                            </div>
                          </div>
                          <div className="relative flex items-center gap-4 pl-10">
                            <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white ${
                              getDaysUntilExpiry()! < 0 ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>
                            <div>
                              <div className="font-medium text-gray-900">Fin du contrat</div>
                              <div className="text-sm text-gray-500">{formatDate(contract.endDate)}</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
