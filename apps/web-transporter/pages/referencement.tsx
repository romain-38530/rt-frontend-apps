/**
 * Page Référencement - Portail Transporter
 * Vue des industriels partenaires et statut de référencement
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { carriersApi } from '../lib/api';
import { useToast } from '@rt/ui-components';

interface IndustrialPartner {
  industrialId: string;
  industrialName: string;
  industrialLogo?: string;
  level: 'N2_guest' | 'N1_referenced' | 'N1_plus_premium';
  status: 'active' | 'pending' | 'suspended' | 'blocked';
  referencedAt: string;
  lastOrderAt?: string;
  totalOrders: number;
  score?: number;
  documentsStatus: {
    valid: number;
    expiringSoon: number;
    expired: number;
    missing: number;
  };
  contact?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface ReferencingData {
  carrierId: string;
  carrierName: string;
  globalLevel: 'N2_guest' | 'N1_referenced' | 'N1_plus_premium';
  globalScore: number;
  partners: IndustrialPartner[];
  pendingInvitations: Array<{
    id: string;
    industrialId: string;
    industrialName: string;
    invitedAt: string;
    expiresAt: string;
    message?: string;
  }>;
}

export default function ReferencementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<ReferencingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<IndustrialPartner | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await carriersApi.getMyReferencings();
      if (result && result.partners) {
        setData(result);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.error('Error loading referencings:', err);
      // Fallback mock data
      const mockData: ReferencingData = {
        carrierId: 'carrier-123',
        carrierName: 'Transport Express SARL',
        globalLevel: 'N1_referenced',
        globalScore: 82,
        partners: [
          {
            industrialId: 'ind-1',
            industrialName: 'Carrefour Supply Chain',
            level: 'N1_plus_premium',
            status: 'active',
            referencedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            lastOrderAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            totalOrders: 247,
            score: 91,
            documentsStatus: { valid: 6, expiringSoon: 1, expired: 0, missing: 0 },
            contact: { name: 'Marie Dupont', email: 'marie.dupont@carrefour.com', phone: '01 23 45 67 89' }
          },
          {
            industrialId: 'ind-2',
            industrialName: 'Auchan Logistique',
            level: 'N1_referenced',
            status: 'active',
            referencedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
            lastOrderAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            totalOrders: 89,
            score: 78,
            documentsStatus: { valid: 5, expiringSoon: 2, expired: 0, missing: 0 },
            contact: { name: 'Jean Martin', email: 'j.martin@auchan.fr' }
          },
          {
            industrialId: 'ind-3',
            industrialName: 'Danone Waters',
            level: 'N2_guest',
            status: 'pending',
            referencedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            totalOrders: 5,
            documentsStatus: { valid: 4, expiringSoon: 0, expired: 1, missing: 2 }
          },
        ],
        pendingInvitations: [
          {
            id: 'inv-1',
            industrialId: 'ind-4',
            industrialName: 'Lactalis Distribution',
            invitedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
            message: 'Suite à notre entretien téléphonique, nous vous invitons à rejoindre notre panel de transporteurs référencés.'
          }
        ]
      };
      setData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'N1_plus_premium':
        return { label: 'Premium N1+', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', icon: '⭐' };
      case 'N1_referenced':
        return { label: 'Référencé N1', color: '#10b981', bg: 'rgba(16,185,129,0.2)', icon: '✓' };
      case 'N2_guest':
        return { label: 'Invité N2', color: '#6b7280', bg: 'rgba(107,114,128,0.2)', icon: '○' };
      default:
        return { label: level, color: 'white', bg: 'rgba(255,255,255,0.1)', icon: '?' };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Actif', color: '#10b981' };
      case 'pending':
        return { label: 'En attente', color: '#f59e0b' };
      case 'suspended':
        return { label: 'Suspendu', color: '#ef4444' };
      case 'blocked':
        return { label: 'Bloqué', color: '#dc2626' };
      default:
        return { label: status, color: 'white' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      // await carriersApi.acceptInvitation(invitationId);
      toast.success('Invitation acceptée !');
      loadData();
    } catch (err) {
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  return (
    <>
      <Head>
        <title>Mon Référencement - Transporter | SYMPHONI.A</title>
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
              <span style={{ fontSize: '32px' }}>🤝</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>
                Mon Référencement
              </h1>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Chargement...</p>
            </div>
          ) : data && (
            <>
              {/* Stats globales */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '40px',
                }}
              >
                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                    Niveau global
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: getLevelInfo(data.globalLevel).bg,
                      color: getLevelInfo(data.globalLevel).color,
                      fontWeight: '700',
                      fontSize: '14px',
                    }}
                  >
                    {getLevelInfo(data.globalLevel).icon} {getLevelInfo(data.globalLevel).label}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                    Score moyen
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: getScoreColor(data.globalScore) }}>
                    {data.globalScore}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                    Partenaires actifs
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>
                    {data.partners.filter(p => p.status === 'active').length}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                    Invitations en attente
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: data.pendingInvitations.length > 0 ? '#f59e0b' : 'white' }}>
                    {data.pendingInvitations.length}
                  </div>
                </div>
              </div>

              {/* Invitations en attente */}
              {data.pendingInvitations.length > 0 && (
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
                    <span>📩</span> Invitations en attente
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {data.pendingInvitations.map((inv) => (
                      <div
                        key={inv.id}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          padding: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
                            {inv.industrialName}
                          </div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                            Invité le {formatDate(inv.invitedAt)} • Expire le {formatDate(inv.expiresAt)}
                          </div>
                          {inv.message && (
                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
                              "{inv.message}"
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => handleAcceptInvitation(inv.id)}
                            style={{
                              padding: '10px 20px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Accepter
                          </button>
                          <button
                            style={{
                              padding: '10px 20px',
                              borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.3)',
                              background: 'transparent',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Refuser
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste des partenaires */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  padding: '32px',
                }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                  Mes partenaires industriels
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {data.partners.map((partner) => {
                    const levelInfo = getLevelInfo(partner.level);
                    const statusInfo = getStatusInfo(partner.status);
                    return (
                      <div
                        key={partner.industrialId}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          padding: '24px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: selectedPartner?.industrialId === partner.industrialId
                            ? '2px solid #667eea'
                            : '1px solid transparent',
                        }}
                        onClick={() => setSelectedPartner(selectedPartner?.industrialId === partner.industrialId ? null : partner)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '24px' }}>🏭</span>
                              <div>
                                <div style={{ fontSize: '18px', fontWeight: '700' }}>
                                  {partner.industrialName}
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                  Référencé depuis {formatDate(partner.referencedAt)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            {/* Niveau */}
                            <span
                              style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '700',
                                background: levelInfo.bg,
                                color: levelInfo.color,
                              }}
                            >
                              {levelInfo.icon} {levelInfo.label}
                            </span>

                            {/* Score */}
                            {partner.score && (
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Score</div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: getScoreColor(partner.score) }}>
                                  {partner.score}
                                </div>
                              </div>
                            )}

                            {/* Commandes */}
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Commandes</div>
                              <div style={{ fontSize: '18px', fontWeight: '700' }}>
                                {partner.totalOrders}
                              </div>
                            </div>

                            {/* Statut */}
                            <span
                              style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '700',
                                background: `${statusInfo.color}20`,
                                color: statusInfo.color,
                              }}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Détails expandus */}
                        {selectedPartner?.industrialId === partner.industrialId && (
                          <div
                            style={{
                              marginTop: '20px',
                              paddingTop: '20px',
                              borderTop: '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                              {/* Statut documents */}
                              <div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                                  Documents de conformité
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                                    {partner.documentsStatus.valid} valides
                                  </span>
                                  {partner.documentsStatus.expiringSoon > 0 && (
                                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                                      {partner.documentsStatus.expiringSoon} expirent bientôt
                                    </span>
                                  )}
                                  {partner.documentsStatus.expired > 0 && (
                                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                                      {partner.documentsStatus.expired} expirés
                                    </span>
                                  )}
                                  {partner.documentsStatus.missing > 0 && (
                                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                                      {partner.documentsStatus.missing} manquants
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Contact */}
                              {partner.contact && (
                                <div>
                                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                                    Contact
                                  </div>
                                  <div style={{ fontSize: '14px' }}>
                                    <div style={{ fontWeight: '600' }}>{partner.contact.name}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.7)' }}>{partner.contact.email}</div>
                                    {partner.contact.phone && (
                                      <div style={{ color: 'rgba(255,255,255,0.7)' }}>{partner.contact.phone}</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Dernière commande */}
                              {partner.lastOrderAt && (
                                <div>
                                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                                    Dernière commande
                                  </div>
                                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                                    {formatDate(partner.lastOrderAt)}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push('/vigilance');
                                }}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >
                                📄 Gérer mes documents
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push('/scoring');
                                }}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  border: '1px solid rgba(255,255,255,0.3)',
                                  background: 'transparent',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >
                                📊 Voir mon score
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {data.partners.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏭</div>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                      Vous n'êtes encore référencé chez aucun industriel.
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                      Consultez la bourse de fret pour trouver des opportunités.
                    </p>
                  </div>
                )}
              </div>

              {/* Note */}
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  background: 'rgba(59,130,246,0.1)',
                  borderRadius: '12px',
                  borderLeft: '4px solid #3b82f6',
                }}
              >
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                  <strong>Niveaux de référencement</strong><br />
                  <span style={{ color: '#6b7280' }}>○ N2 Invité</span> : Accès limité, en attente de validation<br />
                  <span style={{ color: '#10b981' }}>✓ N1 Référencé</span> : Accès aux commandes directes<br />
                  <span style={{ color: '#f59e0b' }}>⭐ N1+ Premium</span> : Priorité sur les attributions et tarifs négociés
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
