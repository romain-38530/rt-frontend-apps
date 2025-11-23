// Système de couleurs RT Technologie
export const colors = {
  // Couleurs de marque RT
  primary: {
    main: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
    contrast: '#FFFFFF'
  },
  secondary: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    contrast: '#FFFFFF'
  },

  // Couleurs spécifiques aux portails
  portals: {
    supplier: {
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      main: '#f093fb',
      dark: '#f5576c'
    },
    recipient: {
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      main: '#11998e',
      dark: '#38ef7d'
    },
    transporter: {
      gradient: 'linear-gradient(135deg, #22c1c3 0%, #fdbb2d 100%)',
      main: '#22c1c3',
      dark: '#fdbb2d'
    },
    logistician: {
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      main: '#fa709a',
      dark: '#fee140'
    },
    forwarder: {
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      main: '#4facfe',
      dark: '#00f2fe'
    },
    industry: {
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      main: '#667eea',
      dark: '#764ba2'
    }
  },

  // Couleurs de statut
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    background: '#D1FAE5'
  },
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    background: '#FEF3C7'
  },
  error: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    background: '#FEE2E2'
  },
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    dark: '#2563EB',
    background: '#DBEAFE'
  },

  // Échelle de gris
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827'
  },

  // Couleurs de fond
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    dark: '#111827'
  },

  // Couleurs de texte
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    inverse: '#FFFFFF'
  }
};

// Abonnements
export const subscriptionColors = {
  free: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    main: '#667eea',
    dark: '#764ba2'
  },
  pro: {
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    main: '#f093fb',
    dark: '#f5576c'
  },
  enterprise: {
    gradient: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    main: '#ffd89b',
    dark: '#19547b'
  }
};
