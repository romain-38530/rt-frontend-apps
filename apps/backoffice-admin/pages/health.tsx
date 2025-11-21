import { useEffect, useState } from 'react';

const ADMIN_GATEWAY = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'http://localhost:3008';

export default function Health() {
  const [basic, setBasic] = useState<any>(null);
  const [full, setFull] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const headers: any = {};
        if (typeof window !== 'undefined') {
          const t = window.localStorage.getItem('admin_jwt');
          if (t) headers['authorization'] = `Bearer ${t}`;
        }
        const [b, f] = await Promise.all([
          fetch(`${ADMIN_GATEWAY}/admin/health`, { headers }).then(r=>r.json()),
          fetch(`${ADMIN_GATEWAY}/admin/health/full`, { headers }).then(r=>r.json()),
        ]);
        setBasic(b); setFull(f);
      } catch (e: any) { setError(e.message || 'Erreur réseau'); }
    })();
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!basic || !full) return <p>Chargement…</p>;

  return (
    <main>
      <h2>Etat des services</h2>
      <div style={{ marginBottom: 12 }}>
        <strong>Admin Gateway</strong>: Mongo: {String(basic.mongo)} — AWS: {String(basic.aws)}
      </div>
      <table border={1} cellPadding={6}>
        <thead><tr><th>Service</th><th>OK</th><th>Détails</th></tr></thead>
        <tbody>
          {Object.entries<any>(full.services || {}).map(([name, s]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{String(s.ok)}</td>
              <td><pre style={{ margin: 0 }}>{JSON.stringify(s, null, 2)}</pre></td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

