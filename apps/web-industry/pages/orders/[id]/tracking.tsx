/**
 * Page de tracking en temps réel - Portail Industry
 * Affiche la carte et les informations de tracking
 */

import { useEffect, useState } from 'react';
import { useSafeRouter } from '../../../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../../../lib/auth';
import { MapView, TrackingPanel, useToast } from '@rt/ui-components';
import { TrackingService, OrdersService, useWebSocket } from '@rt/utils';
import type {
  TrackingSession,
  TrackingPosition,
  MapMarker,
} from '@rt/contracts';
import type { Order } from '@rt/contracts';

export default function TrackingPage() {
  const router = useSafeRouter();
  const { id } = router.query;
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [positionHistory, setPositionHistory] = useState<TrackingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { subscribe, isConnected } = useWebSocket();

  // Charger la commande et la session de tracking
  const loadData = async () => {
    if (!id || typeof id !== 'string') return;

    setIsLoading(true);
    setError(null);

    try {
      const [orderData, trackingSession] = await Promise.all([
        OrdersService.getOrderById(id),
        TrackingService.getTrackingByOrderId(id),
      ]);

      setOrder(orderData);
      setSession(trackingSession);

      // Charger l'historique des positions
      if (trackingSession) {
        const history = await TrackingService.getPositionHistory({
          orderId: id,
          limit: 100,
        });
        setPositionHistory(history.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
      console.error('Error loading tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket: écouter les mises à jour de position
  useEffect(() => {
    if (!id || !isConnected) return;

    const unsubscribe = subscribe('tracking.location.updated', (data) => {
      if (data.orderId === id) {
        console.log('Position updated:', data.location);
        // Recharger les données pour obtenir la position à jour
        loadData();
      }
    });

    return () => unsubscribe();
  }, [id, isConnected, subscribe]);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, id]);

  // Chargement initial
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadData();
  }, [id, router]);

  // Générer les marqueurs pour la carte
  const getMapMarkers = (): MapMarker[] => {
    if (!order) return [];

    const markers: MapMarker[] = [];

    // Point de collecte
    if (order.pickupAddress.latitude && order.pickupAddress.longitude) {
      markers.push({
        id: 'pickup',
        type: 'pickup',
        position: {
          latitude: order.pickupAddress.latitude,
          longitude: order.pickupAddress.longitude,
          timestamp: order.dates.pickupDate,
        },
        label: `Collecte - ${order.pickupAddress.city}`,
        color: '#10b981',
      });
    }

    // Point de livraison
    if (order.deliveryAddress.latitude && order.deliveryAddress.longitude) {
      markers.push({
        id: 'delivery',
        type: 'delivery',
        position: {
          latitude: order.deliveryAddress.latitude,
          longitude: order.deliveryAddress.longitude,
          timestamp: order.dates.deliveryDate,
        },
        label: `Livraison - ${order.deliveryAddress.city}`,
        color: '#ef4444',
      });
    }

    return markers;
  };

  // Actions de tracking
  const handleStartTracking = async () => {
    if (!order) return;

    try {
      await TrackingService.startTracking({
        orderId: order.id,
        carrierId: order.carrierId || '',
        trackingLevel: order.trackingLevel,
      });
      await loadData();
    } catch (err: any) {
      toast.error(`Erreur lors du démarrage du tracking : ${err.message}`);
    }
  };

  const handleStopTracking = async () => {
    if (!session) return;

    try {
      await TrackingService.stopTracking(session.id);
      await loadData();
    } catch (err: any) {
      toast.error(`Erreur lors de l'arrêt du tracking : ${err.message}`);
    }
  };

  const handlePauseTracking = async () => {
    if (!session) return;

    try {
      await TrackingService.pauseTracking(session.id);
      await loadData();
    } catch (err: any) {
      toast.error(`Erreur lors de la pause du tracking : ${err.message}`);
    }
  };

  const handleResumeTracking = async () => {
    if (!session) return;

    try {
      await TrackingService.resumeTracking(session.id);
      await loadData();
    } catch (err: any) {
      toast.error(`Erreur lors de la reprise du tracking : ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Chargement du tracking...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <div style={{ fontSize: '18px', color: '#ef4444', fontWeight: '600' }}>{error || 'Commande introuvable'}</div>
        <button
          onClick={() => router.push(`/orders/${id}`)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Retour au détail de la commande
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Tracking {order.reference} - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push(`/orders/${id}`)}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              ← Retour
            </button>

            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, marginBottom: '4px' }}>
                🗺️ Tracking {order.reference}
              </h1>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {order.pickupAddress.city} → {order.deliveryAddress.city}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Indicateur WebSocket */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: isConnected ? '#10b981' : '#6b7280',
              }}
            >
              <span style={{ fontSize: '8px' }}>{isConnected ? '🟢' : '🔴'}</span>
              {isConnected ? 'Temps réel actif' : 'Déconnecté'}
            </div>

            {/* Auto-refresh toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              Auto-refresh (30s)
            </label>

            <button
              onClick={loadData}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', height: 'calc(100vh - 73px)' }}>
          {/* Carte */}
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <MapView
              currentPosition={session?.currentPosition}
              markers={getMapMarkers()}
              route={session?.route}
              positionHistory={positionHistory}
              autoCenter={true}
              zoom={10}
              height="100%"
              width="100%"
              showControls={true}
              showLegend={true}
              mode="interactive"
            />
          </div>

          {/* Panel de tracking */}
          <div style={{ overflowY: 'auto', backgroundColor: '#f9fafb', padding: '20px' }}>
            {session ? (
              <TrackingPanel
                session={session}
                onRefresh={loadData}
                onStartTracking={handleStartTracking}
                onStopTracking={handleStopTracking}
                onPauseTracking={handlePauseTracking}
                onResumeTracking={handleResumeTracking}
                isLoading={isLoading}
              />
            ) : (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Aucune session de tracking
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                  Démarrez le tracking pour suivre cette commande en temps réel
                </div>
                <button
                  onClick={handleStartTracking}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  ▶️ Démarrer le tracking
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
