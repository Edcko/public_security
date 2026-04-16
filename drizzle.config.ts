import type { Config } from 'drizzle-kit';

export default {
  schema: './src/shared/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? (() => { throw new Error('DATABASE_URL environment variable is required') })(),
  },
} satisfies Config;
