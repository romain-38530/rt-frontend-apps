/**
 * Page Grille Tarifaire - Portail Transporter
 * Consultez et négociez vos tarifs avec les industriels
 * Accessible uniquement si le transporteur est conforme (documents à jour)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { carriersApi } from '../lib/api';
import { useToast } from '@rt/ui-components';

interface PricingZone {
  origin: string;
  destination: string;
  distance: number;
  basePrice: number;
  negotiatedPrice?: number;
  lastUpdated?: string;
  status: 'active' | 'pending' | 'expired';
}

interface IndustrialPricing {
  industrialId: string;
  industrialName: string;
  contractType: 'spot' | 'contract' | 'framework';
  validFrom: string;
  validUntil: string;
  zones: PricingZone[];
  fuelSurcharge: {
    type: 'fixed' | 'indexed';
    value: number;
    reference?: string;
  };
  paymentTerms: number;
  volumeDiscounts?: Array<{
    threshold: number;
    discount: number;
  }>;
}

interface PricingData {
  carrierId: string;
  isCompliant: boolean;
  complianceScore: number;
  industrials: IndustrialPricing[];
  pendingNegotiations: Array<{
    id: string;
    industrialId: string;
    industrialName: string;
    zoneId: string;
    proposedPrice: number;
    currentPrice: number;
    status: 'pending' | 'accepted' | 'rejected' | 'counter_offer';
    submittedAt: string;
    counterOffer?: number;
  }>;
}

export default function GrilleTarifairePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompliant, setIsCompliant] = useState(false);
  const [selectedIndustrial, setSelectedIndustrial] = useState<IndustrialPricing | null>(null);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [negotiationZone, setNegotiationZone] = useState<PricingZone | null>(null);
  const [proposedPrice, setProposedPrice] = useState('');

  const checkComplianceAndLoadData = async () => {
    setIsLoading(true);
    try {
      // Vérifier la conformité d'abord
      const vigilance = await carriersApi.getVigilanceStatus();
      const score = vigilance?.complianceScore || vigilance?.score || 0;
      const compliant = score >= 80 && (vigilance?.overallStatus === 'compliant' || vigilance?.status === 'compliant');
      setIsCompliant(compliant);

      if (!compliant) {
        // Rediriger vers vigilance si non conforme
        toast.error('Vous devez être conforme pour accéder à la grille tarifaire');
        setTimeout(() => router.push('/vigilance'), 2000);
        return;
      }

      // Charger les données tarifaires (mock pour l'instant)
      const mockData: PricingData = {
        carrierId: 'carrier-123',
        isCompliant: true,
        complianceScore: score,
        industrials: [
          {
            industrialId: 'ind-1',
            industrialName: 'Carrefour Supply Chain',
            contractType: 'contract',
            validFrom: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            validUntil: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
            zones: [
              { origin: 'Paris (75)', destination: 'Lyon (69)', distance: 465, basePrice: 850, negotiatedPrice: 820, status: 'active', lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
              { origin: 'Paris (75)', destination: 'Marseille (13)', distance: 775, basePrice: 1150, negotiatedPrice: 1100, status: 'active', lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
              { origin: 'Lyon (69)', destination: 'Bordeaux (33)', distance: 550, basePrice: 950, status: 'active' },
              { origin: 'Lille (59)', destination: 'Paris (75)', distance: 225, basePrice: 450, negotiatedPrice: 430, status: 'active', lastUpdated: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
            ],
            fuelSurcharge: { type: 'indexed', value: 15.2, reference: 'CNR Gazole' },
            paymentTerms: 30,
            volumeDiscounts: [
              { threshold: 50, discount: 3 },
              { threshold: 100, discount: 5 },
              { threshold: 200, discount: 8 },
            ]
          },
          {
            industrialId: 'ind-2',
            industrialName: 'Auchan Logistique',
            contractType: 'framework',
            validFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            validUntil: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString(),
            zones: [
              { origin: 'Roubaix (59)', destination: 'Paris (75)', distance: 230, basePrice: 480, status: 'active' },
              { origin: 'Roubaix (59)', destination: 'Lyon (69)', distance: 680, basePrice: 1050, negotiatedPrice: 980, status: 'active', lastUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
              { origin: 'Toulouse (31)', destination: 'Marseille (13)', distance: 405, basePrice: 720, status: 'pending' },
            ],
            fuelSurcharge: { type: 'fixed', value: 12 },
            paymentTerms: 45,
          },
        ],
        pendingNegotiations: [
          {
            id: 'neg-1',
            industrialId: 'ind-2',
            industrialName: 'Auchan Logistique',
            zoneId: 'zone-3',
            proposedPrice: 680,
            currentPrice: 720,
            status: 'pending',
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]
      };

      setData(mockData);
      if (mockData.industrials.length > 0) {
        setSelectedIndustrial(mockData.industrials[0]);
      }
    } catch (err) {
      console.error('Error loading pricing data:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    checkComplianceAndLoadData();
  }, []);

  const handleProposePrice = (zone: PricingZone) => {
    setNegotiationZone(zone);
    setProposedPrice(zone.negotiatedPrice?.toString() || zone.basePrice.toString());
    setShowNegotiationModal(true);
  };

  const submitNegotiation = async () => {
    if (!negotiationZone || !proposedPrice) return;

    try {
      // API call to submit negotiation
      toast.success('Proposition tarifaire envoyée !');
      setShowNegotiationModal(false);
      setNegotiationZone(null);
      setProposedPrice('');
      // Reload data
      checkComplianceAndLoadData();
    } catch (err) {
      toast.error('Erreur lors de l\'envoi de la proposition');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <Head>
        <title>Grille Tarifaire - Transporter | SYMPHONI.A</title>
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.2)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>💰</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                Grille Tarifaire
              </h1>
            </div>
          </div>
          {data && (
            <div style={{
              padding: '8px 16px',
              background: 'rgba(16,185,129,0.2)',
              borderRadius: '20px',
              fontSize: '14px',
              color: '#10b981',
              fontWeight: '600',
            }}>
              ✓ Conforme ({data.complianceScore}%)
            </div>
          )}
        </div>

        {/* Contenu */}
        <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Chargement...</p>
            </div>
          ) : !isCompliant ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <h2 style={{ marginBottom: '16px' }}>Accès restreint</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
                Vous devez mettre vos documents à jour pour accéder à la grille tarifaire.
              </p>
              <button
                onClick={() => router.push('/vigilance')}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '16px',
                }}
              >
                📄 Mettre à jour mes documents
              </button>
            </div>
          ) : data && (
            <>
              {/* Négociations en cours */}
              {data.pendingNegotiations.length > 0 && (
                <div
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '32px',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}
                >
                  <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⏳</span> Négociations en cours ({data.pendingNegotiations.length})
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.pendingNegotiations.map((neg) => (
                      <div
                        key={neg.id}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{neg.industrialName}</div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                            Prix proposé: {formatPrice(neg.proposedPrice)} (actuel: {formatPrice(neg.currentPrice)})
                          </div>
                        </div>
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: neg.status === 'pending' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                          color: neg.status === 'pending' ? '#f59e0b' : '#10b981',
                        }}>
                          {neg.status === 'pending' ? 'En attente' : neg.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sélecteur d'industriel */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {data.industrials.map((ind) => (
                  <button
                    key={ind.industrialId}
                    onClick={() => setSelectedIndustrial(ind)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      border: selectedIndustrial?.industrialId === ind.industrialId
                        ? '2px solid #667eea'
                        : '1px solid rgba(255,255,255,0.2)',
                      background: selectedIndustrial?.industrialId === ind.industrialId
                        ? 'rgba(102,126,234,0.2)'
                        : 'rgba(255,255,255,0.05)',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                    }}
                  >
                    {ind.industrialName}
                  </button>
                ))}
              </div>

              {/* Détails de l'industriel sélectionné */}
              {selectedIndustrial && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    padding: '32px',
                  }}
                >
                  {/* En-tête */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                        {selectedIndustrial.industrialName}
                      </h2>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          background: 'rgba(102,126,234,0.2)',
                          color: '#667eea',
                        }}>
                          {selectedIndustrial.contractType === 'contract' ? '📋 Contrat' :
                           selectedIndustrial.contractType === 'framework' ? '📑 Accord-cadre' : '⚡ Spot'}
                        </span>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                          Valide jusqu'au {formatDate(selectedIndustrial.validUntil)}
                          {getDaysRemaining(selectedIndustrial.validUntil) <= 30 && (
                            <span style={{ color: '#f59e0b', marginLeft: '8px' }}>
                              ({getDaysRemaining(selectedIndustrial.validUntil)} jours restants)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                        Indice carburant
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>
                        {selectedIndustrial.fuelSurcharge.type === 'indexed'
                          ? `${selectedIndustrial.fuelSurcharge.value}% (${selectedIndustrial.fuelSurcharge.reference})`
                          : `${selectedIndustrial.fuelSurcharge.value}% fixe`}
                      </div>
                    </div>
                  </div>

                  {/* Remises volume */}
                  {selectedIndustrial.volumeDiscounts && selectedIndustrial.volumeDiscounts.length > 0 && (
                    <div style={{
                      background: 'rgba(16,185,129,0.1)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '24px',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                        📊 Remises volume
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {selectedIndustrial.volumeDiscounts.map((disc, idx) => (
                          <span key={idx} style={{
                            padding: '4px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            background: 'rgba(255,255,255,0.1)',
                          }}>
                            {disc.threshold}+ transports → -{disc.discount}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tableau des zones */}
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                    Zones tarifaires
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Origine</th>
                          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Destination</th>
                          <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Distance</th>
                          <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Tarif base</th>
                          <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Tarif négocié</th>
                          <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedIndustrial.zones.map((zone, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '16px 8px', fontWeight: '600' }}>{zone.origin}</td>
                            <td style={{ padding: '16px 8px' }}>{zone.destination}</td>
                            <td style={{ padding: '16px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>{zone.distance} km</td>
                            <td style={{ padding: '16px 8px', textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>{formatPrice(zone.basePrice)}</td>
                            <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                              {zone.negotiatedPrice ? (
                                <span style={{ color: '#10b981', fontWeight: '700' }}>
                                  {formatPrice(zone.negotiatedPrice)}
                                  <span style={{ fontSize: '11px', marginLeft: '4px', color: 'rgba(255,255,255,0.5)' }}>
                                    (-{Math.round((1 - zone.negotiatedPrice / zone.basePrice) * 100)}%)
                                  </span>
                                </span>
                              ) : (
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleProposePrice(zone)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >
                                {zone.negotiatedPrice ? 'Renégocier' : 'Proposer'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Info paiement */}
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'rgba(59,130,246,0.1)',
                    borderRadius: '12px',
                    borderLeft: '4px solid #3b82f6',
                  }}>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                      <strong>Conditions de paiement</strong> : {selectedIndustrial.paymentTerms} jours fin de mois
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de négociation */}
        {showNegotiationModal && negotiationZone && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowNegotiationModal(false)}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                Proposition tarifaire
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                  Zone
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {negotiationZone.origin} → {negotiationZone.destination}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    Tarif actuel
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {formatPrice(negotiationZone.negotiatedPrice || negotiationZone.basePrice)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                    Distance
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>
                    {negotiationZone.distance} km
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
                  Votre proposition (€ HT)
                </label>
                <input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '700',
                  }}
                  placeholder="0.00"
                />
                {proposedPrice && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                    €/km: {(parseFloat(proposedPrice) / negotiationZone.distance).toFixed(2)} €
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowNegotiationModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={submitNegotiation}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Envoyer la proposition
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
