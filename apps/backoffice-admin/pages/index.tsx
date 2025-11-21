// TEMPORAIRE: Désactivé pour déploiement Vercel (dépendance workspace non disponible)
// import { TrainingButton } from '@rt/design-system';

export default function Home() {
  return (
    <>
      {/* TEMPORAIRE: TrainingButton désactivé pour déploiement Vercel */}
      {/* <TrainingButton toolName="Backoffice Admin" /> */}

      {/* Hero Section */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0a66ff 0%, #0052cc 100%)', color: 'white', border: 'none' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem' }}>
          RT Technologie
        </h1>
        <p style={{ fontSize: '1.125rem', opacity: 0.95, marginBottom: '2rem', maxWidth: '800px' }}>
          Plateforme unifiée Transport • Logistique • Industrie — vigilance, planification, suivi, e‑CMR et Affret.IA.
          Testez notre démonstration en ligne et découvrez comment accélérer vos flux.
        </p>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <a href="/login" className="btn btn-lg" style={{ background: 'white', color: '#0a66ff' }}>
            Se connecter à la démo
          </a>
          <a href="/health" className="btn btn-outline btn-lg" style={{ borderColor: 'white', color: 'white' }}>
            État des services
          </a>
          <a
            href={process.env.NEXT_PUBLIC_SUPPORT_URL || 'https://www.rt-technologie.com'}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-lg"
            style={{ borderColor: 'white', color: 'white' }}
          >
            Contacter le support
          </a>
        </div>
      </div>

      {/* Features Section */}
      <div className="card-header" style={{ border: 'none', paddingLeft: 0 }}>
        <h2 className="card-title" style={{ fontSize: '1.75rem' }}>Solutions par secteur</h2>
        <p className="card-subtitle">Des outils adaptés à chaque acteur de la chaîne logistique</p>
      </div>

      <div className="grid grid-cols-4">
        <div className="feature-card">
          <div style={{ width: '48px', height: '48px', background: '#e6f2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '1.5rem' }}>
            🏭
          </div>
          <h3>Industrie</h3>
          <ul>
            <li>Vigilance (documents & blocages)</li>
            <li>Affectation + SLA + escalade Affret.IA</li>
            <li>Planification automatisée (RDV)</li>
            <li>Grilles transporteurs</li>
          </ul>
        </div>

        <div className="feature-card">
          <div style={{ width: '48px', height: '48px', background: '#e6f2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '1.5rem' }}>
            🚚
          </div>
          <h3>Transporteur</h3>
          <ul>
            <li>Acceptation mission (SLA)</li>
            <li>RDV 1‑clic & documents</li>
            <li>Premium : marketplace & Affret.IA</li>
          </ul>
        </div>

        <div className="feature-card">
          <div style={{ width: '48px', height: '48px', background: '#e6f2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '1.5rem' }}>
            📦
          </div>
          <h3>Logisticien</h3>
          <ul>
            <li>Planning quais / borne accueil</li>
            <li>e‑CMR au quai (S3 + PDF/A)</li>
            <li>Webhooks WMS</li>
          </ul>
        </div>

        <div className="feature-card">
          <div style={{ width: '48px', height: '48px', background: '#e6f2ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '1.5rem' }}>
            🌍
          </div>
          <h3>Transitaire</h3>
          <ul>
            <li>Tenders import/export</li>
            <li>Pré/post routier</li>
            <li>Suivi multimodal</li>
          </ul>
        </div>
      </div>

      {/* Modules Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Modules transverses</h3>
          <p className="card-subtitle">Fonctionnalités disponibles sur toutes les plateformes</p>
        </div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <span className="badge badge-info">Vigilance</span>
          <span className="badge badge-info">Tracking & ETA</span>
          <span className="badge badge-info">e‑CMR / BL</span>
          <span className="badge badge-info">Notifications</span>
          <span className="badge badge-info">Affret.IA</span>
          <span className="badge badge-info">Marketplace</span>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Prêt ? Cliquez sur « Se connecter à la démo » pour accéder à l'interface d'administration et tester l'activation des modules.
        </p>
      </div>
    </>
  );
}
