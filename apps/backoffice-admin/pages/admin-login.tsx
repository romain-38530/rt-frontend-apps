/**
 * Page de Login Admin
 *
 * Cette page permet aux administrateurs de se connecter au backoffice
 * pour accéder à l'interface de gestion des prix.
 *
 * Flow:
 * 1. Admin entre email/password
 * 2. Validation et génération de token JWT
 * 3. Stockage du token en localStorage
 * 4. Redirection vers /account-pricing ou /
 *
 * URL: https://backoffice-admin.amplifyapp.com/admin-login
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// ==========================================
// Types
// ==========================================

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    accountType: string;
  };
  message?: string;
}

// ==========================================
// Configuration
// ==========================================

const API_URL = process.env.NEXT_PUBLIC_SUBSCRIPTIONS_API_URL || 'https://dgze8l03lwl5h.cloudfront.net';

// ==========================================
// Utilitaires d'authentification
// ==========================================

export function setAdminToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
}

export function getAdminToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.setItem('admin_token');
  }
  return null;
}

export function removeAdminToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}

export function setAdminUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_user', JSON.stringify(user));
  }
}

export function getAdminUser() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function isAuthenticated(): boolean {
  return !!getAdminToken();
}

export function logout() {
  removeAdminToken();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_user');
    window.location.href = '/admin-login';
  }
}

// ==========================================
// Composant Principal
// ==========================================

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/account-pricing');
    }
  }, [router]);

  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Valider les champs
      if (!formData.email || !formData.password) {
        throw new Error('Veuillez remplir tous les champs');
      }

      // Appeler l'API de login
      const response = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Identifiants invalides');
      }

      if (!data.token || !data.user) {
        throw new Error('Réponse invalide du serveur');
      }

      // Stocker le token et les infos utilisateur
      setAdminToken(data.token);
      setAdminUser(data.user);

      // Rediriger vers la page de gestion des prix
      router.push('/account-pricing');

    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">🔐</span>
            <h1>RT Technologie</h1>
          </div>
          <h2>Administration</h2>
          <p>Connectez-vous pour accéder au backoffice</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@rt-technologie.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Info de développement */}
        {process.env.NODE_ENV === 'development' && (
          <div className="dev-info">
            <h4>🔧 Mode Développement</h4>
            <p>Pour générer un token admin de test :</p>
            <code>node scripts/generate-admin-token.js</code>
            <p style={{ marginTop: 8 }}>
              <small>Identifiants de test : admin@rt-technologie.com / admin123</small>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p>
            <a href="/">← Retour à l'accueil</a>
          </p>
          <p className="copyright">
            © 2025 RT Technologie. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .login-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 48px;
          max-width: 440px;
          width: 100%;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .logo-icon {
          font-size: 48px;
        }

        .logo h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
          color: #1f2937;
        }

        .login-header h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #374151;
        }

        .login-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .login-form {
          margin-bottom: 24px;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .error-icon {
          font-size: 18px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 14px;
          color: #374151;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .btn-login {
          width: 100%;
          padding: 14px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .dev-info {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .dev-info h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #374151;
        }

        .dev-info p {
          margin: 4px 0;
          font-size: 13px;
          color: #6b7280;
        }

        .dev-info code {
          background: #1f2937;
          color: #10b981;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          display: inline-block;
          margin: 8px 0;
        }

        .login-footer {
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .login-footer p {
          margin: 8px 0;
          font-size: 14px;
          color: #6b7280;
        }

        .login-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }

        .copyright {
          font-size: 12px !important;
          color: #9ca3af !important;
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 32px 24px;
          }

          .logo h1 {
            font-size: 24px;
          }

          .login-header h2 {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}
