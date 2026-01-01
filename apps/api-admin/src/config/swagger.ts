/**
 * Configuration Swagger/OpenAPI
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RT Admin API',
      version: process.env.APP_VERSION || '3.0.0',
      description: `
API de gestion du backoffice RT Technologie - SYMPHONI.A

## Authentification

Toutes les routes protégées nécessitent un token JWT dans le header Authorization:
\`\`\`
Authorization: Bearer <token>
\`\`\`

## Rate Limiting

- Global: 1000 requêtes / 15 minutes
- Auth: 10 tentatives / 15 minutes
- Scraping: 50 jobs / heure
      `,
      contact: {
        name: 'RT Technologie',
        email: 'support@rt-technologie.com',
        url: 'https://rt-technologie.com'
      },
      license: {
        name: 'Propriétaire',
        url: 'https://rt-technologie.com/license'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3020',
        description: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /auth/admin/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            roles: { type: 'array', items: { type: 'string' }, example: ['admin', 'manager'] },
            companyId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'adminKey'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@rt-technologie.com' },
            adminKey: { type: 'string', example: 'your-admin-key' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'string', example: '15m' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            type: { type: 'string', enum: ['info', 'warning', 'error', 'success', 'announcement'] },
            title: { type: 'string' },
            message: { type: 'string' },
            target: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['all', 'role', 'user', 'company'] },
                value: { type: 'string' }
              }
            },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        GDPRRequest: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            type: { type: 'string', enum: ['access', 'deletion', 'portability', 'rectification'] },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'rejected'] },
            requestedBy: { $ref: '#/components/schemas/User' },
            targetUser: { $ref: '#/components/schemas/User' },
            reason: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            uptime: { type: 'number' },
            checks: {
              type: 'object',
              properties: {
                mongodb: { type: 'object', properties: { status: { type: 'string' }, latency: { type: 'number' } } },
                memory: { type: 'object', properties: { used: { type: 'number' }, total: { type: 'number' }, percentage: { type: 'number' } } }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token manquant ou invalide',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Authorization header required' }
            }
          }
        },
        ForbiddenError: {
          description: 'Accès non autorisé',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Admin access required' }
            }
          }
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Resource not found' }
            }
          }
        },
        RateLimitError: {
          description: 'Trop de requêtes',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Too many requests, please try again later', retryAfter: 900 }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentification et gestion des sessions' },
      { name: 'Users', description: 'Gestion des utilisateurs' },
      { name: 'Companies', description: 'Gestion des entreprises' },
      { name: 'CRM', description: 'Gestion des leads et pipeline commercial' },
      { name: 'Scraping', description: 'Scraping B2PWeb et transport' },
      { name: 'Notifications', description: 'Système de notifications' },
      { name: 'GDPR', description: 'Conformité RGPD' },
      { name: 'Health', description: 'Monitoring et health checks' }
    ]
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
export default swaggerSpec;
