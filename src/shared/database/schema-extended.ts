/**
 * Extended Database Schema
 *
 * Tablas adicionales para Shifts, Attendance, etc.
 */

import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

// Shifts (Turnos)
export const shifts = pgTable('shifts', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporationId: uuid('corporation_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(), // '08:00'
  endTime: varchar('end_time', { length: 5 }).notNull(), // '16:00'
  daysOfWeek: varchar('days_of_week', { length: 20 }).notNull(), // '1,2,3,4,5' (Monday-Friday)
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Attendance (Registro de asistencia)
export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  corporationId: uuid('corporation_id').notNull(),
  officerId: uuid('officer_id').notNull(),
  shiftId: uuid('shift_id').notNull(),
  checkIn: timestamp('check_in'),
  checkOut: timestamp('check_out'),
  date: timestamp('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});
