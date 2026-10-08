export const SUPABASE_CONFIG = {
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:Continnum@2026@db.kwkdpkewxldxcekeaaoh.supabase.co:5432/postgres',
  poolMin: 2,
  poolMax: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
};

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'cmf-secret-key-change-in-production',
  expiresIn: '24h',
  refreshExpiresIn: '30d'
};

export const SERVER_CONFIG = {
  port: process.env.PORT || 3001
};
