import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getUser } from '../../lib/auth';

export default function UpgradeSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Countdown pour redirection automatique
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <>
      <Head>
        <title>Abonnement active - SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '32px',
          padding: '60px',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
        }}>
          {/* Success Icon */}
          <div style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            fontSize: '48px',
            color: 'white',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)'
          }}>
            &#10003;
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            Felicitations !
          </h1>

          <p style={{
            fontSize: '20px',
            color: '#64748b',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Votre abonnement a ete active avec succes.<br />
            Vous avez maintenant acces a toutes les fonctionnalites.
          </p>

          {/* Features Unlocked */}
          <div style={{
            background: '#f0fdf4',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#166534',
              marginBottom: '16px'
            }}>
              Fonctionnalites debloquees:
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Transports illimites',
                'AFFRET.IA - Intelligence artificielle',
                'KPI et analytics avances',
                'Matching prioritaire',
                'Support prioritaire'
              ].map((feature, idx) => (
                <li key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '10px',
                  fontSize: '15px',
                  color: '#166534'
                }}>
                  <span style={{ color: '#10b981', fontSize: '18px' }}>&#10003;</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(249, 115, 22, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Acceder a mon espace
          </button>

          {/* Countdown */}
          <p style={{
            marginTop: '24px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            Redirection automatique dans {countdown} secondes...
          </p>

          {/* Invoice Info */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Une facture vous sera envoyee par email dans les prochaines minutes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
