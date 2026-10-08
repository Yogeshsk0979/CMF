import pg from 'pg';
import { SUPABASE_CONFIG } from './index.js';

const { Pool } = pg;

export const pool = new Pool(SUPABASE_CONFIG);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development' && duration > 1000) {
    console.log('Slow query:', { text, duration, rows: res.rowCount });
  }
  return res;
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function closePool() {
  await pool.end();
}