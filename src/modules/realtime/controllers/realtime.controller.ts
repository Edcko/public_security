/**
 * Real-Time Dashboard Controller
 *
 * Endpoints para suscribirse a actualizaciones en tiempo real
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/shared/middleware/enhanced-auth.middleware';
import { broadcastAlert } from '@/shared/websocket/socket.server';

/**
 * GET /api/realtime/dashboard
 * Endpoint para obtener configuración inicial del dashboard
 */
export async function GET(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;

      return NextResponse.json({
        success: true,
        data: {
          corporationId: user.corporationId,
          features: {
            liveMap: true,
            alerts: true,
            incidents: true,
            statistics: true,
          },
          webSocketUrl: process.env.NODE_ENV === 'production'
            ? `wss://${process.env.APP_URL}/api/ws`
            : `ws://localhost:3000/api/ws`,
        },
      });
    } catch (error) {
      console.error('Dashboard config error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}

/**
 * POST /api/realtime/test-alert
 * Endpoint para probar broadcasting de alertas (solo desarrollo)
 */
export async function TEST_ALERT(req: NextRequest) {
  return withAuth(async (req) => {
    try {
      const user = (req as any).user;
      const body = await req.json();

      // Broadcast alerta a todos los clientes de la corporación
      await broadcastAlert(user.corporationId, {
        type: body.type || 'info',
        title: body.title || 'Test Alert',
        message: body.message || 'This is a test alert',
        priority: body.priority || 'low',
      });

      return NextResponse.json({
        success: true,
        message: 'Alert broadcasted',
      });
    } catch (error) {
      console.error('Test alert error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  })(req);
}
