const fs = require('fs');
const path = require('path');

// Configuration des portails (identique)
const portals = {
  'web-industry': {
    name: 'Industry',
    icon: '🏭',
    color: '#4A90E2',
    bgImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1920&q=80',
    services: [
      { route: 'production', title: 'Production & Planning', icon: '🏭', apiEnv: 'PLANNING_API_URL', type: 'production' },
      { route: 'orders', title: 'Gestion des commandes', icon: '📦', apiEnv: 'ORDERS_API_URL', type: 'orders' },
      { route: 'dashboard', title: 'Tableau de bord KPI', icon: '📊', apiEnv: 'API_URL', type: 'dashboard' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL', type: 'notifications' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL', type: 'chatbot' },
      { route: 'storage', title: 'Storage Market', icon: '📦', apiEnv: 'STORAGE_MARKET_API_URL', type: 'storage' },
      { route: 'training', title: 'Formation', icon: '📚', apiEnv: 'TRAINING_API_URL', type: 'training' },
      { route: 'affret-ia', title: 'Affret.IA', icon: '🧠', apiEnv: 'AFFRET_IA_API_URL', type: 'affret' }
    ]
  },
  'web-transporter': {
    name: 'Transporter',
    icon: '🚚',
    color: '#FF6B6B',
    bgImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&q=80',
    services: [
      { route: 'orders', title: 'Gestion des commandes', icon: '📦', apiEnv: 'ORDERS_API_URL', type: 'orders' },
      { route: 'planning', title: 'Planning & Itinéraires', icon: '📅', apiEnv: 'PLANNING_API_URL', type: 'planning' },
      { route: 'tracking', title: 'Suivi en temps réel', icon: '📍', apiEnv: 'TRACKING_API_URL', type: 'tracking' },
      { route: 'ecmr', title: 'e-CMR Digital', icon: '📄', apiEnv: 'ECMR_API_URL', type: 'ecmr' },
      { route: 'palettes', title: 'Gestion Palettes', icon: '🏗️', apiEnv: 'PALETTES_API_URL', type: 'palettes' },
      { route: 'tms-sync', title: 'Synchronisation TMS', icon: '🔄', apiEnv: 'TMS_SYNC_API_URL', type: 'tms' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL', type: 'notifications' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL', type: 'chatbot' },
      { route: 'storage', title: 'Storage Market', icon: '📦', apiEnv: 'STORAGE_MARKET_API_URL', type: 'storage' },
      { route: 'training', title: 'Formation', icon: '📚', apiEnv: 'TRAINING_API_URL', type: 'training' }
    ]
  },
  'web-forwarder': {
    name: 'Forwarder',
    icon: '🌍',
    color: '#4ECDC4',
    bgImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1920&q=80',
    services: [
      { route: 'orders', title: 'Gestion des commandes', icon: '📦', apiEnv: 'ORDERS_API_URL', type: 'orders' },
      { route: 'planning', title: 'Planning & Itinéraires', icon: '📅', apiEnv: 'PLANNING_API_URL', type: 'planning' },
      { route: 'tracking', title: 'Suivi en temps réel', icon: '📍', apiEnv: 'TRACKING_API_URL', type: 'tracking' },
      { route: 'ecmr', title: 'e-CMR Digital', icon: '📄', apiEnv: 'ECMR_API_URL', type: 'ecmr' },
      { route: 'palettes', title: 'Gestion Palettes', icon: '🏗️', apiEnv: 'PALETTES_API_URL', type: 'palettes' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL', type: 'notifications' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL', type: 'chatbot' },
      { route: 'storage', title: 'Storage Market', icon: '📦', apiEnv: 'STORAGE_MARKET_API_URL', type: 'storage' },
      { route: 'training', title: 'Formation', icon: '📚', apiEnv: 'TRAINING_API_URL', type: 'training' }
    ]
  },
  'web-supplier': {
    name: 'Supplier',
    icon: '🏢',
    color: '#95E1D3',
    bgImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80',
    services: [
      { route: 'orders', title: 'Gestion des commandes', icon: '📦', apiEnv: 'ORDERS_API_URL', type: 'orders' },
      { route: 'planning', title: 'Planning & Itinéraires', icon: '📅', apiEnv: 'PLANNING_API_URL', type: 'planning' },
      { route: 'palettes', title: 'Gestion Palettes', icon: '🏗️', apiEnv: 'PALETTES_API_URL', type: 'palettes' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL', type: 'notifications' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL', type: 'chatbot' },
      { route: 'storage', title: 'Storage Market', icon: '📦', apiEnv: 'STORAGE_MARKET_API_URL', type: 'storage' },
      { route: 'training', title: 'Formation', icon: '📚', apiEnv: 'TRAINING_API_URL', type: 'training' }
    ]
  },
  'web-logistician': {
    name: 'Logistician',
    icon: '📊',
    color: '#A8E6CF',
    bgImage: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1920&q=80',
    services: [
      { route: 'orders', title: 'Gestion des commandes', icon: '📦', apiEnv: 'ORDERS_API_URL', type: 'orders' },
      { route: 'planning', title: 'Planning & Itinéraires', icon: '📅', apiEnv: 'PLANNING_API_URL', type: 'planning' },
      { route: 'tracking', title: 'Suivi en temps réel', icon: '📍', apiEnv: 'TRACKING_API_URL', type: 'tracking' },
      { route: 'ecmr', title: 'e-CMR Digital', icon: '📄', apiEnv: 'ECMR_API_URL', type: 'ecmr' },
      { route: 'palettes', title: 'Gestion Palettes', icon: '🏗️', apiEnv: 'PALETTES_API_URL', type: 'palettes' },
      { route: 'tms-sync', title: 'Synchronisation TMS', icon: '🔄', apiEnv: 'TMS_SYNC_API_URL', type: 'tms' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL', type: 'notifications' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL', type: 'chatbot' },
      { route: 'storage', title: 'Storage Market', icon: '📦', apiEnv: 'STORAGE_MARKET_API_URL', type: 'storage' },
      { route: 'training', title: 'Formation', icon: '📚', apiEnv: 'TRAINING_API_URL', type: 'training' }
    ]
  },
  'web-recipient': {
    name: 'Recipient',
    icon: '🏪',
    color: '#FFD3B6',
    bgImage: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1920&q=80',
    services: [
      { route: 'orders', title: 'Mes commandes', icon: '📦', apiEnv: 'ORDERS_API_URL', type: 'orders' },
      { route: 'tracking', title: 'Suivi livraisons', icon: '📍', apiEnv: 'TRACKING_API_URL', type: 'tracking' },
      { route: 'ecmr', title: 'e-CMR Digital', icon: '📄', apiEnv: 'ECMR_API_URL', type: 'ecmr' },
      { route: 'notifications', title: 'Notifications', icon: '🔔', apiEnv: 'NOTIFICATIONS_API_URL', type: 'notifications' },
      { route: 'chatbot', title: 'Assistant Chatbot', icon: '🤖', apiEnv: 'CHATBOT_API_URL', type: 'chatbot' }
    ]
  }
};

