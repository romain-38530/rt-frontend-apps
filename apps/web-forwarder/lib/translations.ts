export const translations = {
  fr: {
    portal: 'Portail Transitaire',
    tagline: "L'IA qui orchestre vos flux transport.",
    email: 'Email',
    password: 'Mot de passe',
    login: 'Se connecter',
    logging: 'Connexion...',
    testLogin: 'Connexion de test (démo)',
    testLoginDesc: 'Pour tester sans API',
    features: [
      { icon: '🌐', title: 'Multi-transport', desc: 'Coordonnez tous vos modes de transport' },
      { icon: '🤝', title: 'Coordination globale', desc: 'Orchestrez vos opérations à l\'international' },
      { icon: '📋', title: 'Gestion douanes', desc: 'Simplifiez vos démarches douanières' },
      { icon: '📦', title: 'Consolidation fret', desc: 'Optimisez le groupage de vos marchandises' },
      { icon: '🔍', title: 'Tracking multi-modal', desc: 'Suivez vos envois sur tous les modes' },
      { icon: '💵', title: 'Tarification auto', desc: 'Calcul automatique des tarifs de transport' }
    ]
  },
  en: {
    portal: 'Forwarder Portal',
    tagline: 'AI that orchestrates your transport flows.',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    logging: 'Logging in...',
    testLogin: 'Test login (demo)',
    testLoginDesc: 'To test without API',
    features: [
      { icon: '🌐', title: 'Multi-transport', desc: 'Coordinate all your transport modes' },
      { icon: '🤝', title: 'Global coordination', desc: 'Orchestrate your international operations' },
      { icon: '📋', title: 'Customs management', desc: 'Simplify your customs procedures' },
      { icon: '📦', title: 'Freight consolidation', desc: 'Optimize your cargo grouping' },
      { icon: '🔍', title: 'Multi-modal tracking', desc: 'Track your shipments across all modes' },
      { icon: '💵', title: 'Auto pricing', desc: 'Automatic transport rate calculation' }
    ]
  },
  de: {
    portal: 'Spediteur Portal',
    tagline: 'KI, die Ihre Transportströme orchestriert.',
    email: 'E-Mail',
    password: 'Passwort',
    login: 'Anmelden',
    logging: 'Anmeldung...',
    testLogin: 'Test-Anmeldung (Demo)',
    testLoginDesc: 'Zum Testen ohne API',
    features: [
      { icon: '🌐', title: 'Multi-Transport', desc: 'Koordinieren Sie alle Ihre Transportmodi' },
      { icon: '🤝', title: 'Globale Koordination', desc: 'Orchestrieren Sie Ihre internationalen Operationen' },
      { icon: '📋', title: 'Zollverwaltung', desc: 'Vereinfachen Sie Ihre Zollverfahren' },
      { icon: '📦', title: 'Frachtkonsolidierung', desc: 'Optimieren Sie Ihre Warengruppierung' },
      { icon: '🔍', title: 'Multimodales Tracking', desc: 'Verfolgen Sie Ihre Sendungen über alle Modi' },
      { icon: '💵', title: 'Auto-Preisgestaltung', desc: 'Automatische Berechnung der Transporttarife' }
    ]
  },
  es: {
    portal: 'Portal Transitario',
    tagline: 'IA que orquesta sus flujos de transporte.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    login: 'Iniciar sesión',
    logging: 'Iniciando sesión...',
    testLogin: 'Inicio de sesión de prueba (demo)',
    testLoginDesc: 'Para probar sin API',
    features: [
      { icon: '🌐', title: 'Multi-transporte', desc: 'Coordine todos sus modos de transporte' },
      { icon: '🤝', title: 'Coordinación global', desc: 'Orqueste sus operaciones internacionales' },
      { icon: '📋', title: 'Gestión aduanas', desc: 'Simplifique sus trámites aduaneros' },
      { icon: '📦', title: 'Consolidación carga', desc: 'Optimice la agrupación de sus mercancías' },
      { icon: '🔍', title: 'Seguimiento multi-modal', desc: 'Siga sus envíos en todos los modos' },
      { icon: '💵', title: 'Tarifación automática', desc: 'Cálculo automático de tarifas de transporte' }
    ]
  },
  it: {
    portal: 'Portale Spedizioniere',
    tagline: 'IA che orchestra i vostri flussi di trasporto.',
    email: 'Email',
    password: 'Password',
    login: 'Accedi',
    logging: 'Accesso in corso...',
    testLogin: 'Login di test (demo)',
    testLoginDesc: 'Per testare senza API',
    features: [
      { icon: '🌐', title: 'Multi-trasporto', desc: 'Coordina tutti i tuoi modi di trasporto' },
      { icon: '🤝', title: 'Coordinamento globale', desc: 'Orchestra le tue operazioni internazionali' },
      { icon: '📋', title: 'Gestione dogane', desc: 'Semplifica le tue procedure doganali' },
      { icon: '📦', title: 'Consolidamento merci', desc: 'Ottimizza il raggruppamento delle tue merci' },
      { icon: '🔍', title: 'Tracciamento multi-modale', desc: 'Segui le tue spedizioni su tutti i modi' },
      { icon: '💵', title: 'Tariffazione automatica', desc: 'Calcolo automatico delle tariffe di trasporto' }
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
