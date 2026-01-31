import type { Config } from 'drizzle-kit';

export default {
  schema: './src/shared/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/public_security',
  },
} satisfies Config;
