import { useEffect, useState } from 'react';
import { Search, Building2, Plus, Filter, Download, Eye } from 'lucide-react';

const ADMIN_GATEWAY = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'http://localhost:3008';

interface OrgItem { id: string; name: string; role: string; status: string; plan?: string; addons?: string[] }

export default function OrgsList() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OrgItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    setLoading(true); setError(null);
    try {
      const headers: any = {};
      if (typeof window !== 'undefined') {
        const t = window.localStorage.getItem('admin_jwt');
        if (t) headers['authorization'] = `Bearer ${t}`;
      }
      const res = await fetch(`${ADMIN_GATEWAY}/admin/orgs?query=${encodeURIComponent(query)}`, { headers });
      const json = await res.json();
      setItems(json.items || []);
    } catch (e: any) {
      setError(e.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      search();
    }
  };

  useEffect(() => { search(); }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'active': 'badge-success',
      'pending': 'badge-warning',
      'suspended': 'badge-danger',
      'inactive': 'badge-secondary'
    };
    return statusMap[status.toLowerCase()] || 'badge-secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 size={32} className="text-primary-500" />
            Organisations
          </h1>
          <p className="text-gray-600 mt-2">Gerez les organisations et leurs abonnements</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-modern-secondary">
            <Download size={20} />
            <span>Exporter</span>
          </button>
          <button className="btn-modern-primary">
            <Plus size={20} />
            <span>Nouvelle organisation</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Rechercher par nom, email ou ID..."
              disabled={loading}
            />
          </div>
          <button className="btn-modern-secondary">
            <Filter size={20} />
            <span>Filtres</span>
          </button>
          <button
            className="btn-modern-primary min-w-[140px]"
            onClick={search}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading"></span>
                <span>Recherche...</span>
              </>
            ) : (
              <>
                <Search size={20} />
                <span>Rechercher</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h4 className="font-semibold">Erreur</h4>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {items.length === 0 && !loading && !error ? (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune organisation trouvee</h3>
          <p className="text-gray-600 mb-6">Commencez par creer votre premiere organisation</p>
          <button className="btn-modern-primary">
            <Plus size={20} />
            <span>Creer une organisation</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Organisation</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Addons</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <code className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-mono">
                        {o.id.substring(0, 8)}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {o.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-secondary">{o.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {o.plan ? (
                        <span className="badge badge-info">{o.plan}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {o.addons && o.addons.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {o.addons.map((addon, idx) => (
                            <span key={idx} className="badge badge-secondary text-xs">
                              {addon}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a href={`/orgs/${o.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors font-medium">
                        <Eye size={16} />
                        <span>Voir</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{items.length}</span> organisation{items.length > 1 ? 's' : ''} trouvee{items.length > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Precedent</button>
                <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Suivant</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
