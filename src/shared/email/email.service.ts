/**
 * Email Service
 *
 * Servicio para envío de emails usando Nodemailer
 * Soporta múltiples providers: Gmail, Sendgrid, AWS SES
 */

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

/**
 * Email Service Class
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializar el transportador de email
   */
  private initialize() {
    // En desarrollo, deshabilitar envío real de emails
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.warn('[Email Service] Running in DEVELOPMENT mode without SMTP configured');
      console.warn('[Email Service] Emails will be logged to console instead');
      this.enabled = false;
      return;
    }

    // Configurar SMTP desde variables de entorno
    const config: EmailConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    };

    if (!config.host) {
      console.warn('[Email Service] No SMTP host configured');
      this.enabled = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(config);
      this.enabled = true;
      console.log('[Email Service] Initialized with SMTP:', config.host);
    } catch (error) {
      console.error('[Email Service] Failed to initialize:', error);
      this.enabled = false;
    }
  }

  /**
   * Enviar email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    // En desarrollo o si SMTP no está configurado, loguear a consola
    if (!this.enabled || !this.transporter) {
      console.log('\n==========================================');
      console.log('📧 EMAIL (DEV MODE - NOT SENT)');
      console.log('==========================================');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`\nHTML Preview:`);
      console.log(html);
      if (text) {
        console.log(`\nText Version:`);
        console.log(text);
      }
      console.log('==========================================\n');
      return true; // Retornar true para no bloquear el flujo
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Sistema de Gestión Policial" <noreply@policia.gob.mx>',
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      });

      console.log('[Email Service] Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('[Email Service] Failed to send email:', error);
      return false;
    }
  }

  /**
   * Enviar email de reset de contraseña
   */
  async sendPasswordReset(email: string, resetToken: string, userName?: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #1d4ed8; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .code { background: #1f2937; color: #10b981; padding: 15px; font-family: monospace; border-radius: 5px; font-size: 14px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Sistema de Gestión Policial</h1>
          </div>
          <div class="content">
            <h2>Restablecer Contraseña</h2>
            <p>Hola${userName ? ` ${userName}` : ','}</p>
            <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>

            <div class="warning">
              <strong>⚠️ Si no solicitaste este cambio, por favor ignora este email.</strong>
            </div>

            <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>

            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>

            <p>O copia y pega este enlace en tu navegador:</p>
            <div class="code">${resetUrl}</div>

            <p><strong>Este enlace expirará en 1 hora.</strong></p>

            <p>Si tienes problemas, contacta al administrador del sistema.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
            <p>© ${new Date().getFullYear()} Sistema de Gestión Policial</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      RESTABLECER CONTRASEÑA
      ======================

      Hola${userName ? ` ${userName}` : ','}

      Hemos recibido una solicitud para restablecer tu contraseña.

      Para restablecer tu contraseña, visita este enlace:
      ${resetUrl}

      Este enlace expirará en 1 hora.

      Si no solicitaste este cambio, por favor ignora este email.

      © ${new Date().getFullYear()} Sistema de Gestión Policial
    `;

    return this.sendEmail({
      to: email,
      subject: 'Restablecer Contraseña - Sistema de Gestión Policial',
      html,
      text,
    });
  }

  /**
   * Enviar email de activación de MFA con códigos de recuperación
   */
  async sendMFAActivation(email: string, backupCodes: string[], userName?: string): Promise<boolean> {
    const codesList = backupCodes.join('<br>  • ');

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Autenticación de Dos Factores Activada</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .codes { background: #ffffff; padding: 25px; margin: 25px 0; border: 3px dashed #3b82f6; border-radius: 10px; }
          .code-item { font-family: 'Courier New', monospace; font-size: 18px; color: #1e40af; padding: 8px 0; font-weight: bold; }
          .warning { background: #fef3c7; border-left: 5px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Sistema de Gestión Policial</h1>
          </div>
          <div class="content">
            <h2>Autenticación de Dos Factores Activada</h2>
            <p>Hola${userName ? ` ${userName}` : ','}</p>
            <p>Tu autenticación de dos factores (MFA) ha sido activada exitosamente.</p>
            <p>A continuación encontrarás tus <strong>códigos de recuperación de un solo uso</strong>:</p>
            <div class="codes">
              <strong>Códigos de Recuperación:</strong><br><br>
              <span class="code-item">• ${codesList}</span>
            </div>
            <div class="warning">
              <strong>⚠️ INSTRUCCIONES IMPORTANTES:</strong>
              <ul style="margin: 15px 0; padding-left: 25px;">
                <li>Guarda estos códigos en un lugar SEGURO</li>
                <li>Cada código solo puede usarse UNA VEZ</li>
                <li>Son tu ÚNICA opción si pierdes tu dispositivo MFA</li>
                <li>No los compartas con NADIE</li>
              </ul>
            </div>
            <p><strong>Nunca</strong> compartas estos códigos, ni siquiera con personal de soporte.</p>
            <p>Si no activaste MFA, contacta al administrador inmediatamente.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
            <p>© ${new Date().getFullYear()} Sistema de Gestión Policial</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      AUTENTICACIÓN DE DOS FACTORES ACTIVADA
      =====================================

      Hola${userName ? ` ${userName}` : ','}

      Tu MFA ha sido activado exitosamente.

      TUS CÓDIGOS DE RECUPERACIÓN (usa cada uno SOLO UNA VEZ):
      ${backupCodes.map(code => `  - ${code}`).join('\n')}

      ⚠️ INSTRUCCIONES IMPORTANTES:
      - Guarda estos códigos en un lugar SEGURO
      - Cada código solo puede usarse UNA VEZ
      - Son tu ÚNICA opción si pierdes tu dispositivo MFA
      - Nunca los compartas con NADIE

      Si no activaste MFA, contacta al administrador.

      © ${new Date().getFullYear()} Sistema de Gestión Policial
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Autenticación de Dos Factores Activada - Sistema de Gestión Policial',
      html,
      text,
    });
  }

  /**
   * Enviar reporte por email
   */
  async sendReport(
    email: string,
    reportName: string,
    reportUrl: string,
    reportType: string,
    startDate?: string,
    endDate?: string,
    userName?: string
  ): Promise<boolean> {
    const periodText = startDate && endDate
      ? `Periodo: ${startDate} a ${endDate}`
      : '';

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Generado</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #dbeafe; border-left: 5px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 15px 35px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 25px 0; }
          .button:hover { background: #1d4ed8; }
          .link { background: #f3f4f6; padding: 15px; font-family: monospace; font-size: 12px; border-radius: 5px; word-break: break-all; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Sistema de Gestión Policial</h1>
          </div>
          <div class="content">
            <h2>Tu Reporte Está Listo</h2>
            <p>Hola${userName ? ` ${userName}` : ','}</p>
            <p>El reporte que solicitaste ha sido generado exitosamente y está disponible para su descarga.</p>
            <div class="info-box">
              <p><strong>Tipo de Reporte:</strong> ${reportType}</p>
              ${periodText ? `<p><strong>${periodText}</p>` : ''}
              <p><strong>Nombre del Archivo:</strong> ${reportName}</p>
            </div>
            <p>Puedes descargar tu reporte haciendo clic en el siguiente botón:</p>
            <center>
              <a href="${reportUrl}" class="button">📥 Descargar Reporte</a>
            </center>
            <p>O copia y pega el siguiente enlace en tu navegador:</p>
            <div class="link">${reportUrl}</div>
            <p><strong>Nota:</strong> Este enlace estará disponible por 7 días.</p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas.</p>
            <p>© ${new Date().getFullYear()} Sistema de Gestión Policial</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      REPORTE GENERADO
      ================

      Hola${userName ? ` ${userName}` : ','}

      Tu reporte está listo para descargar.

      TIPO DE REPORT: ${reportType}
      ${periodText}
      NOMBRE DEL ARCHIVO: ${reportName}

      Descarga tu reporte aquí:
      ${reportUrl}

      Este enlace estará disponible por 7 días.

      © ${new Date().getFullYear()} Sistema de Gestión Policial
    `;

    return this.sendEmail({
      to: email,
      subject: `📊 Reporte Disponible: ${reportType} - Sistema de Gestión Policial`,
      html,
      text,
    });
  }

  /**
   * Convertir HTML a texto plano (fallback)
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Verificar si el servicio está habilitado
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton instance
export const emailService = new EmailService();
