import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Building2, ArrowLeft, Globe, Phone, Mail, Linkedin, Users,
  Sparkles, RefreshCw, Calendar, Clock, CheckCircle, AlertCircle,
  Send, Edit, ExternalLink, MapPin, Briefcase, TrendingUp
} from 'lucide-react';
import { crmApi } from '../../../lib/api';

interface Company {
  _id: string;
  raisonSociale: string;
  siren?: string;
  siret?: string;
  tvaIntra?: string;
  pays: string;
  ville?: string;
  adresse?: string;
  codePostal?: string;
  secteurActivite?: string;
  effectif?: string;
  chiffreAffaires?: number;
  siteWeb?: string;
  telephone?: string;
  linkedin?: string;
  statutProspection: string;
  scoreLead?: number;
  dateEnrichissement?: string;
  apolloData?: any;
  lemlistData?: any;
  commercialAssigneId?: string;
  salonSourceId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  _id: string;
  prenom: string;
  nom: string;
  poste?: string;
  email?: string;
  emailStatus?: string;
  telephone?: string;
  linkedin?: string;
  statutContact: string;
}

interface Interaction {
  _id: string;
  typeInteraction: string;
  description: string;
  metadata?: any;
  createdAt: string;
  commercialId?: string;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouveau',
  ENRICHED: 'Enrichi',
  CONTACTED: 'Contacte',
  IN_PROGRESS: 'En cours',
  CONVERTED: 'Converti',
  LOST: 'Perdu',
  BLACKLISTED: 'Blackliste'
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  ENRICHED: 'bg-purple-100 text-purple-700 border-purple-200',
  CONTACTED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  IN_PROGRESS: 'bg-orange-100 text-orange-700 border-orange-200',
  CONVERTED: 'bg-green-100 text-green-700 border-green-200',
  LOST: 'bg-red-100 text-red-700 border-red-200',
  BLACKLISTED: 'bg-gray-100 text-gray-700 border-gray-200'
};

const INTERACTION_ICONS: Record<string, any> = {
  CREATION: Calendar,
  ENRICHISSEMENT: Sparkles,
  EMAIL_ENVOYE: Send,
  EMAIL_OUVERT: Mail,
  EMAIL_CLICKED: CheckCircle,
  ASSIGNATION: Users,
  NOTE: Edit,
  RDV: Calendar,
  CONVERSION: TrendingUp
};

