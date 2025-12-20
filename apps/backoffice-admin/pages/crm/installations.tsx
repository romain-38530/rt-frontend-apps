import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Calendar, Clock, Building, User, Check, X, Send, Plus,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Loader2,
  Monitor, MapPin, Video
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://rt-admin-api-prod.eba-gqzj9rrf.eu-central-1.elasticbeanstalk.com';

interface Installation {
  _id: string;
  contractId: string;
  contractNumber: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  title: string;
  commercialName: string;
  status: string;
  proposedSlots: { date: string; startTime: string; endTime: string; duration: number; }[];
  confirmedSlot?: { date: string; startTime: string; endTime: string; duration: number; };
  assignedTo: { type: string; userName: string; };
  installationConfig: { type: string; estimatedDuration: number; meetingLink?: string; };
  approvedByName?: string;
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  thisWeek: number;
  completed: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600' },
  proposed: { label: 'Propose', color: 'bg-blue-100 text-blue-600' },
  pending_client: { label: 'Attente client', color: 'bg-yellow-100 text-yellow-600' },
  pending_manager: { label: 'Attente validation', color: 'bg-orange-100 text-orange-600' },
  confirmed: { label: 'Confirme', color: 'bg-green-100 text-green-600' },
  in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-600' },
  completed: { label: 'Termine', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Annule', color: 'bg-red-100 text-red-600' }
};

export default function InstallationsPage() {
  const router = useRouter();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);
  const [approving, setApproving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData(token);
  }, [router, statusFilter]);

  const loadData = async (token: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const [installRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/admin/manager/installations?${params}`, { headers }),
        fetch(`${API_URL}/api/v1/admin/manager/installations/stats`, { headers })
      ]);

      if (installRes.ok) {
        const data = await installRes.json();
        setInstallations(data.installations || []);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendProposal = async (id: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/manager/installations/${id}/send-proposal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        loadData(token);
        setSelectedInstallation(null);
      }
    } catch (err) {
      console.error('Erreur envoi:', err);
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setApproving(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/manager/installations/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved, reason: approved ? '' : 'Refuse par le manager' })
      });

      if (res.ok) {
        loadData(token);
        setSelectedInstallation(null);
      }
    } catch (err) {
      console.error('Erreur approbation:', err);
    } finally {
      setApproving(false);
    }
  };

  const handleComplete = async (id: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/admin/manager/installations/${id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actualHours: null, notes: '' })
      });

      if (res.ok) {
        loadData(token);
        setSelectedInstallation(null);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Calendar helpers
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(selectedWeek);
  const confirmedInstallations = installations.filter(i => i.confirmedSlot && i.status === 'confirmed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planning Installations</h1>
            <p className="text-gray-500">Gestion des rendez-vous d'installation</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded ${view === 'list' ? 'bg-white shadow' : ''}`}
              >
                Liste
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1 rounded ${view === 'calendar' ? 'bg-white shadow' : ''}`}
              >
                Calendrier
              </button>
            </div>
            <Link href="/crm" className="text-blue-600 hover:underline">
              Retour CRM
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">En attente</div>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">Confirmes</div>
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">Cette semaine</div>
              <div className="text-2xl font-bold text-blue-600">{stats.thisWeek}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm text-gray-500">Termines</div>
              <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">Tous les statuts</option>
            <option value="pending_client">Attente client</option>
            <option value="pending_manager">Attente validation</option>
            <option value="confirmed">Confirme</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Termine</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* List View */}
        {view === 'list' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Commercial</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Statut</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {installations.map((inst) => (
                  <tr key={inst._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{inst.companyName}</div>
                          <div className="text-sm text-gray-500">{inst.contactName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{inst.commercialName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-sm">
                        {inst.installationConfig.type === 'remote' && <Monitor className="w-4 h-4" />}
                        {inst.installationConfig.type === 'onsite' && <MapPin className="w-4 h-4" />}
                        {inst.installationConfig.type === 'hybrid' && <Video className="w-4 h-4" />}
                        {inst.installationConfig.type === 'remote' ? 'A distance' :
                         inst.installationConfig.type === 'onsite' ? 'Sur site' : 'Hybride'}
                      </span>
                      <div className="text-xs text-gray-400">{inst.installationConfig.estimatedDuration} min</div>
                    </td>
                    <td className="px-4 py-3">
                      {inst.confirmedSlot ? (
                        <div>
                          <div className="font-medium">
                            {new Date(inst.confirmedSlot.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inst.confirmedSlot.startTime} - {inst.confirmedSlot.endTime}
                          </div>
                        </div>
                      ) : inst.proposedSlots.length > 0 ? (
                        <span className="text-sm text-gray-500">{inst.proposedSlots.length} creneaux proposes</span>
                      ) : (
                        <span className="text-sm text-gray-400">Non planifie</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[inst.status]?.color}`}>
                        {statusConfig[inst.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedInstallation(inst)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {installations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      Aucune installation
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm">
            {/* Week navigation */}
            <div className="p-4 border-b flex items-center justify-between">
              <button
                onClick={() => {
                  const d = new Date(selectedWeek);
                  d.setDate(d.getDate() - 7);
                  setSelectedWeek(d);
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="font-medium">
                {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} -
                {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <button
                onClick={() => {
                  const d = new Date(selectedWeek);
                  d.setDate(d.getDate() + 7);
                  setSelectedWeek(d);
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((day, idx) => (
                <div key={idx} className="p-2 text-center border-r last:border-r-0">
                  <div className="text-xs text-gray-500">{day.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                  <div className={`text-lg font-medium ${
                    day.toDateString() === new Date().toDateString() ? 'text-blue-600' : ''
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Appointments */}
            <div className="grid grid-cols-7 min-h-[400px]">
              {weekDays.map((day, idx) => {
                const dayInstallations = confirmedInstallations.filter(i => {
                  if (!i.confirmedSlot) return false;
                  const instDate = new Date(i.confirmedSlot.date);
                  return instDate.toDateString() === day.toDateString();
                });

                return (
                  <div key={idx} className="border-r last:border-r-0 p-2 space-y-2">
                    {dayInstallations.map((inst) => (
                      <div
                        key={inst._id}
                        onClick={() => setSelectedInstallation(inst)}
                        className="bg-blue-100 rounded p-2 cursor-pointer hover:bg-blue-200 transition"
                      >
                        <div className="text-xs font-medium text-blue-800">
                          {inst.confirmedSlot?.startTime}
                        </div>
                        <div className="text-sm font-medium truncate">{inst.companyName}</div>
                        <div className="text-xs text-blue-600 truncate">{inst.commercialName}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInstallation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedInstallation.status]?.color}`}>
                  {statusConfig[selectedInstallation.status]?.label}
                </span>
                <h2 className="text-xl font-bold mt-2">{selectedInstallation.companyName}</h2>
              </div>
              <button
                onClick={() => setSelectedInstallation(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Contact</div>
                  <div className="font-medium">{selectedInstallation.contactName}</div>
                  <div className="text-sm text-gray-500">{selectedInstallation.contactEmail}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Commercial</div>
                  <div className="font-medium">{selectedInstallation.commercialName}</div>
                </div>
              </div>

              {/* Installation config */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {selectedInstallation.installationConfig.type === 'remote' && <Monitor className="w-5 h-5 text-blue-600" />}
                    {selectedInstallation.installationConfig.type === 'onsite' && <MapPin className="w-5 h-5 text-green-600" />}
                    {selectedInstallation.installationConfig.type === 'hybrid' && <Video className="w-5 h-5 text-purple-600" />}
                    <span className="font-medium">
                      {selectedInstallation.installationConfig.type === 'remote' ? 'A distance' :
                       selectedInstallation.installationConfig.type === 'onsite' ? 'Sur site' : 'Hybride'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    {selectedInstallation.installationConfig.estimatedDuration} min
                  </div>
                </div>
                {selectedInstallation.installationConfig.meetingLink && (
                  <div className="mt-2 text-sm">
                    <a href={selectedInstallation.installationConfig.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Lien visio
                    </a>
                  </div>
                )}
              </div>

              {/* Confirmed slot */}
              {selectedInstallation.confirmedSlot && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <CheckCircle className="w-5 h-5" />
                    Creneau confirme
                  </div>
                  <div className="text-lg font-bold">
                    {new Date(selectedInstallation.confirmedSlot.date).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </div>
                  <div className="text-gray-600">
                    {selectedInstallation.confirmedSlot.startTime} - {selectedInstallation.confirmedSlot.endTime}
                  </div>
                </div>
              )}

              {/* Proposed slots */}
              {selectedInstallation.proposedSlots.length > 0 && !selectedInstallation.confirmedSlot && (
                <div>
                  <div className="font-medium mb-2">Creneaux proposes</div>
                  <div className="space-y-2">
                    {selectedInstallation.proposedSlots.map((slot, idx) => (
                      <div key={idx} className="bg-gray-50 rounded p-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium">
                            {new Date(slot.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div className="text-sm text-gray-500">{slot.startTime} - {slot.endTime}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions based on status */}
              <div className="flex gap-3 pt-4 border-t">
                {/* Draft - can send proposal */}
                {selectedInstallation.status === 'draft' && selectedInstallation.proposedSlots.length > 0 && (
                  <button
                    onClick={() => handleSendProposal(selectedInstallation._id)}
                    disabled={sending}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Envoyer au client
                  </button>
                )}

                {/* Pending manager - can approve/reject */}
                {selectedInstallation.status === 'pending_manager' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedInstallation._id, true)}
                      disabled={approving}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approuver
                    </button>
                    <button
                      onClick={() => handleApprove(selectedInstallation._id, false)}
                      disabled={approving}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Refuser
                    </button>
                  </>
                )}

                {/* Confirmed - can mark complete */}
                {(selectedInstallation.status === 'confirmed' || selectedInstallation.status === 'in_progress') && (
                  <button
                    onClick={() => handleComplete(selectedInstallation._id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marquer comme termine
                  </button>
                )}

                <button
                  onClick={() => setSelectedInstallation(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
