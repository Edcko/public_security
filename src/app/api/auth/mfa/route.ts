/**
 * MFA Routes
 */

import {
  GET,
  POST,
  PUT,
  DELETE,
} from '@/modules/authentication/controllers/mfa.controller';

// Verificar status de MFA
export { GET };

// Iniciar setup de MFA
export { POST };

// Activar MFA
export { PUT };

// Desactivar MFA
export { DELETE };
