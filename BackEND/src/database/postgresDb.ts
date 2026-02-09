/**
 * PostgreSQL Connection Pool for Asset Price Data
 * Connects to the Docker PostgreSQL instance with historical market data
 */

import { Pool, PoolClient } from 'pg';

interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

// Connection pool singleton
let pool: Pool | null = null;

/**
 * Initialize the PostgreSQL connection pool
 * Should be called once on server startup
 */
export async function initPostgresPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const config: PostgresConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'BullRun_GameDB_PGSQL',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'BullRun2024!',
    max: 20, // Maximum connections in pool (increased from 10)
    idleTimeoutMillis: 60000, // Close idle connections after 60 seconds (increased from 30s)
    connectionTimeoutMillis: 10000, // Timeout connection attempts after 10 seconds (increased from 5s)
  };

  pool = new Pool(config);

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err);
  });

  // Test the connection
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now');
    client.release();

    // Verify market data tables exist and have data
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'asset_prices'
      ) AS exists
    `);

    if (!tableExists.rows[0].exists) {
      pool = null;
      throw new Error(
        'Table "asset_prices" not found. Please restore the database backup:\n' +
        '   docker exec -i bullrun_game_postgres psql -U postgres -d BullRun_GameDB_PGSQL < backups/backup_BullRun_GameDB_PGSQL.sql'
      );
    }

    const tableCheck = await pool.query('SELECT COUNT(*) as count FROM asset_prices');
    const count = parseInt(tableCheck.rows[0].count, 10);
    if (count === 0) {
      pool = null;
      throw new Error(
        'Table "asset_prices" is empty — no market data found.\n' +
        '   Please restore the database backup:\n' +
        '   docker exec -i bullrun_game_postgres psql -U postgres -d BullRun_GameDB_PGSQL < backups/backup_BullRun_GameDB_PGSQL.sql'
      );
    }

    return pool;
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    pool = null;
    throw error;
  }
}

/**
 * Get the PostgreSQL connection pool
 * Throws if not initialized
 */
export function getPostgresPool(): Pool {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized. Call initPostgresPool() first.');
  }
  return pool;
}

/**
 * Get a client from the pool for transactions
 */
export async function getPostgresClient(): Promise<PoolClient> {
  const p = getPostgresPool();
  return p.connect();
}

/**
 * Close the PostgreSQL connection pool
 * Should be called on server shutdown
 */
export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Check if PostgreSQL pool is initialized
 */
export function isPostgresPoolInitialized(): boolean {
  return pool !== null;
}
