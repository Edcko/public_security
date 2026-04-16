/**
 * GPS Tracking Service
 *
 * Servicio para ingesta y consulta de datos GPS
 */

import { client } from '@/shared/database/connection';
import amqp from 'amqplib';

export const gpsService = {
  /**
   * Inicia el consumer de RabbitMQ para actualizaciones GPS
   */
  async startConsumer() {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL;
      if (!rabbitUrl) {
        throw new Error('RABBITMQ_URL environment variable is required for GPS tracking');
      }
      const connection = await amqp.connect(rabbitUrl);
      const channel = await connection.createChannel();

      const queue = 'gps-updates';
      await channel.assertQueue(queue, { durable: true });

      console.log('GPS Consumer started, waiting for messages...');

      channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const data = JSON.parse(msg.content.toString());

            // Store en database
            await client`
              INSERT INTO gps_tracking (vehicle_id, latitude, longitude, speed, heading, timestamp)
              VALUES (${data.vehicleId}, ${data.latitude}, ${data.longitude}, ${data.speed}, ${data.heading}, ${data.timestamp || new Date()})
            `;

            channel.ack(msg);
          } catch (error) {
            console.error('Error processing GPS update:', error);
            channel.nack(msg, false, false);
          }
        }
      });
    } catch (error) {
      console.error('Error starting GPS consumer:', error);
    }
  },

  /**
   * Obtiene ubicación actual de un vehículo
   */
  async getVehicleLocation(vehicleId: string) {
    const [location] = await client`
      SELECT latitude, longitude, speed, heading, timestamp
      FROM gps_tracking
      WHERE vehicle_id = ${vehicleId}
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    return location;
  },

  /**
   * Obtiene trail histórico de un vehículo
   */
  async getVehicleTrail(vehicleId: string, startDate: Date, endDate: Date) {
    return await client`
      SELECT latitude, longitude, speed, heading, timestamp
      FROM gps_tracking
      WHERE vehicle_id = ${vehicleId}
      AND timestamp BETWEEN ${startDate} AND ${endDate}
      ORDER BY timestamp ASC
    `;
  },

  /**
   * Obtiene ubicación de todos los vehículos activos
   */
  async getAllActiveVehicles() {
    return await client`
      SELECT DISTINCT ON (vehicle_id)
        vehicle_id,
        latitude,
        longitude,
        speed,
        heading,
        timestamp
      FROM gps_tracking
      WHERE timestamp > NOW() - INTERVAL '10 minutes'
      ORDER BY vehicle_id, timestamp DESC
    `;
  },
};
