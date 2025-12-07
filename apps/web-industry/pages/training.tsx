import { useEffect, useState } from 'react';
import { useSafeRouter } from '../lib/useSafeRouter';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { trainingApi } from '../lib/api';

interface TrainingModule {
  id: string;
  title: string;
  duration: string;
  completed: number;
  status: 'completed' | 'in_progress' | 'not_started';
  description?: string;
}

export default function TrainingPage() {
  const router = useSafeRouter();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed': return 'Complete';
      case 'in_progress': return 'En cours';
      case 'not_started': return 'Non commence';
      default: return status;
    }
  };

  const getStatusColor = (status: string): { bg: string; text: string } => {
    switch (status) {
      case 'completed': return { bg: '#00D08422', text: '#00D084' };
      case 'in_progress': return { bg: '#667eea22', text: '#667eea' };
      default: return { bg: 'rgba(255,255,255,0.1)', text: 'white' };
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const data = await trainingApi.getModules();
      if (data.modules) {
        setModules(data.modules);
      } else if (Array.isArray(data)) {
        setModules(data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching training modules:', err);
      setError('Impossible de charger les modules de formation');
      // Fallback data
      setModules([
        { id: '1', title: 'Securite routiere', duration: '2h', completed: 100, status: 'completed' },
        { id: '2', title: 'Gestion documentaire', duration: '1h30', completed: 60, status: 'in_progress' },
        { id: '3', title: 'Utilisation TMS', duration: '3h', completed: 0, status: 'not_started' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartModule = async (moduleId: string) => {
    try {
      await trainingApi.updateProgress(moduleId, { completed: false });
      setModules(prev => prev.map(m =>
        m.id === moduleId ? { ...m, status: 'in_progress' as const, completed: 0 } : m
      ));
    } catch (err) {
      console.error('Error starting module:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchModules();
  }, [router]);

  return (
    <>
      <Head>
        <title>Formation - Industry | SYMPHONI.A</title>
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
              <span style={{ fontSize: '32px' }}>&#128218;</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Formation</h1>
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
              <p>Chargement des modules...</p>
            </div>
          ) : error && modules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#9888;&#65039;</div>
              <p>{error}</p>
              <button
                onClick={fetchModules}
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
              {modules.map(mod => {
                const statusColors = getStatusColor(mod.status);
                return (
                  <div key={mod.id} style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{mod.title}</div>
                        <div style={{ fontSize: '14px', opacity: 0.7 }}>Duree: {mod.duration}</div>
                        {mod.description && <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>{mod.description}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          padding: '6px 16px',
                          background: statusColors.bg,
                          color: statusColors.text,
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '700'
                        }}>{getStatusLabel(mod.status)}</div>
                        {mod.status === 'not_started' && (
                          <button
                            onClick={() => handleStartModule(mod.id)}
                            style={{
                              padding: '6px 16px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Commencer
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', opacity: 0.7 }}>Progression</span>
                        <span style={{ fontSize: '14px', fontWeight: '700' }}>{mod.completed}%</span>
                      </div>
                      <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        height: '8px',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          background: mod.completed === 100 ? '#00D084' : '#667eea',
                          width: `${mod.completed}%`,
                          height: '100%',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
