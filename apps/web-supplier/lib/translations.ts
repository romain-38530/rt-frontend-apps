export const translations = {
  fr: {
    portal: 'Portail Fournisseur',
    tagline: "L'IA qui orchestre vos flux transport.",
    email: 'Email',
    password: 'Mot de passe',
    login: 'Se connecter',
    logging: 'Connexion...',
    testLogin: 'Connexion de test (démo)',
    testLoginDesc: 'Pour tester sans API',
    features: [
      { icon: '📦', title: 'Gestion des commandes', desc: 'Suivez toutes vos commandes en temps réel' },
      { icon: '📊', title: 'Catalogue produits', desc: 'Gérez votre inventaire et vos tarifs' },
      { icon: '🚚', title: 'Suivi livraisons', desc: 'Traçabilité complète de vos expéditions' },
      { icon: '💰', title: 'Facturation auto', desc: 'Automatisez vos processus de facturation' },
      { icon: '📈', title: 'Analytics', desc: 'Tableaux de bord et statistiques détaillées' },
      { icon: '🔔', title: 'Alertes temps réel', desc: 'Notifications instantanées importantes' }
    ]
  },
  en: {
    portal: 'Supplier Portal',
    tagline: 'AI that orchestrates your transport flows.',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    logging: 'Logging in...',
    testLogin: 'Test login (demo)',
    testLoginDesc: 'To test without API',
    features: [
      { icon: '📦', title: 'Order management', desc: 'Track all your orders in real time' },
      { icon: '📊', title: 'Product catalog', desc: 'Manage your inventory and pricing' },
      { icon: '🚚', title: 'Delivery tracking', desc: 'Complete traceability of your shipments' },
      { icon: '💰', title: 'Auto invoicing', desc: 'Automate your billing processes' },
      { icon: '📈', title: 'Analytics', desc: 'Detailed dashboards and statistics' },
      { icon: '🔔', title: 'Real-time alerts', desc: 'Important instant notifications' }
    ]
  },
  de: {
    portal: 'Lieferanten Portal',
    tagline: 'KI, die Ihre Transportströme orchestriert.',
    email: 'E-Mail',
    password: 'Passwort',
    login: 'Anmelden',
    logging: 'Anmeldung...',
    testLogin: 'Test-Anmeldung (Demo)',
    testLoginDesc: 'Zum Testen ohne API',
    features: [
      { icon: '📦', title: 'Auftragsverwaltung', desc: 'Verfolgen Sie alle Ihre Bestellungen in Echtzeit' },
      { icon: '📊', title: 'Produktkatalog', desc: 'Verwalten Sie Ihr Inventar und Ihre Preise' },
      { icon: '🚚', title: 'Lieferverfolgung', desc: 'Vollständige Rückverfolgbarkeit Ihrer Sendungen' },
      { icon: '💰', title: 'Auto-Rechnungsstellung', desc: 'Automatisieren Sie Ihre Abrechnungsprozesse' },
      { icon: '📈', title: 'Analytics', desc: 'Detaillierte Dashboards und Statistiken' },
      { icon: '🔔', title: 'Echtzeit-Benachrichtigungen', desc: 'Wichtige Sofortnachrichten' }
    ]
  },
  es: {
    portal: 'Portal Proveedor',
    tagline: 'IA que orquesta sus flujos de transporte.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    login: 'Iniciar sesión',
    logging: 'Iniciando sesión...',
    testLogin: 'Inicio de sesión de prueba (demo)',
    testLoginDesc: 'Para probar sin API',
    features: [
      { icon: '📦', title: 'Gestión pedidos', desc: 'Siga todos sus pedidos en tiempo real' },
      { icon: '📊', title: 'Catálogo productos', desc: 'Gestione su inventario y precios' },
      { icon: '🚚', title: 'Seguimiento entregas', desc: 'Trazabilidad completa de sus envíos' },
      { icon: '💰', title: 'Facturación automática', desc: 'Automatice sus procesos de facturación' },
      { icon: '📈', title: 'Analytics', desc: 'Paneles de control y estadísticas detalladas' },
      { icon: '🔔', title: 'Alertas tiempo real', desc: 'Notificaciones instantáneas importantes' }
    ]
  },
  it: {
    portal: 'Portale Fornitore',
    tagline: 'IA che orchestra i vostri flussi di trasporto.',
    email: 'Email',
    password: 'Password',
    login: 'Accedi',
    logging: 'Accesso in corso...',
    testLogin: 'Login di test (demo)',
    testLoginDesc: 'Per testare senza API',
    features: [
      { icon: '📦', title: 'Gestione ordini', desc: 'Segui tutti i tuoi ordini in tempo reale' },
      { icon: '📊', title: 'Catalogo prodotti', desc: 'Gestisci il tuo inventario e i tuoi prezzi' },
      { icon: '🚚', title: 'Tracciamento consegne', desc: 'Tracciabilità completa delle tue spedizioni' },
      { icon: '💰', title: 'Fatturazione automatica', desc: 'Automatizza i tuoi processi di fatturazione' },
      { icon: '📈', title: 'Analytics', desc: 'Dashboard e statistiche dettagliate' },
      { icon: '🔔', title: 'Avvisi tempo reale', desc: 'Notifiche istantanee importanti' }
    ]
  }
};

export type Language = keyof typeof translations;
export const languages: Language[] = ['fr', 'en', 'de', 'es', 'it'];
export const languageNames = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano'
};
