/**
 * AWS Secrets Manager Service
 * Gère la récupération sécurisée des secrets depuis AWS
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export interface AdminUserSecret {
  email: string;
  adminKey: string; // Hash bcrypt
  roles: string[];
}

export interface B2PWebCredentials {
  email: string;
  password: string;
}

export interface AppSecrets {
  adminUsers: AdminUserSecret[];
  b2pwebCredentials: B2PWebCredentials;
  jwtSecret: string;
  jwtRefreshSecret: string;
  mongodbUri: string;
  redisUrl: string;
  sentryDsn: string;
  sesFromEmail: string;
}

class SecretsManager {
  private client: SecretsManagerClient | null = null;
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private isAWS: boolean;

  constructor() {
    this.isAWS = process.env.NODE_ENV === 'production' || !!process.env.AWS_REGION;

    if (this.isAWS) {
      this.client = new SecretsManagerClient({
        region: process.env.AWS_REGION || 'eu-west-3'
      });
    }
  }

  async getSecret(secretName: string): Promise<any> {
    // En dev, utiliser les variables d'environnement
    if (!this.isAWS || !this.client) {
      return this.getFromEnv(secretName);
    }

    // Vérifier le cache
    const cached = this.cache.get(secretName);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    try {
      // Récupérer depuis AWS
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);
      const value = JSON.parse(response.SecretString || '{}');

      // Mettre en cache
      this.cache.set(secretName, { value, expiry: Date.now() + this.cacheTTL });
      return value;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error);
      // Fallback aux variables d'environnement
      return this.getFromEnv(secretName);
    }
  }

  private getFromEnv(secretName: string): any {
    // Fallback pour développement local
    if (secretName === 'rt-admin-api/production' || secretName === 'rt-admin-api/secrets') {
      return {
        adminUsers: [
          {
            email: process.env.ADMIN_EMAIL || 'admin@rt-technologie.com',
            adminKey: process.env.ADMIN_KEY_HASH || '$2a$10$defaulthash', // À configurer
            roles: ['super_admin', 'pricing', 'support', 'commercial', 'manager']
          }
        ],
        b2pwebCredentials: {
          email: process.env.B2PWEB_EMAIL || '',
          password: process.env.B2PWEB_PASSWORD || ''
        },
        jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
        mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rt-admin',
        redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
        sentryDsn: process.env.SENTRY_DSN || '',
        sesFromEmail: process.env.SES_FROM_EMAIL || 'noreply@rt-technologie.com'
      };
    }
    return {};
  }

  async getAppSecrets(): Promise<AppSecrets> {
    const secretName = process.env.SECRETS_NAME || 'rt-admin-api/secrets';
    return this.getSecret(secretName);
  }

  async getJwtSecret(): Promise<string> {
    const secrets = await this.getAppSecrets();
    return secrets.jwtSecret;
  }

  async getJwtRefreshSecret(): Promise<string> {
    const secrets = await this.getAppSecrets();
    return secrets.jwtRefreshSecret;
  }

  async getB2PWebCredentials(): Promise<B2PWebCredentials> {
    const secrets = await this.getAppSecrets();
    return secrets.b2pwebCredentials;
  }

  async getAdminUsers(): Promise<AdminUserSecret[]> {
    const secrets = await this.getAppSecrets();
    return secrets.adminUsers;
  }

  // Invalider le cache (utile après rotation des secrets)
  invalidateCache(): void {
    this.cache.clear();
  }
}

export const secretsManager = new SecretsManager();
export default secretsManager;
