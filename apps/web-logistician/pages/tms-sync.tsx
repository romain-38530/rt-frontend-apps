import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { tmsSyncApi } from '../lib/api';
import { useToast } from '@rt/ui-components';

interface SyncStatus {
  lastSync: string;
  status: string;
  orders: number;
  vehicles: number;
  errors: number;
}

export default function TmssyncPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: '',
    status: 'Chargement...',
    orders: 0,
    vehicles: 0,
    errors: 0
  });
  const [loading, setLoading] = useState(false);

  const loadSyncStatus = async () => {
    try {
      const data = await tmsSyncApi.getStatus();
      if (data && data.status) {
        setSyncStatus({
          lastSync: data.lastSync || new Date().toLocaleString('fr-FR'),
          status: data.status === 'connected' ? 'Connecté' : data.status === 'error' ? 'Erreur' : 'Déconnecté',
          orders: data.ordersCount || data.orders || 0,
          vehicles: data.vehiclesCount || data.vehicles || 0,
          errors: data.errorsCount || data.errors || 0
        });
      }
    } catch (err) {
      console.error('Error loading TMS sync status:', err);
      // Fallback mock data
      setSyncStatus({
        lastSync: new Date().toLocaleString('fr-FR'),
        status: 'Connecté',
        orders: 1247,
        vehicles: 45,
        errors: 2
      });
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      await tmsSyncApi.syncNow();
      await loadSyncStatus();
      toast.success('Synchronisation lancée avec succès !');
    } catch (err) {
      console.error('Error triggering sync:', err);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadSyncStatus();
  }, []);

  return (
    <>
      <Head>
        <title>Synchronisation TMS - Logistique | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=80) center/cover',
        position: 'relative',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 0
        }} />

        {/* Header */}
        <div style={{
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
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
                transition: 'all 0.2s ease'
              }}>
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🔄</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Synchronisation TMS</h1>
            </div>
          </div>
          <div style={{
            padding: '8px 20px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            📊 Logistique
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '40px',
          position: 'relative',
          zIndex: 1,
          maxWidth: '1400px',
          margin: '0 auto'
        }}>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.2)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Statut de synchronisation</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Dernière sync: {syncStatus.lastSync}</div>
                </div>
                <div style={{
                  padding: '12px 24px',
                  background: '#00D08422',
                  color: '#00D084',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700'
                }}>
                  ● {syncStatus.status}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>{syncStatus.orders}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Commandes synchronisées</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>{syncStatus.vehicles}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Véhicules</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: syncStatus.errors > 0 ? '#FFA500' : '#00D084' }}>{syncStatus.errors}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Erreurs</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={handleSync}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      background: loading ? 'rgba(255,255,255,0.3)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                    {loading ? 'Synchronisation...' : 'Synchroniser'}
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
    </>
  );
}