export default function CompanyDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'timeline' | 'lemlist'>('info');

  useEffect(() => {
    if (id) {
      loadCompany();
      loadContacts();
    }
  }, [id]);

  const loadCompany = async () => {
    setLoading(true);
    try {
      const result = await crmApi.getCompany(id as string);
      if (result.success) {
        setCompany(result.company);
        setInteractions(result.interactions || []);
      }
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const result = await crmApi.getContacts({ entrepriseId: id as string, limit: 50 });
      if (result.success) {
        setContacts(result.contacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const handleEnrich = async () => {
    if (!company) return;
    setEnriching(true);
    try {
      const result = await crmApi.enrichCompany(company._id);
      if (result.success) {
        loadCompany();
        loadContacts();
      } else {
        alert('Erreur enrichissement: ' + result.error);
      }
    } catch (error) {
      console.error('Error enriching company:', error);
    } finally {
      setEnriching(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!company) return;
    try {
      const result = await crmApi.updateCompany(company._id, { statutProspection: newStatus });
      if (result.success) {
        loadCompany();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Entreprise non trouvee</h2>
        <button
          onClick={() => router.push('/crm/companies')}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
        >
          Retour a la liste
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/crm/companies')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{company.raisonSociale}</h1>
          <p className="text-gray-600">{company.ville ? `${company.ville}, ` : ''}{company.pays}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center gap-2 hover:bg-purple-600 disabled:opacity-50"
          >
            {enriching ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Enrichir (Lemlist)
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Statut:</span>
            <div className="flex gap-2">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    company.statutProspection === key
                      ? STATUS_COLORS[key]
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {company.scoreLead !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Score Lead:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                company.scoreLead >= 80 ? 'bg-green-100 text-green-700' :
                company.scoreLead >= 60 ? 'bg-yellow-100 text-yellow-700' :
                company.scoreLead >= 40 ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {company.scoreLead}/100
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { key: 'info', label: 'Informations', icon: Building2 },
            { key: 'contacts', label: `Contacts (${contacts.length})`, icon: Users },
            { key: 'timeline', label: 'Timeline', icon: Clock },
            { key: 'lemlist', label: 'Donnees Lemlist', icon: Sparkles }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Informations generales</h3>
              <InfoRow icon={Building2} label="Raison sociale" value={company.raisonSociale} />
              <InfoRow icon={Briefcase} label="SIREN" value={company.siren} />
              <InfoRow icon={Briefcase} label="SIRET" value={company.siret} />
              <InfoRow icon={Briefcase} label="TVA Intra" value={company.tvaIntra} />
              <InfoRow icon={Briefcase} label="Secteur" value={company.secteurActivite} />
              <InfoRow icon={Users} label="Effectif" value={company.effectif} />
              {company.chiffreAffaires && (
                <InfoRow icon={TrendingUp} label="CA" value={`${(company.chiffreAffaires / 1000000).toFixed(1)}M EUR`} />
              )}
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Coordonnees</h3>
              <InfoRow icon={MapPin} label="Adresse" value={company.adresse} />
              <InfoRow icon={MapPin} label="Ville" value={`${company.codePostal || ''} ${company.ville || ''}`} />
              <InfoRow icon={Globe} label="Pays" value={company.pays} />
              <InfoRow icon={Phone} label="Telephone" value={company.telephone} />
              {company.siteWeb && (
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-600 w-24">Site web</span>
                  <a
                    href={company.siteWeb.startsWith('http') ? company.siteWeb : `https://${company.siteWeb}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline flex items-center gap-1"
                  >
                    {company.siteWeb}
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
              {company.linkedin && (
                <div className="flex items-center gap-3">
                  <Linkedin size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-600 w-24">LinkedIn</span>
                  <a
                    href={company.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Voir le profil
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div>
            {contacts.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">Aucun contact trouve. Utilisez l'enrichissement Apollo pour trouver des contacts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map(contact => (
                  <div key={contact._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {contact.prenom?.charAt(0)}{contact.nom?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{contact.prenom} {contact.nom}</h4>
                        <p className="text-sm text-gray-600">{contact.poste || 'Poste inconnu'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{contact.email}</span>
                          {contact.emailStatus && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              contact.emailStatus === 'VALID' ? 'bg-green-100 text-green-700' :
                              contact.emailStatus === 'INVALID' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {contact.emailStatus}
                            </span>
                          )}
                        </div>
                      )}
                      {contact.telephone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{contact.telephone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            {interactions.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">Aucune interaction enregistree</p>
              </div>
            ) : (
              <div className="space-y-4">
                {interactions.map((interaction, idx) => {
                  const Icon = INTERACTION_ICONS[interaction.typeInteraction] || Calendar;
                  return (
                    <div key={interaction._id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Icon size={18} className="text-orange-600" />
                        </div>
                        {idx < interactions.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 my-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{interaction.typeInteraction.replace(/_/g, ' ')}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(interaction.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{interaction.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'lemlist' && (
          <div>
            {company.lemlistData ? (
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(company.lemlistData, null, 2)}
              </pre>
            ) : (
              <div className="text-center py-8">
                <Sparkles size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">Aucune donnee Lemlist disponible</p>
                <button
                  onClick={handleEnrich}
                  disabled={enriching}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                >
                  {enriching ? 'Enrichissement...' : 'Enrichir maintenant'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3">
      <Icon size={18} className="text-gray-400" />
      <span className="text-sm text-gray-600 w-24">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