// Générateur de contenu spécifique par type de service
const getServiceContent = (service) => {
  const contentMap = {
    orders: `
  const [orders, setOrders] = useState([
    { id: 'CMD-001', client: 'Client A', statut: 'En cours', date: '2025-11-20', montant: '1 250 €' },
    { id: 'CMD-002', client: 'Client B', statut: 'Livrée', date: '2025-11-19', montant: '3 400 €' },
    { id: 'CMD-003', client: 'Client C', statut: 'En préparation', date: '2025-11-18', montant: '750 €' },
  ]);
  const [filter, setFilter] = useState('all');

  const getStatusColor = (status) => {
    switch(status) {
      case 'En cours': return '#FFA500';
      case 'Livrée': return '#00D084';
      case 'En préparation': return '#667eea';
      default: return '#666';
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.statut === filter);`,

    planning: `
  const [events, setEvents] = useState([
    { time: '08:00', title: 'Livraison Paris Nord', type: 'delivery' },
    { time: '10:30', title: 'Collecte Entrepôt A', type: 'pickup' },
    { time: '14:00', title: 'Maintenance véhicule', type: 'maintenance' },
  ]);

  const getEventColor = (type) => {
    switch(type) {
      case 'delivery': return '#00D084';
      case 'pickup': return '#667eea';
      case 'maintenance': return '#FFA500';
      default: return '#666';
    }
  };`,

    tracking: `
  const [shipments, setShipments] = useState([
    { id: 'TRK-001', destination: 'Paris', progress: 75, eta: '2h30', status: 'En transit' },
    { id: 'TRK-002', destination: 'Lyon', progress: 40, eta: '5h00', status: 'En transit' },
    { id: 'TRK-003', destination: 'Marseille', progress: 100, eta: 'Arrivé', status: 'Livré' },
  ]);`,

    ecmr: `
  const [documents, setDocuments] = useState([
    { id: 'CMR-2025-001', date: '2025-11-23', transporteur: 'Transport A', status: 'Signé' },
    { id: 'CMR-2025-002', date: '2025-11-22', transporteur: 'Transport B', status: 'En attente' },
    { id: 'CMR-2025-003', date: '2025-11-21', transporteur: 'Transport C', status: 'Signé' },
  ]);`,

    palettes: `
  const [palettes, setPalettes] = useState([
    { id: 'PAL-EUR-001', type: 'Europe', qty: 150, location: 'Entrepôt A', status: 'Disponible' },
    { id: 'PAL-EUR-002', type: 'Europe', qty: 75, location: 'En transit', status: 'En mouvement' },
    { id: 'PAL-US-001', type: 'Américaine', qty: 50, location: 'Entrepôt B', status: 'Disponible' },
  ]);`,

    tms: `
  const [syncStatus, setSyncStatus] = useState({
    lastSync: '2025-11-23 10:30',
    status: 'Connecté',
    orders: 1247,
    vehicles: 45,
    errors: 2
  });`,

    notifications: `
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', message: 'Nouvelle commande CMD-004 reçue', time: 'Il y a 5 min', read: false },
    { id: 2, type: 'warning', message: 'Retard prévu sur livraison TRK-002', time: 'Il y a 15 min', read: false },
    { id: 3, type: 'success', message: 'Livraison TRK-003 complétée', time: 'Il y a 1h', read: true },
  ]);

  const getNotifColor = (type) => {
    switch(type) {
      case 'info': return '#667eea';
      case 'warning': return '#FFA500';
      case 'success': return '#00D084';
      case 'error': return '#FF4444';
      default: return '#666';
    }
  };`,

    chatbot: `
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Bonjour ! Comment puis-je vous aider aujourd\\'hui ?' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages,
      { id: messages.length + 1, sender: 'user', text: input },
      { id: messages.length + 2, sender: 'bot', text: 'Merci pour votre message. Notre équipe va traiter votre demande.' }
    ]);
    setInput('');
  };`,

    storage: `
  const [spaces, setSpaces] = useState([
    { id: 'STO-001', location: 'Paris - Zone Nord', size: '500 m²', price: '2 500 €/mois', available: true },
    { id: 'STO-002', location: 'Lyon - Zone Est', size: '1000 m²', price: '4 200 €/mois', available: true },
    { id: 'STO-003', location: 'Marseille - Port', size: '750 m²', price: '3 100 €/mois', available: false },
  ]);`,

    training: `
  const [modules, setModules] = useState([
    { id: 1, title: 'Sécurité routière', duration: '2h', completed: 100, status: 'Complété' },
    { id: 2, title: 'Gestion documentaire', duration: '1h30', completed: 60, status: 'En cours' },
    { id: 3, title: 'Utilisation TMS', duration: '3h', completed: 0, status: 'Non commencé' },
  ]);`,

    production: `
  const [production, setProduction] = useState([
    { ligne: 'Ligne A', produit: 'Produit X', objectif: 1000, realise: 850, taux: 85 },
    { ligne: 'Ligne B', produit: 'Produit Y', objectif: 500, realise: 520, taux: 104 },
    { ligne: 'Ligne C', produit: 'Produit Z', objectif: 750, realise: 680, taux: 91 },
  ]);`,

    dashboard: `
  const [kpis, setKpis] = useState({
    orders: { value: 1247, trend: '+12%', color: '#00D084' },
    revenue: { value: '€ 245K', trend: '+8%', color: '#00D084' },
    deliveries: { value: 892, trend: '+5%', color: '#00D084' },
    satisfaction: { value: '96%', trend: '+2%', color: '#00D084' }
  });`,

    affret: `
  const [optimization, setOptimization] = useState({
    routes: 45,
    savings: '€ 12 500',
    co2Reduction: '2.3 tonnes',
    efficiency: '+18%'
  });
  const [suggestions, setSuggestions] = useState([
    'Regrouper les livraisons Paris Nord et Paris Sud',
    'Optimiser le chargement du véhicule V-042',
    'Utiliser un itinéraire alternatif pour éviter les embouteillages'
  ]);`
  };

  return contentMap[service.type] || `const [data, setData] = useState([]);`;
};

