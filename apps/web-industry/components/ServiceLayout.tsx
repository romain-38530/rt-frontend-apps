import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface ServiceLayoutProps {
  title: string;
  icon: string;
  children: ReactNode;
  requiresAuth?: boolean;
}

export default function ServiceLayout({ title, icon, children, requiresAuth = true }: ServiceLayoutProps) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{title} - Industry Portal | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80) center/cover',
        position: 'relative',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Dark overlay */}
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
                fontWeight: '600'
              }}
            >
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>{icon}</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>{title}</h1>
            </div>
          </div>
          <div style={{
            padding: '8px 20px',
            background: 'rgba(74, 144, 226, 0.2)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid rgba(74, 144, 226, 0.4)'
          }}>
            🏭 Industry Portal
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          padding: '40px',
          position: 'relative',
          zIndex: 1,
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {children}
        </div>
      </div>
    </>
  );
}
