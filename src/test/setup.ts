/**
 * Test Setup File
 * Configuración global para tests
 */

// Mock de environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only';
process.env.REDIS_URL = 'redis://localhost:6379';
