-- PostgreSQL init script — runs only on first container start
-- Flyway handles the actual schema migrations; this just sets up extensions.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create the application user if it doesn't exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'intervai') THEN
    CREATE ROLE intervai LOGIN PASSWORD 'intervai_password';
  END IF;
END
$$;

GRANT ALL PRIVILEGES ON DATABASE intervai TO intervai;
