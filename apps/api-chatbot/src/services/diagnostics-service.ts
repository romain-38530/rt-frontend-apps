import axios from 'axios';
import Diagnostic from '../models/Diagnostic';

// Configuration des services à diagnostiquer
const SERVICES = {
  'auth-api': {
    url: process.env.AUTH_API_URL || 'http://localhost:3001',
    type: 'api' as const,
  },
  'authz-api': {
    url: process.env.AUTHZ_API_URL || 'http://localhost:3002',
    type: 'api' as const,
  },
  'orders-api': {
    url: process.env.ORDERS_API_URL || 'http://localhost:3010',
    type: 'api' as const,
  },
  'planning-api': {
    url: process.env.PLANNING_API_URL || 'http://localhost:3030',
    type: 'api' as const,
  },
  'tracking-api': {
    url: process.env.TRACKING_API_URL || 'http://localhost:3011',
    type: 'api' as const,
  },
  'documents-api': {
    url: process.env.DOCUMENTS_API_URL || 'http://localhost:3012',
    type: 'api' as const,
  },
  'ecmr-api': {
    url: process.env.ECMR_API_URL || 'http://localhost:3013',
    type: 'api' as const,
  },
  'notifications-api': {
    url: process.env.NOTIFICATIONS_API_URL || 'http://localhost:3014',
    type: 'api' as const,
  },
  'websocket-api': {
    url: process.env.WEBSOCKET_API_URL || 'http://localhost:3015',
    type: 'api' as const,
  },
  'affret-ia-api': {
    url: process.env.AFFRET_IA_API_URL || 'http://localhost:3020',
    type: 'api' as const,
  },
  'scoring-api': {
    url: process.env.SCORING_API_URL || 'http://localhost:3021',
    type: 'api' as const,
  },
  'palettes-api': {
    url: process.env.PALETTES_API_URL || 'http://localhost:3022',
    type: 'api' as const,
  },
  'billing-api': {
    url: process.env.BILLING_API_URL || 'http://localhost:3023',
    type: 'api' as const,
  },
  'erp-integration': {
    url: process.env.ERP_API_URL || 'http://localhost:3100',
    type: 'erp' as const,
  },
};

interface ServiceCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  responseTime: number;
  details: {
    endpoint: string;
    statusCode?: number;
    errorMessage?: string;
    metadata?: any;
  };
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message?: string;
    duration?: number;
  }>;
}

export async function checkService(serviceName: string): Promise<ServiceCheckResult> {
  const serviceConfig = SERVICES[serviceName as keyof typeof SERVICES];

  if (!serviceConfig) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  const startTime = Date.now();
  const result: ServiceCheckResult = {
    service: serviceName,
    status: 'healthy',
    responseTime: 0,
    details: {
      endpoint: `${serviceConfig.url}/health`,
    },
    checks: [],
  };

  try {
    // Vérifier le endpoint /health
    const response = await axios.get(`${serviceConfig.url}/health`, {
      timeout: 5000,
      validateStatus: () => true, // Ne pas rejeter sur 4xx/5xx
    });

    result.responseTime = Date.now() - startTime;
    result.details.statusCode = response.status;

    // Analyser la réponse
    if (response.status === 200) {
      result.status = 'healthy';
      result.checks.push({
        name: 'health_endpoint',
        status: 'pass',
        message: 'Service is responding',
        duration: result.responseTime,
      });
    } else if (response.status === 503) {
      result.status = 'maintenance';
      result.checks.push({
        name: 'health_endpoint',
        status: 'warning',
        message: 'Service is in maintenance mode',
        duration: result.responseTime,
      });
    } else if (response.status >= 400) {
      result.status = 'degraded';
      result.checks.push({
        name: 'health_endpoint',
        status: 'warning',
        message: `Service returned ${response.status}`,
        duration: result.responseTime,
      });
    }

    // Stocker metadata si disponible
    if (response.data) {
      result.details.metadata = response.data;
    }
  } catch (error: any) {
    result.responseTime = Date.now() - startTime;
    result.status = 'down';
    result.details.errorMessage = error.message;
    result.checks.push({
      name: 'health_endpoint',
      status: 'fail',
      message: `Service unreachable: ${error.message}`,
      duration: result.responseTime,
    });
  }

  // Sauvegarder dans la base de données
  await saveDiagnostic(result, serviceConfig.type);

  return result;
}

export async function checkAllServices(): Promise<ServiceCheckResult[]> {
  const serviceNames = Object.keys(SERVICES);
  const results = await Promise.all(
    serviceNames.map(serviceName => checkService(serviceName))
  );
  return results;
}

export async function runDiagnostic(
  type: 'erp' | 'api' | 'tracking' | 'server'
): Promise<ServiceCheckResult[]> {
  let servicesToCheck: string[];

  switch (type) {
    case 'erp':
      servicesToCheck = ['erp-integration'];
      break;
    case 'api':
      servicesToCheck = Object.keys(SERVICES).filter(
        s => SERVICES[s as keyof typeof SERVICES].type === 'api'
      );
      break;
    case 'tracking':
      servicesToCheck = ['tracking-api', 'orders-api', 'planning-api'];
      break;
    case 'server':
      servicesToCheck = Object.keys(SERVICES);
      break;
    default:
      servicesToCheck = [];
  }

  const results = await Promise.all(
    servicesToCheck.map(serviceName => checkService(serviceName))
  );

  return results;
}

export async function getServiceStatus(serviceName: string) {
  // Récupérer les 10 derniers diagnostics pour ce service
  const diagnostics = await Diagnostic.find({ service: serviceName })
    .sort({ timestamp: -1 })
    .limit(10);

  if (diagnostics.length === 0) {
    return {
      service: serviceName,
      status: 'unknown',
      message: 'No diagnostic data available',
    };
  }

  const latest = diagnostics[0];
  const avgResponseTime =
    diagnostics.reduce((sum, d) => sum + d.responseTime, 0) / diagnostics.length;

  // Calculer uptime (% de checks healthy sur les 10 derniers)
  const healthyCount = diagnostics.filter(d => d.status === 'healthy').length;
  const uptime = (healthyCount / diagnostics.length) * 100;

  return {
    service: serviceName,
    status: latest.status,
    responseTime: latest.responseTime,
    avgResponseTime: Math.round(avgResponseTime),
    uptime: Math.round(uptime),
    lastCheck: latest.timestamp,
    checks: latest.checks,
  };
}

export async function getAllServicesStatus() {
  const serviceNames = Object.keys(SERVICES);
  const statuses = await Promise.all(
    serviceNames.map(serviceName => getServiceStatus(serviceName))
  );
  return statuses;
}

async function saveDiagnostic(result: ServiceCheckResult, type: string) {
  try {
    const diagnostic = new Diagnostic({
      type,
      service: result.service,
      status: result.status,
      responseTime: result.responseTime,
      details: result.details,
      checks: result.checks,
      timestamp: new Date(),
    });

    await diagnostic.save();
  } catch (error) {
    console.error('Error saving diagnostic:', error);
  }
}

// Fonction pour monitorer en continu (optionnel)
export function startHealthMonitoring(intervalMinutes: number = 5) {
  setInterval(async () => {
    try {
      await checkAllServices();
      console.log(`Health check completed at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error during health monitoring:', error);
    }
  }, intervalMinutes * 60 * 1000);
}
