import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, MapPin, Phone, Mail, ArrowLeft,
  LogOut, CheckCircle, XCircle, Clock, Plus, MessageSquare,
  Calendar, User, FileText, Trophy, AlertTriangle
} from 'lucide-react';

const COMMERCIAL_API_URL = process.env.NEXT_PUBLIC_ADMIN_GATEWAY_URL || 'https://ddaywxps9n701.cloudfront.net';

const STAGES = [
  { order: 1, code: 'QUALIFICATION', label: 'Qualification', description: 'Verification de l\'interet et du besoin' },
  { order: 2, code: 'PREMIER_CONTACT', label: 'Premier Contact', description: 'Prise de contact initiale avec le prospect' },
  { order: 3, code: 'DECOUVERTE', label: 'Decouverte', description: 'Analyse des besoins et attentes' },
  { order: 4, code: 'PROPOSITION', label: 'Proposition', description: 'Presentation de l\'offre commerciale' },
  { order: 5, code: 'NEGOCIATION', label: 'Negociation', description: 'Discussion des termes et conditions' },
  { order: 6, code: 'CLOSING', label: 'Closing', description: 'Finalisation et signature du contrat' }
];

interface LeadDetail {
  _id: string;
  companyName: string;
  siret?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    position?: string;
  };
  enrichedData?: {
    effectif?: string;
    chiffreAffaires?: number;
    activitePrincipale?: string;
    formeJuridique?: string;
  };
  currentStage: string;
  pipeline: Array<{
    stageCode: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    notes?: string;
  }>;
  interactions: Array<{
    _id: string;
    type: string;
    notes: string;
    createdAt: string;
    metadata?: Record<string, any>;
  }>;
  status: string;
  createdAt: string;
}

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState<any>(null);
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageNotes, setStageNotes] = useState('');
  const [selectedStage, setSelectedStage] = useState('');

  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionType, setInteractionType] = useState('APPEL');
  const [interactionNotes, setInteractionNotes] = useState('');

  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('commercial_token');
    const userData = localStorage.getItem('commercial_user');

    if (!token || !userData) {
      router.push('/commercial/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.mustChangePassword) {
      router.push('/commercial/change-password');
      return;
    }

    setUser(parsedUser);
  }, [router]);

  useEffect(() => {
    if (id && user) {
      loadLead();
    }
  }, [id, user]);

  const loadLead = async () => {
    try {
      const token = localStorage.getItem('commercial_token');
      const res = await fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/my-leads/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) {
        localStorage.removeItem('commercial_token');
        localStorage.removeItem('commercial_user');
        router.push('/commercial/login');
        return;
      }

      if (res.status === 404) {
        router.push('/commercial/my-leads');
        return;
      }

      const data = await res.json();
      setLead(data.lead);
    } catch (error) {
      console.error('Erreur chargement lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStage = async () => {
    if (!selectedStage) return;

    setUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('commercial_token');
      const res = await fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/pipeline/${id}/stage/${selectedStage}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'completed',
          notes: stageNotes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise a jour');
      }

      setSuccess('Etape validee avec succes!');
      setShowStageModal(false);
      setStageNotes('');
      setSelectedStage('');
      loadLead();

      // Check if this was the closing stage
      if (selectedStage === 'CLOSING') {
        setSuccess('Felicitations! Lead converti en client!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddInteraction = async () => {
    if (!interactionNotes.trim()) return;

    setUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('commercial_token');
      const res = await fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/my-leads/${id}/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: interactionType,
          notes: interactionNotes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajout');
      }

      setSuccess('Interaction ajoutee!');
      setShowInteractionModal(false);
      setInteractionNotes('');
      setInteractionType('APPEL');
      loadLead();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkLost = async () => {
    if (!lostReason.trim()) return;

    setUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('commercial_token');
      const res = await fetch(`${COMMERCIAL_API_URL}/api/v1/commercial/my-leads/${id}/lost`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: lostReason })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise a jour');
      }

      setShowLostModal(false);
      setLostReason('');
      loadLead();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('commercial_token');
    localStorage.removeItem('commercial_user');
    router.push('/commercial/login');
  };

  const getStageStatus = (stageCode: string) => {
    if (!lead?.pipeline) return 'pending';
    const stage = lead.pipeline.find(p => p.stageCode === stageCode);
    return stage?.status || 'pending';
  };

  const isStageCompleted = (stageCode: string) => {
    return getStageStatus(stageCode) === 'completed';
  };

  const canCompleteStage = (stageCode: string) => {
    if (lead?.status === 'WON' || lead?.status === 'LOST') return false;

    const stageIndex = STAGES.findIndex(s => s.code === stageCode);
    const currentIndex = STAGES.findIndex(s => s.code === lead?.currentStage);

    // Can only complete current stage or previous uncompleted stages
    if (stageIndex <= currentIndex && !isStageCompleted(stageCode)) {
      return true;
    }
    return false;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCA = (ca?: number) => {
    if (!ca) return '-';
    if (ca >= 1000000) return `${(ca / 1000000).toFixed(1)}M €`;
    if (ca >= 1000) return `${(ca / 1000).toFixed(0)}K €`;
    return `${ca} €`;
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'APPEL': return <Phone className="w-4 h-4" />;
      case 'EMAIL': return <Mail className="w-4 h-4" />;
      case 'REUNION': return <Calendar className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Lead non trouve</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/commercial/my-leads" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{lead.companyName}</h1>
                <p className="text-sm text-gray-500">Detail du prospect</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">&times;</button>
          </div>
        )}

        {/* Status Banner */}
        {lead.status === 'WON' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <p className="font-bold text-lg">Lead Gagne!</p>
              <p className="text-green-100">Ce prospect est maintenant un client.</p>
            </div>
          </div>
        )}

        {lead.status === 'LOST' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl flex items-center gap-3">
            <XCircle className="w-8 h-8" />
            <div>
              <p className="font-bold text-lg">Lead Perdu</p>
              <p className="text-red-100">Ce prospect n'a pas abouti.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pipeline */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Pipeline de Vente</h2>

              <div className="space-y-4">
                {STAGES.map((stage, index) => {
                  const status = getStageStatus(stage.code);
                  const isCompleted = status === 'completed';
                  const isCurrent = lead.currentStage === stage.code && !isCompleted;
                  const canComplete = canCompleteStage(stage.code);

                  return (
                    <div
                      key={stage.code}
                      className={`relative p-4 rounded-lg border-2 transition ${
                        isCompleted
                          ? 'border-green-200 bg-green-50'
                          : isCurrent
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isCurrent
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <span className="font-bold">{stage.order}</span>
                            )}
                          </div>
                          <div>
                            <h3 className={`font-medium ${isCompleted ? 'text-green-800' : isCurrent ? 'text-blue-800' : 'text-gray-700'}`}>
                              {stage.label}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{stage.description}</p>
                            {isCompleted && lead.pipeline.find(p => p.stageCode === stage.code)?.completedAt && (
                              <p className="text-xs text-green-600 mt-2">
                                Complete le {formatDate(lead.pipeline.find(p => p.stageCode === stage.code)!.completedAt!)}
                              </p>
                            )}
                          </div>
                        </div>

                        {canComplete && (
                          <button
                            onClick={() => {
                              setSelectedStage(stage.code);
                              setShowStageModal(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                          >
                            Valider
                          </button>
                        )}
                      </div>

                      {/* Connection line */}
                      {index < STAGES.length - 1 && (
                        <div
                          className={`absolute left-7 top-14 w-0.5 h-8 ${
                            isCompleted ? 'bg-green-300' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              {lead.status !== 'WON' && lead.status !== 'LOST' && (
                <div className="mt-6 pt-6 border-t flex gap-4">
                  <button
                    onClick={() => setShowInteractionModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter une interaction
                  </button>
                  <button
                    onClick={() => setShowLostModal(true)}
                    className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    Marquer comme perdu
                  </button>
                </div>
              )}
            </div>

            {/* Interactions History */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des interactions</h2>

              {lead.interactions && lead.interactions.length > 0 ? (
                <div className="space-y-4">
                  {lead.interactions.map((interaction) => (
                    <div key={interaction._id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {getInteractionIcon(interaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{interaction.type}</span>
                          <span className="text-sm text-gray-500">{formatDate(interaction.createdAt)}</span>
                        </div>
                        <p className="text-gray-600">{interaction.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune interaction enregistree</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Lead Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{lead.companyName}</h3>
                  {lead.siret && <p className="text-sm text-gray-500">SIRET: {lead.siret}</p>}
                </div>
              </div>

              <div className="space-y-4">
                {/* Contact */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Contact</h4>
                  <div className="space-y-2">
                    {lead.contact?.firstName && lead.contact?.lastName && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="w-4 h-4 text-gray-400" />
                        {lead.contact.firstName} {lead.contact.lastName}
                        {lead.contact.position && <span className="text-gray-400">({lead.contact.position})</span>}
                      </div>
                    )}
                    {lead.contact?.email && (
                      <a href={`mailto:${lead.contact.email}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                        <Mail className="w-4 h-4" />
                        {lead.contact.email}
                      </a>
                    )}
                    {lead.contact?.phone && (
                      <a href={`tel:${lead.contact.phone}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                        <Phone className="w-4 h-4" />
                        {lead.contact.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Address */}
                {lead.address?.city && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Adresse</h4>
                    <div className="flex items-start gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        {lead.address.street && <p>{lead.address.street}</p>}
                        <p>{lead.address.postalCode} {lead.address.city}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enriched Data */}
                {lead.enrichedData && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Informations entreprise</h4>
                    <div className="space-y-2 text-sm">
                      {lead.enrichedData.activitePrincipale && (
                        <p className="text-gray-700">{lead.enrichedData.activitePrincipale}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        {lead.enrichedData.effectif && (
                          <div className="p-2 bg-gray-50 rounded">
                            <p className="text-gray-500">Effectif</p>
                            <p className="font-medium">{lead.enrichedData.effectif}</p>
                          </div>
                        )}
                        {lead.enrichedData.chiffreAffaires && (
                          <div className="p-2 bg-gray-50 rounded">
                            <p className="text-gray-500">CA</p>
                            <p className="font-medium">{formatCA(lead.enrichedData.chiffreAffaires)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">Dates</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Assigne le</span>
                  <span className="text-gray-700">{formatDate(lead.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Stage Validation Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Valider l'etape: {STAGES.find(s => s.code === selectedStage)?.label}
            </h3>
            <textarea
              value={stageNotes}
              onChange={(e) => setStageNotes(e.target.value)}
              placeholder="Notes sur cette etape (optionnel)..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowStageModal(false);
                  setSelectedStage('');
                  setStageNotes('');
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleCompleteStage}
                disabled={updating}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updating ? 'Validation...' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Modal */}
      {showInteractionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle interaction</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={interactionType}
                  onChange={(e) => setInteractionType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="APPEL">Appel telephonique</option>
                  <option value="EMAIL">Email</option>
                  <option value="REUNION">Reunion</option>
                  <option value="NOTE">Note</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                <textarea
                  value={interactionNotes}
                  onChange={(e) => setInteractionNotes(e.target.value)}
                  placeholder="Decrivez l'interaction..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowInteractionModal(false);
                  setInteractionNotes('');
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleAddInteraction}
                disabled={updating || !interactionNotes.trim()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updating ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lost Modal */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Marquer comme perdu</h3>
            <p className="text-gray-500 mb-4">Cette action est irreversible. Veuillez indiquer la raison.</p>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Raison de la perte..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 h-32"
              required
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowLostModal(false);
                  setLostReason('');
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleMarkLost}
                disabled={updating || !lostReason.trim()}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {updating ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
