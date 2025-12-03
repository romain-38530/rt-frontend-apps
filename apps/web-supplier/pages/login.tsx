import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useLanguage } from '../hooks/useLanguage';
import { languages, languageNames } from '../lib/translations';

export default function Login() {
  const router = useRouter();
  const { language, changeLanguage, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://d2i50a1vlg138w.cloudfront.net'}/api/auth/login`, {
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
    localStorage.setItem('user', JSON.stringify({ email: 'test@symphoni-a.com', role: 'admin' }));
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Connexion - SYMPHONI.A Supplier</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'url(https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=80) center/cover',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden'
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

        {/* Language selector - top right */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                padding: '10px 16px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🌍 {languageNames[language]}
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>

            {showLangMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                minWidth: '150px'
              }}>
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => {
                      changeLanguage(lang);
                      setShowLangMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: language === lang ? '#f0f0f0' : 'white',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: language === lang ? '600' : '400',
                      color: '#333'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = language === lang ? '#f0f0f0' : 'white'}
                  >
                    {languageNames[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Ligne supérieure: 3 cartes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%'
          }}>
            {t.features.slice(0, 3).map((feature, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                textAlign: 'center'
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
          </div>

          {/* Ligne centrale: Login Form */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            padding: '50px',
            width: '100%',
            maxWidth: '480px',
            margin: '0 auto'
          }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '800', margin: 0, color: '#333' }}>SYMPHONI.A</h1>
              <p style={{ fontSize: '18px', fontStyle: 'italic', margin: 0, opacity: 0.7, color: '#666' }}>{t.tagline}</p>
            </div>
          </div>

          <p style={{
            color: '#718096',
            textAlign: 'center',
            marginBottom: '30px',
            fontWeight: '600'
          }}>
            {t.portal}
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#4a5568',
                fontWeight: '500'
              }}>
                {t.email}
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
                onFocus={(e) => e.target.style.borderColor = '#f093fb'}
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
                {t.password}
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
                onFocus={(e) => e.target.style.borderColor = '#f093fb'}
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
                background: loading ? '#a0aec0' : '#f093fb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#d076db')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#f093fb')}
            >
              {loading ? t.logging : t.login}
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
              {t.testLogin}
            </button>
            <p style={{
              fontSize: '12px',
              color: '#a0aec0',
              textAlign: 'center',
              marginTop: '8px'
            }}>
              {t.testLoginDesc}
            </p>
          </div>
        </div>

          {/* Ligne inférieure: 3 cartes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%'
          }}>
            {t.features.slice(3, 6).map((feature, i) => (
              <div key={i + 3} style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                textAlign: 'center'
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
          </div>
        </div>
      </div>
    </>
  );
}
