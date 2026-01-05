import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const DB_PATH = path.join(__dirname, '../../data/game.db');
const DATA_DIR = path.join(__dirname, '../../data');

let db: Database | null = null;

/**
 * Initialize the SQLite database
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log('Database loaded from file');
    } else {
      db = new SQL.Database();
      await createTables();
      await seedDefaultAdmin();
      saveDatabase();
      console.log('New database created and initialized');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Create database tables
 */
async function createTables(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  // Admin accounts table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Admin settings table (single row for global settings)
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      selected_categories TEXT NOT NULL,
      game_start_year INTEGER NOT NULL DEFAULT 2005,
      hide_current_year INTEGER NOT NULL DEFAULT 0,
      initial_pocket_cash INTEGER NOT NULL DEFAULT 100000,
      recurring_income INTEGER NOT NULL DEFAULT 50000,
      enable_quiz INTEGER NOT NULL DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Player progress logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS player_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_mode TEXT NOT NULL,
      player_name TEXT NOT NULL,
      room_id TEXT,
      final_networth REAL NOT NULL,
      final_cagr REAL,
      profit_loss REAL,
      portfolio_breakdown TEXT NOT NULL,
      admin_settings TEXT NOT NULL,
      game_duration_minutes INTEGER,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indexes for better query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_player_logs_game_mode ON player_logs(game_mode)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_player_logs_completed_at ON player_logs(completed_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_player_logs_room_id ON player_logs(room_id)`);

  console.log('Database tables created successfully');
}

/**
 * Default admin credentials (used for first-time login and recovery)
 */
export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'Tejas@6767';

/**
 * Seed default admin account
 */
async function seedDefaultAdmin(): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  db.run(
    'INSERT INTO admin_accounts (username, password_hash) VALUES (?, ?)',
    [DEFAULT_ADMIN_USERNAME, passwordHash]
  );

  console.log('Default admin account created');
}

/**
 * Save database to disk
 */
export function saveDatabase(): void {
  if (!db) throw new Error('Database not initialized');

  const data = db.export();
  fs.writeFileSync(DB_PATH, data);
}

/**
 * Get database instance
 */
export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('Database closed');
  }
}
