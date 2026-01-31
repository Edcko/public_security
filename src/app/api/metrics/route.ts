/**
 * Prometheus Metrics API Route
 *
 * Endpoint para que Prometheus haga scrape de métricas
 * GET /metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prometheusService } from '@/shared/monitoring/prometheus.service';

/**
 * GET /metrics
 * Retorna métricas en formato Prometheus
 */
export async function GET(req: NextRequest) {
  try {
    // Agregar métricas del sistema
    const memoryUsage = process.memoryUsage();
    prometheusService.appMetrics.memoryUsage(memoryUsage.heapUsed);

    // Calcular uptime
    const uptime = process.uptime();
    prometheusService.registry.setMetric('process_uptime_seconds', 'gauge', uptime, undefined, 'Process uptime in seconds');

    // Generar output Prometheus
    const metrics = prometheusService.registry.serialize();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error generating metrics:', error);
    return new NextResponse('# Error generating metrics\n', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  }
}
