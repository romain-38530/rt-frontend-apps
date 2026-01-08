import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';
import { ecmrApi } from '../lib/api';

interface EcmrDocument {
  id: string;
  date: string;
  transporteur: string;
  status: string;
}

export default function EcmrPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<EcmrDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await ecmrApi.list();
      if (data.documents) {
        setDocuments(data.documents);
      } else if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch (err) {
      console.error('Error fetching eCMR documents:', err);
      // Fallback mock data
      setDocuments([
        { id: 'CMR-2025-001', date: '2025-11-23', transporteur: 'Transport A', status: 'Signé' },
        { id: 'CMR-2025-002', date: '2025-11-22', transporteur: 'Transport B', status: 'En attente' },
        { id: 'CMR-2025-003', date: '2025-11-21', transporteur: 'Transport C', status: 'Signé' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchDocuments();
  }, []);

  return (
    <>
      <Head>
        <title>e-CMR Digital - Logistique | SYMPHONI.A</title>
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
              <span style={{ fontSize: '32px' }}>📄</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>e-CMR Digital</h1>
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

            <div style={{ display: 'grid', gap: '16px' }}>
              {documents.map(doc => (
                <div key={doc.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ fontSize: '40px' }}>📄</div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '700' }}>{doc.id}</div>
                      <div style={{ fontSize: '14px', opacity: 0.7 }}>{doc.transporteur} • {doc.date}</div>
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 16px',
                    background: doc.status === 'Signé' ? '#00D08422' : '#FFA50022',
                    color: doc.status === 'Signé' ? '#00D084' : '#FFA500',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}>{doc.status}</div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </>
  );
}
