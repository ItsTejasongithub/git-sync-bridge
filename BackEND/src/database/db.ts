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
    } else {
      db = new SQL.Database();
      await createTables();
      await seedDefaultAdmin();
      saveDatabase();
    }

    // Run lightweight migrations on existing DB files to ensure schema compatibility
    try {
      runMigrations();
    } catch (migErr) {
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Run any lightweight migrations needed for older DB files
 */
function runMigrations(): void {
  if (!db) throw new Error('Database not initialized');

  // Check admin_settings columns
  const infoSettings = db.exec("PRAGMA table_info('admin_settings')");
  const hasEventsCount =
    infoSettings && infoSettings.length > 0 && infoSettings[0].values && infoSettings[0].values.some((row: any) => row[1] === 'events_count');

  if (!hasEventsCount) {
    db.run('ALTER TABLE admin_settings ADD COLUMN events_count INTEGER NOT NULL DEFAULT 3');
    saveDatabase();
  }

  // Check player_logs columns
  const infoLogs = db.exec("PRAGMA table_info('player_logs')");
  const hasPlayerAge =
    infoLogs && infoLogs.length > 0 && infoLogs[0].values && infoLogs[0].values.some((row: any) => row[1] === 'player_age');

  if (!hasPlayerAge) {
    db.run('ALTER TABLE player_logs ADD COLUMN player_age INTEGER');
    saveDatabase();
  }

  // Check if unique_id column exists in player_logs
  const hasUniqueId =
    infoLogs && infoLogs.length > 0 && infoLogs[0].values && infoLogs[0].values.some((row: any) => row[1] === 'unique_id');

  if (!hasUniqueId) {
    // Add column WITHOUT UNIQUE (sql.js doesn't support UNIQUE in ALTER TABLE)
    // The index below provides uniqueness constraint enforcement
    db.run('ALTER TABLE player_logs ADD COLUMN unique_id TEXT');
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_player_logs_unique_id ON player_logs(unique_id)`);
    saveDatabase();
  }

  // Check if trading_transactions table exists
  const tablesList = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='trading_transactions'");
  const hasTradesTable = tablesList && tablesList.length > 0 && tablesList[0].values && tablesList[0].values.length > 0;

  if (!hasTradesTable) {
    db.run(`
      CREATE TABLE IF NOT EXISTS trading_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        asset_name TEXT,
        quantity REAL NOT NULL,
        entry_price REAL NOT NULL,
        exit_price REAL,
        position_size REAL NOT NULL,
        profit_loss REAL,
        game_year INTEGER NOT NULL,
        game_month INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (log_id) REFERENCES player_logs(id) ON DELETE CASCADE
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_trades_log_id ON trading_transactions(log_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_trades_player ON trading_transactions(player_name)`);
    saveDatabase();
  }

  // Check if ai_reports table exists
  const aiReportsList = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_reports'");
  const hasAiReportsTable = aiReportsList && aiReportsList.length > 0 && aiReportsList[0].values && aiReportsList[0].values.length > 0;

  if (!hasAiReportsTable) {
    db.run(`
      CREATE TABLE IF NOT EXISTS ai_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id TEXT UNIQUE NOT NULL,
        unique_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        summary_json TEXT NOT NULL,
        trades_json TEXT,
        cash_json TEXT,
        banking_summary_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_reports_unique_id ON ai_reports(unique_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_ai_reports_report_id ON ai_reports(report_id)`);
    saveDatabase();
  } else {
    // If table exists (older installations), ensure new columns exist
    try {
      const cols = db.exec("PRAGMA table_info(ai_reports)");
      const columns = (cols && cols[0] && cols[0].values) ? cols[0].values.map((r:any) => r[1]) : [];
      if (!columns.includes('cash_json')) {
        db.run(`ALTER TABLE ai_reports ADD COLUMN cash_json TEXT`);
      }
      if (!columns.includes('banking_summary_json')) {
        db.run(`ALTER TABLE ai_reports ADD COLUMN banking_summary_json TEXT`);
      }
      saveDatabase();
    } catch (err) {
    }
  }

  // Check if banking_transactions table exists
  const bankingTransList = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='banking_transactions'");
  const hasBankingTable = bankingTransList && bankingTransList.length > 0 && bankingTransList[0].values && bankingTransList[0].values.length > 0;

  if (!hasBankingTable) {
    db.run(`
      CREATE TABLE IF NOT EXISTS banking_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        sub_type TEXT,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        fd_id TEXT,
        fd_duration_months INTEGER,
        interest_rate REAL,
        maturity_amount REAL,
        penalty_amount REAL,
        remarks TEXT,
        game_year INTEGER NOT NULL,
        game_month INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (log_id) REFERENCES player_logs(id) ON DELETE CASCADE
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_banking_log_id ON banking_transactions(log_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_banking_player ON banking_transactions(player_name)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_banking_type ON banking_transactions(transaction_type)`);
    saveDatabase();
  }

  // Ensure cash_transactions table exists to store life events and recurring income separately
  const cashTransList = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='cash_transactions'");
  const hasCashTable = cashTransList && cashTransList.length > 0 && cashTransList[0].values && cashTransList[0].values.length > 0;

  if (!hasCashTable) {
    db.run(`
      CREATE TABLE IF NOT EXISTS cash_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        tx_type TEXT NOT NULL,
        sub_type TEXT,
        amount REAL NOT NULL,
        message TEXT,
        game_year INTEGER,
        game_month INTEGER,
        timestamp INTEGER,
        FOREIGN KEY (log_id) REFERENCES player_logs(id) ON DELETE CASCADE
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_cash_log_id ON cash_transactions(log_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_cash_player ON cash_transactions(player_name)`);
    saveDatabase();
  }

  // Check if player_holdings table exists - stores end-of-game holdings for accurate P&L calculations
  const holdingsList = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='player_holdings'");
  const hasHoldingsTable = holdingsList && holdingsList.length > 0 && holdingsList[0].values && holdingsList[0].values.length > 0;

  if (!hasHoldingsTable) {
    db.run(`
      CREATE TABLE IF NOT EXISTS player_holdings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER NOT NULL,
        player_name TEXT NOT NULL,
        asset_category TEXT NOT NULL,
        asset_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        avg_price REAL NOT NULL,
        total_invested REAL NOT NULL,
        current_price REAL NOT NULL,
        current_value REAL NOT NULL,
        unrealized_pl REAL NOT NULL,
        game_year INTEGER NOT NULL,
        game_month INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (log_id) REFERENCES player_logs(id) ON DELETE CASCADE
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_holdings_log_id ON player_holdings(log_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_holdings_player ON player_holdings(player_name)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_holdings_category ON player_holdings(asset_category)`);
    saveDatabase();
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
      events_count INTEGER NOT NULL DEFAULT 3,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Player progress logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS player_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unique_id TEXT UNIQUE NOT NULL,
      game_mode TEXT NOT NULL,
      player_name TEXT NOT NULL,
      player_age INTEGER,
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
  db.run(`CREATE INDEX IF NOT EXISTS idx_player_logs_unique_id ON player_logs(unique_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_player_logs_game_mode ON player_logs(game_mode)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_player_logs_completed_at ON player_logs(completed_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_player_logs_room_id ON player_logs(room_id)`);

  // Trading transactions table for AI analysis
  db.run(`
    CREATE TABLE IF NOT EXISTS trading_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      asset_name TEXT,
      quantity REAL NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL,
      position_size REAL NOT NULL,
      profit_loss REAL,
      game_year INTEGER NOT NULL,
      game_month INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (log_id) REFERENCES player_logs(id) ON DELETE CASCADE
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_trades_log_id ON trading_transactions(log_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_trades_player ON trading_transactions(player_name)`);
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
  }
}
