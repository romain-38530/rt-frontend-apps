# Script pour configurer l'authentification sur tous les portails

$portals = @(
    @{name="recipient"; title="Recipient Portal"; icon="📦"; gradient="#11998e 0%, #38ef7d 100%"; primaryColor="#11998e"; hoverColor="#0d7a73"},
    @{name="supplier"; title="Supplier Portal"; icon="🏪"; gradient="#f093fb 0%, #f5576c 100%"; primaryColor="#f093fb"; hoverColor="#d076db"},
    @{name="forwarder"; title="Forwarder Portal"; icon="🌐"; gradient="#4facfe 0%, #00f2fe 100%"; primaryColor="#4facfe"; hoverColor="#3a8bce"},
    @{name="logistician"; title="Logistician Portal"; icon="📊"; gradient="#fa709a 0%, #fee140 100%"; primaryColor="#fa709a"; hoverColor="#d95e82"}
)

foreach ($portal in $portals) {
    $app = "web-$($portal.name)"
    Write-Host "Configuration de $app..." -ForegroundColor Cyan

    # index.tsx avec auth
    $indexContent = @"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated, getUser, logout } from '../lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(getUser());
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, $($portal.gradient))',
        color: 'white'
      }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>$($portal.title) - RT Technologie</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, $($portal.gradient))',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.1)'
        }}>
          <div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Connecté en tant que: <strong>{user?.email}</strong>
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Se déconnecter
          </button>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)',
          padding: '20px'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>
            $($portal.icon) $($portal.title)
          </h1>
          <p style={{ fontSize: '1.5rem', opacity: 0.9, textAlign: 'center' }}>
            RT Technologie - Portail $($portal.name)
          </p>
        </div>
      </div>
    </>
  );
}
"@

    $indexContent | Out-File -FilePath "apps\$app\pages\index.tsx" -Encoding UTF8

    # login.tsx
    $loginContent = @"
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
      const response = await fetch(`\`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
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

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = () => {
    localStorage.setItem('authToken', 'demo-token');
    localStorage.setItem('user', JSON.stringify({ email: 'test@rt-technologie.com', role: 'admin' }));
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Connexion - $($portal.title)</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, $($portal.gradient))',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          padding: '40px',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '10px',
            color: '#1a202c',
            textAlign: 'center'
          }}>
            $($portal.title)
          </h1>

          <p style={{
            color: '#718096',
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            Connectez-vous pour accéder au portail
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
                onFocus={(e) => e.target.style.borderColor = '$($portal.primaryColor)'}
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
                onFocus={(e) => e.target.style.borderColor = '$($portal.primaryColor)'}
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
                background: loading ? '#a0aec0' : '$($portal.primaryColor)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '$($portal.hoverColor)')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '$($portal.primaryColor)')}
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
              🧪 Connexion de test (démo)
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
    </>
  );
}
"@

    $loginContent | Out-File -FilePath "apps\$app\pages\login.tsx" -Encoding UTF8

    Write-Host "✓ $app configuré" -ForegroundColor Green
}

Write-Host "`nTous les portails ont été configurés avec l'authentification MongoDB!" -ForegroundColor Yellow
