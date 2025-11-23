export const translations = {
  fr: {
    portal: 'Portail Transporteur',
    tagline: "L'IA qui orchestre vos flux transport.",
    email: 'Email',
    password: 'Mot de passe',
    login: 'Se connecter',
    logging: 'Connexion...',
    testLogin: 'Connexion de test (démo)',
    testLoginDesc: 'Pour tester sans API',
    features: [
      { icon: '🚛', title: 'Gestion flotte', desc: 'Gérez tous vos véhicules en un seul endroit' },
      { icon: '📍', title: 'Planification routes', desc: 'Optimisez vos itinéraires de transport' },
      { icon: '🗺️', title: 'Suivi temps réel', desc: 'Localisez vos véhicules en temps réel' },
      { icon: '⚡', title: 'Optimisation trajets', desc: 'Réduisez les coûts et les temps de trajet' },
      { icon: '📝', title: 'Carnet de bord', desc: 'Historique complet de toutes les courses' },
      { icon: '👥', title: 'Gestion chauffeurs', desc: 'Plannings et affectations des conducteurs' }
    ]
  },
  en: {
    portal: 'Transporter Portal',
    tagline: 'AI that orchestrates your transport flows.',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    logging: 'Logging in...',
    testLogin: 'Test login (demo)',
    testLoginDesc: 'To test without API',
    features: [
      { icon: '🚛', title: 'Fleet management', desc: 'Manage all your vehicles in one place' },
      { icon: '📍', title: 'Route planning', desc: 'Optimize your transport routes' },
      { icon: '🗺️', title: 'Real-time tracking', desc: 'Locate your vehicles in real time' },
      { icon: '⚡', title: 'Trip optimization', desc: 'Reduce costs and travel times' },
      { icon: '📝', title: 'Logbook', desc: 'Complete history of all trips' },
      { icon: '👥', title: 'Driver management', desc: 'Schedules and driver assignments' }
    ]
  },
  de: {
    portal: 'Transporter Portal',
    tagline: 'KI, die Ihre Transportströme orchestriert.',
    email: 'E-Mail',
    password: 'Passwort',
    login: 'Anmelden',
    logging: 'Anmeldung...',
    testLogin: 'Test-Anmeldung (Demo)',
    testLoginDesc: 'Zum Testen ohne API',
    features: [
      { icon: '🚛', title: 'Flottenverwaltung', desc: 'Verwalten Sie alle Ihre Fahrzeuge an einem Ort' },
      { icon: '📍', title: 'Routenplanung', desc: 'Optimieren Sie Ihre Transportrouten' },
      { icon: '🗺️', title: 'Echtzeit-Verfolgung', desc: 'Lokalisieren Sie Ihre Fahrzeuge in Echtzeit' },
      { icon: '⚡', title: 'Fahrtenoptimierung', desc: 'Reduzieren Sie Kosten und Fahrzeiten' },
      { icon: '📝', title: 'Fahrtenbuch', desc: 'Vollständige Historie aller Fahrten' },
      { icon: '👥', title: 'Fahrerverwaltung', desc: 'Zeitpläne und Fahrerzuweisungen' }
    ]
  },
  es: {
    portal: 'Portal Transportista',
    tagline: 'IA que orquesta sus flujos de transporte.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    login: 'Iniciar sesión',
    logging: 'Iniciando sesión...',
    testLogin: 'Inicio de sesión de prueba (demo)',
    testLoginDesc: 'Para probar sin API',
    features: [
      { icon: '🚛', title: 'Gestión flota', desc: 'Gestione todos sus vehículos en un solo lugar' },
      { icon: '📍', title: 'Planificación rutas', desc: 'Optimice sus rutas de transporte' },
      { icon: '🗺️', title: 'Seguimiento tiempo real', desc: 'Localice sus vehículos en tiempo real' },
      { icon: '⚡', title: 'Optimización viajes', desc: 'Reduzca costos y tiempos de viaje' },
      { icon: '📝', title: 'Libro de ruta', desc: 'Historial completo de todos los viajes' },
      { icon: '👥', title: 'Gestión conductores', desc: 'Horarios y asignaciones de conductores' }
    ]
  },
  it: {
    portal: 'Portale Trasportatore',
    tagline: 'IA che orchestra i vostri flussi di trasporto.',
    email: 'Email',
    password: 'Password',
    login: 'Accedi',
    logging: 'Accesso in corso...',
    testLogin: 'Login di test (demo)',
    testLoginDesc: 'Per testare senza API',
    features: [
      { icon: '🚛', title: 'Gestione flotta', desc: 'Gestisci tutti i tuoi veicoli in un unico posto' },
      { icon: '📍', title: 'Pianificazione percorsi', desc: 'Ottimizza i tuoi percorsi di trasporto' },
      { icon: '🗺️', title: 'Tracciamento tempo reale', desc: 'Localizza i tuoi veicoli in tempo reale' },
      { icon: '⚡', title: 'Ottimizzazione viaggi', desc: 'Riduci costi e tempi di viaggio' },
      { icon: '📝', title: 'Registro di bordo', desc: 'Storico completo di tutti i viaggi' },
      { icon: '👥', title: 'Gestione autisti', desc: 'Pianificazioni e assegnazioni autisti' }
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
