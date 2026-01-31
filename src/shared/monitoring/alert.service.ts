/**
 * Alert Service
 *
 * Sistema de alertas via Email y Slack
 */

/**
 * Tipos de alerta
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Canales de notificación
 */
export enum AlertChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
}

/**
 * Alerta
 */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  resolved?: boolean;
}

/**
 * Configuración de Slack
 */
interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

/**
 * Configuración de Email
 */
interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  username: string;
  password: string;
  from: string;
  to: string[];
}

/**
 * Servicio de alertas
 */
class AlertService {
  private alerts: Alert[] = [];
  private slackConfig?: SlackConfig;
  private emailConfig?: EmailConfig;

  constructor() {
    // Cargar configuración desde variables de entorno
    if (process.env.SLACK_WEBHOOK_URL) {
      this.slackConfig = {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL,
        username: process.env.SLACK_USERNAME || 'Security Bot',
        iconEmoji: process.env.SLACK_ICON_EMOJI || ':rotating_light:',
      };
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USERNAME) {
      this.emailConfig = {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        username: process.env.SMTP_USERNAME,
        password: process.env.SMTP_PASSWORD || '',
        from: process.env.EMAIL_FROM || 'alerts@security.local',
        to: process.env.EMAIL_TO?.split(',') || [],
      };
    }
  }

  /**
   * Envía una alerta
   */
  async sendAlert(
    severity: AlertSeverity,
    title: string,
    message: string,
    details?: Record<string, any>,
    channels: AlertChannel[] = [AlertChannel.SLACK]
  ): Promise<string> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      title,
      message,
      details,
      timestamp: new Date(),
      resolved: false,
    };

    // Guardar en historial
    this.alerts.push(alert);

    // Enviar a cada canal configurado
    const promises: Promise<void>[] = [];

    if (channels.includes(AlertChannel.SLACK) && this.slackConfig) {
      promises.push(this.sendToSlack(alert));
    }

    if (channels.includes(AlertChannel.EMAIL) && this.emailConfig) {
      promises.push(this.sendEmail(alert));
    }

    if (channels.includes(AlertChannel.WEBHOOK) && process.env.ALERT_WEBHOOK_URL) {
      promises.push(this.sendToWebhook(alert));
    }

    await Promise.allSettled(promises);

    return alert.id;
  }

  /**
   * Envía alerta a Slack
   */
  private async sendToSlack(alert: Alert): Promise<void> {
    if (!this.slackConfig) {
      console.warn('Slack not configured');
      return;
    }

    const color = this.getSeverityColor(alert.severity);

    const payload = {
      channel: this.slackConfig.channel,
      username: this.slackConfig.username,
      icon_emoji: this.slackConfig.iconEmoji,
      attachments: [
        {
          color,
          title: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          text: alert.message,
          fields: alert.details
            ? Object.entries(alert.details).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              }))
            : [],
          footer: 'Security Dashboard',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(this.slackConfig.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
      }

      console.log('Alert sent to Slack:', alert.id);
    } catch (error: any) {
      console.error('Error sending Slack alert:', error);
    }
  }

  /**
   * Envía alerta por email
   */
  private async sendEmail(alert: Alert): Promise<void> {
    if (!this.emailConfig || this.emailConfig.to.length === 0) {
      console.warn('Email not configured');
      return;
    }

    // En producción, aquí se usaría nodemailer o similar
    // Por ahora, solo logueamos
    console.log('Email alert:', {
      to: this.emailConfig.to.join(', '),
      subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
      body: alert.message,
      details: alert.details,
    });

    // TODO: Implementar envío real con nodemailer
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransporter({
    //   host: this.emailConfig.smtpHost,
    //   port: this.emailConfig.smtpPort,
    //   auth: {
    //     user: this.emailConfig.username,
    //     pass: this.emailConfig.password,
    //   },
    // });
    // await transporter.sendMail({...});
  }

  /**
   * Envía alerta a webhook genérico
   */
  private async sendToWebhook(alert: Alert): Promise<void> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn('Webhook URL not configured');
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });

      console.log('Alert sent to webhook:', alert.id);
    } catch (error: any) {
      console.error('Error sending webhook alert:', error);
    }
  }

  /**
   * Obtiene color para Slack según severidad
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO:
        return '#36a64f'; // green
      case AlertSeverity.WARNING:
        return '#ff9900'; // orange
      case AlertSeverity.ERROR:
        return '#ff0000'; // red
      case AlertSeverity.CRITICAL:
        return '#990000'; // dark red
      default:
        return '#808080'; // gray
    }
  }

  /**
   * Marca una alerta como resuelta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Obtiene historial de alertas
   */
  getAlerts(limit: number = 100): Alert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Limpia alertas antiguas
   */
  cleanOldAlerts(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.alerts = this.alerts.filter((a) => a.timestamp.getTime() > cutoff);
  }
}

// Instancia global
export const alertService = new AlertService();

/**
 * Funciones helper para enviar alertas comunes
 */
export const alerts = {
  // Alertas de seguridad
  securityThreat: (title: string, message: string, details?: Record<string, any>) =>
    alertService.sendAlert(AlertSeverity.CRITICAL, title, message, details),

  // Alertas de sistema
  systemError: (title: string, message: string, details?: Record<string, any>) =>
    alertService.sendAlert(AlertSeverity.ERROR, title, message, details),

  systemWarning: (title: string, message: string, details?: Record<string, any>) =>
    alertService.sendAlert(AlertSeverity.WARNING, title, message, details),

  // Alertas de recursos
  highCPUUsage: (cpuPercent: number) =>
    alertService.sendAlert(
      AlertSeverity.WARNING,
      'High CPU Usage',
      `CPU usage is at ${cpuPercent.toFixed(1)}%`,
      { cpuPercent }
    ),

  highMemoryUsage: (memoryBytes: number, limit: number) =>
    alertService.sendAlert(
      AlertSeverity.WARNING,
      'High Memory Usage',
      `Memory usage is ${(memoryBytes / 1024 / 1024 / 1024).toFixed(2)}GB / ${(limit / 1024 / 1024 / 1024).toFixed(2)}GB`,
      { memoryBytes, limit }
    ),

  databaseConnectionFailed: (error: string) =>
    alertService.sendAlert(
      AlertSeverity.CRITICAL,
      'Database Connection Failed',
      `Could not connect to database: ${error}`,
      { error }
    ),

  // Alertas de API
  highErrorRate: (route: string, errorRate: number) =>
    alertService.sendAlert(
      AlertSeverity.ERROR,
      'High API Error Rate',
      `Route ${route} has ${errorRate.toFixed(1)}% error rate`,
      { route, errorRate }
    ),

  slowResponseTime: (route: string, avgTime: number) =>
    alertService.sendAlert(
      AlertSeverity.WARNING,
      'Slow API Response',
      `Route ${route} has average response time of ${avgTime.toFixed(0)}ms`,
      { route, avgTime }
    ),
};

/**
 * Servicio de alertas
 */
export const monitoringAlertService = {
  alertService,
  alerts,
};
