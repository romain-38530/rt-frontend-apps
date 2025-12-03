import { useState } from 'react';

const AUTHZ_URL = process.env.NEXT_PUBLIC_AUTHZ_URL || 'https://ddaywxps9n701.cloudfront.net';

export default function Login() {
  const [email, setEmail] = useState('admin@example.com');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${AUTHZ_URL}/auth/admin/login`, { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ email, adminKey }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Login échoué');
      localStorage.setItem('admin_jwt', json.token);
      location.href = '/orgs';
    } catch (e: any) { setError(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      login();
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto' }}>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title" style={{ fontSize: '1.5rem' }}>SYMPHONI.A - Administration</h2>
          <p className="card-subtitle">L'IA qui orchestre vos flux transport.</p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Clé d'administration</label>
          <input
            className="form-input"
            type="password"
            placeholder="Entrez votre clé admin"
            value={adminKey}
            onChange={e=>setAdminKey(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={login}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? (
            <span className="flex items-center" style={{ justifyContent: 'center' }}>
              <span className="loading"></span>
              <span style={{ marginLeft: '0.5rem' }}>Connexion...</span>
            </span>
          ) : (
            'Se connecter'
          )}
        </button>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Besoin d'aide ? <a href={process.env.NEXT_PUBLIC_SUPPORT_URL || 'https://www.rt-technologie.com'} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 500 }}>Contactez le support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
