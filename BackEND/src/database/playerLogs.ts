import { getDatabase, saveDatabase } from './db';
import { AdminSettings, PortfolioBreakdown } from '../types';

export interface PlayerLog {
  id: number;
  uniqueId: string; // Unique identifier: YYYYMMDDHHMMSS-XXXXX
  gameMode: 'solo' | 'multiplayer';
  playerName: string;
  playerAge: number | null;
  roomId: string | null;
  finalNetworth: number;
  finalCAGR: number | null;
  profitLoss: number | null;
  portfolioBreakdown: PortfolioBreakdown;
  adminSettings: AdminSettings;
  gameDurationMinutes: number | null;
  completedAt: string;
}

export interface LogPlayerGameParams {
  gameMode: 'solo' | 'multiplayer';
  playerName: string;
  playerAge?: number;
  roomId?: string;
  finalNetworth: number;
  finalCAGR?: number;
  profitLoss?: number;
  portfolioBreakdown: PortfolioBreakdown;
  adminSettings: AdminSettings;
  gameDurationMinutes?: number;
}

/**
 * Generate a unique log ID using timestamp + random component
 * Format: YYYYMMDDHHMMSS-XXXXX (e.g., 20260109143045-A7B2C)
 */
function generateUniqueLogId(): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 14); // YYYYMMDDHHMMSS

  // Generate 5-character random alphanumeric string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${timestamp}-${random}`;
}

/**
 * Log a completed game for a player
 */
