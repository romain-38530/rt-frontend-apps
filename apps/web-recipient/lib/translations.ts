export const translations = {
  fr: {
    portal: 'Portail Destinataire',
    tagline: "L'IA qui orchestre vos flux transport.",
    email: 'Email',
    password: 'Mot de passe',
    login: 'Se connecter',
    logging: 'Connexion...',
    testLogin: 'Connexion de test (démo)',
    testLoginDesc: 'Pour tester sans API',
    features: [
      { icon: '📦', title: 'Réception marchandises', desc: 'Enregistrez vos réceptions en temps réel' },
      { icon: '✅', title: 'Contrôle qualité', desc: 'Vérifiez la conformité de vos livraisons' },
      { icon: '📋', title: 'Gestion stock', desc: 'Gérez votre inventaire avec précision' },
      { icon: '🔍', title: 'Traçabilité entrées', desc: 'Suivez toutes vos entrées de stock' },
      { icon: '📊', title: 'Rapports réception', desc: 'Générez des rapports détaillés' },
      { icon: '🔔', title: 'Notifications livraisons', desc: 'Alertes pour chaque nouvelle livraison' }
    ]
  },
  en: {
    portal: 'Recipient Portal',
    tagline: 'AI that orchestrates your transport flows.',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    logging: 'Logging in...',
    testLogin: 'Test login (demo)',
    testLoginDesc: 'To test without API',
    features: [
      { icon: '📦', title: 'Goods receipt', desc: 'Record your receipts in real time' },
      { icon: '✅', title: 'Quality control', desc: 'Verify delivery compliance' },
      { icon: '📋', title: 'Stock management', desc: 'Manage your inventory with precision' },
      { icon: '🔍', title: 'Entry traceability', desc: 'Track all your stock entries' },
      { icon: '📊', title: 'Receipt reports', desc: 'Generate detailed reports' },
      { icon: '🔔', title: 'Delivery notifications', desc: 'Alerts for each new delivery' }
    ]
  },
  de: {
    portal: 'Empfänger Portal',
    tagline: 'KI, die Ihre Transportströme orchestriert.',
    email: 'E-Mail',
    password: 'Passwort',
    login: 'Anmelden',
    logging: 'Anmeldung...',
    testLogin: 'Test-Anmeldung (Demo)',
    testLoginDesc: 'Zum Testen ohne API',
    features: [
      { icon: '📦', title: 'Wareneingang', desc: 'Erfassen Sie Ihre Eingänge in Echtzeit' },
      { icon: '✅', title: 'Qualitätskontrolle', desc: 'Überprüfen Sie die Lieferkonformität' },
      { icon: '📋', title: 'Bestandsverwaltung', desc: 'Verwalten Sie Ihr Inventar präzise' },
      { icon: '🔍', title: 'Eingangs-Rückverfolgbarkeit', desc: 'Verfolgen Sie alle Ihre Bestandseingänge' },
      { icon: '📊', title: 'Eingangsberichte', desc: 'Erstellen Sie detaillierte Berichte' },
      { icon: '🔔', title: 'Lieferbenachrichtigungen', desc: 'Benachrichtigungen für jede neue Lieferung' }
    ]
  },
  es: {
    portal: 'Portal Destinatario',
    tagline: 'IA que orquesta sus flujos de transporte.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    login: 'Iniciar sesión',
    logging: 'Iniciando sesión...',
    testLogin: 'Inicio de sesión de prueba (demo)',
    testLoginDesc: 'Para probar sin API',
    features: [
      { icon: '📦', title: 'Recepción mercancías', desc: 'Registre sus recepciones en tiempo real' },
      { icon: '✅', title: 'Control de calidad', desc: 'Verifique el cumplimiento de las entregas' },
      { icon: '📋', title: 'Gestión stock', desc: 'Gestione su inventario con precisión' },
      { icon: '🔍', title: 'Trazabilidad entradas', desc: 'Siga todas sus entradas de stock' },
      { icon: '📊', title: 'Informes recepción', desc: 'Genere informes detallados' },
      { icon: '🔔', title: 'Notificaciones entregas', desc: 'Alertas para cada nueva entrega' }
    ]
  },
  it: {
    portal: 'Portale Destinatario',
    tagline: 'IA che orchestra i vostri flussi di trasporto.',
    email: 'Email',
    password: 'Password',
    login: 'Accedi',
    logging: 'Accesso in corso...',
    testLogin: 'Login di test (demo)',
    testLoginDesc: 'Per testare senza API',
    features: [
      { icon: '📦', title: 'Ricezione merci', desc: 'Registra le tue ricevute in tempo reale' },
      { icon: '✅', title: 'Controllo qualità', desc: 'Verifica la conformità delle consegne' },
      { icon: '📋', title: 'Gestione scorte', desc: 'Gestisci il tuo inventario con precisione' },
      { icon: '🔍', title: 'Tracciabilità ingressi', desc: 'Traccia tutti i tuoi ingressi di magazzino' },
      { icon: '📊', title: 'Report ricevimento', desc: 'Genera report dettagliati' },
      { icon: '🔔', title: 'Notifiche consegne', desc: 'Avvisi per ogni nuova consegna' }
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
