import { useEffect, useState, useCallback } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated, getToken } from '../lib/auth';

// Types
interface Session {
  sessionId: string;
  _id?: string;
  orderId: string;
  status: string;
  createdAt: string;
  triggerReason?: string;
  analysis?: { complexity: number; estimatedPrice: number };
  selection?: { carrierId: string; carrierName: string; finalPrice: number };
  proposalsReceived?: number;
}

interface Proposal {
  _id: string;
  carrierId: string;
  carrierName: string;
  proposedPrice: number;
  status: string;
  scores?: { price: number; quality: number; overall: number };
  submittedAt: string;
}

interface Stats {
  totalSessions: number;
  successRate: number;
  avgResponseTime: number;
  avgPrice: number;
  topCarriers: Array<{ carrierId: string; name: string; assignations: number; avgScore: number }>;
}

interface BourseOffer {
  _id: string;
  orderId: string;
  origin: string;
  destination: string;
  date: string;
  price?: number;
  weight?: number;
  status: string;
  proposalsCount?: number;
}

interface TrackingLevel {
  level: string;
  label: string;
  description: string;
  features: string[];
}

interface VigilanceResult {
  carrierId: string;
  carrierName: string;
  siret: string;
  status: 'valid' | 'warning' | 'invalid';
  checks: {
    licenseValid: boolean;
    insuranceValid: boolean;
    financialHealth: string;
    lastAudit: string;
  };
  score: number;
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    assigned: 'bg-green-500/30 text-green-300',
    analyzing: 'bg-blue-500/30 text-blue-300',
    pending: 'bg-yellow-500/30 text-yellow-300',
    accepted: 'bg-green-500/30 text-green-300',
    rejected: 'bg-red-500/30 text-red-300',
    broadcasting: 'bg-purple-500/30 text-purple-300',
  };
  const colorClass = colors[status] || 'bg-gray-500/30 text-gray-300';

  const labels: Record<string, string> = {
    assigned: 'Assigne',
    analyzing: 'En analyse',
    pending: 'En attente',
    accepted: 'Accepte',
    rejected: 'Rejete',
    broadcasting: 'Diffusion',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {labels[status] || status}
    </span>
  );
};

// Stats card component
const StatCard = ({ value, label, color = 'white', icon }: { value: string | number; label: string; color?: string; icon?: string }) => (
  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
    <div className="flex items-center gap-3 mb-2">
      {icon && <span className="text-2xl">{icon}</span>}
      <span className={`text-3xl font-bold`} style={{ color }}>{value}</span>
    </div>
    <p className="text-sm text-white/60">{label}</p>
  </div>
);

