import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Identifiants invalides');
      }

      // Stocker le token
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Rediriger vers la page principale
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Connexion de test (à supprimer en production)
  const handleTestLogin = () => {
    localStorage.setItem('authToken', 'demo-token');
    localStorage.setItem('user', JSON.stringify({ email: 'test@symphoni-a.com', role: 'admin' }));
    router.push('/');
  };

  const features = [
    { icon: '🚛', title: 'Gestion flotte', desc: 'Gérez tous vos véhicules en un seul endroit' },
    { icon: '📍', title: 'Planification routes', desc: 'Optimisez vos itinéraires de transport' },
    { icon: '🗺️', title: 'Suivi temps réel', desc: 'Localisez vos véhicules en temps réel' },
    { icon: '⚡', title: 'Optimisation trajets', desc: 'Réduisez les coûts et les temps de trajet' },
    { icon: '📝', title: 'Carnet de bord', desc: 'Historique complet de toutes les courses' },
    { icon: '👥', title: 'Gestion chauffeurs', desc: 'Plannings et affectations des conducteurs' }
  ];

  return (
    <>
      <Head>
        <title>Connexion - SYMPHONI.A Transporter</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #22c1c3 0%, #fdbb2d 100%)',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          left: '-100px',
          width: '300px',
          height: '300px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-150px',
          right: '-150px',
          width: '400px',
          height: '400px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Features Cards - Left & Right */}
          {features.map((feature, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              display: i === 2 || i === 3 ? 'none' : 'block' // Hide middle cards on mobile
            }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{feature.icon}</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', margin: 0 }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                {feature.desc}
              </p>
            </div>
          ))}

          {/* Login Form - Center */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            padding: '40px',
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto',
            gridColumn: features.length > 3 ? 'span 1' : 'auto'
          }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '800', margin: 0, color: '#333' }}>SYMPHONI.A</h1>
              <p style={{ fontSize: '18px', fontStyle: 'italic', margin: 0, opacity: 0.7, color: '#666' }}>L'IA qui orchestre vos flux transport.</p>
            </div>
          </div>

          <p style={{
            color: '#718096',
            textAlign: 'center',
            marginBottom: '30px',
            fontWeight: '600'
          }}>
            Transporter Portal
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#4a5568',
                fontWeight: '500'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#22c1c3'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#4a5568',
                fontWeight: '500'
              }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#22c1c3'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: '#fed7d7',
                color: '#c53030',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#a0aec0' : '#22c1c3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#1ba5a6')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#22c1c3')}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              onClick={handleTestLogin}
              style={{
                width: '100%',
                padding: '10px',
                background: '#48bb78',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Connexion de test (démo)
            </button>
            <p style={{
              fontSize: '12px',
              color: '#a0aec0',
              textAlign: 'center',
              marginTop: '8px'
            }}>
              Pour tester sans API
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
