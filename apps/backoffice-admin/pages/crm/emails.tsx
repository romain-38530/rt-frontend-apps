import { useState, useEffect } from 'react';
import { Mail, Search, Filter, RefreshCw, Eye, MousePointer, AlertTriangle, CheckCircle, Clock, Send } from 'lucide-react';
import { crmApi } from '../../lib/api';

interface Email {
  _id: string;
  contactId: string;
  contact?: {
    _id: string;
    prenom: string;
    nom: string;
    email: string;
  };
  entrepriseId: string;
  entreprise?: {
    _id: string;
    raisonSociale: string;
  };
  typeEmail: string;
  sujet: string;
  statutEnvoi: string;
  mailgunMessageId?: string;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  bouncedAt?: string;
  createdAt: string;
}

const EMAIL_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'En attente', color: 'bg-gray-100 text-gray-700', icon: Clock },
  QUEUED: { label: 'En queue', color: 'bg-blue-100 text-blue-700', icon: Clock },
  SENT: { label: 'Envoye', color: 'bg-blue-100 text-blue-700', icon: Send },
  DELIVERED: { label: 'Delivre', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  OPENED: { label: 'Ouvert', color: 'bg-purple-100 text-purple-700', icon: Eye },
  CLICKED: { label: 'Clique', color: 'bg-orange-100 text-orange-700', icon: MousePointer },
  BOUNCED: { label: 'Bounce', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  COMPLAINED: { label: 'Plainte', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  UNSUBSCRIBED: { label: 'Desabonne', color: 'bg-gray-100 text-gray-700', icon: AlertTriangle },
  FAILED: { label: 'Echec', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
};

const EMAIL_TYPES: Record<string, string> = {
  PRESENTATION: 'Presentation',
  COMMERCIAL_INTRO: 'Introduction commerciale',
  RELANCE_1: 'Relance 1',
  RELANCE_2: 'Relance 2',
  MANUEL: 'Manuel'
};

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ statut: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [stats, setStats] = useState({
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0
  });

  useEffect(() => {
    loadEmails();
  }, [filters, pagination.page]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getEmails({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      if (result.success) {
        setEmails(result.emails);
        setPagination(prev => ({ ...prev, total: result.total }));

        // Calculate stats
        const allEmails = result.emails;
        setStats({
          sent: allEmails.filter((e: Email) => e.sentAt).length,
          delivered: allEmails.filter((e: Email) => e.deliveredAt).length,
          opened: allEmails.filter((e: Email) => e.openedAt).length,
          clicked: allEmails.filter((e: Email) => e.clickedAt).length,
          bounced: allEmails.filter((e: Email) => e.bouncedAt).length
        });
      }
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Mail className="text-green-500" />
            Emails
          </h1>
          <p className="text-gray-600 mt-1">Suivi des campagnes email et tracking</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            showFilters ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter size={18} />
          Filtres
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Send size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
              <p className="text-sm text-gray-600">Envoyes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              <p className="text-sm text-gray-600">Delivres</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Eye size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.opened}</p>
              <p className="text-sm text-gray-600">Ouverts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MousePointer size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.clicked}</p>
              <p className="text-sm text-gray-600">Cliques</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.bounced}</p>
              <p className="text-sm text-gray-600">Bounces</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={filters.statut}
                onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(EMAIL_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Emails List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-green-500" />
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12">
            <Mail size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun email</h3>
            <p className="text-gray-600">Envoyez votre premiere campagne email</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Destinataire</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Sujet</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {emails.map((email) => {
                  const statusConfig = EMAIL_STATUS_CONFIG[email.statutEnvoi] || EMAIL_STATUS_CONFIG.PENDING;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={email._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          {email.contact ? (
                            <div className="font-medium text-gray-900">
                              {email.contact.prenom} {email.contact.nom}
                            </div>
                          ) : (
                            <div className="text-gray-400">Contact inconnu</div>
                          )}
                          {email.entreprise && (
                            <div className="text-sm text-gray-500">{email.entreprise.raisonSociale}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-900">{email.sujet}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-600">{EMAIL_TYPES[email.typeEmail] || email.typeEmail}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium w-fit ${statusConfig.color}`}>
                          <StatusIcon size={14} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {email.sentAt
                            ? new Date(email.sentAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {email.deliveredAt && (
                            <span className="p-1 bg-green-100 rounded" title="Delivre">
                              <CheckCircle size={14} className="text-green-600" />
                            </span>
                          )}
                          {email.openedAt && (
                            <span className="p-1 bg-purple-100 rounded" title="Ouvert">
                              <Eye size={14} className="text-purple-600" />
                            </span>
                          )}
                          {email.clickedAt && (
                            <span className="p-1 bg-orange-100 rounded" title="Clique">
                              <MousePointer size={14} className="text-orange-600" />
                            </span>
                          )}
                          {email.bouncedAt && (
                            <span className="p-1 bg-red-100 rounded" title="Bounce">
                              <AlertTriangle size={14} className="text-red-600" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Precedent
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
