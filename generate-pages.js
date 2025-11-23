const fs = require('fs');
const path = require('path');

// Configuration des portails
const portals = {
  'web-industry': {
    name: 'Industry',
    icon: '🏭',
    color: '#4A90E2',
    bgImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80',
    services: [
      { route: 'production', title: 'Production & Planning', icon: '🏭', apiEnv: 'PLANNING_API_URL' },
      { route: 'orders', title: 'Gestion des commandes', icon: '📦', apiEnv: 'ORDERS_API_URL' },
      { route: 'dashboard', title: 'Tableau de bord KPI', icon: '📊', apiEnv: 'API_URL' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL' },
      { route: 'storage', title: 'Storage Market', icon: '📦', apiEnv: 'STORAGE_MARKET_API_URL' },
      { route: 'training', title: 'Formation', icon: '📚', apiEnv: 'TRAINING_API_URL' },
      { route: 'affret-ia', title: 'Affret.IA', icon: '🧠', apiEnv: 'AFFRET_IA_API_URL' }
    ]
  },
  'web-transporter': {
    name: 'Transporter',
    icon: '🚚',
    color: '#FF6B6B',
    bgImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80',
    services: [
      { route: 'orders', title: 'Gestion des commandes', icon: '📦', apiEnv: 'ORDERS_API_URL' },
      { route: 'planning', title: 'Planning & Itinéraires', icon: '📅', apiEnv: 'PLANNING_API_URL' },
      { route: 'tracking', title: 'Suivi en temps réel', icon: '📍', apiEnv: 'TRACKING_API_URL' },
      { route: 'ecmr', title: 'e-CMR Digital', icon: '📄', apiEnv: 'ECMR_API_URL' },
      { route: 'palettes', title: 'Gestion Palettes', icon: '🏗️', apiEnv: 'PALETTES_API_URL' },
      { route: 'tms-sync', title: 'Synchronisation TMS', icon: '🔄', apiEnv: 'TMS_SYNC_API_URL' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL' },
      { route: 'storage', title: 'Storage Market', icon: '📦', apiEnv: 'STORAGE_MARKET_API_URL' },
      { route: 'training', title: 'Formation', icon: '📚', apiEnv: 'TRAINING_API_URL' }
    ]
  },
  'web-forwarder': {
    name: 'Forwarder',
    icon: '🌍',
    color: '#4ECDC4',
    bgImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1920&q=80',
    services: [
      { route: 'orders', title: 'Gestion des commandes', icon: '📦', apiEnv: 'ORDERS_API_URL' },
      { route: 'planning', title: 'Planning & Itinéraires', icon: '📅', apiEnv: 'PLANNING_API_URL' },
      { route: 'tracking', title: 'Suivi en temps réel', icon: '📍', apiEnv: 'TRACKING_API_URL' },
      { route: 'ecmr', title: 'e-CMR Digital', icon: '📄', apiEnv: 'ECMR_API_URL' },
      { route: 'palettes', title: 'Gestion Palettes', icon: '🏗️', apiEnv: 'PALETTES_API_URL' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL' },
      { route: 'storage', title: 'Storage Market', icon: '📦', apiEnv: 'STORAGE_MARKET_API_URL' },
      { route: 'training', title: 'Formation', icon: '📚', apiEnv: 'TRAINING_API_URL' }
    ]
  },
  'web-supplier': {
    name: 'Supplier',
    icon: '🏢',
    color: '#95E1D3',
    bgImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80',
    services: [
      { route: 'orders', title: 'Gestion des commandes', icon: '📦', apiEnv: 'ORDERS_API_URL' },
      { route: 'planning', title: 'Planning & Itinéraires', icon: '📅', apiEnv: 'PLANNING_API_URL' },
      { route: 'palettes', title: 'Gestion Palettes', icon: '🏗️', apiEnv: 'PALETTES_API_URL' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL' },
      { route: 'storage', title: 'Storage Market', icon: '📦', apiEnv: 'STORAGE_MARKET_API_URL' },
      { route: 'training', title: 'Formation', icon: '📚', apiEnv: 'TRAINING_API_URL' }
    ]
  },
  'web-logistician': {
    name: 'Logistician',
    icon: '📊',
    color: '#A8E6CF',
    bgImage: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=80',
    services: [
      { route: 'orders', title: 'Gestion des commandes', icon: '📦', apiEnv: 'ORDERS_API_URL' },
      { route: 'planning', title: 'Planning & Itinéraires', icon: '📅', apiEnv: 'PLANNING_API_URL' },
      { route: 'tracking', title: 'Suivi en temps réel', icon: '📍', apiEnv: 'TRACKING_API_URL' },
      { route: 'ecmr', title: 'e-CMR Digital', icon: '📄', apiEnv: 'ECMR_API_URL' },
      { route: 'palettes', title: 'Gestion Palettes', icon: '🏗️', apiEnv: 'PALETTES_API_URL' },
      { route: 'tms-sync', title: 'Synchronisation TMS', icon: '🔄', apiEnv: 'TMS_SYNC_API_URL' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL' },
      { route: 'storage', title: 'Storage Market', icon: '📦', apiEnv: 'STORAGE_MARKET_API_URL' },
      { route: 'training', title: 'Formation', icon: '📚', apiEnv: 'TRAINING_API_URL' }
    ]
  },
  'web-recipient': {
    name: 'Recipient',
    icon: '🏪',
    color: '#FFD3B6',
    bgImage: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1920&q=80',
    services: [
      { route: 'orders', title: 'Mes commandes', icon: '📦', apiEnv: 'ORDERS_API_URL' },
      { route: 'tracking', title: 'Suivi livraisons', icon: '📍', apiEnv: 'TRACKING_API_URL' },
      { route: 'ecmr', title: 'e-CMR Digital', icon: '📄', apiEnv: 'ECMR_API_URL' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL' }
    ]
  }
};

// Template de page de service
const generateServicePage = (portal, service) => `import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';

export default function ${service.route.charAt(0).toUpperCase() + service.route.slice(1).replace(/-/g, '')}Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const apiUrl = process.env.NEXT_PUBLIC_${service.apiEnv};

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const handleAction = async () => {
    setLoading(true);
    try {
      alert(\`Service ${service.title} en cours d'implémentation...\\n\\nAPI: \${apiUrl}\`);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>${service.title} - ${portal.name} | SYMPHONI.A</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'url(${portal.bgImage}) center/cover',
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
                fontWeight: '600'
              }}
            >
              ← Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>${service.icon}</span>
              <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>${service.title}</h1>
            </div>
          </div>
          <div style={{
            padding: '8px 20px',
            background: 'rgba(${portal.color.replace('#', '')}, 0.2)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            ${portal.icon} ${portal.name}
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: '60px 40px',
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '40px',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>${service.icon}</div>
            <h2 style={{ fontSize: '36px', marginBottom: '16px', fontWeight: '800' }}>
              ${service.title}
            </h2>
            <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px' }}>
              Service connecté à l'API backend
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '32px',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              API: {apiUrl || 'Non configurée'}
            </div>

            <button
              onClick={handleAction}
              disabled={loading}
              style={{
                padding: '16px 48px',
                background: loading ? '#666' : 'linear-gradient(135deg, ${portal.color} 0%, #667eea 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              {loading ? 'Chargement...' : 'Lancer le service'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
`;

// Générer les pages
let totalCreated = 0;

Object.keys(portals).forEach(portalKey => {
  const portal = portals[portalKey];
  const pagesDir = path.join(__dirname, 'apps', portalKey, 'pages');

  console.log(`\\n📁 Génération pour ${portal.name}...`);

  portal.services.forEach(service => {
    const filePath = path.join(pagesDir, `${service.route}.tsx`);
    const content = generateServicePage(portal, service);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ ${service.route}.tsx`);
    totalCreated++;
  });
});

console.log(`\\n🎉 ${totalCreated} pages créées avec succès!`);
