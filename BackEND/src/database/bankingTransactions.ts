import { getDatabase, saveDatabase } from './db';

export interface BankingTransaction {
  logId: number;
  playerName: string;
  transactionType: 'deposit' | 'withdrawal' | 'fd_investment' | 'fd_maturity' | 'fd_break'; // savings vs FD operations
  subType?: string; // e.g., "automatic_deposit", "fd_36_month", "early_withdrawal"
  amount: number;
  balanceAfter: number;
  fdId?: string; // FD identifier if applicable
  fdDurationMonths?: number;
  interestRate?: number;
  maturityAmount?: number; // Amount received including interest
  penaltyAmount?: number; // Penalty for early FD break
  remarks?: string;
  gameYear: number;
  gameMonth: number;
}

/**
 * Log a banking transaction
 */
export function logBankingTransaction(params: BankingTransaction): { success: boolean; id?: number; error?: string } {
  try {
    const db = getDatabase();
    if (!db) {
      return { success: false, error: 'Database not initialized' };
    }

    db.run(
      `INSERT INTO banking_transactions (
        log_id, player_name, transaction_type, sub_type, amount, balance_after,
        fd_id, fd_duration_months, interest_rate, maturity_amount, penalty_amount,
        remarks, game_year, game_month
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.logId,
        params.playerName,
        params.transactionType,
        params.subType || null,
        params.amount,
        params.balanceAfter,
        params.fdId || null,
        params.fdDurationMonths || null,
        params.interestRate || null,
        params.maturityAmount || null,
        params.penaltyAmount || null,
        params.remarks || null,
        params.gameYear,
        params.gameMonth,
      ]
    );

    saveDatabase();

    console.log(`✅ Banking transaction logged:`, {
      type: params.transactionType,
      amount: `₹${params.amount.toFixed(2)}`,
      balanceAfter: `₹${params.balanceAfter.toFixed(2)}`,
      gameYear: params.gameYear,
      gameMonth: params.gameMonth,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error logging banking transaction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all banking transactions for a player log
 */
export function getBankingTransactionsByLogId(logId: number): BankingTransaction[] {
  try {
    const db = getDatabase();
    if (!db) return [];

    const result = db.exec(
      `SELECT id, log_id, player_name, transaction_type, sub_type, amount, balance_after,
              fd_id, fd_duration_months, interest_rate, maturity_amount, penalty_amount,
              remarks, game_year, game_month
       FROM banking_transactions
       WHERE log_id = ?
       ORDER BY game_year ASC, game_month ASC, id ASC`,
      [logId]
    );

    if (!result || result.length === 0) return [];

    const transactions: BankingTransaction[] = [];
    const columns = result[0].columns;
    const values = result[0].values;

    values.forEach((row: any[]) => {
      const transaction: BankingTransaction = {
        logId: row[columns.indexOf('log_id')],
        playerName: row[columns.indexOf('player_name')],
        transactionType: row[columns.indexOf('transaction_type')],
        subType: row[columns.indexOf('sub_type')],
        amount: row[columns.indexOf('amount')],
        balanceAfter: row[columns.indexOf('balance_after')],
        fdId: row[columns.indexOf('fd_id')],
        fdDurationMonths: row[columns.indexOf('fd_duration_months')],
        interestRate: row[columns.indexOf('interest_rate')],
        maturityAmount: row[columns.indexOf('maturity_amount')],
        penaltyAmount: row[columns.indexOf('penalty_amount')],
        remarks: row[columns.indexOf('remarks')],
        gameYear: row[columns.indexOf('game_year')],
        gameMonth: row[columns.indexOf('game_month')],
      };
      transactions.push(transaction);
    });

    return transactions;
  } catch (error: any) {
    console.error('Error retrieving banking transactions:', error);
    return [];
  }
}

/**
 * Get banking transaction summary for a player log
 */
export function getBankingTransactionSummary(logId: number) {
  try {
    const db = getDatabase();
    if (!db) return null;

    const result = db.exec(
      `SELECT
        COUNT(*) as total_transactions,
        SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawals,
        SUM(CASE WHEN transaction_type = 'fd_investment' THEN amount ELSE 0 END) as total_fd_investments,
        SUM(CASE WHEN transaction_type = 'fd_maturity' THEN maturity_amount ELSE 0 END) as total_fd_maturity_received,
        SUM(CASE WHEN transaction_type = 'fd_break' THEN penalty_amount ELSE 0 END) as total_penalties,
        SUM(CASE WHEN transaction_type = 'fd_maturity' THEN (maturity_amount - (SELECT SUM(amount) FROM banking_transactions bt2 WHERE bt2.fd_id = banking_transactions.fd_id AND bt2.transaction_type = 'fd_investment')) ELSE 0 END) as total_interest_earned,
        COUNT(CASE WHEN transaction_type = 'fd_investment' THEN 1 END) as fd_investments_count,
        COUNT(CASE WHEN transaction_type = 'fd_maturity' THEN 1 END) as fd_matured_count,
        COUNT(CASE WHEN transaction_type = 'fd_break' THEN 1 END) as fd_broken_count
       FROM banking_transactions
       WHERE log_id = ?`,
      [logId]
    );

    if (!result || result.length === 0) return null;

    const row = result[0].values[0];
    const columns = result[0].columns;

    return {
      totalTransactions: row[columns.indexOf('total_transactions')] || 0,
      totalDeposits: row[columns.indexOf('total_deposits')] || 0,
      totalWithdrawals: row[columns.indexOf('total_withdrawals')] || 0,
      totalFdInvestments: row[columns.indexOf('total_fd_investments')] || 0,
      totalFdMaturityReceived: row[columns.indexOf('total_fd_maturity_received')] || 0,
      totalPenalties: row[columns.indexOf('total_penalties')] || 0,
      totalInterestEarned: row[columns.indexOf('total_interest_earned')] || 0,
      fdInvestmentsCount: row[columns.indexOf('fd_investments_count')] || 0,
      fdMaturedCount: row[columns.indexOf('fd_matured_count')] || 0,
      fdBrokenCount: row[columns.indexOf('fd_broken_count')] || 0,
    };
  } catch (error: any) {
    console.error('Error getting banking transaction summary:', error);
    return null;
  }
}

/**
 * Get all FD transactions for a player log (grouped by FD)
 */
export function getFDTransactionsByLogId(logId: number) {
  try {
    const db = getDatabase();
    if (!db) return [];

    const result = db.exec(
      `SELECT
        fd_id,
        fd_duration_months,
        interest_rate,
        SUM(CASE WHEN transaction_type = 'fd_investment' THEN amount ELSE 0 END) as invested_amount,
        SUM(CASE WHEN transaction_type = 'fd_maturity' THEN maturity_amount ELSE 0 END) as maturity_received,
        SUM(CASE WHEN transaction_type = 'fd_break' THEN penalty_amount ELSE 0 END) as penalty_paid,
        CASE 
          WHEN COUNT(CASE WHEN transaction_type = 'fd_break' THEN 1 END) > 0 THEN 'broken'
          WHEN COUNT(CASE WHEN transaction_type = 'fd_maturity' THEN 1 END) > 0 THEN 'matured'
          ELSE 'active'
        END as fd_status
       FROM banking_transactions
       WHERE log_id = ? AND transaction_type IN ('fd_investment', 'fd_maturity', 'fd_break')
       GROUP BY fd_id
       ORDER BY fd_id ASC`,
      [logId]
    );

    if (!result || result.length === 0) return [];

    const fdTransactions: any[] = [];
    const columns = result[0].columns;
    const values = result[0].values;

    values.forEach((row: any[]) => {
      const fdTrans = {
        fdId: row[columns.indexOf('fd_id')],
        durationMonths: row[columns.indexOf('fd_duration_months')],
        interestRate: row[columns.indexOf('interest_rate')],
        investedAmount: row[columns.indexOf('invested_amount')] || 0,
        maturityReceived: row[columns.indexOf('maturity_received')] || 0,
        penaltyPaid: row[columns.indexOf('penalty_paid')] || 0,
        status: row[columns.indexOf('fd_status')],
      };
      fdTransactions.push(fdTrans);
    });

    return fdTransactions;
  } catch (error: any) {
    console.error('Error retrieving FD transactions:', error);
    return [];
  }
}
