import { Router, Request, Response } from 'express';
import { logTrade } from '../database/tradingTransactions';
import { logBankingTransaction } from '../database/bankingTransactions';
import { getDatabase, saveDatabase } from '../database/db';

const router = Router();

router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { logId, uniqueId, playerName: bodyPlayerName, player, trades, bankingTransactions, cashTransactions, reportId, summary } = req.body;

    const playerName = bodyPlayerName || (player && player.name) || null;

    console.log('📊 Bulk upload request:', {
      logId,
      uniqueId,
      playerName,
      tradeCount: trades?.length,
      bankingTransactionCount: bankingTransactions?.length,
      reportId,
    });

    // Resolve numeric logId from uniqueId if provided
    let resolvedLogId: number | undefined = undefined;
    if (typeof uniqueId === 'string') {
      const { getPlayerLogByUniqueId } = await import('../database/playerLogs');
      const pl = getPlayerLogByUniqueId(uniqueId);
      if (!pl) {
        console.error('❌ Unknown uniqueId for upload', uniqueId);
        return res.status(400).json({ success: false, message: 'Unknown uniqueId' });
      }
      resolvedLogId = pl.id;
    } else if (logId !== undefined) {
      resolvedLogId = logId;
    }

    // Validate
    if (resolvedLogId === undefined || !playerName) {
      console.error('❌ Validation failed:', { resolvedLogId, playerName });
      return res.status(400).json({
        success: false,
        message: 'uniqueId or logId and playerName are required',
      });
    }

    type TradeResult = { success: boolean; message: string; tradeId?: number };
    type BankingResult = { success: boolean; id?: number; error?: string };
    type CashResult = { success: boolean; id?: number; error?: string };

    const results: {
      trades: TradeResult[];
      bankingTransactions: BankingResult[];
      cashTransactions: CashResult[];
    } = {
      trades: [],
      bankingTransactions: [],
      cashTransactions: [],
    };

    // Log trades
    if (Array.isArray(trades) && trades.length > 0) {
      for (const trade of trades) {
        const result = logTrade({
          logId: resolvedLogId,
          playerName,
          ...trade,
        });
        results.trades.push(result);
      }
      console.log(`✅ Trades uploaded: ${results.trades.filter(r => r.success).length}/${trades.length}`);
    } else {
      console.log('⚠️ No trades to upload');
    }

    // Log banking transactions
    if (Array.isArray(bankingTransactions) && bankingTransactions.length > 0) {
      for (const bankingTrans of bankingTransactions) {
        const result = logBankingTransaction({
          logId: resolvedLogId,
          playerName,
          transactionType: bankingTrans.transactionType,
          subType: bankingTrans.subType,
          amount: bankingTrans.amount,
          balanceAfter: bankingTrans.balanceAfter,
          fdId: bankingTrans.fdId,
          fdDurationMonths: bankingTrans.fdDurationMonths,
          interestRate: bankingTrans.interestRate,
          maturityAmount: bankingTrans.maturityAmount,
          penaltyAmount: bankingTrans.penaltyAmount,
          remarks: bankingTrans.remarks,
          gameYear: bankingTrans.gameYear,
          gameMonth: bankingTrans.gameMonth,
        });
        results.bankingTransactions.push(result);
      }
      console.log(`✅ Banking transactions uploaded: ${results.bankingTransactions.filter(r => r.success).length}/${bankingTransactions.length}`);
    } else {
      console.log('⚠️ No banking transactions to upload');
    }

    // Log cash transactions (life events & recurring income)
    if (Array.isArray(cashTransactions) && cashTransactions.length > 0) {
      try {
        const { logCashTransaction } = await import('../database/cashTransactions');
        for (const ct of cashTransactions) {
          const result = logCashTransaction({
            logId: resolvedLogId as number,
            playerName,
            txType: ct.type || ct.txType || 'life_event',
            subType: ct.subType || null,
            amount: ct.amount,
            message: ct.message || null,
            gameYear: ct.gameYear || ct.game_year || null,
            gameMonth: ct.gameMonth || ct.game_month || null,
            timestamp: ct.timestamp || Date.now(),
          });
          results.cashTransactions.push(result);
        }
        console.log(`✅ Cash transactions uploaded: ${results.cashTransactions.filter(r => r.success).length}/${cashTransactions.length}`);
      } catch (err) {
        console.warn('⚠️ Failed to upload cash transactions:', err);
      }
    } else {
      console.log('⚠️ No cash transactions to upload');
    }

    // Persist AI report summary (if provided) for later retrieval
    try {
      if (reportId && summary) {
        const db = getDatabase();

        // Try to compute banking summary server-side to avoid recomputing in AI step
        let bankingSummary = null;
        try {
          const { getBankingTransactionSummary } = await import('../database/bankingTransactions');
          bankingSummary = getBankingTransactionSummary(resolvedLogId as number);
        } catch (err) {
          // noop
        }

        db.run(
          `INSERT OR REPLACE INTO ai_reports (report_id, unique_id, player_name, summary_json, trades_json, cash_json, banking_summary_json) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            reportId,
            uniqueId || null,
            playerName,
            JSON.stringify(summary),
            JSON.stringify(trades || []),
            JSON.stringify(cashTransactions || []),
            bankingSummary ? JSON.stringify(bankingSummary) : null,
          ]
        );
        saveDatabase();
        console.log('💾 AI report summary saved:', reportId);
      }
    } catch (err) {
      console.warn('⚠️ Failed to save AI report summary:', err);
    }

    const tradeSuccess = results.trades.filter(r => r.success).length;
    const bankingSuccess = results.bankingTransactions.filter(r => r.success).length;

    res.json({
      success: true,
      message: `Uploaded ${tradeSuccess} trades and ${bankingSuccess} banking transactions`,
      results: {
        trades: {
          success: tradeSuccess,
          total: results.trades.length,
        },
        bankingTransactions: {
          success: bankingSuccess,
          total: results.bankingTransactions.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

export default router;
