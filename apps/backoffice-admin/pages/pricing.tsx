import { useEffect, useState } from 'react';

const ADMIN_GATEWAY = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'http://localhost:3008';

export default function Pricing() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${ADMIN_GATEWAY}/admin/pricing`);
        setData(await res.json());
      } catch (e: any) { setError(e.message || 'Erreur réseau'); }
    })();
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data) return <p>Chargement…</p>;

  return (
    <main>
      <h2>Tarifs (indicatifs)</h2>
      <h3>Plans</h3>
      <table border={1} cellPadding={6}>
        <thead><tr><th>Plan</th><th>Prix mensuel</th><th>Libellé</th></tr></thead>
        <tbody>
          {Object.entries<any>(data.plans || {}).map(([k, v]) => (
            <tr key={k}><td>{k}</td><td>{v.monthly} €</td><td>{v.label}</td></tr>
          ))}
        </tbody>
      </table>
      <h3>Addons</h3>
      <table border={1} cellPadding={6}>
        <thead><tr><th>Addon</th><th>Prix mensuel</th><th>Libellé</th></tr></thead>
        <tbody>
          {Object.entries<any>(data.addons || {}).map(([k, v]) => (
            <tr key={k}><td>{k}</td><td>{v.monthly} €</td><td>{v.label}</td></tr>
          ))}
        </tbody>
      </table>
      <p style={{ opacity: .7, marginTop: 8 }}>{data.notes}</p>
    </main>
  );
}
