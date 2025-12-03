import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const ADMIN_GATEWAY = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://d2i50a1vlg138w.cloudfront.net';

const PLANS = [
  { value: 'INDUSTRY_BASE', label: 'Industrie — Base (499€)' },
  { value: 'TRANSPORTER_BASE', label: 'Transporteur — Base (499€)' },
];

const ADDONS = [
  { value: 'AFFRET_IA', label: 'Affret.IA' },
  { value: 'PREMIUM_MARKETPLACE', label: 'Premium Marketplace' },
];

export default function OrgDetail() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [org, setOrg] = useState<any>(null);
  const [pricing, setPricing] = useState<any>(null);
  const [features, setFeatures] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const headers: any = {};
        if (typeof window !== 'undefined') {
          const t = window.localStorage.getItem('admin_jwt');
          if (t) headers['authorization'] = `Bearer ${t}`;
        }
        const [oRes, pRes, fRes] = await Promise.all([
          fetch(`${ADMIN_GATEWAY}/admin/orgs/${id}`, { headers }),
          fetch(`${ADMIN_GATEWAY}/admin/pricing`, { headers }),
          fetch(`${ADMIN_GATEWAY}/admin/orgs/${id}/features`, { headers }),
        ]);
        setOrg(await oRes.json());
        setPricing(await pRes.json());
        const fJson = await fRes.json();
        setFeatures(fJson.features || []);
      } catch (e: any) { setError(e.message || 'Erreur réseau'); }
    })();
  }, [id]);

  const toggleAddon = (addon: string) => setOrg((o: any) => {
    const current = new Set(o.addons || []);
    if (current.has(addon)) current.delete(addon); else current.add(addon);
    return { ...o, addons: Array.from(current) };
  });

  const save = async () => {
    if (!id) return;
    setSaving(true); setError(null);
    try {
      const headers: any = { 'content-type': 'application/json' };
      if (typeof window !== 'undefined') {
        const t = window.localStorage.getItem('admin_jwt');
        if (t) headers['authorization'] = `Bearer ${t}`;
      }
      await fetch(`${ADMIN_GATEWAY}/admin/orgs/${id}/plan`, {
        method: 'POST', headers,
        body: JSON.stringify({ plan: org.plan, addons: org.addons || [] })
      });
      alert('Modifications enregistrées');
    } catch (e: any) { setError(e.message || 'Erreur réseau'); }
    finally { setSaving(false); }
  };

  if (!id) return <p>Chargement…</p>;
  if (!org || !pricing) return <p>Chargement…</p>;

  return (
    <main>
      <h2>Organisation {org.name} ({org.id})</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>Rôle: {org.role} — Statut: {org.status}</p>
      <div style={{ margin: '12px 0' }}>
        <label>Plan:&nbsp;
          <select value={org.plan || ''} onChange={(e)=>setOrg((o:any)=>({ ...o, plan: e.target.value }))}>
            <option value="">—</option>
            {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>
      <div>
        <h3>Modules complémentaires</h3>
        {ADDONS.map(a => (
          <label key={a.value} style={{ display: 'block' }}>
            <input type="checkbox" checked={(org.addons||[]).includes(a.value)} onChange={()=>toggleAddon(a.value)} />
            {a.label} {pricing?.addons?.[a.value]?.monthly ? `(+${pricing.addons[a.value].monthly} €)` : ''}
          </label>
        ))}
      </div>
      {features && (
        <div style={{ marginTop: 12 }}>
          <h3>Droits effectifs (plan+addons)</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {features.map(f => (
              <span key={f} style={{ background: '#eef', padding: '4px 8px', borderRadius: 6 }}>{f}</span>
            ))}
          </div>
          <p style={{ opacity: .7 }}>
            Note: les transporteurs invités héritent de ces droits pour les flux appartenant à cette organisation.
          </p>
        </div>
      )}
      <p style={{ marginTop: 12 }}>
        <a href={`/orgs/${org.id}/invitations`}>Gérer les invitations transporteurs →</a>
      </p>
      <button onClick={save} disabled={saving}>Enregistrer</button>
    </main>
  );
}
