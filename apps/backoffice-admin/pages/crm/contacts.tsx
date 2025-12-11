import { useState, useEffect } from 'react';
import { Users, Search, Filter, Mail, Phone, CheckCircle, XCircle, AlertCircle, RefreshCw, Send, Linkedin, Building2 } from 'lucide-react';
import { crmApi } from '../../lib/api';

interface Contact {
  _id: string;
  entrepriseId: string;
  entreprise?: {
    _id: string;
    raisonSociale: string;
    pays: string;
  };
  civilite?: string;
  prenom: string;
  nom: string;
  poste?: string;
  seniority?: string;
  email?: string;
  emailStatus: string;
  telephone?: string;
  linkedin?: string;
  sourceEnrichissement?: string;
  statutContact: string;
  optOut: boolean;
  createdAt: string;
}

const EMAIL_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  UNKNOWN: { label: 'Inconnu', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
  VALID: { label: 'Valide', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  INVALID: { label: 'Invalide', color: 'bg-red-100 text-red-700', icon: XCircle },
  CATCH_ALL: { label: 'Catch-all', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  DISPOSABLE: { label: 'Jetable', color: 'bg-orange-100 text-orange-700', icon: AlertCircle }
};

const CONTACT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: 'Nouveau', color: 'bg-blue-100 text-blue-700' },
  CONTACTED: { label: 'Contacte', color: 'bg-yellow-100 text-yellow-700' },
  INTERESTED: { label: 'Interesse', color: 'bg-purple-100 text-purple-700' },
  MEETING_SCHEDULED: { label: 'RDV prevu', color: 'bg-orange-100 text-orange-700' },
  CONVERTED: { label: 'Converti', color: 'bg-green-100 text-green-700' },
  OPTED_OUT: { label: 'Opt-out', color: 'bg-gray-100 text-gray-700' },
  BOUNCED: { label: 'Bounce', color: 'bg-red-100 text-red-700' }
};

const SENIORITY_LABELS: Record<string, string> = {
  director: 'Directeur',
  vp: 'VP',
  manager: 'Manager',
  senior: 'Senior',
  entry: 'Junior',
  unknown: 'Inconnu'
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    emailStatus: '',
    contactStatus: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  useEffect(() => {
    loadContacts();
  }, [filters, pagination.page]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getContacts({
        ...filters,
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit
      });
      if (result.success) {
        setContacts(result.contacts);
        setPagination(prev => ({ ...prev, total: result.total }));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadContacts();
  };

  const handleVerifyEmail = async (contactId: string) => {
    setVerifyingId(contactId);
    try {
      const result = await crmApi.verifyContactEmail(contactId);
      if (result.success) {
        loadContacts();
      } else {
        alert('Erreur verification: ' + result.error);
      }
    } catch (error) {
      console.error('Error verifying email:', error);
    } finally {
      setVerifyingId(null);
    }
  };

  const toggleSelectContact = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c._id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-blue-500" />
            Contacts
          </h1>
          <p className="text-gray-600 mt-1">Decideurs et contacts des entreprises prospects</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
            Filtres
          </button>
          {selectedContacts.length > 0 && (
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600 transition-colors"
            >
              <Send size={18} />
              Envoyer email ({selectedContacts.length})
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, entreprise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Rechercher
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut Email</label>
              <select
                value={filters.emailStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, emailStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {Object.entries(EMAIL_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut Contact</label>
              <select
                value={filters.contactStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, contactStatus: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {Object.entries(CONTACT_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun contact</h3>
            <p className="text-gray-600">Enrichissez vos entreprises pour trouver des contacts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === contacts.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Entreprise</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map((contact) => {
                  const emailConfig = EMAIL_STATUS_CONFIG[contact.emailStatus] || EMAIL_STATUS_CONFIG.UNKNOWN;
                  const statusConfig = CONTACT_STATUS_CONFIG[contact.statutContact] || CONTACT_STATUS_CONFIG.NEW;
                  const EmailIcon = emailConfig.icon;

                  return (
                    <tr key={contact._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact._id)}
                          onChange={() => toggleSelectContact(contact._id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {contact.prenom?.charAt(0)}{contact.nom?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {contact.civilite && `${contact.civilite} `}{contact.prenom} {contact.nom}
                            </div>
                            <div className="text-sm text-gray-600">
                              {contact.poste || 'Poste inconnu'}
                              {contact.seniority && contact.seniority !== 'unknown' && (
                                <span className="ml-2 text-gray-400">({SENIORITY_LABELS[contact.seniority]})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {contact.entreprise ? (
                          <a
                            href={`/crm/companies/${contact.entreprise._id}`}
                            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                          >
                            <Building2 size={16} />
                            <span>{contact.entreprise.raisonSociale}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {contact.email ? (
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-gray-400" />
                            <span className="text-gray-700">{contact.email}</span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${emailConfig.color}`}>
                              <EmailIcon size={12} />
                              {emailConfig.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Pas d'email</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        {contact.optOut && (
                          <span className="ml-2 px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                            Opt-out
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {contact.email && contact.emailStatus !== 'VALID' && (
                            <button
                              onClick={() => handleVerifyEmail(contact._id)}
                              disabled={verifyingId === contact._id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Verifier l'email (Lemlist)"
                            >
                              {verifyingId === contact._id ? (
                                <RefreshCw size={18} className="animate-spin" />
                              ) : (
                                <CheckCircle size={18} />
                              )}
                            </button>
                          )}
                          {contact.telephone && (
                            <a
                              href={`tel:${contact.telephone}`}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Appeler"
                            >
                              <Phone size={18} />
                            </a>
                          )}
                          {contact.linkedin && (
                            <a
                              href={contact.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="LinkedIn"
                            >
                              <Linkedin size={18} />
                            </a>
                          )}
                          {contact.email && contact.emailStatus === 'VALID' && !contact.optOut && (
                            <button
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Envoyer un email"
                            >
                              <Send size={18} />
                            </button>
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
