import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { storageMarketApi } from '../lib/api';
import { useToast } from '@rt/ui-components';

interface StorageSpace {
  id: string;
  location: string;
  size: string;
  price: string;
  available: boolean;
  type?: string;
  features?: string[];
}

export default function StoragePage() {
  const router = useSafeRouter();
  const { toast } = useToast();
  const [spaces, setSpaces] = useState<StorageSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState<string | null>(null);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const data = await storageMarketApi.listSpaces();
      if (data.spaces) {
        setSpaces(data.spaces);
      } else if (Array.isArray(data)) {
        setSpaces(data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching storage spaces:', err);
      setError('Impossible de charger les espaces de stockage');
      // Fallback data
      setSpaces([
        { id: 'STO-001', location: 'Paris - Zone Nord', size: '500 m2', price: '2 500 EUR/mois', available: true },
        { id: 'STO-002', location: 'Lyon - Zone Est', size: '1000 m2', price: '4 200 EUR/mois', available: true },
        { id: 'STO-003', location: 'Marseille - Port', size: '750 m2', price: '3 100 EUR/mois', available: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (spaceId: string) => {
    try {
      setReserving(spaceId);
      await storageMarketApi.createReservation({ spaceId, startDate: new Date().toISOString() });
      // Update local state
      setSpaces(prev => prev.map(s => s.id === spaceId ? { ...s, available: false } : s));
      toast.success('Reservation effectuee avec succes!');
    } catch (err) {
      console.error('Error creating reservation:', err);
      toast.error('Erreur lors de la reservation');
    } finally {
      setReserving(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchSpaces();
  }, [router]);

  return (
    <>
      <Head>
        <title>Storage Market - Industry | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80) center/cover',
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
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              &#8592; Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>&#128230;</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Storage Market</h1>
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
            &#127981; Industry
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#8987;</div>
              <p>Chargement des espaces...</p>
            </div>
          ) : error && spaces.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9888;&#65039;</div>
              <p>{error}</p>
              <button
                onClick={fetchSpaces}
                style={{
                  marginTop: '16px',
                  background: '#667eea',
                  border: 'none',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Reessayer
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {spaces.map(space => (
                <div key={space.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{space.location}</div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>Ref: {space.id}</div>
                    {space.type && <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Type: {space.type}</div>}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800' }}>{space.size}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Surface</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#00D084' }}>{space.price}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => space.available && handleReserve(space.id)}
                      disabled={!space.available || reserving === space.id}
                      style={{
                        padding: '10px 20px',
                        background: space.available ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: space.available ? 'pointer' : 'not-allowed',
                        fontWeight: '700',
                        fontSize: '14px',
                        opacity: space.available ? 1 : 0.5
                      }}>
                      {reserving === space.id ? 'Reservation...' : space.available ? 'Reserver' : 'Indisponible'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
