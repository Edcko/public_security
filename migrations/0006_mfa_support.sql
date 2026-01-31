-- Migration: MFA Support for Users
-- Created: 2025-01-30
-- Description: Agrega campos para Multi-Factor Authentication

-- Agregar campos MFA a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[];

-- Crear índice para búsqueda por MFA habilitado
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled) WHERE mfa_enabled = true;

-- Comments
COMMENT ON COLUMN users.mfa_enabled IS 'Si el usuario tiene MFA habilitado';
COMMENT ON COLUMN users.mfa_secret IS 'Secreto TOTP base32 (Google Authenticator)';
COMMENT ON COLUMN users.mfa_backup_codes IS 'Códigos de respaldo separados por coma (JSON array)';
