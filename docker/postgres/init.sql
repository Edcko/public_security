-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create database schema if needed
-- Note: Tables will be created by Drizzle migrations

-- Create a test user for development
-- In production, this should be managed differently
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';
  END IF;
END
$$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE public_security TO app_user;

-- Log setup completion
SELECT 'PostgreSQL initialization completed' AS status;
