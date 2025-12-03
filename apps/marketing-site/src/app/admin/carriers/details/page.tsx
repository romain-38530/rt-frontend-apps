'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Types
interface Document {
  _id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  expiryDate?: string;
  ocrData?: any;
}

interface Carrier {
  _id: string;
  email: string;
  companyName: string;
  siret: string;
  vatNumber: string;
  phone: string;
  address: string;
  status: 'guest' | 'referenced' | 'premium';
  referenceMode: string;
  vigilanceStatus: 'compliant' | 'warning' | 'blocked';
  score: number;
  isInDispatchChain: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  invitedAt: string;
  onboardedAt?: string;
  documents: Document[];
  pricingGrids: any[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ddaywxps9n701.cloudfront.net';

const DOCUMENT_TYPES = {
  kbis: 'Kbis',
  urssaf: 'Attestation URSSAF',
  insurance: 'Assurance Transport',
  license: 'Licence de Transport',
  rib: 'RIB',
  id_card: 'Pièce d\'identité'
};

function CarrierDetailsContent() {
  const searchParams = useSearchParams();
  const carrierId = searchParams.get('id') || '';

  const [carrier, setCarrier] = useState<Carrier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    fetchCarrier();
  }, [carrierId]);

  const fetchCarrier = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/carriers/${carrierId}`);
      const data = await response.json();

      if (data.success) {
        setCarrier(data.carrier);
      } else {
        setError('Transporteur non trouvé');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboard = async () => {
    if (!confirm('Voulez-vous valider l\'onboarding de ce transporteur ? (passage Niveau 2 → Niveau 1)')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/carriers/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierId })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Onboarding réussi ! Score: ${data.score}`);
        fetchCarrier();
      } else {
        alert(`Erreur: ${data.error?.message}`);
      }
    } catch (err) {
      alert('Erreur de connexion au serveur');
    }
  };

  const handleCalculateScore = async () => {
    try {
      const response = await fetch(`${API_URL}/api/carriers/${carrierId}/calculate-score`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        alert(`Score recalculé: ${data.score} points`);
        fetchCarrier();
      }
    } catch (err) {
      alert('Erreur lors du calcul du score');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      guest: { bg: 'bg-gray-100', text: 'text-gray-800', label: '👥 Niveau 2 - Invité' },
      referenced: { bg: 'bg-blue-100', text: 'text-blue-800', label: '✅ Niveau 1 - Référencé' },
      premium: { bg: 'bg-purple-100', text: 'text-purple-800', label: '⭐ Niveau 1+ - Premium' }
    };

    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getVigilanceBadge = (vigilanceStatus: string) => {
    const badges = {
      compliant: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Conforme' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⚠️ Alerte' },
      blocked: { bg: 'bg-red-100', text: 'text-red-800', label: '🚫 Bloqué' }
    };

    const badge = badges[vigilanceStatus as keyof typeof badges];
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getDocumentStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ En attente' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Vérifié' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Rejeté' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-800', label: '📅 Expiré' }
    };

    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !carrier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
            <p className="text-red-800 font-semibold">{error}</p>
            <Link href="/admin/carriers" className="text-blue-600 hover:text-blue-800 font-semibold mt-4 inline-block">
              ← Retour à la liste
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/carriers" className="text-blue-600 hover:text-blue-800 font-semibold mb-4 inline-block">
            ← Retour à la liste
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {carrier.companyName}
              </h1>
              <div className="flex items-center gap-3">
                {getStatusBadge(carrier.status)}
                {getVigilanceBadge(carrier.vigilanceStatus)}
                {carrier.isBlocked && (
                  <span className="px-4 py-2 rounded-full text-sm font-bold bg-red-100 text-red-800">
                    🚫 Bloqué
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Score</p>
              <p className="text-5xl font-bold text-gray-900">{carrier.score}</p>
              <p className="text-sm text-gray-500">points</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-gray-900 font-semibold">{carrier.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Téléphone</p>
                  <p className="text-gray-900 font-semibold">{carrier.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">SIRET</p>
                  <p className="text-gray-900 font-semibold">{carrier.siret}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Numéro de TVA</p>
                  <p className="text-gray-900 font-semibold">{carrier.vatNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Adresse</p>
                  <p className="text-gray-900 font-semibold">{carrier.address}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Documents de Vigilance</h2>
                <span className="text-sm text-gray-600">
                  {carrier.documents.filter(d => d.status === 'verified').length} / 4 obligatoires
                </span>
              </div>

              <div className="space-y-4">
                {Object.entries(DOCUMENT_TYPES).map(([type, label]) => {
                  const doc = carrier.documents.find(d => d.documentType === type);

                  return (
                    <div key={type} className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{label}</p>
                          {doc && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">{doc.fileName}</p>
                              {doc.expiryDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Expire le: {new Date(doc.expiryDate).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          {doc ? (
                            getDocumentStatusBadge(doc.status)
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                              Non fourni
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {carrier.status === 'guest' && (
                  <button
                    onClick={handleOnboard}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all"
                  >
                    ✅ Onboarder (Niveau 1)
                  </button>
                )}

                <button
                  onClick={handleCalculateScore}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  📊 Recalculer le Score
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Invité le</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(carrier.invitedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {carrier.onboardedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Onboardé le</p>
                    <p className="text-gray-900 font-semibold">
                      {new Date(carrier.onboardedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Mode de référencement</p>
                  <p className="text-gray-900 font-semibold capitalize">{carrier.referenceMode}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Chaîne d'affectation</p>
                  <p className="text-gray-900 font-semibold">
                    {carrier.isInDispatchChain ? '✅ Oui' : '❌ Non'}
                  </p>
                </div>

                {carrier.isBlocked && carrier.blockedReason && (
                  <div>
                    <p className="text-sm text-red-600 font-semibold">Raison du blocage</p>
                    <p className="text-red-800">{carrier.blockedReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CarrierDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <CarrierDetailsContent />
    </Suspense>
  );
}
