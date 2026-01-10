import { getDatabase, saveDatabase } from './db';

export interface CashTransaction {
  id?: number;
  logId: number;
  playerName: string;
  txType: 'recurring_income' | 'life_event_gain' | 'life_event_loss' | string;
  subType?: string | null;
  amount: number;
  message?: string | null;
  gameYear?: number | null;
  gameMonth?: number | null;
  timestamp?: number | null;
}

export function logCashTransaction(params: CashTransaction): { success: boolean; id?: number; error?: string } {
  try {
    const db = getDatabase();
    if (!db) return { success: false, error: 'Database not initialized' };

    db.run(
      `INSERT INTO cash_transactions (
        log_id, player_name, tx_type, sub_type, amount, message, game_year, game_month, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.logId,
        params.playerName,
        params.txType,
        params.subType || null,
        params.amount,
        params.message || null,
        params.gameYear || null,
        params.gameMonth || null,
        params.timestamp || null,
      ]
    );

    saveDatabase();
    return { success: true };
  } catch (err: any) {
    console.error('Error logging cash transaction:', err);
    return { success: false, error: err.message };
  }
}

export function getCashTransactionsByLogId(logId: number) {
  try {
    const db = getDatabase();
    if (!db) return [];

    const result = db.exec(
      `SELECT id, log_id, player_name, tx_type, sub_type, amount, message, game_year, game_month, timestamp
       FROM cash_transactions
       WHERE log_id = ?
       ORDER BY timestamp ASC`,
      [logId]
    );

    if (!result || result.length === 0) return [];

    const columns = result[0].columns;
    const values = result[0].values;

    const out: CashTransaction[] = [];
    values.forEach((row: any[]) => {
      out.push({
        id: row[columns.indexOf('id')],
        logId: row[columns.indexOf('log_id')],
        playerName: row[columns.indexOf('player_name')],
        txType: row[columns.indexOf('tx_type')],
        subType: row[columns.indexOf('sub_type')],
        amount: row[columns.indexOf('amount')],
        message: row[columns.indexOf('message')],
        gameYear: row[columns.indexOf('game_year')],
        gameMonth: row[columns.indexOf('game_month')],
        timestamp: row[columns.indexOf('timestamp')],
      });
    });

    return out;
  } catch (err) {
    console.error('Error fetching cash transactions:', err);
    return [];
  }
}

export function getCashSummaryByLogId(logId: number) {
  try {
    const txs = getCashTransactionsByLogId(logId);
    const summary = {
      totalIncoming: 0,
      totalOutgoing: 0,
      recurringIncomeTotal: 0,
      lifeEventGains: 0,
      lifeEventLosses: 0,
      eventsCount: txs.length
    } as any;

    for (const t of txs) {
      if (t.amount >= 0) summary.totalIncoming += t.amount;
      else summary.totalOutgoing += Math.abs(t.amount);

      if (t.txType === 'recurring_income') summary.recurringIncomeTotal += t.amount;
      if (t.txType === 'life_event_gain') summary.lifeEventGains += t.amount;
      if (t.txType === 'life_event_loss') summary.lifeEventLosses += Math.abs(t.amount);
    }

    return summary;
  } catch (err) {
    console.error('Error computing cash summary:', err);
    return null;
  }
}
