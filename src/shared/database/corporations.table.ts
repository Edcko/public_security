import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';

export const corporations = pgTable('corporations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'federal', 'estatal', 'municipal'
  // TODO: Self-reference temporalmente deshabilitada por TypeScript strict mode
  // parentId: uuid('parent_id').references(() => corporations.id),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  typeIdx: index('corporations_type_idx').on(table.type),
  parentIdx: index('corporations_parent_idx').on(table.parentId),
}));
