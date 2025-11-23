export const translations = {
  fr: {
    portal: 'Portail Industry',
    tagline: "L'IA qui orchestre vos flux transport.",
    email: 'Email',
    password: 'Mot de passe',
    login: 'Se connecter',
    logging: 'Connexion...',
    testLogin: 'Connexion de test (démo)',
    testLoginDesc: 'Pour tester sans API',
    features: [
      { icon: '🏭', title: 'Planification production', desc: 'Planifiez et optimisez votre production' },
      { icon: '📊', title: 'Chaîne logistique', desc: 'Visibilité complète de votre supply chain' },
      { icon: '📦', title: 'Gestion inventaire', desc: 'Gérez vos stocks en temps réel' },
      { icon: '✅', title: 'Contrôle qualité', desc: 'Contrôle qualité et conformité produits' },
      { icon: '📈', title: 'Analyse performance', desc: 'Tableaux de bord et KPIs détaillés' },
      { icon: '📉', title: 'Prévision demande', desc: 'Prévisions intelligentes de la demande' }
    ]
  },
  en: {
    portal: 'Industry Portal',
    tagline: 'AI that orchestrates your transport flows.',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    logging: 'Logging in...',
    testLogin: 'Test login (demo)',
    testLoginDesc: 'To test without API',
    features: [
      { icon: '🏭', title: 'Production planning', desc: 'Plan and optimize your production' },
      { icon: '📊', title: 'Supply chain', desc: 'Complete visibility of your supply chain' },
      { icon: '📦', title: 'Inventory management', desc: 'Manage your stocks in real time' },
      { icon: '✅', title: 'Quality control', desc: 'Product quality control and compliance' },
      { icon: '📈', title: 'Performance analytics', desc: 'Detailed dashboards and KPIs' },
      { icon: '📉', title: 'Demand forecasting', desc: 'Intelligent demand forecasting' }
    ]
  },
  de: {
    portal: 'Industrie Portal',
    tagline: 'KI, die Ihre Transportströme orchestriert.',
    email: 'E-Mail',
    password: 'Passwort',
    login: 'Anmelden',
    logging: 'Anmeldung...',
    testLogin: 'Test-Anmeldung (Demo)',
    testLoginDesc: 'Zum Testen ohne API',
    features: [
      { icon: '🏭', title: 'Produktionsplanung', desc: 'Planen und optimieren Sie Ihre Produktion' },
      { icon: '📊', title: 'Lieferkette', desc: 'Vollständige Transparenz Ihrer Lieferkette' },
      { icon: '📦', title: 'Bestandsverwaltung', desc: 'Verwalten Sie Ihre Bestände in Echtzeit' },
      { icon: '✅', title: 'Qualitätskontrolle', desc: 'Produktqualitätskontrolle und Compliance' },
      { icon: '📈', title: 'Leistungsanalyse', desc: 'Detaillierte Dashboards und KPIs' },
      { icon: '📉', title: 'Bedarfsprognose', desc: 'Intelligente Bedarfsprognose' }
    ]
  },
  es: {
    portal: 'Portal Industria',
    tagline: 'IA que orquesta sus flujos de transporte.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    login: 'Iniciar sesión',
    logging: 'Iniciando sesión...',
    testLogin: 'Inicio de sesión de prueba (demo)',
    testLoginDesc: 'Para probar sin API',
    features: [
      { icon: '🏭', title: 'Planificación producción', desc: 'Planifique y optimice su producción' },
      { icon: '📊', title: 'Cadena de suministro', desc: 'Visibilidad completa de su cadena de suministro' },
      { icon: '📦', title: 'Gestión inventario', desc: 'Gestione sus stocks en tiempo real' },
      { icon: '✅', title: 'Control de calidad', desc: 'Control de calidad y cumplimiento de productos' },
      { icon: '📈', title: 'Análisis rendimiento', desc: 'Paneles de control y KPIs detallados' },
      { icon: '📉', title: 'Previsión demanda', desc: 'Previsión inteligente de la demanda' }
    ]
  },
  it: {
    portal: 'Portale Industria',
    tagline: 'IA che orchestra i vostri flussi di trasporto.',
    email: 'Email',
    password: 'Password',
    login: 'Accedi',
    logging: 'Accesso in corso...',
    testLogin: 'Login di test (demo)',
    testLoginDesc: 'Per testare senza API',
    features: [
      { icon: '🏭', title: 'Pianificazione produzione', desc: 'Pianificate e ottimizzate la vostra produzione' },
      { icon: '📊', title: 'Catena di fornitura', desc: 'Visibilità completa della vostra supply chain' },
      { icon: '📦', title: 'Gestione inventario', desc: 'Gestite le vostre scorte in tempo reale' },
      { icon: '✅', title: 'Controllo qualità', desc: 'Controllo qualità e conformità dei prodotti' },
      { icon: '📈', title: 'Analisi performance', desc: 'Dashboard e KPI dettagliati' },
      { icon: '📉', title: 'Previsione domanda', desc: 'Previsione intelligente della domanda' }
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
