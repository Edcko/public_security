-- Migration: Password Resets Table
-- Created: 2025-01-30
-- Description: Tabla para tokens de reseteo de contraseña

-- Asegurar que las extensiones necesarias estén habilitadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla: password_resets
-- Almacena tokens para reseteo de contraseña con expiración
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash del token
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP DEFAULT NULL,

  -- Constraints
  CONSTRAINT valid_token CHECK (
    (used_at IS NULL) AND (expires_at > created_at)
  )
);

-- Índices para performance
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token_hash ON password_resets(token_hash);
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);

-- Comments
COMMENT ON TABLE password_resets IS 'Tokens de reseteo de contraseña con expiración';
COMMENT ON COLUMN password_resets.token_hash IS 'Hash SHA-256 del token de reset (no guardamos el token en texto plano)';
COMMENT ON COLUMN password_resets.expires_at IS 'Fecha y hora de expiración del token (típicamente 1 hora)';
COMMENT ON COLUMN password_resets.used_at IS 'Fecha y hora en que se usó el token (NULL si no ha sido usado)';