// Générateur de rendu spécifique par type de service
const getServiceRender = (service) => {
  const renderMap = {
    orders: `
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              {['all', 'En cours', 'Livrée', 'En préparation'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '8px 16px',
                    background: filter === f ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: filter === f ? '700' : '600'
                  }}
                >
                  {f === 'all' ? 'Toutes' : f}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredOrders.map(order => (
                <div key={order.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Référence</div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>{order.id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Client</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{order.client}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Statut</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: getStatusColor(order.statut),
                      padding: '4px 12px',
                      background: \`\${getStatusColor(order.statut)}22\`,
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>{order.statut}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Montant</div>
                    <div style={{ fontSize: '18px', fontWeight: '800' }}>{order.montant}</div>
                  </div>
                </div>
              ))}
            </div>`,

    planning: `
            <div style={{ display: 'grid', gap: '16px' }}>
              {events.map((event, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '800',
                    width: '80px',
                    textAlign: 'center'
                  }}>{event.time}</div>
                  <div style={{
                    width: '4px',
                    height: '60px',
                    background: getEventColor(event.type),
                    borderRadius: '2px'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{event.title}</div>
                    <div style={{
                      fontSize: '12px',
                      opacity: 0.7,
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    }}>{event.type}</div>
                  </div>
                </div>
              ))}
            </div>`,

    tracking: `
            <div style={{ display: 'grid', gap: '16px' }}>
              {shipments.map(shipment => (
                <div key={shipment.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{shipment.id}</div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>Destination: {shipment.destination}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', opacity: 0.7 }}>ETA</div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{shipment.eta}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', opacity: 0.7 }}>Progression</span>
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>{shipment.progress}%</span>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: shipment.progress === 100 ? '#00D084' : '#667eea',
                        width: \`\${shipment.progress}%\`,
                        height: '100%',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>`,

    ecmr: `
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
            </div>`,

    palettes: `
            <div style={{ display: 'grid', gap: '16px' }}>
              {palettes.map(pal => (
                <div key={pal.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Référence</div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>{pal.id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Type</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{pal.type}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Quantité</div>
                    <div style={{ fontSize: '20px', fontWeight: '800' }}>{pal.qty}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>Statut</div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '700',
                      color: pal.status === 'Disponible' ? '#00D084' : '#FFA500'
                    }}>{pal.status}</div>
                  </div>
                </div>
              ))}
            </div>`,

    tms: `
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.2)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Statut de synchronisation</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Dernière sync: {syncStatus.lastSync}</div>
                </div>
                <div style={{
                  padding: '12px 24px',
                  background: '#00D08422',
                  color: '#00D084',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700'
                }}>
                  ● {syncStatus.status}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>{syncStatus.orders}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Commandes synchronisées</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>{syncStatus.vehicles}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Véhicules</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: syncStatus.errors > 0 ? '#FFA500' : '#00D084' }}>{syncStatus.errors}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>Erreurs</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <button style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}>
                    Synchroniser
                  </button>
                </div>
              </div>
            </div>`,

    notifications: `
            <div style={{ display: 'grid', gap: '12px' }}>
              {notifications.map(notif => (
                <div key={notif.id} style={{
                  background: notif.read ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: notif.read ? 'transparent' : getNotifColor(notif.type)
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{notif.message}</div>
                    <div style={{ fontSize: '12px', opacity: 0.6 }}>{notif.time}</div>
                  </div>
                </div>
              ))}
            </div>`,

    chatbot: `
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.2)',
              height: '500px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: msg.sender === 'bot' ? 'flex-start' : 'flex-end'
                  }}>
                    <div style={{
                      background: msg.sender === 'bot' ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      maxWidth: '70%',
                      fontSize: '14px'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Tapez votre message..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={sendMessage}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}
                >
                  Envoyer
                </button>
              </div>
            </div>`,

    storage: `
            <div style={{ display: 'grid', gap: '16px' }}>
              {spaces.map(space => (
                <div key={space.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{space.location}</div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>Réf: {space.id}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800' }}>{space.size}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Surface</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#00D084' }}>{space.price}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <button style={{
                      padding: '10px 20px',
                      background: space.available ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: space.available ? 'pointer' : 'not-allowed',
                      fontWeight: '700',
                      fontSize: '14px',
                      opacity: space.available ? 1 : 0.5
                    }}>
                      {space.available ? 'Réserver' : 'Indisponible'}
                    </button>
                  </div>
                </div>
              ))}
            </div>`,

    training: `
            <div style={{ display: 'grid', gap: '16px' }}>
              {modules.map(mod => (
                <div key={mod.id} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{mod.title}</div>
                      <div style={{ fontSize: '14px', opacity: 0.7 }}>Durée: {mod.duration}</div>
                    </div>
                    <div style={{
                      padding: '6px 16px',
                      background: mod.status === 'Complété' ? '#00D08422' : mod.status === 'En cours' ? '#667eea22' : 'rgba(255,255,255,0.1)',
                      color: mod.status === 'Complété' ? '#00D084' : mod.status === 'En cours' ? '#667eea' : 'white',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>{mod.status}</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', opacity: 0.7 }}>Progression</span>
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>{mod.completed}%</span>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        background: mod.completed === 100 ? '#00D084' : '#667eea',
                        width: \`\${mod.completed}%\`,
                        height: '100%',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>`,

    production: `
            <div style={{ display: 'grid', gap: '16px' }}>
              {production.map((ligne, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{ligne.ligne}</div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>{ligne.produit}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800' }}>{ligne.objectif}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Objectif</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: ligne.taux >= 100 ? '#00D084' : '#FFA500' }}>{ligne.realise}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Réalisé</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: ligne.taux >= 100 ? '#00D084' : ligne.taux >= 80 ? '#FFA500' : '#FF4444' }}>{ligne.taux}%</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>Taux</div>
                  </div>
                </div>
              ))}
            </div>`,

    dashboard: `
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
              {Object.entries(kpis).map(([key, kpi]) => (
                <div key={key} style={{
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px', color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: '14px', opacity: 0.7, textTransform: 'capitalize', marginBottom: '8px' }}>{key}</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#00D084' }}>{kpi.trend}</div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '80px', marginBottom: '16px' }}>📊</div>
              <div style={{ fontSize: '18px', opacity: 0.8 }}>Graphiques et analyses détaillées à venir</div>
            </div>`,

    affret: `
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>{optimization.routes}</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>Routes optimisées</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: '#00D084' }}>{optimization.savings}</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>Économies réalisées</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: '#00D084' }}>{optimization.co2Reduction}</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>CO₂ évité</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.2)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: '#667eea' }}>{optimization.efficiency}</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>Efficacité améliorée</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>💡 Suggestions d'optimisation</div>
              {suggestions.map((sug, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  fontSize: '15px'
                }}>
                  {sug}
                </div>
              ))}
            </div>`
  };

  return renderMap[service.type] || `
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '40px',
              border: '1px solid rgba(255,255,255,0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>${service.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>${service.title}</div>
              <div style={{ fontSize: '16px', opacity: 0.8, marginBottom: '24px' }}>Interface en cours de développement</div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}>
                API: {apiUrl || 'Non configurée'}
              </div>
            </div>`;
};

// Template de page de service avec contenu fonctionnel
const generateServicePage = (portal, service) => `import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAuthenticated } from '../lib/auth';

export default function ${service.route.charAt(0).toUpperCase() + service.route.slice(1).replace(/-/g, '')}Page() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_${service.apiEnv};
${getServiceContent(service)}

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

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
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
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
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            ${portal.icon} ${portal.name}
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
${getServiceRender(service)}
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

  console.log(`\n📁 Génération pour ${portal.name}...`);

  portal.services.forEach(service => {
    const filePath = path.join(pagesDir, `${service.route}.tsx`);
    const content = generateServicePage(portal, service);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ ${service.route}.tsx (${service.type})`);
    totalCreated++;
  });
});

console.log(`\n🎉 ${totalCreated} pages fonctionnelles créées avec succès!`);
