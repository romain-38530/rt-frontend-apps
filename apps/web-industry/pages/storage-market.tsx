import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getAuthToken } from '../lib/auth';

// Types
interface StorageNeed {
  needId: string;
  storageType: string;
  volume: { value: number; unit: string };
  duration: { value: number; unit: string };
  location: { country: string; region: string };
  constraints: { temperature: string; certifications: string[] };
  status: string;
  createdAt: string;
  rfp?: {
    original?: string;
    aiGenerated?: string;
    standardized?: string;
    generatedAt?: string;
  };
}

interface LogisticianResponse {
  responseId: string;
  logisticianName: string;
  proposedPrice: number;
  availability: string;
  message: string;
  status: string;
  aiAnalysis?: {
    overallScore: number;
    recommendation: string;
    strengths: string[];
    weaknesses: string[];
  };
}

interface NewNeedForm {
  storageType: string;
  volume: { value: number; unit: string };
  duration: { value: number; unit: string };
  location: { country: string; region: string; city?: string };
  constraints: {
    temperature: string;
    certifications: string[];
  };
}

const API_URL = process.env.NEXT_PUBLIC_STORAGE_MARKET_API_URL || 'http://rt-storage-market-prod.eba-6dcj6yvh.eu-central-1.elasticbeanstalk.com';

// Constants
const STORAGE_TYPES = [
  { value: 'LONG_TERM', label: 'Stockage long terme' },
  { value: 'SHORT_TERM', label: 'Stockage court terme' },
  { value: 'CROSS_DOCK', label: 'Cross-docking' },
  { value: 'PICKING', label: 'Picking / Preparation' },
  { value: 'TEMPERATURE_CONTROLLED', label: 'Temperature controlee' },
];

const TEMPERATURE_TYPES = [
  { value: 'AMBIENT', label: 'Ambiant' },
  { value: 'REFRIGERATED', label: 'Refrigere (0-4C)' },
  { value: 'FROZEN', label: 'Congele (-18C)' },
];

const CERTIFICATIONS = [
  { value: 'ISO_9001', label: 'ISO 9001' },
  { value: 'ISO_14001', label: 'ISO 14001' },
  { value: 'HACCP', label: 'HACCP' },
  { value: 'GDP', label: 'GDP Pharma' },
];

