import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Building2, Globe, Phone, Mail, MapPin,
  Calendar, User, ExternalLink, Tag, Package, Star,
  Clock, CheckCircle, XCircle, AlertCircle, Sparkles, RefreshCw
} from 'lucide-react';
import { crmApi } from '../../../lib/api';

interface LeadCompany {
  _id: string;
  numeroLead?: string;
  raisonSociale: string;
  formeJuridique?: string;
  siren?: string;
  siret?: string;
  tvaIntracommunautaire?: string;
  adresse: {
    ligne1?: string;
    ligne2?: string;
    codePostal?: string;
    ville?: string;
    pays: string;
  };
  telephone?: string;
  emailGenerique?: string;
  siteWeb?: string;
  linkedinCompanyUrl?: string;
  secteurActivite?: string;
  codeNaf?: string;
  effectifTranche?: string;
  chiffreAffairesTranche?: string;
  descriptionActivite?: string;
  produits?: string[];
  urlPageExposant?: string;
  numeroStand?: string;
  statutProspection: string;
  scoreLead?: number;
  inPool: boolean;
  prioritePool?: number;
  nbContactsEnrichis?: number;
  dateAddedToPool?: string;
  lastContactAttempt?: string;
  salonSource?: {
    _id: string;
    nom: string;
  };
  commercialAssigne?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  NEW: { label: 'Nouveau', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  ENRICHED: { label: 'Enrichi', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  CONTACTED: { label: 'Contacte', color: 'bg-yellow-100 text-yellow-700', icon: Mail },
  IN_PROGRESS: { label: 'En cours', color: 'bg-orange-100 text-orange-700', icon: Clock },
  CONVERTED: { label: 'Converti', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  LOST: { label: 'Perdu', color: 'bg-red-100 text-red-700', icon: XCircle },
  BLACKLISTED: { label: 'Blackliste', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  5: { label: 'Tres haute', color: 'bg-red-100 text-red-700' },
  4: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
  3: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700' },
  2: { label: 'Basse', color: 'bg-blue-100 text-blue-700' },
  1: { label: 'Tres basse', color: 'bg-gray-100 text-gray-700' },
};

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [lead, setLead] = useState<LeadCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrichingFree, setEnrichingFree] = useState(false);
  const [enrichingPaid, setEnrichingPaid] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadLead(id);
    }
  }, [id]);

  const loadLead = async (leadId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await crmApi.getCompany(leadId);
      // L'API retourne { company, contacts, interactions, emails }
      if (result.company) {
        // Transformer salonSourceId en salonSource pour le frontend
        const lead = {
          ...result.company,
          salonSource: result.company.salonSourceId,
          commercialAssigne: result.company.commercialAssigneId
        };
        setLead(lead);
      } else if (result.error) {
        setError(result.error);
      } else {
        setError('Lead non trouve');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const enrichFree = async () => {
    if (!lead || enrichingFree) return;
    setEnrichingFree(true);
    try {
      const result = await crmApi.enrichCompanyFree(lead._id);
      if (result.success) {
        await loadLead(lead._id);
      }
    } catch (err: any) {
      console.error('Free enrichment error:', err);
    } finally {
      setEnrichingFree(false);
    }
  };

  const enrichPaid = async () => {
    if (!lead || enrichingPaid) return;
    setEnrichingPaid(true);
    try {
      const result = await crmApi.enrichCompanyPaid(lead._id);
      if (result.success) {
        await loadLead(lead._id);
      }
    } catch (err: any) {
      console.error('Paid enrichment error:', err);
    } finally {
      setEnrichingPaid(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircle className="mx-auto text-red-500 mb-2" size={48} />
            <h2 className="text-xl font-semibold text-red-700">{error || 'Lead non trouve'}</h2>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[lead.statutProspection] || STATUS_CONFIG.NEW;
  const priorityConfig = PRIORITY_CONFIG[lead.prioritePool || 3];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Retour au pool
          </button>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  {lead.raisonSociale.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{lead.raisonSociale}</h1>
                  {lead.numeroLead && (
                    <p className="text-sm text-gray-500">#{lead.numeroLead}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig.color}`}>
                      <StatusIcon size={14} />
                      {statusConfig.label}
                    </span>
                    {lead.prioritePool && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityConfig.color}`}>
                        Priorite: {priorityConfig.label}
                      </span>
                    )}
                    {lead.scoreLead && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                        <Star size={14} />
                        Score: {lead.scoreLead}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={enrichFree}
                  disabled={enrichingFree || enrichingPaid}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
                >
                  {enrichingFree ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {enrichingFree ? 'Enrichissement...' : 'Gratuit'}
                </button>
                <button
                  onClick={enrichPaid}
                  disabled={enrichingFree || enrichingPaid}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 text-sm"
                >
                  {enrichingPaid ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  {enrichingPaid ? 'Enrichissement...' : 'Payant'}
                </button>
                {lead.siteWeb && (
                  <a
                    href={lead.siteWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                  >
                    <ExternalLink size={14} />
                    Site
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Coordonnees */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="text-purple-600" size={20} />
                Coordonnees
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Adresse</label>
                  <p className="font-medium text-gray-900">
                    {lead.adresse?.ligne1 || '-'}
                    {lead.adresse?.ligne2 && <><br />{lead.adresse.ligne2}</>}
                  </p>
                  <p className="text-gray-700">
                    {lead.adresse?.codePostal} {lead.adresse?.ville}
                  </p>
                  <p className="text-gray-700">{lead.adresse?.pays || '-'}</p>
                </div>
                <div className="space-y-3">
                  {lead.telephone && (
                    <div>
                      <label className="text-sm text-gray-500">Telephone</label>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <a href={`tel:${lead.telephone}`} className="text-purple-600 hover:underline">
                          {lead.telephone}
                        </a>
                      </p>
                    </div>
                  )}
                  {lead.emailGenerique && (
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <a href={`mailto:${lead.emailGenerique}`} className="text-purple-600 hover:underline">
                          {lead.emailGenerique}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informations Business */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="text-purple-600" size={20} />
                Informations Business
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.secteurActivite && (
                  <div>
                    <label className="text-sm text-gray-500">Secteur d'activite</label>
                    <p className="font-medium text-gray-900">{lead.secteurActivite}</p>
                  </div>
                )}
                {lead.formeJuridique && (
                  <div>
                    <label className="text-sm text-gray-500">Forme juridique</label>
                    <p className="font-medium text-gray-900">{lead.formeJuridique}</p>
                  </div>
                )}
                {lead.siren && (
                  <div>
                    <label className="text-sm text-gray-500">SIREN</label>
                    <p className="font-medium text-gray-900">{lead.siren}</p>
                  </div>
                )}
                {lead.siret && (
                  <div>
                    <label className="text-sm text-gray-500">SIRET</label>
                    <p className="font-medium text-gray-900">{lead.siret}</p>
                  </div>
                )}
                {lead.codeNaf && (
                  <div>
                    <label className="text-sm text-gray-500">Code NAF</label>
                    <p className="font-medium text-gray-900">{lead.codeNaf}</p>
                  </div>
                )}
                {lead.effectifTranche && (
                  <div>
                    <label className="text-sm text-gray-500">Effectif</label>
                    <p className="font-medium text-gray-900">{lead.effectifTranche}</p>
                  </div>
                )}
                {lead.chiffreAffairesTranche && (
                  <div>
                    <label className="text-sm text-gray-500">Chiffre d'affaires</label>
                    <p className="font-medium text-gray-900">{lead.chiffreAffairesTranche}</p>
                  </div>
                )}
              </div>
              {lead.descriptionActivite && (
                <div className="mt-4 pt-4 border-t">
                  <label className="text-sm text-gray-500">Description</label>
                  <p className="text-gray-700 mt-1">{lead.descriptionActivite}</p>
                </div>
              )}
            </div>

            {/* Produits */}
            {lead.produits && lead.produits.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="text-purple-600" size={20} />
                  Produits / Categories
                </h2>
                <div className="flex flex-wrap gap-2">
                  {lead.produits.map((produit, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {produit}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Source */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="text-purple-600" size={20} />
                Source
              </h2>
              {lead.salonSource && (
                <div className="mb-3">
                  <label className="text-sm text-gray-500">Salon</label>
                  <p className="font-medium text-gray-900">{lead.salonSource.nom}</p>
                </div>
              )}
              {lead.numeroStand && (
                <div className="mb-3">
                  <label className="text-sm text-gray-500">Stand</label>
                  <p className="font-medium text-gray-900">{lead.numeroStand}</p>
                </div>
              )}
              {lead.urlPageExposant && (
                <a
                  href={lead.urlPageExposant}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline text-sm flex items-center gap-1"
                >
                  <ExternalLink size={14} />
                  Page exposant
                </a>
              )}
            </div>

            {/* Liens */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="text-purple-600" size={20} />
                Liens
              </h2>
              <div className="space-y-2">
                {lead.siteWeb && (
                  <a
                    href={lead.siteWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-600 hover:underline"
                  >
                    <Globe size={16} />
                    Site web
                  </a>
                )}
                {lead.linkedinCompanyUrl && (
                  <a
                    href={lead.linkedinCompanyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-600 hover:underline"
                  >
                    <ExternalLink size={16} />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="text-purple-600" size={20} />
                Historique
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-gray-500">Cree le</label>
                  <p className="font-medium text-gray-900">
                    {new Date(lead.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {lead.dateAddedToPool && (
                  <div>
                    <label className="text-gray-500">Ajoute au pool</label>
                    <p className="font-medium text-gray-900">
                      {new Date(lead.dateAddedToPool).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {lead.lastContactAttempt && (
                  <div>
                    <label className="text-gray-500">Dernier contact</label>
                    <p className="font-medium text-gray-900">
                      {new Date(lead.lastContactAttempt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Commercial */}
            {lead.commercialAssigne && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="text-purple-600" size={20} />
                  Commercial assigne
                </h2>
                <p className="font-medium text-gray-900">{lead.commercialAssigne.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
