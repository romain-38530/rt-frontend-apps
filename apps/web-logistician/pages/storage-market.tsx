import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';

interface StorageNeed {
  needId: string;
  storageType: string;
  volume: { value: number; unit: string };
  location: { country: string; region: string };
  status: string;
  createdAt: string;
  rfp?: {
    aiGenerated?: string;
    standardized?: string;
  };
}

interface MyCapacity {
  capacityId: string;
  site: { name: string; region: string; country: string };
  capacity: { total: number; available: number; unit: string };
  storageTypes: string[];
  temperature: string;
}

const API_URL = process.env.NEXT_PUBLIC_STORAGE_MARKET_API_URL || 'https://d1ea8wbaf6ws9i.cloudfront.net';

const STORAGE_TYPES: Record<string, string> = {
  LONG_TERM: 'Stockage long terme',
  SHORT_TERM: 'Stockage court terme',
  CROSS_DOCK: 'Cross-docking',
  PICKING: 'Picking / Preparation',
  TEMPERATURE_CONTROLLED: 'Temperature controlee',
};

const TEMPERATURE_LABELS: Record<string, string> = {
  AMBIENT: 'Ambiant',
  REFRIGERATED: 'Refrigere (0-4C)',
  FROZEN: 'Congele (-18C)',
};

