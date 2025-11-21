import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

const ADMIN_GATEWAY = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'http://localhost:3008';

type Carrier = { id: string; name: string; email?: string|null; blocked: boolean };

export default function InvitationsPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [invited, setInvited] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCid, setNewCid] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const headers: any = {};
      if (typeof window !== 'undefined') {
        const t = window.localStorage.getItem('admin_jwt');
        if (t) headers['authorization'] = `Bearer ${t}`;
      }
      const res = await fetch(`${ADMIN_GATEWAY}/admin/orgs/${id}/invitations`, { headers });
      const json = await res.json();
      setInvited(json.invitedCarriers || []);
    } catch (e: any) { setError(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => { (async () => {
    try {
      const headers: any = {};
      if (typeof window !== 'undefined') {
        const t = window.localStorage.getItem('admin_jwt');
        if (t) headers['authorization'] = `Bearer ${t}`;
      }
      const res = await fetch(`${ADMIN_GATEWAY}/admin/carriers`, { headers });
      const json = await res.json();
      setCatalog(json.items || []);
    } catch { /* ignore */ }
  })(); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const filteredCatalog = useMemo(() => {
    if (!debouncedSearch) return catalog;
    return catalog.filter(c => (
      c.id.toLowerCase().includes(debouncedSearch) ||
      (c.name || '').toLowerCase().includes(debouncedSearch) ||
      (c.email || '').toLowerCase().includes(debouncedSearch)
    ));
  }, [catalog, debouncedSearch]);

  const addCarrier = (cid: string) => {
    cid = cid.trim(); if (!cid) return;
    setInvited((list) => (list.includes(cid) ? list : [...list, cid]));
  };
  const removeCarrier = (cid: string) => setInvited((list) => list.filter((x) => x !== cid));

  const save = async () => {
    if (!id) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      const headers: any = { 'content-type': 'application/json' };
      if (typeof window !== 'undefined') {
        const t = window.localStorage.getItem('admin_jwt');
        if (t) headers['authorization'] = `Bearer ${t}`;
      }
      await fetch(`${ADMIN_GATEWAY}/admin/orgs/${id}/invitations`, {
        method: 'POST', headers,
        body: JSON.stringify({ invitedCarriers: invited })
      });
      setSuccess('Invitations mises à jour');
    } catch (e: any) { setError(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
  };

  const applyToFlows = async () => {
    if (!id) return;
    setLoading(true); setError(null); setSuccess(null);
    try {
      const headers: any = {};
      if (typeof window !== 'undefined') {
        const t = window.localStorage.getItem('admin_jwt');
        if (t) headers['authorization'] = `Bearer ${t}`;
      }
      await fetch(`${ADMIN_GATEWAY}/admin/orgs/${id}/invitations/apply`, { method: 'POST', headers });
      setSuccess('Invitations appliquées aux flux existants (stub)');
    } catch (e: any) { setError(e.message || 'Erreur réseau'); }
    finally { setLoading(false); }
  };

  if (!id) return <p>Chargement…</p>;

  return (
    <main>
      <h2>Invitations transporteurs — Org {id}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input list="carrier-suggestions" value={newCid} onChange={(e)=>setNewCid(e.target.value)} placeholder="ID transporteur (ex: B)" />
        <datalist id="carrier-suggestions">
          {catalog.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </datalist>
        <button onClick={()=>{ addCarrier(newCid); setNewCid(''); }} disabled={loading}>Ajouter</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <strong>Suggestions:</strong>
        <div style={{ margin: '8px 0' }}>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Filtrer par id/nom/email" />
        </div>
        <ul>
          {filteredCatalog.filter(c => !invited.includes(c.id)).slice(0,12).map(c => (
            <li key={c.id}>
              {c.id} — {c.name} {c.email ? `(${c.email})` : ''} {c.blocked ? '— bloqué vigilance' : ''}
              <button style={{ marginLeft: 8 }} onClick={()=>addCarrier(c.id)} disabled={loading}>Ajouter</button>
            </li>
          ))}
        </ul>
      </div>

      <h3>Transporteurs invités</h3>
      <ul>
        {invited.map((cid) => (
          <li key={cid}>
            {cid} <button onClick={()=>removeCarrier(cid)} disabled={loading}>Retirer</button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={loading}>Enregistrer</button>
        <button onClick={applyToFlows} disabled={loading}>Appliquer aux flux existants</button>
      </div>

      <p style={{ marginTop: 12 }}>
        <a href={`/orgs/${id}`}>← Retour organisation</a>
      </p>
    </main>
  );
}
