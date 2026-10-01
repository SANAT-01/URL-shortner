'use strict';

function boolEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined) return fallback;
  return v.toLowerCase() === 'true';
}

function intEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined) return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

const port = intEnv('PORT', 8000);

module.exports = {
  port,
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${port}`,
  cacheEnabled: boolEnv('CACHE_ENABLED', false),
  redirectStatus: intEnv('REDIRECT_STATUS', 302),
  cacheTtlSeconds: intEnv('CACHE_TTL_SECONDS', 3600),
  pg: {
    host: process.env.PGHOST || 'pg',
    port: intEnv('PGPORT', 5432),
    user: process.env.PGUSER || 'app',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE || 'shortener',
  },
  redis: {
    host: process.env.REDISHOST || 'redis',
    port: intEnv('REDISPORT', 6379),
  },
};
