import { getDatabase, saveDatabase } from './db';

export interface TradingTransaction {
  id: number;
  logId: number;
  playerName: string;
  transactionType: 'buy' | 'sell';
  assetType: string;
  assetName: string | null;
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  positionSize: number;
  profitLoss: number | null;
  gameYear: number;
  gameMonth: number;
  timestamp: string;
}

export interface LogTradeParams {
  logId: number;
  playerName: string;
  transactionType: 'buy' | 'sell';
  assetType: string;
  assetName?: string;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  positionSize: number;
  profitLoss?: number;
  gameYear: number;
  gameMonth: number;
}

export function logTrade(params: LogTradeParams): { success: boolean; message: string; tradeId?: number } {
  try {
    const db = getDatabase();

    db.run(
      `INSERT INTO trading_transactions (
        log_id, player_name, transaction_type, asset_type, asset_name,
        quantity, entry_price, exit_price, position_size, profit_loss,
        game_year, game_month
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.logId,
        params.playerName,
        params.transactionType,
        params.assetType,
        params.assetName || null,
        params.quantity,
        params.entryPrice,
        params.exitPrice || null,
        params.positionSize,
        params.profitLoss || null,
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
      message: 'Trade logged successfully',
      tradeId: result.id as number,
    };
  } catch (error) {
    console.error('Log trade error:', error);
    return {
      success: false,
      message: 'Failed to log trade',
    };
  }
}

export function getTradesByLogId(logId: number): TradingTransaction[] {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM trading_transactions WHERE log_id = ? ORDER BY timestamp ASC');
    stmt.bind([logId]);

    const trades: TradingTransaction[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      trades.push({
        id: row.id as number,
        logId: row.log_id as number,
        playerName: row.player_name as string,
        transactionType: row.transaction_type as 'buy' | 'sell',
        assetType: row.asset_type as string,
        assetName: row.asset_name as string | null,
        quantity: row.quantity as number,
        entryPrice: row.entry_price as number,
        exitPrice: row.exit_price as number | null,
        positionSize: row.position_size as number,
        profitLoss: row.profit_loss as number | null,
        gameYear: row.game_year as number,
        gameMonth: row.game_month as number,
        timestamp: row.timestamp as string,
      });
    }

    stmt.free();
    return trades;
  } catch (error) {
    console.error('Get trades error:', error);
    return [];
  }
}
