/**
 * Service de métriques CloudWatch
 */

import { CloudWatchClient, PutMetricDataCommand, MetricDatum, StandardUnit } from '@aws-sdk/client-cloudwatch';

interface MetricData {
  name: string;
  value: number;
  unit: StandardUnit;
  dimensions?: Record<string, string>;
}

class MetricsService {
  private client: CloudWatchClient | null = null;
  private namespace = 'RTAdminAPI';
  private buffer: MetricData[] = [];
  private flushInterval = 60000; // 1 minute
  private isEnabled: boolean;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && process.env.CLOUDWATCH_METRICS_ENABLED === 'true';

    if (this.isEnabled) {
      this.client = new CloudWatchClient({
        region: process.env.AWS_REGION || 'eu-west-3'
      });

      // Démarrer le flush périodique
      this.intervalId = setInterval(() => this.flush(), this.flushInterval);
    }
  }

  private record(metric: MetricData): void {
    if (!this.isEnabled) return;
    this.buffer.push(metric);

    // Flush si buffer trop gros
    if (this.buffer.length >= 20) {
      this.flush();
    }
  }

  // === Métriques API ===

  recordApiLatency(endpoint: string, duration: number): void {
    this.record({
      name: 'APILatency',
      value: duration / 1000, // En secondes
      unit: 'Seconds',
      dimensions: { Endpoint: this.sanitizeEndpoint(endpoint) }
    });
  }

  recordApiRequest(endpoint: string, statusCode: number): void {
    this.record({
      name: 'APIRequests',
      value: 1,
      unit: 'Count',
      dimensions: {
        Endpoint: this.sanitizeEndpoint(endpoint),
        StatusCode: String(statusCode)
      }
    });

    if (statusCode >= 400) {
      this.record({
        name: 'APIErrors',
        value: 1,
        unit: 'Count',
        dimensions: {
          Endpoint: this.sanitizeEndpoint(endpoint),
          StatusCode: String(statusCode)
        }
      });
    }
  }

  // === Métriques Scraping ===

  recordScrapingJob(status: 'started' | 'success' | 'failure'): void {
    this.record({
      name: 'ScrapingJobs',
      value: 1,
      unit: 'Count',
      dimensions: { Status: status }
    });
  }

  recordTransportersScraped(count: number): void {
    this.record({
      name: 'TransportersScraped',
      value: count,
      unit: 'Count'
    });
  }

  recordScrapingDuration(duration: number): void {
    this.record({
      name: 'ScrapingDuration',
      value: duration / 1000,
      unit: 'Seconds'
    });
  }

  // === Métriques CRM ===

  recordLeadCreated(): void {
    this.record({
      name: 'LeadsCreated',
      value: 1,
      unit: 'Count'
    });
  }

  recordLeadStatusChange(fromStatus: string, toStatus: string): void {
    this.record({
      name: 'LeadStatusChanges',
      value: 1,
      unit: 'Count',
      dimensions: {
        FromStatus: fromStatus,
        ToStatus: toStatus
      }
    });
  }

  // === Métriques Auth ===

  recordLogin(success: boolean): void {
    this.record({
      name: success ? 'LoginSuccess' : 'LoginFailure',
      value: 1,
      unit: 'Count'
    });
  }

  recordTokenRefresh(): void {
    this.record({
      name: 'TokenRefresh',
      value: 1,
      unit: 'Count'
    });
  }

  // === Métriques Système ===

  recordQueueSize(queueName: string, size: number): void {
    this.record({
      name: 'QueueSize',
      value: size,
      unit: 'Count',
      dimensions: { Queue: queueName }
    });
  }

  recordMemoryUsage(): void {
    const usage = process.memoryUsage();
    this.record({
      name: 'MemoryHeapUsed',
      value: usage.heapUsed / (1024 * 1024), // En MB
      unit: 'Megabytes'
    });
  }

  // === Helpers ===

  private sanitizeEndpoint(endpoint: string): string {
    // Remplacer les IDs par des placeholders pour agrégation
    return endpoint
      .replace(/\/[a-f0-9]{24}/g, '/:id')
      .replace(/\/\d+/g, '/:num')
      .substring(0, 100); // Limiter la longueur
  }

  private async flush(): Promise<void> {
    if (!this.isEnabled || !this.client || this.buffer.length === 0) return;

    const metrics = this.buffer.splice(0, this.buffer.length);

    try {
      const metricData: MetricDatum[] = metrics.map(m => ({
        MetricName: m.name,
        Value: m.value,
        Unit: m.unit,
        Timestamp: new Date(),
        Dimensions: m.dimensions
          ? Object.entries(m.dimensions).map(([Name, Value]) => ({ Name, Value }))
          : undefined
      }));

      // CloudWatch limite à 20 métriques par appel
      for (let i = 0; i < metricData.length; i += 20) {
        const batch = metricData.slice(i, i + 20);
        const command = new PutMetricDataCommand({
          Namespace: this.namespace,
          MetricData: batch
        });
        await this.client.send(command);
      }
    } catch (error) {
      console.error('[Metrics] Failed to send metrics:', error);
      // Remettre les métriques dans le buffer pour réessayer
      this.buffer.unshift(...metrics);
    }
  }

  // Arrêter le service proprement
  async shutdown(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    await this.flush();
  }
}

export const metricsService = new MetricsService();
export default metricsService;
