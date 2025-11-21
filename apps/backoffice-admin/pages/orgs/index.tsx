import { useEffect, useState } from 'react';

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
    <>
      <div className="card-header" style={{ border: 'none', paddingLeft: 0 }}>
        <h2 className="card-title" style={{ fontSize: '1.75rem' }}>Organisations</h2>
        <p className="card-subtitle">Gérez les organisations et leurs abonnements</p>
      </div>

      <div className="card">
        <div className="flex gap-2 mb-3">
          <input
            className="form-input"
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Rechercher par nom, email ou ID..."
            style={{ flex: 1 }}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={search}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <span className="loading"></span>
                <span style={{ marginLeft: '0.5rem' }}>Recherche...</span>
              </span>
            ) : (
              'Rechercher'
            )}
          </button>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {items.length === 0 && !loading && !error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p>Aucune organisation trouvée</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Plan</th>
                  <th>Addons</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(o => (
                  <tr key={o.id}>
                    <td>
                      <code style={{
                        background: 'var(--bg-secondary)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8125rem',
                        fontFamily: 'monospace'
                      }}>
                        {o.id.substring(0, 8)}
                      </code>
                    </td>
                    <td style={{ fontWeight: 500 }}>{o.name}</td>
                    <td>
                      <span className="badge badge-secondary">{o.role}</span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>
                      {o.plan ? (
                        <span className="badge badge-info">{o.plan}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      {o.addons && o.addons.length > 0 ? (
                        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                          {o.addons.map((addon, idx) => (
                            <span key={idx} className="badge badge-secondary" style={{ fontSize: '0.6875rem' }}>
                              {addon}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <a href={`/orgs/${o.id}`} className="btn btn-sm btn-outline">
                        Ouvrir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {items.length} organisation{items.length > 1 ? 's' : ''} trouvée{items.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </>
  );
}
