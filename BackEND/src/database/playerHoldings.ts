import { getDatabase, saveDatabase } from './db';

export interface PlayerHolding {
  id: number;
  logId: number;
  playerName: string;
  assetCategory: string;
  assetName: string;
  quantity: number;
  avgPrice: number;
  totalInvested: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPL: number;
  gameYear: number;
  gameMonth: number;
  timestamp: string;
}

export interface LogHoldingParams {
  logId: number;
  playerName: string;
  assetCategory: string;
  assetName: string;
  quantity: number;
  avgPrice: number;
  totalInvested: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPL: number;
  gameYear: number;
  gameMonth: number;
}

/**
 * Log a single holding record to the database
 */
export function logHolding(params: LogHoldingParams): { success: boolean; message: string; holdingId?: number } {
  try {
    const db = getDatabase();

    db.run(
      `INSERT INTO player_holdings (
        log_id, player_name, asset_category, asset_name,
        quantity, avg_price, total_invested, current_price,
        current_value, unrealized_pl, game_year, game_month
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.logId,
        params.playerName,
        params.assetCategory,
        params.assetName,
        params.quantity,
        params.avgPrice,
        params.totalInvested,
        params.currentPrice,
        params.currentValue,
        params.unrealizedPL,
        params.gameYear,
        params.gameMonth,
      ]
    );

    saveDatabase();

    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const result = lastIdStmt.getAsObject();
    lastIdStmt.free();

    return {
      success: true,
      message: 'Holding logged successfully',
      holdingId: result.id as number,
    };
  } catch (error) {
    console.error('Log holding error:', error);
    return {
      success: false,
      message: 'Failed to log holding',
    };
  }
}

/**
 * Bulk insert holdings - optimized for end-of-game uploads
 */
export function bulkLogHoldings(holdings: LogHoldingParams[]): { success: boolean; message: string; count?: number } {
  try {
    if (holdings.length === 0) {
      return { success: true, message: 'No holdings to log', count: 0 };
    }

    const db = getDatabase();

    // Use a transaction for bulk inserts
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(
      `INSERT INTO player_holdings (
        log_id, player_name, asset_category, asset_name,
        quantity, avg_price, total_invested, current_price,
        current_value, unrealized_pl, game_year, game_month
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    let insertCount = 0;
    for (const holding of holdings) {
      stmt.run([
        holding.logId,
        holding.playerName,
        holding.assetCategory,
        holding.assetName,
        holding.quantity,
        holding.avgPrice,
        holding.totalInvested,
        holding.currentPrice,
        holding.currentValue,
        holding.unrealizedPL,
        holding.gameYear,
        holding.gameMonth,
      ]);
      insertCount++;
    }

    stmt.free();
    db.run('COMMIT');
    saveDatabase();

    console.log(`✅ Bulk logged ${insertCount} holdings to database`);

    return {
      success: true,
      message: `Successfully logged ${insertCount} holdings`,
      count: insertCount,
    };
  } catch (error) {
    console.error('Bulk log holdings error:', error);

    // Rollback on error
    try {
      const db = getDatabase();
      db.run('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }

    return {
      success: false,
      message: 'Failed to bulk log holdings',
    };
  }
}

/**
 * Get all holdings for a specific game log
 */
export function getHoldingsByLogId(logId: number): PlayerHolding[] {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM player_holdings WHERE log_id = ? ORDER BY current_value DESC');
    stmt.bind([logId]);

    const holdings: PlayerHolding[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      holdings.push({
        id: row.id as number,
        logId: row.log_id as number,
        playerName: row.player_name as string,
        assetCategory: row.asset_category as string,
        assetName: row.asset_name as string,
        quantity: row.quantity as number,
        avgPrice: row.avg_price as number,
        totalInvested: row.total_invested as number,
        currentPrice: row.current_price as number,
        currentValue: row.current_value as number,
        unrealizedPL: row.unrealized_pl as number,
        gameYear: row.game_year as number,
        gameMonth: row.game_month as number,
        timestamp: row.timestamp as string,
      });
    }

    stmt.free();
    return holdings;
  } catch (error) {
    console.error('Get holdings error:', error);
    return [];
  }
}

/**
 * Get holdings summary by asset category
 */
export function getHoldingsSummaryByCategory(logId: number): {
  category: string;
  totalInvested: number;
  currentValue: number;
  unrealizedPL: number;
  plPercentage: number;
}[] {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT
        asset_category,
        SUM(total_invested) as total_invested,
        SUM(current_value) as current_value,
        SUM(unrealized_pl) as unrealized_pl
      FROM player_holdings
      WHERE log_id = ?
      GROUP BY asset_category
      ORDER BY current_value DESC
    `);
    stmt.bind([logId]);

    const summary: {
      category: string;
      totalInvested: number;
      currentValue: number;
      unrealizedPL: number;
      plPercentage: number;
    }[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const totalInvested = row.total_invested as number;
      const currentValue = row.current_value as number;
      const unrealizedPL = row.unrealized_pl as number;
      const plPercentage = totalInvested > 0 ? (unrealizedPL / totalInvested) * 100 : 0;

      summary.push({
        category: row.asset_category as string,
        totalInvested,
        currentValue,
        unrealizedPL,
        plPercentage,
      });
    }

    stmt.free();
    return summary;
  } catch (error) {
    console.error('Get holdings summary error:', error);
    return [];
  }
}

/**
 * Calculate total unrealized P&L for a game
 */
export function getTotalUnrealizedPL(logId: number): number {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT SUM(unrealized_pl) as total_unrealized_pl
      FROM player_holdings
      WHERE log_id = ?
    `);
    stmt.bind([logId]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return (row.total_unrealized_pl as number) || 0;
    }

    stmt.free();
    return 0;
  } catch (error) {
    console.error('Get total unrealized P&L error:', error);
    return 0;
  }
}
