const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 4000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    // console.log('DB client connected');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message);
  process.exit(-1);
});

// Test connection on start
pool.query('SELECT 1').then(() => {
  console.log('✅  PostgreSQL connected');
}).catch(err => {
  console.error('❌  PostgreSQL connection failed:', err.message);
});

module.exports = pool;
