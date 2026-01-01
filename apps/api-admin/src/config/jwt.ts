/**
 * Configuration JWT sécurisée
 */

export const JWT_CONFIG = {
  accessToken: {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m', // 15 minutes en prod
    algorithm: 'HS256' as const
  },
  refreshToken: {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d', // 7 jours
    algorithm: 'HS256' as const
  }
};

// En développement, permettre des tokens plus longs
if (process.env.NODE_ENV !== 'production') {
  JWT_CONFIG.accessToken.expiresIn = '24h';
}

export default JWT_CONFIG;
