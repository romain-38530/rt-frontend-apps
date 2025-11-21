import type { AppProps } from 'next/app';
import '../styles/globals.css';
// TEMPORAIRE: Désactivé pour déploiement Vercel (dépendance workspace non disponible)
// import { ChatProvider, ChatWidget } from '@rt/chatbot-widget';

export default function App({ Component, pageProps }: AppProps) {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('admin_jwt') : null;
  const userId = typeof window !== 'undefined' ? window.localStorage.getItem('user_id') : null;
  const userName = typeof window !== 'undefined' ? window.localStorage.getItem('user_name') : null;
  const supportUrl = process.env.NEXT_PUBLIC_SUPPORT_URL || 'https://www.rt-technologie.com';

  return (
    <>
    {/* TEMPORAIRE: Chatbot désactivé pour déploiement Vercel */}
    {/* <ChatProvider
      botType="helpbot"
      userId={userId || undefined}
      userName={userName || undefined}
      role="admin"
    > */}
      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <a href="/" className="logo">
              <div className="logo-icon">RT</div>
              <span>Backoffice Admin</span>
            </a>
            <nav className="main-nav">
              <a href="/" className="nav-link">Accueil</a>
              <a href="/orgs" className="nav-link">Organisations</a>
              <a href="/pricing" className="nav-link">Tarifs</a>
              <a href="/palettes" className="nav-link">Palettes</a>
              <a href="/health" className="nav-link">État</a>
              <a href={supportUrl} target="_blank" rel="noreferrer" className="nav-link">Support</a>
              {!token ? (
                <a href="/login" className="btn btn-primary btn-sm">Se connecter</a>
              ) : (
                <a
                  href="#"
                  className="nav-link logout"
                  onClick={(e)=>{e.preventDefault(); localStorage.removeItem('admin_jwt'); location.href='/';}}
                >
                  Se déconnecter
                </a>
              )}
            </nav>
          </div>
        </header>
        <main className="main-content">
          <Component {...pageProps} />
        </main>
      </div>
    {/* <ChatWidget
      botType="helpbot"
      userId={userId || undefined}
      userName={userName || undefined}
      role="admin"
    /> */}
    {/* </ChatProvider> */}
    </>
  );
}