export default function StorageMarketPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'detail' | 'responses'>('list');
  const [needs, setNeeds] = useState<StorageNeed[]>([]);
  const [responses, setResponses] = useState<LogisticianResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedNeed, setSelectedNeed] = useState<StorageNeed | null>(null);

  // AI States
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [generatedRFP, setGeneratedRFP] = useState<string | null>(null);
  const [standardizedRFP, setStandardizedRFP] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [existingRFP, setExistingRFP] = useState('');

  // Form state
  const [newNeed, setNewNeed] = useState<NewNeedForm>({
    storageType: 'LONG_TERM',
    volume: { value: 500, unit: 'M2' },
    duration: { value: 12, unit: 'MONTHS' },
    location: { country: 'France', region: 'Ile-de-France' },
    constraints: {
      temperature: 'AMBIENT',
      certifications: [],
    },
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      fetchNeeds();
    }
  }, [router]);

  const fetchNeeds = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/needs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setNeeds(data.data?.needs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createNeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/needs/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newNeed),
      });
      if (!response.ok) throw new Error('Erreur lors de la creation');
      const data = await response.json();
      setSuccess('Besoin cree avec succes!');
      setActiveTab('list');
      fetchNeeds();
      if (data.data?.needId) {
        generateRFP(data.data.needId, newNeed);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const publishNeed = async (needId: string) => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/needs/${needId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicationType: 'GLOBAL_MARKET' }),
      });
      if (!response.ok) throw new Error('Erreur lors de la publication');
      setSuccess('Besoin publie sur la bourse!');
      fetchNeeds();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteNeed = async (needId: string) => {
    if (!confirm('Supprimer ce besoin?')) return;
    setLoading(true);
    try {
      const token = getAuthToken();
      await fetch(`${API_URL}/api/storage-market/needs/${needId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setSuccess('Besoin supprime');
      fetchNeeds();
      setActiveTab('list');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== AI FUNCTIONS ====================

  const generateRFP = async (needId: string, needDetails: any) => {
    setAiLoading('generate');
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/ai/generate-rfp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          needId,
          needDetails,
          companyContext: { name: 'Mon Entreprise', industry: 'Distribution' },
        }),
      });
      if (!response.ok) throw new Error('Erreur generation IA');
      const data = await response.json();
      setGeneratedRFP(data.data?.rfp || null);
      setSuccess('Cahier des charges genere par IA!');
      fetchNeeds();
    } catch (err: any) {
      setError(`Erreur IA: ${err.message}`);
    } finally {
      setAiLoading(null);
    }
  };

  const standardizeRFP = async (needId: string) => {
    if (!existingRFP.trim()) {
      setError('Veuillez entrer un cahier des charges existant');
      return;
    }
    setAiLoading('standardize');
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/ai/standardize-rfp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          needId,
          existingRFP,
          needDetails: selectedNeed,
        }),
      });
      if (!response.ok) throw new Error('Erreur standardisation IA');
      const data = await response.json();
      setStandardizedRFP(data.data?.rfp || null);
      setSuccess('Cahier des charges standardise par IA!');
      fetchNeeds();
    } catch (err: any) {
      setError(`Erreur IA: ${err.message}`);
    } finally {
      setAiLoading(null);
    }
  };

  const analyzeResponses = async (needId: string) => {
    setAiLoading('analyze');
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/ai/analyze-responses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ needId }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erreur analyse IA');
      }
      const data = await response.json();
      setAnalysisResult(data.data?.analysis || null);
      setSuccess('Analyse des reponses terminee!');
    } catch (err: any) {
      setError(`Erreur IA: ${err.message}`);
    } finally {
      setAiLoading(null);
    }
  };

  const suggestClarifications = async (responseId: string) => {
    setAiLoading('clarify');
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/ai/suggest-clarifications`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId }),
      });
      if (!response.ok) throw new Error('Erreur suggestions IA');
      const data = await response.json();
      setClarificationQuestions(data.data?.questions || []);
      setSuccess('Questions de clarification generees!');
    } catch (err: any) {
      setError(`Erreur IA: ${err.message}`);
    } finally {
      setAiLoading(null);
    }
  };

  const extractResponseData = async (responseId: string, rawResponse: string) => {
    setAiLoading('extract');
    setError(null);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/api/storage-market/ai/extract-response-data`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId,
          rawResponse,
          needContext: selectedNeed,
        }),
      });
      if (!response.ok) throw new Error('Erreur extraction IA');
      const data = await response.json();
      setSuccess('Donnees extraites avec succes!');
      return data.data?.extractedData;
    } catch (err: any) {
      setError(`Erreur IA: ${err.message}`);
    } finally {
      setAiLoading(null);
    }
  };

  const viewDetail = (need: StorageNeed) => {
    setSelectedNeed(need);
    setGeneratedRFP(need.rfp?.aiGenerated || null);
    setStandardizedRFP(need.rfp?.standardized || null);
    setExistingRFP('');
    setAnalysisResult(null);
    setClarificationQuestions([]);
    setActiveTab('detail');
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: '#fbbf24', text: '#000' },
      PUBLISHED: { bg: '#34d399', text: '#000' },
      CLOSED: { bg: '#6b7280', text: '#fff' },
      ATTRIBUTED: { bg: '#8b5cf6', text: '#fff' },
    };
    return colors[status] || { bg: '#6b7280', text: '#fff' };
  };

  return (
    <>
      <Head>
        <title>Bourse de Stockage IA - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
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
              <span style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>IA Claude</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['list', 'create'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                style={{
                  padding: '10px 20px',
                  background: activeTab === tab ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                {tab === 'list' ? 'Mes Besoins' : '+ Nouveau'}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        {error && <div style={errorStyle}>{error} <button onClick={() => setError(null)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>X</button></div>}
        {success && <div style={successStyle}>{success} <button onClick={() => setSuccess(null)} style={{ marginLeft: '10px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>X</button></div>}

        {/* Content */}
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>

          {/* LIST TAB */}
          {activeTab === 'list' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Mes besoins de stockage</h2>
                <button onClick={fetchNeeds} disabled={loading} style={btnStyle}>
                  {loading ? 'Chargement...' : 'Actualiser'}
                </button>
              </div>

              {needs.length === 0 ? (
                <EmptyState onAction={() => setActiveTab('create')} />
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {needs.map((need) => (
                    <NeedCard key={need.needId} need={need} onView={() => viewDetail(need)} getStatusBadge={getStatusBadge} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CREATE TAB */}
          {activeTab === 'create' && (
            <CreateNeedForm
              newNeed={newNeed}
              setNewNeed={setNewNeed}
              onCreate={createNeed}
              loading={loading}
            />
          )}

          {/* DETAIL TAB */}
          {activeTab === 'detail' && selectedNeed && (
            <div>
              <button onClick={() => setActiveTab('list')} style={{ ...btnStyle, marginBottom: '24px' }}>
                Retour a la liste
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left: Need Details + Actions */}
                <div>
                  <NeedDetailsCard
                    need={selectedNeed}
                    onPublish={() => publishNeed(selectedNeed.needId)}
                    onDelete={() => deleteNeed(selectedNeed.needId)}
                    onGenerateRFP={() => generateRFP(selectedNeed.needId, selectedNeed)}
                    onAnalyze={() => analyzeResponses(selectedNeed.needId)}
                    aiLoading={aiLoading}
                    getStatusBadge={getStatusBadge}
                  />

                  {/* Standardize RFP Section */}
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📝</span> Standardiser un CDC existant
                    </h3>
                    <textarea
                      value={existingRFP}
                      onChange={(e) => setExistingRFP(e.target.value)}
                      placeholder="Collez ici votre cahier des charges existant pour le standardiser..."
                      rows={6}
                      style={textareaStyle}
                    />
                    <button
                      onClick={() => standardizeRFP(selectedNeed.needId)}
                      disabled={aiLoading === 'standardize' || !existingRFP.trim()}
                      style={{ ...aiButtonStyle, marginTop: '12px', opacity: aiLoading === 'standardize' || !existingRFP.trim() ? 0.7 : 1 }}
                    >
                      {aiLoading === 'standardize' ? '🔄 Standardisation IA...' : '🤖 Standardiser avec IA'}
                    </button>
                  </div>
                </div>

                {/* Right: AI Results */}
                <div>
                  {/* Generated RFP */}
                  {(generatedRFP || aiLoading === 'generate') && (
                    <AIResultCard
                      title="Cahier des Charges IA"
                      icon="📄"
                      loading={aiLoading === 'generate'}
                      content={generatedRFP}
                    />
                  )}

                  {/* Standardized RFP */}
                  {(standardizedRFP || aiLoading === 'standardize') && (
                    <AIResultCard
                      title="CDC Standardise"
                      icon="✨"
                      loading={aiLoading === 'standardize'}
                      content={standardizedRFP}
                    />
                  )}

                  {/* Analysis Results */}
                  {(analysisResult || aiLoading === 'analyze') && (
                    <div style={cardStyle}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📊</span> Analyse IA des Reponses
                      </h3>
                      {aiLoading === 'analyze' ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>🔄 Analyse en cours...</div>
                      ) : analysisResult ? (
                        <div>
                          <div style={{ marginBottom: '16px' }}>
                            <strong>Synthese:</strong>
                            <p style={{ opacity: 0.8, marginTop: '8px' }}>{analysisResult.summary}</p>
                          </div>
                          {analysisResult.ranking && (
                            <div>
                              <strong>Classement:</strong>
                              {analysisResult.ranking.map((r: any, i: number) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>#{i + 1} {r.logisticianName || `Logisticien ${r.logisticianId}`}</span>
                                    <span style={{ color: '#34d399', fontWeight: '700' }}>{r.overallScore}/100</span>
                                  </div>
                                  <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>{r.recommendation}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ opacity: 0.6 }}>Aucune reponse a analyser</div>
                      )}
                    </div>
                  )}

                  {/* Clarification Questions */}
                  {clarificationQuestions.length > 0 && (
                    <div style={cardStyle}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>❓</span> Questions de Clarification IA
                      </h3>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {clarificationQuestions.map((q, i) => (
                          <li key={i} style={{ marginBottom: '8px', opacity: 0.9 }}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ==================== COMPONENTS ====================

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
  marginBottom: '16px',
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

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.1)',
  color: 'white',
  fontSize: '14px',
  resize: 'vertical',
};

const aiButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  border: 'none',
  borderRadius: '8px',
  color: 'white',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '14px',
};

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div style={{ ...cardStyle, padding: '60px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
      <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Aucun besoin de stockage</h3>
      <p style={{ opacity: 0.7, marginBottom: '24px' }}>Creez votre premier besoin pour recevoir des offres</p>
      <button onClick={onAction} style={aiButtonStyle}>Creer un besoin</button>
    </div>
  );
}

function NeedCard({ need, onView, getStatusBadge }: { need: any; onView: () => void; getStatusBadge: (s: string) => any }) {
  const status = getStatusBadge(need.status);
  return (
    <div
      onClick={onView}
      style={{
        ...cardStyle,
        marginBottom: 0,
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
        gap: '20px',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <div>
        <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
          {STORAGE_TYPES.find(t => t.value === need.storageType)?.label || need.storageType}
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
        <span style={{ padding: '4px 12px', background: status.bg, color: status.text, borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
          {need.status}
        </span>
      </div>
      <div style={{ textAlign: 'center' }}>
        {need.rfp?.aiGenerated ? <span style={{ color: '#34d399' }}>🤖 CDC IA</span> : <span style={{ opacity: 0.5 }}>-</span>}
      </div>
    </div>
  );
}

function NeedDetailsCard({ need, onPublish, onDelete, onGenerateRFP, onAnalyze, aiLoading, getStatusBadge }: any) {
  const status = getStatusBadge(need.status);
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Details du besoin</h3>
      <InfoRow label="Reference" value={need.needId} />
      <InfoRow label="Type" value={STORAGE_TYPES.find(t => t.value === need.storageType)?.label} />
      <InfoRow label="Surface" value={`${need.volume?.value} ${need.volume?.unit}`} />
      <InfoRow label="Localisation" value={`${need.location?.region}, ${need.location?.country}`} />
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', opacity: 0.6 }}>Statut</div>
        <span style={{ padding: '4px 12px', background: status.bg, color: status.text, borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
          {need.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '20px' }}>
        {need.status === 'DRAFT' && (
          <>
            <button onClick={onPublish} style={{ ...aiButtonStyle, background: '#34d399' }}>Publier</button>
            <button onClick={onDelete} style={{ ...btnStyle, background: 'rgba(239,68,68,0.3)' }}>Supprimer</button>
          </>
        )}
        <button onClick={onGenerateRFP} disabled={aiLoading === 'generate'} style={aiButtonStyle}>
          {aiLoading === 'generate' ? '🔄...' : '🤖 Generer CDC'}
        </button>
        <button onClick={onAnalyze} disabled={aiLoading === 'analyze'} style={aiButtonStyle}>
          {aiLoading === 'analyze' ? '🔄...' : '📊 Analyser Reponses'}
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

function AIResultCard({ title, icon, loading, content }: { title: string; icon: string; loading: boolean; content: string | null }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{icon}</span> {title}
      </h3>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
          <div>Claude genere le contenu...</div>
        </div>
      ) : content ? (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          padding: '16px',
          whiteSpace: 'pre-wrap',
          fontSize: '14px',
          lineHeight: '1.6',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {content}
        </div>
      ) : (
        <div style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>Aucun contenu genere</div>
      )}
    </div>
  );
}

function CreateNeedForm({ newNeed, setNewNeed, onCreate, loading }: any) {
  return (
    <div style={{ ...cardStyle, maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Nouveau besoin de stockage</h2>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Type de stockage</label>
        <select
          value={newNeed.storageType}
          onChange={(e) => setNewNeed({ ...newNeed, storageType: e.target.value })}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
        >
          {STORAGE_TYPES.map(type => (
            <option key={type.value} value={type.value} style={{ background: '#1a1a2e' }}>{type.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Surface (m2)</label>
          <input
            type="number"
            value={newNeed.volume.value}
            onChange={(e) => setNewNeed({ ...newNeed, volume: { ...newNeed.volume, value: parseInt(e.target.value) } })}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Duree (mois)</label>
          <input
            type="number"
            value={newNeed.duration.value}
            onChange={(e) => setNewNeed({ ...newNeed, duration: { ...newNeed.duration, value: parseInt(e.target.value) } })}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Pays</label>
          <input
            type="text"
            value={newNeed.location.country}
            onChange={(e) => setNewNeed({ ...newNeed, location: { ...newNeed.location, country: e.target.value } })}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Region</label>
          <input
            type="text"
            value={newNeed.location.region}
            onChange={(e) => setNewNeed({ ...newNeed, location: { ...newNeed.location, region: e.target.value } })}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Temperature</label>
        <select
          value={newNeed.constraints.temperature}
          onChange={(e) => setNewNeed({ ...newNeed, constraints: { ...newNeed.constraints, temperature: e.target.value } })}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '16px' }}
        >
          {TEMPERATURE_TYPES.map(type => (
            <option key={type.value} value={type.value} style={{ background: '#1a1a2e' }}>{type.label}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Certifications requises</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CERTIFICATIONS.map(cert => (
            <button
              key={cert.value}
              type="button"
              onClick={() => {
                const certs = newNeed.constraints.certifications;
                const newCerts = certs.includes(cert.value) ? certs.filter((c: string) => c !== cert.value) : [...certs, cert.value];
                setNewNeed({ ...newNeed, constraints: { ...newNeed.constraints, certifications: newCerts } });
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: newNeed.constraints.certifications.includes(cert.value) ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'rgba(255,255,255,0.1)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {cert.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={onCreate} disabled={loading} style={{ ...aiButtonStyle, fontSize: '18px', padding: '16px', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Creation en cours...' : '🤖 Creer et generer CDC avec IA'}
      </button>
    </div>
  );
}