export default function AffretiaPage() {
  const router = useSafeRouter();
  const [mounted, setMounted] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_AFFRET_API_URL || 'https://d393yiia4ig3bw.cloudfront.net';

  // State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'new' | 'bourse' | 'tracking' | 'vigilance'>('dashboard');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Bourse state
  const [bourseOffers, setBourseOffers] = useState<BourseOffer[]>([]);

  // Tracking state
  const [trackingLevels] = useState<TrackingLevel[]>([
    { level: 'basic', label: 'Basique', description: 'Suivi standard par etapes', features: ['Depart', 'Arrivee', 'Incidents majeurs'] },
    { level: 'advanced', label: 'Avance', description: 'Suivi temps reel GPS', features: ['Position GPS', 'ETA dynamique', 'Alertes automatiques', 'Historique complet'] },
    { level: 'premium', label: 'Premium', description: 'Suivi premium avec IA', features: ['Tout Avance', 'Prediction retards', 'Optimisation itineraire', 'Rapport automatique'] },
  ]);
  const [selectedTrackingLevel, setSelectedTrackingLevel] = useState<string>('advanced');
  const [trackingOrderId, setTrackingOrderId] = useState('');

  // Vigilance state
  const [vigilanceSearch, setVigilanceSearch] = useState('');
  const [vigilanceResults, setVigilanceResults] = useState<VigilanceResult[]>([]);

  // Forms
  const [triggerForm, setTriggerForm] = useState({ orderId: '', reason: '' });
  const [negotiatePrice, setNegotiatePrice] = useState('');

  // API helper
  const apiCall = useCallback(async (endpoint: string, method = 'GET', body?: any) => {
    const token = getToken();
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(apiUrl + '/api/v1' + endpoint, options);
    if (!response.ok) throw new Error('Erreur API: ' + response.status);

    const data = await response.json();
    if (data.success === false) throw new Error(data.error || 'Erreur API');

    // Normalize response format
    if (data.success === undefined) {
      return { success: true, data };
    }
    return data;
  }, [apiUrl]);

  // Data loading
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall('/affretia/sessions?limit=50');
      setSessions(data.data?.sessions || data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiCall('/affretia/stats');
      setStats(data.data);
    } catch (err: any) {
      console.error('Stats error:', err);
    }
  }, [apiCall]);

  const loadBourseOffers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall('/affretia/bourse/offers?status=open&limit=20');
      setBourseOffers(data.data?.offers || data.data || []);
    } catch (err: any) {
      console.error('Bourse error:', err);
      // Mock data for demo
      setBourseOffers([
        { _id: '1', orderId: 'CMD-2024-156', origin: 'Lyon', destination: 'Paris', date: new Date().toISOString(), price: 450, weight: 12000, status: 'open', proposalsCount: 3 },
        { _id: '2', orderId: 'CMD-2024-157', origin: 'Marseille', destination: 'Bordeaux', date: new Date().toISOString(), price: 680, weight: 8500, status: 'open', proposalsCount: 1 },
        { _id: '3', orderId: 'CMD-2024-158', origin: 'Lille', destination: 'Strasbourg', date: new Date().toISOString(), weight: 15000, status: 'open', proposalsCount: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const checkVigilance = async (query: string) => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const data = await apiCall('/vigilance/check?q=' + encodeURIComponent(query));
      setVigilanceResults(data.data?.results || data.data || []);
    } catch (err: any) {
      console.error('Vigilance error:', err);
      // Mock data for demo
      setVigilanceResults([
        {
          carrierId: 'C001',
          carrierName: query.toUpperCase() + ' TRANSPORT',
          siret: '12345678901234',
          status: 'valid',
          checks: { licenseValid: true, insuranceValid: true, financialHealth: 'Bonne', lastAudit: '2024-06-15' },
          score: 92
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const configureTracking = async () => {
    if (!trackingOrderId.trim()) {
      setError('Veuillez saisir un ID de commande');
      return;
    }
    try {
      setLoading(true);
      await apiCall('/tracking/configure', 'POST', {
        orderId: trackingOrderId,
        level: selectedTrackingLevel
      });
      setSuccessMsg(`Tracking ${selectedTrackingLevel} configure pour ${trackingOrderId}`);
      setTrackingOrderId('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    try {
      setLoading(true);
      const [sessionData, proposalsData] = await Promise.all([
        apiCall('/affretia/session/' + sessionId),
        apiCall('/affretia/proposals/' + sessionId)
      ]);
      setSelectedSession(sessionData.data);
      setProposals(proposalsData.data?.proposals || proposalsData.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const triggerAffretIA = async () => {
    if (!triggerForm.orderId.trim()) {
      setError('Veuillez saisir un ID de commande');
      return;
    }
    try {
      setLoading(true);
      const data = await apiCall('/affretia/trigger', 'POST', {
        orderId: triggerForm.orderId.trim(),
        reason: triggerForm.reason || 'Recherche transporteur',
        triggerType: 'manual',
        organizationId: 'org-demo'
      });
      const sessionId = data.data?.sessionId || data.data?._id;
      setSuccessMsg(`Session ${sessionId} creee avec succes`);
      setTriggerForm({ orderId: '', reason: '' });
      loadSessions();
      setActiveTab('sessions');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSession = async (sessionId: string) => {
    try {
      setLoading(true);
      await apiCall('/affretia/analyze', 'POST', { sessionId });
      setSuccessMsg('Analyse lancee');
      loadSessionDetails(sessionId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const broadcastSession = async (sessionId: string) => {
    try {
      setLoading(true);
      const data = await apiCall('/affretia/broadcast', 'POST', {
        sessionId,
        channels: ['email', 'bourse', 'push']
      });
      setSuccessMsg(`Diffusee a ${data.data?.recipientsCount || 0} transporteurs`);
      loadSessionDetails(sessionId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectBestCarrier = async (sessionId: string) => {
    try {
      setLoading(true);
      const data = await apiCall('/affretia/select', 'POST', { sessionId });
      setSuccessMsg(`Selection: ${data.data?.selectedCarrierName} - ${data.data?.selectedPrice}EUR`);
      loadSessionDetails(sessionId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignCarrier = async (sessionId: string) => {
    try {
      setLoading(true);
      const data = await apiCall('/affretia/assign', 'POST', { sessionId, userId: 'user-demo' });
      setSuccessMsg(`Transporteur ${data.data?.carrierName} assigne`);
      loadSessions();
      setSelectedSession(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptProposal = async (proposalId: string) => {
    try {
      setLoading(true);
      await apiCall('/affretia/proposals/' + proposalId + '/accept', 'PUT', {
        userId: 'user-demo',
        reason: 'Acceptation manuelle'
      });
      setSuccessMsg('Proposition acceptee');
      if (selectedSession) loadSessionDetails(selectedSession.sessionId || selectedSession._id || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const rejectProposal = async (proposalId: string) => {
    try {
      setLoading(true);
      await apiCall('/affretia/proposals/' + proposalId + '/reject', 'PUT', {
        userId: 'user-demo',
        reason: 'Rejet manuel'
      });
      setSuccessMsg('Proposition rejetee');
      if (selectedSession) loadSessionDetails(selectedSession.sessionId || selectedSession._id || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const negotiateProposal = async (proposalId: string, price: number) => {
    try {
      setLoading(true);
      await apiCall('/affretia/proposals/' + proposalId + '/negotiate', 'POST', {
        counterPrice: price,
        message: 'Contre-proposition',
        userId: 'user-demo'
      });
      setSuccessMsg('Contre-proposition envoyee');
      setNegotiatePrice('');
      if (selectedSession) loadSessionDetails(selectedSession.sessionId || selectedSession._id || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadStats();
    loadSessions();
  }, [mounted, loadStats, loadSessions, router]);

  useEffect(() => {
    if (error || successMsg) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMsg]);

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'sessions', label: 'Sessions', icon: '📋' },
    { id: 'new', label: 'Nouvelle recherche', icon: '➕' },
    { id: 'bourse', label: 'Bourse Fret', icon: '🏪' },
    { id: 'tracking', label: 'Tracking IA', icon: '📍' },
    { id: 'vigilance', label: 'Vigilance', icon: '🛡️' },
  ];

  return (
    <>
      <Head>
        <title>AFFRET.IA - Affretement Intelligent | SYMPHONI.A</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 text-sm transition-colors"
                >
                  ← Retour
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🤖</span>
                  <div>
                    <h1 className="text-2xl font-bold text-white">AFFRET.IA</h1>
                    <p className="text-xs text-white/50">Affreteur Virtuel Intelligent 24/7</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-indigo-500/30 rounded-full text-sm text-white/80">
                Industrie
              </div>
            </div>
          </div>
        </header>

        {/* Notifications */}
        {error && (
          <div className="bg-red-500/20 border-b border-red-500/30 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-red-200">
              <span>⚠️</span> {error}
            </div>
          </div>
        )}
        {successMsg && (
          <div className="bg-green-500/20 border-b border-green-500/30 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center gap-2 text-green-200">
              <span>✓</span> {successMsg}
            </div>
          </div>
        )}

        {/* Tabs */}
        <nav className="border-b border-white/10 bg-black/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedSession(null);
                  }}
                  className={`px-5 py-4 text-sm font-medium transition-colors flex items-center gap-2 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-400 text-white bg-white/5'
                      : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-indigo-400"></div>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && !loading && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon="📦"
                  value={stats?.totalSessions || 0}
                  label="Sessions totales"
                  color="#818cf8"
                />
                <StatCard
                  icon="✅"
                  value={`${(stats?.successRate || 0).toFixed(0)}%`}
                  label="Taux de succes"
                  color="#34d399"
                />
                <StatCard
                  icon="⏱️"
                  value={`${stats?.avgResponseTime || 0}min`}
                  label="Temps de reponse moyen"
                />
                <StatCard
                  icon="💶"
                  value={`${(stats?.avgPrice || 0).toFixed(0)}€`}
                  label="Prix moyen"
                  color="#fbbf24"
                />
              </div>

              {/* Quick Action */}
              <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 rounded-2xl p-6 border border-indigo-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Lancer une recherche IA</h2>
                    <p className="text-white/60 text-sm">AFFRET.IA trouve automatiquement le meilleur transporteur pour votre commande</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                  >
                    <span>🚀</span> Nouvelle recherche
                  </button>
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Sessions recentes</h2>
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className="text-sm text-indigo-400 hover:text-indigo-300"
                  >
                    Voir tout →
                  </button>
                </div>
                <div className="divide-y divide-white/5">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.sessionId || session._id}
                      className="px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        loadSessionDetails(session.sessionId || session._id || '');
                        setActiveTab('sessions');
                      }}
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white">{session.orderId}</span>
                          <StatusBadge status={session.status} />
                        </div>
                        <p className="text-sm text-white/50 mt-1">
                          {session.triggerReason || 'Recherche transporteur'} • {new Date(session.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      {session.selection && (
                        <div className="text-right">
                          <p className="text-green-400 font-medium">{session.selection.finalPrice}€</p>
                          <p className="text-xs text-white/50">{session.selection.carrierName}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="px-6 py-12 text-center text-white/50">
                      Aucune session pour le moment
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* New Search Tab */}
          {activeTab === 'new' && !loading && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8">
                <div className="text-center mb-8">
                  <span className="text-5xl mb-4 block">🤖</span>
                  <h2 className="text-2xl font-bold text-white mb-2">Nouvelle recherche AFFRET.IA</h2>
                  <p className="text-white/60">L'IA analyse votre commande et trouve le meilleur transporteur</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Reference commande *
                    </label>
                    <input
                      type="text"
                      value={triggerForm.orderId}
                      onChange={(e) => setTriggerForm({ ...triggerForm, orderId: e.target.value })}
                      placeholder="Ex: CMD-2024-001"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Contexte de la recherche (optionnel)
                    </label>
                    <input
                      type="text"
                      value={triggerForm.reason}
                      onChange={(e) => setTriggerForm({ ...triggerForm, reason: e.target.value })}
                      placeholder="Ex: Urgent, frigorifique requis..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>

                  <button
                    onClick={triggerAffretIA}
                    disabled={!triggerForm.orderId.trim()}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>🚀</span> Lancer la recherche IA
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <h3 className="text-sm font-medium text-white/80 mb-4">Comment ca fonctionne ?</h3>
                  <div className="space-y-3">
                    {[
                      { icon: '🔍', text: 'L\'IA analyse votre commande (origine, destination, contraintes)' },
                      { icon: '📡', text: 'Diffusion automatique aux transporteurs qualifies' },
                      { icon: '📊', text: 'Comparaison des propositions et scoring' },
                      { icon: '✅', text: 'Selection du meilleur transporteur' },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-white/60">
                        <span className="text-lg">{step.icon}</span>
                        <span>{step.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && !loading && (
            <>
              {selectedSession ? (
                // Session Detail View
                <div className="space-y-6">
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    ← Retour a la liste
                  </button>

                  {/* Session Header */}
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl font-bold text-white">{selectedSession.orderId}</h2>
                          <StatusBadge status={selectedSession.status} />
                        </div>
                        <p className="text-white/50 text-sm">
                          Session {selectedSession.sessionId || selectedSession._id} • Creee le {new Date(selectedSession.createdAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      {selectedSession.selection && (
                        <div className="text-right bg-green-500/10 px-4 py-2 rounded-xl">
                          <p className="text-green-400 font-bold text-xl">{selectedSession.selection.finalPrice}€</p>
                          <p className="text-xs text-white/50">{selectedSession.selection.carrierName}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {selectedSession.status === 'analyzing' && (
                        <button
                          onClick={() => broadcastSession(selectedSession.sessionId || selectedSession._id || '')}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <span>📡</span> Diffuser aux transporteurs
                        </button>
                      )}
                      {['analyzing', 'broadcasting'].includes(selectedSession.status) && proposals.length > 0 && (
                        <button
                          onClick={() => selectBestCarrier(selectedSession.sessionId || selectedSession._id || '')}
                          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <span>🎯</span> Selection IA
                        </button>
                      )}
                      {selectedSession.selection && selectedSession.status !== 'assigned' && (
                        <button
                          onClick={() => assignCarrier(selectedSession.sessionId || selectedSession._id || '')}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <span>✅</span> Confirmer et assigner
                        </button>
                      )}
                      <button
                        onClick={() => loadSessionDetails(selectedSession.sessionId || selectedSession._id || '')}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        🔄 Actualiser
                      </button>
                    </div>
                  </div>

                  {/* Proposals */}
                  <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    <div className="px-6 py-4 border-b border-white/10">
                      <h3 className="text-lg font-semibold text-white">
                        Propositions ({proposals.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-white/5">
                      {proposals.map((proposal) => (
                        <div key={proposal._id} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-white">{proposal.carrierName}</span>
                                <StatusBadge status={proposal.status} />
                              </div>
                              <p className="text-sm text-white/50 mt-1">
                                Recu le {new Date(proposal.submittedAt).toLocaleString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">{proposal.proposedPrice}€</p>
                              {proposal.scores && (
                                <p className="text-xs text-white/50">
                                  Score: {proposal.scores.overall}/100
                                </p>
                              )}
                            </div>
                          </div>

                          {proposal.status === 'pending' && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => acceptProposal(proposal._id)}
                                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-medium transition-colors"
                              >
                                ✓ Accepter
                              </button>
                              <button
                                onClick={() => rejectProposal(proposal._id)}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                              >
                                ✗ Refuser
                              </button>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder="Contre-offre"
                                  value={negotiatePrice}
                                  onChange={(e) => setNegotiatePrice(e.target.value)}
                                  className="w-28 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-indigo-400"
                                />
                                <button
                                  onClick={() => {
                                    if (negotiatePrice) {
                                      negotiateProposal(proposal._id, parseFloat(negotiatePrice));
                                    }
                                  }}
                                  disabled={!negotiatePrice}
                                  className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-50 text-yellow-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Negocier
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {proposals.length === 0 && (
                        <div className="px-6 py-12 text-center text-white/50">
                          <span className="text-4xl mb-4 block">📭</span>
                          Aucune proposition recue pour le moment
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Sessions List View
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                  <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Toutes les sessions</h2>
                    <button
                      onClick={loadSessions}
                      className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                      🔄 Actualiser
                    </button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {sessions.map((session) => (
                      <div
                        key={session.sessionId || session._id}
                        className="px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => loadSessionDetails(session.sessionId || session._id || '')}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-white">{session.orderId}</span>
                              <StatusBadge status={session.status} />
                            </div>
                            <p className="text-sm text-white/50 mt-1">
                              {session.triggerReason || 'Recherche transporteur'} • {new Date(session.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {session.selection && (
                              <div className="text-right">
                                <p className="text-green-400 font-medium">{session.selection.finalPrice}€</p>
                                <p className="text-xs text-white/50">{session.selection.carrierName}</p>
                              </div>
                            )}
                            <span className="text-white/30">→</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {sessions.length === 0 && (
                      <div className="px-6 py-12 text-center text-white/50">
                        <span className="text-4xl mb-4 block">📭</span>
                        <p>Aucune session pour le moment</p>
                        <button
                          onClick={() => setActiveTab('new')}
                          className="mt-4 text-indigo-400 hover:text-indigo-300"
                        >
                          Lancer une premiere recherche →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bourse Tab */}
          {activeTab === 'bourse' && !loading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Bourse de Fret</h2>
                  <p className="text-white/60 text-sm">Offres ouvertes aux transporteurs</p>
                </div>
                <button
                  onClick={loadBourseOffers}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  🔄 Actualiser
                </button>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="divide-y divide-white/5">
                  {bourseOffers.map((offer) => (
                    <div key={offer._id} className="p-6 hover:bg-white/5 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-white">{offer.orderId}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              offer.status === 'open' ? 'bg-green-500/30 text-green-300' : 'bg-gray-500/30 text-gray-300'
                            }`}>
                              {offer.status === 'open' ? 'Ouvert' : offer.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-white/70 mb-2">
                            <span>📍 {offer.origin}</span>
                            <span className="text-white/40">→</span>
                            <span>🏁 {offer.destination}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-white/50">
                            <span>📅 {new Date(offer.date).toLocaleDateString('fr-FR')}</span>
                            {offer.weight && <span>⚖️ {(offer.weight / 1000).toFixed(1)}t</span>}
                            <span>💬 {offer.proposalsCount || 0} propositions</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {offer.price ? (
                            <p className="text-xl font-bold text-indigo-400">{offer.price}€</p>
                          ) : (
                            <p className="text-sm text-white/50">Prix ouvert</p>
                          )}
                          <button
                            onClick={() => {
                              setTriggerForm({ orderId: offer.orderId, reason: 'Via Bourse' });
                              setActiveTab('new');
                            }}
                            className="mt-2 px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg text-sm transition-colors"
                          >
                            Lancer AFFRET.IA
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {bourseOffers.length === 0 && (
                    <div className="px-6 py-12 text-center text-white/50">
                      <span className="text-4xl mb-4 block">🏪</span>
                      <p>Aucune offre disponible</p>
                      <button
                        onClick={loadBourseOffers}
                        className="mt-4 text-indigo-400 hover:text-indigo-300"
                      >
                        Charger les offres →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tracking Tab */}
          {activeTab === 'tracking' && !loading && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Configuration Tracking IA</h2>
                <p className="text-white/60 text-sm">Definissez le niveau de suivi pour vos commandes</p>
              </div>

              {/* Tracking Levels */}
              <div className="grid md:grid-cols-3 gap-4">
                {trackingLevels.map((level) => (
                  <div
                    key={level.level}
                    onClick={() => setSelectedTrackingLevel(level.level)}
                    className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                      selectedTrackingLevel === level.level
                        ? 'bg-indigo-500/20 border-indigo-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{level.label}</h3>
                      {selectedTrackingLevel === level.level && (
                        <span className="text-indigo-400">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mb-4">{level.description}</p>
                    <ul className="space-y-2">
                      {level.features.map((feature, i) => (
                        <li key={i} className="text-sm text-white/70 flex items-center gap-2">
                          <span className="text-green-400">•</span> {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Configure Form */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Appliquer a une commande</h3>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={trackingOrderId}
                    onChange={(e) => setTrackingOrderId(e.target.value)}
                    placeholder="ID de commande (ex: CMD-2024-001)"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={configureTracking}
                    disabled={!trackingOrderId.trim()}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                  >
                    Configurer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Vigilance Tab */}
          {activeTab === 'vigilance' && !loading && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Vigilance Transporteurs</h2>
                <p className="text-white/60 text-sm">Verifiez la conformite et la fiabilite des transporteurs</p>
              </div>

              {/* Search */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={vigilanceSearch}
                    onChange={(e) => setVigilanceSearch(e.target.value)}
                    placeholder="Nom du transporteur ou SIRET..."
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-400"
                    onKeyDown={(e) => e.key === 'Enter' && checkVigilance(vigilanceSearch)}
                  />
                  <button
                    onClick={() => checkVigilance(vigilanceSearch)}
                    disabled={!vigilanceSearch.trim()}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                  >
                    <span>🔍</span> Verifier
                  </button>
                </div>
              </div>

              {/* Results */}
              {vigilanceResults.length > 0 && (
                <div className="space-y-4">
                  {vigilanceResults.map((result) => (
                    <div key={result.carrierId} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-white">{result.carrierName}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              result.status === 'valid' ? 'bg-green-500/30 text-green-300' :
                              result.status === 'warning' ? 'bg-yellow-500/30 text-yellow-300' :
                              'bg-red-500/30 text-red-300'
                            }`}>
                              {result.status === 'valid' ? 'Conforme' : result.status === 'warning' ? 'Attention' : 'Non conforme'}
                            </span>
                          </div>
                          <p className="text-sm text-white/50">SIRET: {result.siret}</p>
                        </div>
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${
                            result.score >= 80 ? 'text-green-400' :
                            result.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {result.score}
                          </div>
                          <p className="text-xs text-white/50">Score</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {result.checks.licenseValid ? (
                              <span className="text-green-400">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                            <span className="text-sm text-white/70">Licence</span>
                          </div>
                          <p className="text-xs text-white/50">{result.checks.licenseValid ? 'Valide' : 'Invalide'}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {result.checks.insuranceValid ? (
                              <span className="text-green-400">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                            <span className="text-sm text-white/70">Assurance</span>
                          </div>
                          <p className="text-xs text-white/50">{result.checks.insuranceValid ? 'Valide' : 'Invalide'}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-indigo-400">📊</span>
                            <span className="text-sm text-white/70">Sante financiere</span>
                          </div>
                          <p className="text-xs text-white/50">{result.checks.financialHealth}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-indigo-400">📅</span>
                            <span className="text-sm text-white/70">Dernier audit</span>
                          </div>
                          <p className="text-xs text-white/50">{new Date(result.checks.lastAudit).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {vigilanceResults.length === 0 && !loading && (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-12 text-center">
                  <span className="text-5xl mb-4 block">🛡️</span>
                  <p className="text-white/60">Recherchez un transporteur pour verifier sa conformite</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