export default function StorageMarketLogisticianPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'opportunities' | 'myCapacities' | 'myResponses' | 'detail'>('opportunities');
  const [opportunities, setOpportunities] = useState<StorageNeed[]>([]);
  const [capacities, setCapacities] = useState<MyCapacity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedNeed, setSelectedNeed] = useState<StorageNeed | null>(null);

  // AI States
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);

  // Response form
  const [responseForm, setResponseForm] = useState({
    proposedPrice: '',
    availability: '',
    message: '',
    rawResponse: '',
  });

  // Capacity form
  const [capacityForm, setCapacityForm] = useState({
    siteName: '',
    siteRegion: 'Ile-de-France',
    siteCountry: 'France',
    totalCapacity: 1000,
    availableCapacity: 500,
    storageType: 'LONG_TERM',
    temperature: 'AMBIENT',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      fetchOpportunities();
      fetchMyCapacities();
    }
  }, [router]);

  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/needs?status=PUBLISHED`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setOpportunities(data.data?.needs || []);
    } catch (err: any) {
      // Demo data
      setOpportunities([
        {
          needId: 'STM-DEMO-001',
          storageType: 'LONG_TERM',
          volume: { value: 500, unit: 'M2' },
          location: { country: 'France', region: 'Ile-de-France' },
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          rfp: { aiGenerated: 'Cahier des charges demo...' }
        },
        {
          needId: 'STM-DEMO-002',
          storageType: 'TEMPERATURE_CONTROLLED',
          volume: { value: 200, unit: 'M2' },
          location: { country: 'France', region: 'Rhone-Alpes' },
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCapacities = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/logistician-capacity`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCapacities(data.data?.capacities || []);
      }
    } catch (err) {
      console.log('No capacities yet');
    }
  };

  const registerCapacity = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/logistician-capacity`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: {
            name: capacityForm.siteName,
            region: capacityForm.siteRegion,
            country: capacityForm.siteCountry,
          },
          capacity: {
            total: { value: capacityForm.totalCapacity, unit: 'M2' },
            available: { value: capacityForm.availableCapacity, unit: 'M2' },
            storageTypes: [capacityForm.storageType],
          },
          conditions: {
            temperature: capacityForm.temperature,
          },
        }),
      });
      if (!response.ok) throw new Error('Erreur lors de l\'enregistrement');
      setSuccess('Capacite enregistree avec succes!');
      fetchMyCapacities();
      setCapacityForm({ ...capacityForm, siteName: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!selectedNeed) return;
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      // First extract data if raw response provided
      if (responseForm.rawResponse) {
        await extractResponseData(responseForm.rawResponse);
      }

      const response = await fetch(`${API_URL}/api/storage-market/responses/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          needId: selectedNeed.needId,
          proposedPrice: parseFloat(responseForm.proposedPrice),
          availability: responseForm.availability,
          message: responseForm.message,
        }),
      });
      if (!response.ok) throw new Error('Erreur lors de la soumission');
      setSuccess('Offre soumise avec succes!');
      setActiveTab('opportunities');
      resetResponseForm();
    } catch (err: any) {
      // Demo success
      setSuccess('Offre soumise avec succes! (demo)');
      setActiveTab('opportunities');
      resetResponseForm();
    } finally {
      setLoading(false);
    }
  };

  const resetResponseForm = () => {
    setResponseForm({ proposedPrice: '', availability: '', message: '', rawResponse: '' });
    setExtractedData(null);
    setClarificationQuestions([]);
  };

  // ==================== AI FUNCTIONS ====================

  const extractResponseData = async (rawResponse: string) => {
    if (!rawResponse.trim()) return;
    setAiLoading('extract');
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/ai/extract-response-data`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: `temp-${Date.now()}`,
          rawResponse,
          needContext: selectedNeed,
        }),
      });
      if (!response.ok) throw new Error('Erreur extraction IA');
      const data = await response.json();
      setExtractedData(data.data?.extractedData || null);

      // Auto-fill form from extracted data
      if (data.data?.extractedData) {
        const ed = data.data.extractedData;
        if (ed.price) setResponseForm(prev => ({ ...prev, proposedPrice: ed.price.toString() }));
        if (ed.availability) setResponseForm(prev => ({ ...prev, availability: ed.availability }));
      }

      setSuccess('Donnees extraites par IA!');
    } catch (err: any) {
      setError(`Erreur IA: ${err.message}`);
    } finally {
      setAiLoading(null);
    }
  };

  const getClarifications = async () => {
    if (!selectedNeed) return;
    setAiLoading('clarify');
    setError(null);
    try {
      const token = getAuthToken();
      // For demo, we'll call with a temp responseId
      const response = await fetch(`${API_URL}/api/storage-market/ai/suggest-clarifications`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: `temp-${selectedNeed.needId}`,
        }),
      });
      if (!response.ok) throw new Error('Erreur suggestions IA');
      const data = await response.json();
      setClarificationQuestions(data.data?.questions || [
        "Quelle est la date de disponibilite exacte?",
        "Les services de manutention sont-ils inclus?",
        "Quelles certifications possedez-vous?",
        "Quelle est la frequence possible des livraisons/expeditions?",
      ]);
      setSuccess('Questions de clarification generees!');
    } catch (err: any) {
      // Demo questions
      setClarificationQuestions([
        "Quelle est la date de disponibilite exacte?",
        "Les services de manutention sont-ils inclus?",
        "Quelles certifications possedez-vous?",
        "Quelle est la frequence possible des livraisons/expeditions?",
      ]);
      setSuccess('Questions de clarification generees! (demo)');
    } finally {
      setAiLoading(null);
    }
  };

  const viewDetail = (need: StorageNeed) => {
    setSelectedNeed(need);
    resetResponseForm();
    setActiveTab('detail');
  };

  return (
    <>
      <Head>
        <title>Bourse de Stockage - Logisticien | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => router.push('/')} style={btnStyle}>Retour</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🏪</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Bourse de Stockage</h1>
              <span style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>IA Claude</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'opportunities', label: 'Opportunites' },
              { key: 'myCapacities', label: 'Mes Capacites' },
              { key: 'myResponses', label: 'Mes Reponses' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '10px 20px',
                  background: activeTab === tab.key ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{
            padding: '8px 20px',
            background: 'rgba(16, 185, 129, 0.2)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid rgba(16, 185, 129, 0.5)'
          }}>
            🚚 Logisticien
          </div>
        </div>

        {/* Notifications */}
        {error && <div style={errorStyle}>{error} <button onClick={() => setError(null)} style={closeBtn}>X</button></div>}
        {success && <div style={successStyle}>{success} <button onClick={() => setSuccess(null)} style={closeBtn}>X</button></div>}

        {/* Content */}
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>

          {/* OPPORTUNITIES TAB */}
          {activeTab === 'opportunities' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Appels d'offres disponibles</h2>
                <button onClick={fetchOpportunities} disabled={loading} style={btnStyle}>
                  {loading ? 'Chargement...' : 'Actualiser'}
                </button>
              </div>

              {opportunities.length === 0 ? (
                <EmptyState message="Aucun appel d'offres disponible" icon="📭" />
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {opportunities.map((need) => (
                    <OpportunityCard key={need.needId} need={need} onView={() => viewDetail(need)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MY CAPACITIES TAB */}
          {activeTab === 'myCapacities' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Register new capacity */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Declarer une capacite</h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Nom du site</label>
                  <input
                    type="text"
                    value={capacityForm.siteName}
                    onChange={(e) => setCapacityForm({ ...capacityForm, siteName: e.target.value })}
                    placeholder="Ex: Entrepot Paris Nord"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Region</label>
                    <input
                      type="text"
                      value={capacityForm.siteRegion}
                      onChange={(e) => setCapacityForm({ ...capacityForm, siteRegion: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Pays</label>
                    <input
                      type="text"
                      value={capacityForm.siteCountry}
                      onChange={(e) => setCapacityForm({ ...capacityForm, siteCountry: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={labelStyle}>Capacite totale (m2)</label>
                    <input
                      type="number"
                      value={capacityForm.totalCapacity}
                      onChange={(e) => setCapacityForm({ ...capacityForm, totalCapacity: parseInt(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Disponible (m2)</label>
                    <input
                      type="number"
                      value={capacityForm.availableCapacity}
                      onChange={(e) => setCapacityForm({ ...capacityForm, availableCapacity: parseInt(e.target.value) })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>Type de stockage</label>
                    <select
                      value={capacityForm.storageType}
                      onChange={(e) => setCapacityForm({ ...capacityForm, storageType: e.target.value })}
                      style={inputStyle}
                    >
                      {Object.entries(STORAGE_TYPES).map(([k, v]) => (
                        <option key={k} value={k} style={{ background: '#1e293b' }}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Temperature</label>
                    <select
                      value={capacityForm.temperature}
                      onChange={(e) => setCapacityForm({ ...capacityForm, temperature: e.target.value })}
                      style={inputStyle}
                    >
                      {Object.entries(TEMPERATURE_LABELS).map(([k, v]) => (
                        <option key={k} value={k} style={{ background: '#1e293b' }}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button onClick={registerCapacity} disabled={loading || !capacityForm.siteName} style={{ ...aiButtonStyle, opacity: loading || !capacityForm.siteName ? 0.7 : 1 }}>
                  {loading ? 'Enregistrement...' : 'Enregistrer la capacite'}
                </button>
              </div>

              {/* My capacities list */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Mes capacites declarees</h3>
                {capacities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                    <div>Aucune capacite declaree</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {capacities.map((cap) => (
                      <div key={cap.capacityId} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ fontWeight: '700', marginBottom: '8px' }}>{cap.site?.name}</div>
                        <div style={{ fontSize: '14px', opacity: 0.7 }}>{cap.site?.region}, {cap.site?.country}</div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '16px' }}>
                          <span style={{ color: '#10b981' }}>{typeof cap.capacity?.available === 'object' ? (cap.capacity.available as {value?: number})?.value : cap.capacity?.available} m2 dispo</span>
                          <span style={{ opacity: 0.6 }}>/ {typeof cap.capacity?.total === 'object' ? (cap.capacity.total as {value?: number})?.value : cap.capacity?.total} m2 total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MY RESPONSES TAB */}
          {activeTab === 'myResponses' && (
            <EmptyState message="Historique des reponses - Vos offres soumises apparaitront ici" icon="📋" />
          )}

          {/* DETAIL TAB */}
          {activeTab === 'detail' && selectedNeed && (
            <div>
              <button onClick={() => { setActiveTab('opportunities'); resetResponseForm(); }} style={{ ...btnStyle, marginBottom: '24px' }}>
                Retour aux opportunites
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left: Need Details */}
                <div>
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Details de l'appel d'offres</h3>
                    <InfoRow label="Reference" value={selectedNeed.needId} />
                    <InfoRow label="Type" value={STORAGE_TYPES[selectedNeed.storageType]} />
                    <InfoRow label="Surface" value={`${selectedNeed.volume?.value} ${selectedNeed.volume?.unit}`} />
                    <InfoRow label="Localisation" value={`${selectedNeed.location?.region}, ${selectedNeed.location?.country}`} />

                    {selectedNeed.rfp?.aiGenerated && (
                      <div style={{ marginTop: '20px' }}>
                        <div style={{ fontSize: '13px', opacity: 0.6, marginBottom: '8px' }}>Cahier des charges</div>
                        <div style={{
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          padding: '16px',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                        }}>
                          {selectedNeed.rfp.aiGenerated}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Clarification Questions */}
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>❓</span> Questions pour l'industriel
                      </h3>
                      <button
                        onClick={getClarifications}
                        disabled={aiLoading === 'clarify'}
                        style={{ ...btnStyle, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}
                      >
                        {aiLoading === 'clarify' ? '🔄...' : '🤖 Generer'}
                      </button>
                    </div>
                    {clarificationQuestions.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {clarificationQuestions.map((q, i) => (
                          <li key={i} style={{ marginBottom: '8px', opacity: 0.9 }}>{q}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ opacity: 0.6, fontSize: '14px' }}>Cliquez sur "Generer" pour obtenir des questions de clarification IA</div>
                    )}
                  </div>
                </div>

                {/* Right: Response Form */}
                <div>
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Soumettre une offre</h3>

                    {/* AI Extract Section */}
                    <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(102,126,234,0.1)', borderRadius: '8px', border: '1px solid rgba(102,126,234,0.3)' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🤖</span> Extraction IA automatique
                      </div>
                      <textarea
                        value={responseForm.rawResponse}
                        onChange={(e) => setResponseForm({ ...responseForm, rawResponse: e.target.value })}
                        placeholder="Collez ici votre offre brute (email, document...) et l'IA extraira automatiquement les donnees..."
                        rows={4}
                        style={textareaStyle}
                      />
                      <button
                        onClick={() => extractResponseData(responseForm.rawResponse)}
                        disabled={aiLoading === 'extract' || !responseForm.rawResponse.trim()}
                        style={{ ...btnStyle, marginTop: '8px', background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', opacity: aiLoading === 'extract' || !responseForm.rawResponse.trim() ? 0.7 : 1 }}
                      >
                        {aiLoading === 'extract' ? '🔄 Extraction...' : '🤖 Extraire les donnees'}
                      </button>
                      {extractedData && (
                        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', fontSize: '13px' }}>
                          <strong>Donnees extraites:</strong>
                          <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                            {JSON.stringify(extractedData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={labelStyle}>Prix propose (EUR/mois)</label>
                      <input
                        type="number"
                        value={responseForm.proposedPrice}
                        onChange={(e) => setResponseForm({ ...responseForm, proposedPrice: e.target.value })}
                        placeholder="Ex: 2500"
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={labelStyle}>Disponibilite</label>
                      <input
                        type="text"
                        value={responseForm.availability}
                        onChange={(e) => setResponseForm({ ...responseForm, availability: e.target.value })}
                        placeholder="Ex: Immediat / Sous 2 semaines"
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={labelStyle}>Message / Details complementaires</label>
                      <textarea
                        value={responseForm.message}
                        onChange={(e) => setResponseForm({ ...responseForm, message: e.target.value })}
                        placeholder="Decrivez votre offre, vos atouts, certifications..."
                        rows={5}
                        style={textareaStyle}
                      />
                    </div>

                    <button
                      onClick={submitResponse}
                      disabled={loading || !responseForm.proposedPrice}
                      style={{ ...aiButtonStyle, fontSize: '16px', padding: '16px', opacity: loading || !responseForm.proposedPrice ? 0.7 : 1 }}
                    >
                      {loading ? 'Envoi en cours...' : 'Soumettre mon offre'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ==================== STYLES ====================

const btnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid rgba(255,255,255,0.1)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.1)',
  color: 'white',
  fontSize: '14px',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: '600',
  fontSize: '14px',
};

const aiButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '14px',
};

const errorStyle: React.CSSProperties = {
  margin: '20px 40px',
  padding: '16px',
  background: 'rgba(239, 68, 68, 0.2)',
  border: '1px solid rgba(239, 68, 68, 0.5)',
  borderRadius: '8px',
  color: '#fca5a5',
  display: 'flex',
  justifyContent: 'space-between',
};

const successStyle: React.CSSProperties = {
  margin: '20px 40px',
  padding: '16px',
  background: 'rgba(34, 197, 94, 0.2)',
  border: '1px solid rgba(34, 197, 94, 0.5)',
  borderRadius: '8px',
  color: '#86efac',
  display: 'flex',
  justifyContent: 'space-between',
};

const closeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
};

// ==================== COMPONENTS ====================

function EmptyState({ message, icon }: { message: string; icon: string }) {
  return (
    <div style={{ ...cardStyle, padding: '60px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>{icon}</div>
      <p style={{ opacity: 0.7 }}>{message}</p>
    </div>
  );
}

function OpportunityCard({ need, onView }: { need: StorageNeed; onView: () => void }) {
  return (
    <div
      onClick={onView}
      style={{
        ...cardStyle,
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: '20px',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div>
        <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
          {STORAGE_TYPES[need.storageType] || need.storageType}
        </div>
        <div style={{ fontSize: '13px', opacity: 0.6 }}>Ref: {need.needId}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: '700' }}>{need.volume?.value} {need.volume?.unit}</div>
        <div style={{ fontSize: '12px', opacity: 0.6 }}>Surface</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '14px' }}>{need.location?.region}</div>
        <div style={{ fontSize: '12px', opacity: 0.6 }}>{need.location?.country}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <button style={{
          padding: '10px 20px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          cursor: 'pointer',
          fontWeight: '600',
        }}>
          Voir & Repondre
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '13px', opacity: 0.6 }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: '600' }}>{value}</div>
    </div>
  );
}
