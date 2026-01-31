/**
 * Prometheus Metrics Service
 *
 * Colección de métricas para monitoreo de la aplicación
 */

/**
 * Tipos de métricas soportados
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Métrica de Prometheus
 */
export interface Metric {
  name: string;
  type: MetricType;
  help: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

/**
 * Histogram bucket
 */
interface HistogramBucket {
  le: string; // less than or equal
  value: number;
}

/**
 * Métrica Histogram con buckets
 */
export interface HistogramMetric extends Metric {
  type: MetricType.HISTOGRAM;
  buckets: HistogramBucket[];
  sum: number;
}

/**
 * Registry de métricas
 */
class PrometheusRegistry {
  private metrics: Map<string, Metric> = new Map();
  private histograms: Map<string, HistogramMetric> = new Map();

  /**
   * Registra o actualiza una métrica counter
   */
  incCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.metrics.get(key);

    if (existing && existing.type === MetricType.COUNTER) {
      existing.value += value;
      existing.timestamp = Date.now();
    } else {
      this.setMetric(name, MetricType.COUNTER, value, labels);
    }
  }

  /**
   * Registra o actualiza una métrica gauge
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.metrics.get(key);

    if (existing && existing.type === MetricType.GAUGE) {
      existing.value = value;
      existing.timestamp = Date.now();
    } else {
      this.setMetric(name, MetricType.GAUGE, value, labels);
    }
  }

  /**
   * Observa un valor para un histogram
   */
  observeHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ): void {
    const key = this.getMetricKey(name, labels);
    let histogram = this.histograms.get(key);

    if (!histogram) {
      histogram = {
        name,
        type: MetricType.HISTOGRAM,
        help: `${name} histogram`,
        value: 0,
        labels,
        buckets: buckets.map((le) => ({ le: le.toString(), value: 0 })),
        sum: 0,
        timestamp: Date.now(),
      };
      this.histograms.set(key, histogram);
    }

    // Actualizar sum
    histogram.sum += value;

    // Actualizar buckets
    for (const bucket of histogram.buckets) {
      const le = parseFloat(bucket.le);
      if (value <= le) {
        bucket.value++;
      }
    }

    // Bucket +Inf siempre incrementa
    histogram.value++;
    histogram.timestamp = Date.now();
  }

  /**
   * Registra una métrica genérica
   */
  setMetric(
    name: string,
    type: MetricType,
    value: number,
    labels?: Record<string, string>,
    help?: string
  ): void {
    const key = this.getMetricKey(name, labels);

    this.metrics.set(key, {
      name,
      type,
      help: help || `${name} metric`,
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Genera clave única para la métrica
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  /**
   * Formatea labels para Prometheus
   */
  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `{${labelStr}}`;
  }

  /**
   * Genera output en formato Prometheus
   */
  serialize(): string {
    const lines: string[] = [];

    // Métricas normales
    for (const [key, metric] of this.metrics.entries()) {
      // HELP
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      // TYPE
      lines.push(`# TYPE ${metric.name} ${metric.type}`);
      // Valor
      const labels = this.formatLabels(metric.labels);
      lines.push(`${metric.name}${labels} ${metric.value}`);
    }

    // Histograms
    for (const [key, histogram] of this.histograms.entries()) {
      // HELP
      lines.push(`# HELP ${histogram.name} ${histogram.help}`);
      // TYPE
      lines.push(`# TYPE ${histogram.name} ${histogram.type}`);

      const labels = this.formatLabels(histogram.labels);

      // Buckets
      for (const bucket of histogram.buckets) {
        const bucketLabels = labels
          ? labels.slice(0, -1) + `le="${bucket.le}"}`
          : `{le="${bucket.le}"}`;
        lines.push(`${histogram.name}_bucket${bucketLabels} ${bucket.value}`);
      }

      // Sum
      lines.push(`${histogram.name}_sum${labels} ${histogram.sum}`);

      // Count
      lines.push(`${histogram.name}_count${labels} ${histogram.value}`);
    }

    return lines.join('\n');
  }

  /**
   * Limpia todas las métricas
   */
  reset(): void {
    this.metrics.clear();
    this.histograms.clear();
  }

  /**
   * Obtiene todas las métricas
   */
  getAllMetrics(): Map<string, Metric | HistogramMetric> {
    const all = new Map<string, Metric | HistogramMetric>();

    for (const [key, metric] of this.metrics.entries()) {
      all.set(key, metric);
    }

    for (const [key, histogram] of this.histograms.entries()) {
      all.set(key, histogram);
    }

    return all;
  }
}

// Registry global
export const registry = new PrometheusRegistry();

/**
 * Métricas predefinidas de la aplicación
 */
export const appMetrics = {
  // Contadores
  httpRequestsTotal: (method: string, route: string, status: number) =>
    registry.incCounter('http_requests_total', 1, {
      method,
      route,
      status: status.toString(),
    }),

  dbQueryTotal: (operation: string, table: string) =>
    registry.incCounter('db_query_total', 1, {
      operation,
      table,
    }),

  authFailuresTotal: () =>
    registry.incCounter('auth_failures_total', 1),

  // Gauges
  activeUsers: (count: number) =>
    registry.setGauge('active_users', count),

  pendingRequests: (count: number) =>
    registry.setGauge('pending_requests', count),

  databaseConnections: (count: number) =>
    registry.setGauge('database_connections', count),

  cpuUsage: (percent: number) =>
    registry.setGauge('cpu_usage_percent', percent),

  memoryUsage: (bytes: number) =>
    registry.setGauge('memory_usage_bytes', bytes),

  diskUsage: (bytes: number, mount: string) =>
    registry.setGauge('disk_usage_bytes', bytes, { mount }),

  // Histograms
  httpRequestDuration: (seconds: number, route: string, method: string) =>
    registry.observeHistogram('http_request_duration_seconds', seconds, {
      route,
      method,
    }),

  dbQueryDuration: (seconds: number, operation: string) =>
    registry.observeHistogram('db_query_duration_seconds', seconds, {
      operation,
    }),

  responseSize: (bytes: number, route: string) =>
    registry.observeHistogram('response_size_bytes', bytes, {
      route,
    }),
};

/**
 * Middleware para medir requests HTTP
 */
export function measureHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  duration: number
): void {
  appMetrics.httpRequestsTotal(method, route, statusCode);
  appMetrics.httpRequestDuration(duration / 1000, route, method);
}

/**
 * Servicio de Prometheus
 */
export const prometheusService = {
  registry,
  appMetrics,
  measureHttpRequest,
};
