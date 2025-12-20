import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Package, Tag, Percent, Plus, Edit2, Trash2, Save, X,
  ChevronDown, ChevronUp, Euro, Clock, Check, AlertCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://rt-admin-api-prod.eba-gqzj9rrf.eu-central-1.elasticbeanstalk.com';

interface ModulePricing {
  _id: string;
  moduleCode: string;
  moduleName: string;
  description: string;
  category: string;
  pricing: {
    type: string;
    basePrice: number;
    setupFee: number;
    currency: string;
  };
  installation: {
    estimatedHours: number;
    complexity: string;
  };
  isActive: boolean;
  features: string[];
}

interface ModulePack {
  _id: string;
  packCode: string;
  packName: string;
  description: string;
  targetAudience: string;
  modules: { moduleCode: string; moduleName: string; }[];
  pricing: {
    monthlyPrice: number;
    setupFee: number;
    annualDiscount: number;
    originalPrice: number;
    savingsPercent: number;
  };
  isActive: boolean;
  badge?: string;
}

interface Promotion {
  _id: string;
  promoCode: string;
  promoName: string;
  description: string;
  type: string;
  value: {
    percentage?: number;
    fixedAmount?: number;
    freeMonths?: number;
  };
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  usageCount: number;
}

export default function PricingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'modules' | 'packs' | 'promos'>('modules');
  const [modules, setModules] = useState<ModulePricing[]>([]);
  const [packs, setPacks] = useState<ModulePack[]>([]);
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData(token);
  }, [router]);

  const loadData = async (token: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [modulesRes, packsRes, promosRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/admin/manager/pricing`, { headers }),
        fetch(`${API_URL}/api/v1/admin/manager/packs`, { headers }),
        fetch(`${API_URL}/api/v1/admin/manager/promotions`, { headers })
      ]);

      if (modulesRes.ok) setModules(await modulesRes.json());
      if (packsRes.ok) setPacks(await packsRes.json());
      if (promosRes.ok) setPromos(await promosRes.json());
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    const endpoint = activeTab === 'modules' ? 'pricing' :
                     activeTab === 'packs' ? 'packs' : 'promotions';
    const method = editItem?._id ? 'PUT' : 'POST';
    const url = editItem?._id
      ? `${API_URL}/api/v1/admin/manager/${endpoint}/${editItem._id}`
      : `${API_URL}/api/v1/admin/manager/${endpoint}`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setShowModal(false);
        setEditItem(null);
        loadData(token);
      } else {
        const err = await res.json();
        setError(err.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet element?')) return;

    const token = localStorage.getItem('admin_token');
    if (!token) return;

    const endpoint = activeTab === 'modules' ? 'pricing' :
                     activeTab === 'packs' ? 'packs' : 'promotions';

    try {
      await fetch(`${API_URL}/api/v1/admin/manager/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadData(token);
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Tarifs</h1>
            <p className="text-gray-500">Modules, Packs et Promotions</p>
          </div>
          <Link href="/crm" className="text-blue-600 hover:underline">
            Retour CRM
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === 'modules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            <Package className="w-5 h-5" />
            Modules ({modules.length})
          </button>
          <button
            onClick={() => setActiveTab('packs')}
            className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === 'packs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            <Tag className="w-5 h-5" />
            Packs ({packs.length})
          </button>
          <button
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition ${
              activeTab === 'promos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            <Percent className="w-5 h-5" />
            Promotions ({promos.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Add button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => { setEditItem(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Ajouter {activeTab === 'modules' ? 'un module' : activeTab === 'packs' ? 'un pack' : 'une promo'}
          </button>
        </div>

        {/* Modules Table */}
        {activeTab === 'modules' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Module</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Categorie</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Prix/mois</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Installation</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Statut</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {modules.map((mod) => (
                  <tr key={mod._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{mod.moduleName}</div>
                      <div className="text-sm text-gray-500">{mod.moduleCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">{mod.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {mod.pricing.basePrice.toLocaleString()} EUR
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {mod.installation.estimatedHours}h - {mod.pricing.setupFee} EUR
                    </td>
                    <td className="px-4 py-3 text-center">
                      {mod.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Check className="w-4 h-4" /> Actif
                        </span>
                      ) : (
                        <span className="text-gray-400">Inactif</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditItem(mod); setShowModal(true); }}
                        className="p-2 text-gray-500 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mod._id)}
                        className="p-2 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {modules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Aucun module configure
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Packs Table */}
        {activeTab === 'packs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map((pack) => (
              <div key={pack._id} className="bg-white rounded-xl shadow-sm p-6 relative">
                {pack.badge && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    {pack.badge}
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{pack.packName}</h3>
                <p className="text-sm text-gray-500 mt-1">{pack.description}</p>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {pack.pricing.monthlyPrice.toLocaleString()} EUR
                    <span className="text-sm text-gray-400 font-normal">/mois</span>
                  </div>
                  {pack.pricing.savingsPercent > 0 && (
                    <div className="text-sm text-green-600 mt-1">
                      Economisez {pack.pricing.savingsPercent}%
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium text-gray-700">Modules inclus:</div>
                  {pack.modules.map((m, idx) => (
                    <div key={idx} className="text-sm text-gray-500 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      {m.moduleName}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between">
                  <span className={`text-sm ${pack.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    {pack.isActive ? 'Actif' : 'Inactif'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditItem(pack); setShowModal(true); }}
                      className="p-2 text-gray-500 hover:text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pack._id)}
                      className="p-2 text-gray-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {packs.length === 0 && (
              <div className="col-span-3 bg-white rounded-xl p-8 text-center text-gray-500">
                Aucun pack configure
              </div>
            )}
          </div>
        )}

        {/* Promos Table */}
        {activeTab === 'promos' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Promotion</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Valeur</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Validite</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Utilisations</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {promos.map((promo) => (
                  <tr key={promo._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                        {promo.promoCode}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{promo.promoName}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{promo.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                        {promo.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {promo.value.percentage && `${promo.value.percentage}%`}
                      {promo.value.fixedAmount && `${promo.value.fixedAmount} EUR`}
                      {promo.value.freeMonths && `${promo.value.freeMonths} mois`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(promo.validFrom).toLocaleDateString('fr-FR')} -
                      {new Date(promo.validUntil).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{promo.usageCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditItem(promo); setShowModal(true); }}
                        className="p-2 text-gray-500 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo._id)}
                        className="p-2 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Aucune promotion configuree
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <Modal
          type={activeTab}
          item={editItem}
          modules={modules}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null); setError(''); }}
          error={error}
        />
      )}
    </div>
  );
}

// Modal Component
function Modal({ type, item, modules, onSave, onClose, error }: {
  type: 'modules' | 'packs' | 'promos';
  item: any;
  modules: ModulePricing[];
  onSave: (data: any) => void;
  onClose: () => void;
  error: string;
}) {
  const [formData, setFormData] = useState(item || getDefaultData(type));

  function getDefaultData(type: string) {
    if (type === 'modules') {
      return {
        moduleCode: '',
        moduleName: '',
        description: '',
        category: 'addon',
        pricing: { type: 'flat', basePrice: 0, setupFee: 0, currency: 'EUR' },
        installation: { estimatedHours: 2, complexity: 'simple' },
        isActive: true,
        features: []
      };
    }
    if (type === 'packs') {
      return {
        packCode: '',
        packName: '',
        description: '',
        targetAudience: '',
        modules: [],
        pricing: { monthlyPrice: 0, setupFee: 0, annualDiscount: 10, originalPrice: 0, savingsPercent: 0 },
        isActive: true
      };
    }
    return {
      promoCode: '',
      promoName: '',
      description: '',
      type: 'percentage',
      value: { percentage: 10 },
      applicableTo: { type: 'all' },
      conditions: {},
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      isActive: true
    };
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {item ? 'Modifier' : 'Ajouter'} {type === 'modules' ? 'un module' : type === 'packs' ? 'un pack' : 'une promotion'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Module Form */}
          {type === 'modules' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code module</label>
                  <input
                    type="text"
                    value={formData.moduleCode}
                    onChange={(e) => setFormData({ ...formData, moduleCode: e.target.value.toUpperCase() })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du module</label>
                  <input
                    type="text"
                    value={formData.moduleName}
                    onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="core">Core</option>
                    <option value="transport">Transport</option>
                    <option value="logistics">Logistique</option>
                    <option value="finance">Finance</option>
                    <option value="analytics">Analytics</option>
                    <option value="integration">Integration</option>
                    <option value="addon">Addon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix mensuel (EUR)</label>
                  <input
                    type="number"
                    value={formData.pricing?.basePrice || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, basePrice: Number(e.target.value) }
                    })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frais installation (EUR)</label>
                  <input
                    type="number"
                    value={formData.pricing?.setupFee || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, setupFee: Number(e.target.value) }
                    })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temps installation (h)</label>
                  <input
                    type="number"
                    value={formData.installation?.estimatedHours || 2}
                    onChange={(e) => setFormData({
                      ...formData,
                      installation: { ...formData.installation, estimatedHours: Number(e.target.value) }
                    })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="moduleActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="moduleActive" className="text-sm text-gray-700">Module actif</label>
              </div>
            </>
          )}

          {/* Pack Form */}
          {type === 'packs' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code pack</label>
                  <input
                    type="text"
                    value={formData.packCode}
                    onChange={(e) => setFormData({ ...formData, packCode: e.target.value.toUpperCase() })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du pack</label>
                  <input
                    type="text"
                    value={formData.packName}
                    onChange={(e) => setFormData({ ...formData, packName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix mensuel (EUR)</label>
                  <input
                    type="number"
                    value={formData.pricing?.monthlyPrice || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, monthlyPrice: Number(e.target.value) }
                    })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix original (EUR)</label>
                  <input
                    type="number"
                    value={formData.pricing?.originalPrice || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, originalPrice: Number(e.target.value) }
                    })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modules inclus</label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {modules.map((mod) => (
                    <label key={mod._id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.modules?.some((m: any) => m.moduleCode === mod.moduleCode)}
                        onChange={(e) => {
                          const newModules = e.target.checked
                            ? [...(formData.modules || []), { moduleCode: mod.moduleCode, moduleName: mod.moduleName }]
                            : (formData.modules || []).filter((m: any) => m.moduleCode !== mod.moduleCode);
                          setFormData({ ...formData, modules: newModules });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{mod.moduleName}</span>
                      <span className="text-xs text-gray-400">({mod.pricing.basePrice} EUR)</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Promo Form */}
          {type === 'promos' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code promo</label>
                  <input
                    type="text"
                    value={formData.promoCode}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                    className="w-full border rounded-lg px-3 py-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la promotion</label>
                  <input
                    type="text"
                    value={formData.promoName}
                    onChange={(e) => setFormData({ ...formData, promoName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="percentage">Pourcentage</option>
                    <option value="fixed_amount">Montant fixe</option>
                    <option value="free_months">Mois gratuits</option>
                    <option value="free_setup">Installation gratuite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
                  {formData.type === 'percentage' && (
                    <input
                      type="number"
                      value={formData.value?.percentage || 0}
                      onChange={(e) => setFormData({ ...formData, value: { percentage: Number(e.target.value) } })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="%"
                    />
                  )}
                  {formData.type === 'fixed_amount' && (
                    <input
                      type="number"
                      value={formData.value?.fixedAmount || 0}
                      onChange={(e) => setFormData({ ...formData, value: { fixedAmount: Number(e.target.value) } })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="EUR"
                    />
                  )}
                  {formData.type === 'free_months' && (
                    <input
                      type="number"
                      value={formData.value?.freeMonths || 0}
                      onChange={(e) => setFormData({ ...formData, value: { freeMonths: Number(e.target.value) } })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="mois"
                    />
                  )}
                  {formData.type === 'free_setup' && (
                    <div className="text-gray-500 py-2">Installation offerte</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valide du</label>
                  <input
                    type="date"
                    value={formData.validFrom?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valide jusqu'au</label>
                  <input
                    type="date"
                    value={formData.validUntil?.split('T')[0] || ''}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
