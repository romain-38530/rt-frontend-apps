/**
 * Page Mes Affectations - Portail Transporter
 * Affiche les demandes de transport en attente de reponse avec compteur
 * Permet d'accepter ou refuser avec raison
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getCurrentUser } from '../lib/auth';
import { useToast } from '@rt/ui-components';
import { API_CONFIG } from '../lib/api';

interface DispatchRequest {
  orderId: string;
  orderReference: string;
  pickupCity: string;
  deliveryCity: string;
  pickupDate: string;
  deliveryDate: string;
  weight: number;
  estimatedPrice: number;
  currency: string;
  score: number;
  position: number;
  sentAt: string;
  timeoutAt: string;
  remainingSeconds: number;
  industrialName: string;
}

interface RefusalReason {
  id: string;
  label: string;
}

const REFUSAL_REASONS: RefusalReason[] = [
  { id: 'no_capacity', label: 'Pas de capacite disponible' },
  { id: 'price_too_low', label: 'Prix trop bas' },
  { id: 'route_not_covered', label: 'Route non couverte' },
  { id: 'timing_issue', label: 'Probleme de timing' },
  { id: 'vehicle_unavailable', label: 'Vehicule indisponible' },
  { id: 'other', label: 'Autre raison' },
];

export default function MesAffectationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<DispatchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRefuseModal, setShowRefuseModal] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [processing, setProcessing] = useState<string | null>(null);

  // Charger les demandes en attente
  const loadRequests = useCallback(async () => {
    try {
      const user = getCurrentUser();
      if (!user?.carrierId) {
        setError('Identifiant transporteur non trouve');
        setIsLoading(false);
        return;
      }

      // Appeler l'API pour recuperer les commandes en attente de reponse
      const response = await fetch(
        `${API_CONFIG.ORDERS_API}/api/orders/carrier/${user.carrierId}/pending-dispatch`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des demandes');
      }

      const data = await response.json();
      setRequests(data.data || []);
    } catch (err: any) {
      console.error('Error loading dispatch requests:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mettre a jour les compteurs chaque seconde
  useEffect(() => {
    const timer = setInterval(() => {
      setRequests(prev => prev.map(req => ({
        ...req,
        remainingSeconds: Math.max(0, req.remainingSeconds - 1)
      })));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Recharger periodiquement (toutes les 30 secondes)
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadRequests();
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, [loadRequests, router]);

  // Formater le temps restant
  const formatRemainingTime = (seconds: number) => {
    if (seconds <= 0) return 'Expire';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Couleur selon le temps restant
  const getTimeColor = (seconds: number) => {
    if (seconds <= 0) return '#dc2626';
    if (seconds < 300) return '#f59e0b'; // < 5 min
    if (seconds < 900) return '#eab308'; // < 15 min
    return '#22c55e';
  };

  // Accepter une commande
  const handleAccept = async (orderId: string) => {
    const user = getCurrentUser();
    if (!user?.carrierId) return;

    setProcessing(orderId);
    try {
      const response = await fetch(
        `${API_CONFIG.ORDERS_API}/api/orders/${orderId}/carrier-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            carrierId: user.carrierId,
            response: 'accepted',
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Commande acceptee avec succes !');
        // Retirer de la liste
        setRequests(prev => prev.filter(r => r.orderId !== orderId));
        // Rediriger vers le detail
        router.push(`/orders/${orderId}`);
      } else {
        throw new Error(data.error || 'Erreur lors de l\'acceptation');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Refuser une commande
  const handleRefuse = async (orderId: string) => {
    const user = getCurrentUser();
    if (!user?.carrierId) return;

    const reason = selectedReason === 'other' ? customReason :
      REFUSAL_REASONS.find(r => r.id === selectedReason)?.label || selectedReason;

    if (!reason) {
      toast.error('Veuillez selectionner une raison');
      return;
    }

    setProcessing(orderId);
    try {
      const response = await fetch(
        `${API_CONFIG.ORDERS_API}/api/orders/${orderId}/carrier-response`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            carrierId: user.carrierId,
            response: 'refused',
            reason,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Commande refusee');
        setShowRefuseModal(null);
        setSelectedReason('');
        setCustomReason('');
        // Retirer de la liste
        setRequests(prev => prev.filter(r => r.orderId !== orderId));
      } else {
        throw new Error(data.error || 'Erreur lors du refus');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(price);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚛</div>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Chargement des demandes...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Mes Affectations - Transporter | SYMPHONI.A</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div style={{
          padding: '20px 40px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, marginBottom: '4px' }}>
                  Mes Affectations
                </h1>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Demandes de transport en attente de votre reponse
                </div>
              </div>
              <div style={{
                padding: '12px 20px',
                backgroundColor: requests.length > 0 ? '#fef3c7' : '#d1fae5',
                borderRadius: '12px',
                fontWeight: '700',
                color: requests.length > 0 ? '#92400e' : '#065f46',
              }}>
                {requests.length} demande{requests.length !== 1 ? 's' : ''} en attente
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          {error && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              marginBottom: '24px',
            }}>
              {error}
            </div>
          )}

          {requests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>✨</div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#111827' }}>
                Aucune demande en attente
              </h2>
              <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '400px', margin: '0 auto' }}>
                Vous n'avez pas de nouvelle demande de transport pour le moment.
                Les nouvelles demandes apparaitront ici automatiquement.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {requests.map((request) => (
                <div
                  key={request.orderId}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    border: request.remainingSeconds < 300 ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                  }}
                >
                  {/* Header de la carte */}
                  <div style={{
                    padding: '20px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                        {request.industrialName}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700' }}>
                        {request.orderReference}
                      </div>
                    </div>

                    {/* Compteur de temps */}
                    <div style={{
                      textAlign: 'center',
                      padding: '12px 20px',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                    }}>
                      <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>
                        Temps restant
                      </div>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: '800',
                        fontFamily: 'monospace',
                        color: getTimeColor(request.remainingSeconds),
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}>
                        {formatRemainingTime(request.remainingSeconds)}
                      </div>
                    </div>
                  </div>

                  {/* Corps de la carte */}
                  <div style={{ padding: '24px' }}>
                    {/* Itineraire */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '20px',
                    }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Collecte</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#15803d' }}>
                          {request.pickupCity}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {formatDate(request.pickupDate)}
                        </div>
                      </div>

                      <div style={{ fontSize: '24px' }}>➜</div>

                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Livraison</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e40af' }}>
                          {request.deliveryCity}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {formatDate(request.deliveryDate)}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '16px',
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '20px',
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Poids</div>
                        <div style={{ fontSize: '16px', fontWeight: '700' }}>{request.weight} kg</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Prix propose</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669' }}>
                          {formatPrice(request.estimatedPrice, request.currency)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Votre score</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#667eea' }}>
                          {request.score}/100
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Position</div>
                        <div style={{ fontSize: '16px', fontWeight: '700' }}>
                          #{request.position}
                        </div>
                      </div>
                    </div>

                    {/* Boutons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleAccept(request.orderId)}
                        disabled={processing === request.orderId || request.remainingSeconds <= 0}
                        style={{
                          flex: 1,
                          padding: '16px 24px',
                          background: request.remainingSeconds <= 0 ? '#9ca3af' :
                            'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '700',
                          cursor: request.remainingSeconds <= 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: request.remainingSeconds > 0 ? '0 4px 12px rgba(34, 197, 94, 0.4)' : 'none',
                        }}
                      >
                        {processing === request.orderId ? '...' : '✅ Accepter'}
                      </button>

                      <button
                        onClick={() => setShowRefuseModal(request.orderId)}
                        disabled={processing === request.orderId || request.remainingSeconds <= 0}
                        style={{
                          flex: 1,
                          padding: '16px 24px',
                          backgroundColor: request.remainingSeconds <= 0 ? '#f3f4f6' : 'white',
                          color: request.remainingSeconds <= 0 ? '#9ca3af' : '#dc2626',
                          border: `2px solid ${request.remainingSeconds <= 0 ? '#e5e7eb' : '#dc2626'}`,
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '700',
                          cursor: request.remainingSeconds <= 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        ❌ Refuser
                      </button>

                      <button
                        onClick={() => router.push(`/orders/${request.orderId}`)}
                        style={{
                          padding: '16px 20px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Voir details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de refus */}
      {showRefuseModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              Refuser la commande
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              Veuillez indiquer la raison de votre refus. Cette information sera transmise au donneur d'ordre.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {REFUSAL_REASONS.map((reason) => (
                <label
                  key={reason.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: selectedReason === reason.id ? '#fee2e2' : '#f9fafb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: selectedReason === reason.id ? '2px solid #dc2626' : '2px solid transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="refusalReason"
                    value={reason.id}
                    checked={selectedReason === reason.id}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    style={{ accentColor: '#dc2626' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{reason.label}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'other' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Precisez la raison..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '24px',
                  resize: 'vertical',
                  minHeight: '80px',
                }}
              />
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowRefuseModal(null);
                  setSelectedReason('');
                  setCustomReason('');
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleRefuse(showRefuseModal)}
                disabled={!selectedReason || (selectedReason === 'other' && !customReason)}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: !selectedReason || (selectedReason === 'other' && !customReason)
                    ? '#f3f4f6' : '#dc2626',
                  color: !selectedReason || (selectedReason === 'other' && !customReason)
                    ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: !selectedReason || (selectedReason === 'other' && !customReason)
                    ? 'not-allowed' : 'pointer',
                }}
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
