/**
 * Light Load Test - Development Environment
 * SAFE for Local Development: Max 50 concurrent users
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    light_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 25 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test 1: Health Check
  const healthRes = http.get(`${BASE_URL}/`);
  check(healthRes, {
    'homepage status': (r) => r.status === 200,
  });
  
  sleep(1);
  
  // Test 2: Login Attempt
  const loginPayload = JSON.stringify({
    email: 'test@example.com',
    password: 'Test1234!',
  });
  
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(loginRes, {
    'login attempted': (r) => [200, 401, 404].includes(r.status),
  });
  
  sleep(Math.random() * 3 + 1);
}