export function logPlayerGame(params: LogPlayerGameParams): { success: boolean; message: string; logId?: number; uniqueId?: string } {
  try {
    const db = getDatabase();

    const portfolioJson = JSON.stringify(params.portfolioBreakdown);
    const settingsJson = JSON.stringify(params.adminSettings);

    // Generate unique string ID for this log entry
    const uniqueLogId = generateUniqueLogId();
    console.log(`🔑 Generated unique log ID: ${uniqueLogId}`);

    db.run(
      `INSERT INTO player_logs (
        unique_id,
        game_mode,
        player_name,
        player_age,
        room_id,
        final_networth,
        final_cagr,
        profit_loss,
        portfolio_breakdown,
        admin_settings,
        game_duration_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uniqueLogId,
        params.gameMode,
        params.playerName,
        params.playerAge !== undefined ? params.playerAge : null,
        params.roomId || null,
        params.finalNetworth,
        params.finalCAGR || null,
        params.profitLoss || null,
        portfolioJson,
        settingsJson,
        params.gameDurationMinutes || null,
      ]
    );

    saveDatabase();

    // Get the auto-increment ID (still used internally for database)
    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const result = lastIdStmt.getAsObject();
    lastIdStmt.free();

    const logId = result.id as number;

    console.log(`\n🎮 ═══════════════════════════════════════════════════════════════`);
    console.log(`   Player Game Logged: ${params.playerName} (${params.gameMode.toUpperCase()})`);
    console.log(`   📋 Unique ID: ${uniqueLogId}`);
    console.log(`   Log ID: ${logId}`);
    console.log(`   💰 Final Networth: ₹${params.finalNetworth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    if (params.finalCAGR) {
      console.log(`   📈 CAGR: ${params.finalCAGR.toFixed(2)}%`);
    }
    if (params.profitLoss !== undefined) {
      const profitSign = params.profitLoss >= 0 ? '+' : '';
      console.log(`   💵 Profit/Loss: ${profitSign}₹${params.profitLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
    }
    console.log(`\n   📊 Portfolio Breakdown:`);
    Object.entries(params.portfolioBreakdown).forEach(([asset, value]) => {
      if (value > 0) {
        const percentage = ((value / params.finalNetworth) * 100).toFixed(1);
        console.log(`      • ${asset.padEnd(20)} ₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${percentage}%)`);
      }
    });
    console.log(`═══════════════════════════════════════════════════════════════\n`);

    return {
      success: true,
      message: 'Player game logged successfully',
      logId,
      uniqueId: uniqueLogId,
    };
  } catch (error) {
    console.error('Log player game error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to log player game: ${errMsg}`,
    };
  }
}

/**
 * Get all player logs with optional filters
 */
export function getPlayerLogs(filters?: {
  gameMode?: 'solo' | 'multiplayer';
  playerName?: string;
  roomId?: string;
  limit?: number;
  offset?: number;
}): PlayerLog[] {
  try {
    const db = getDatabase();

    let query = 'SELECT * FROM player_logs WHERE 1=1';
    const params: any[] = [];

    if (filters?.gameMode) {
      query += ' AND game_mode = ?';
      params.push(filters.gameMode);
    }

    if (filters?.playerName) {
      query += ' AND player_name LIKE ?';
      params.push(`%${filters.playerName}%`);
    }

    if (filters?.roomId) {
      query += ' AND room_id = ?';
      params.push(filters.roomId);
    }

    query += ' ORDER BY completed_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const stmt = db.prepare(query);
    if (params.length > 0) {
      stmt.bind(params);
    }

    const logs: PlayerLog[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      logs.push({
        id: row.id as number,
        uniqueId: row.unique_id as string,
        gameMode: row.game_mode as 'solo' | 'multiplayer',
        playerName: row.player_name as string,
        playerAge: row.player_age as number | null,
        roomId: row.room_id as string | null,
        finalNetworth: row.final_networth as number,
        finalCAGR: row.final_cagr as number | null,
        profitLoss: row.profit_loss as number | null,
        portfolioBreakdown: JSON.parse(row.portfolio_breakdown as string),
        adminSettings: JSON.parse(row.admin_settings as string),
        gameDurationMinutes: row.game_duration_minutes as number | null,
        completedAt: row.completed_at as string,
      });
    }

    stmt.free();
    return logs;
  } catch (error) {
    console.error('Get player logs error:', error);
    return [];
  }
}

export function getPlayerLogByUniqueId(uniqueId: string): PlayerLog | null {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM player_logs WHERE unique_id = ? LIMIT 1');
    stmt.bind([uniqueId]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();
    return {
      id: row.id as number,
      uniqueId: row.unique_id as string,
      gameMode: row.game_mode as 'solo' | 'multiplayer',
      playerName: row.player_name as string,
      playerAge: row.player_age as number | null,
      roomId: row.room_id as string | null,
      finalNetworth: row.final_networth as number,
      finalCAGR: row.final_cagr as number | null,
      profitLoss: row.profit_loss as number | null,
      portfolioBreakdown: JSON.parse(row.portfolio_breakdown as string),
      adminSettings: JSON.parse(row.admin_settings as string),
      gameDurationMinutes: row.game_duration_minutes as number | null,
      completedAt: row.completed_at as string,
    };
  } catch (error) {
    console.error('Get player log by uniqueId error:', error);
    return null;
  }
}

/**
 * Get player statistics
 */
export function getPlayerStats(playerName?: string): {
  totalGames: number;
  soloGames: number;
  multiplayerGames: number;
  averageNetworth: number;
  highestNetworth: number;
  averageCAGR: number;
} {
  try {
    const db = getDatabase();

    let query = `
      SELECT
        COUNT(*) as total_games,
        SUM(CASE WHEN game_mode = 'solo' THEN 1 ELSE 0 END) as solo_games,
        SUM(CASE WHEN game_mode = 'multiplayer' THEN 1 ELSE 0 END) as multiplayer_games,
        AVG(final_networth) as avg_networth,
        MAX(final_networth) as max_networth,
        AVG(final_cagr) as avg_cagr
      FROM player_logs
    `;

    const params: any[] = [];

    if (playerName) {
      query += ' WHERE player_name = ?';
      params.push(playerName);
    }

    const stmt = db.prepare(query);
    if (params.length > 0) {
      stmt.bind(params);
    }

    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();

    return {
      totalGames: (row.total_games as number) || 0,
      soloGames: (row.solo_games as number) || 0,
      multiplayerGames: (row.multiplayer_games as number) || 0,
      averageNetworth: (row.avg_networth as number) || 0,
      highestNetworth: (row.max_networth as number) || 0,
      averageCAGR: (row.avg_cagr as number) || 0,
    };
  } catch (error) {
    console.error('Get player stats error:', error);
    return {
      totalGames: 0,
      soloGames: 0,
      multiplayerGames: 0,
      averageNetworth: 0,
      highestNetworth: 0,
      averageCAGR: 0,
    };
  }
}

/**
 * Delete player logs (for cleanup)
 */
export function deletePlayerLogs(logIds: number[]): { success: boolean; message: string; deletedCount: number } {
  try {
    const db = getDatabase();

    const placeholders = logIds.map(() => '?').join(',');
    const stmt = db.prepare(`DELETE FROM player_logs WHERE id IN (${placeholders})`);
    stmt.bind(logIds);
    stmt.step();
    stmt.free();

    saveDatabase();

    return {
      success: true,
      message: `${logIds.length} log(s) deleted successfully`,
      deletedCount: logIds.length,
    };
  } catch (error) {
    console.error('Delete player logs error:', error);
    return {
      success: false,
      message: 'Failed to delete player logs',
      deletedCount: 0,
    };
  }
}
