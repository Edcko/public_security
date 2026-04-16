#!/usr/bin/env ts-node
/**
 * Environment Checker
 * Verifica que todos los servicios necesarios estén corriendo
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

interface CheckResult {
  service: string;
  status: 'pass' | 'fail';
  message: string;
}

async function checkPostgres(): Promise<CheckResult> {
  const sql = postgres(DATABASE_URL);

  try {
    const result = await sql`SELECT version()`;
    const version = result[0].version;

    await sql.end();

    return {
      service: 'PostgreSQL',
      status: 'pass',
      message: `✅ Conectado (v${version.split(' ')[1]})`,
    };
  } catch (error: any) {
    return {
      service: 'PostgreSQL',
      status: 'fail',
      message: `❌ ${error.message}`,
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  try {
    const redis = await import('redis');
    const client = redis.createClient({
      socket: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT),
      },
    });

    await client.connect();
    await client.ping();
    await client.quit();

    return {
      service: 'Redis',
      status: 'pass',
      message: '✅ Conectado',
    };
  } catch (error: any) {
    return {
      service: 'Redis',
      status: 'fail',
      message: `❌ ${error.message}`,
    };
  }
}

async function checkDocker(): Promise<CheckResult> {
  try {
    const { execSync } = await import('child_process');
    const output = execSync('docker ps', { encoding: 'utf-8' });

    const containerCount = output.split('\n').filter((line: string) => line.trim() && !line.includes('CONTAINER ID')).length;

    return {
      service: 'Docker',
      status: 'pass',
      message: `✅ Corriendo (${containerCount} contenedores)`,
    };
  } catch (error: any) {
    return {
      service: 'Docker',
      status: 'fail',
      message: `❌ Docker daemon no está corriendo`,
    };
  }
}

async function main() {
  console.log('🔍 Environment Checker - Sistema Nacional de Seguridad Pública');
  console.log('='.repeat(60));
  console.log('');

  const results: CheckResult[] = [];

  // Check Docker
  const dockerResult = await checkDocker();
  results.push(dockerResult);
  console.log(`${dockerResult.service.padEnd(20)} ${dockerResult.message}`);

  if (dockerResult.status === 'fail') {
    console.log('');
    console.log('❌ Docker no está corriendo. Inicia Docker Desktop:');
    console.log('   - macOS: Abre "Docker" desde Applications');
    console.log('   - Linux: sudo systemctl start docker');
    console.log('   - Windows: Abre "Docker Desktop"');
    console.log('');
    process.exit(1);
  }

  console.log('');

  // Check PostgreSQL
  const postgresResult = await checkPostgres();
  results.push(postgresResult);
  console.log(`${postgresResult.service.padEnd(20)} ${postgresResult.message}`);

  // Check Redis
  const redisResult = await checkRedis();
  results.push(redisResult);
  console.log(`${redisResult.service.padEnd(20)} ${redisResult.message}`);

  console.log('');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  if (failed === 0) {
    console.log(`✅ Todos los servicios están funcionando (${passed}/${results.length})`);
    console.log('');
    console.log('🚀 Puedes iniciar la aplicación:');
    console.log('   npm run dev');
  } else {
    console.log(`❌ ${failed} servicios fallando (${passed}/${results.length} pasaron)`);
    console.log('');
    console.log('💡 Inicia los servicios de Docker:');
    console.log('   docker-compose up -d');
    console.log('');
    console.log('💡 Verifica el estado:');
    console.log('   docker-compose ps');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
