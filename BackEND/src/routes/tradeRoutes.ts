import { Router, Request, Response } from 'express';
import { logTrade } from '../database/tradingTransactions';
import { logBankingTransaction } from '../database/bankingTransactions';
import { getDatabase, saveDatabase } from '../database/db';

const router = Router();

router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { logId, uniqueId, playerName: bodyPlayerName, player, trades, bankingTransactions, cashTransactions, holdings, reportId, summary } = req.body;

    const playerName = bodyPlayerName || (player && player.name) || null;

    // Resolve numeric logId from uniqueId if provided
    let resolvedLogId: number | undefined = undefined;
    if (typeof uniqueId === 'string') {
      const { getPlayerLogByUniqueId } = await import('../database/playerLogs');
      const pl = getPlayerLogByUniqueId(uniqueId);
      if (!pl) {
        return res.status(400).json({ success: false, message: 'Unknown uniqueId' });
      }
      resolvedLogId = pl.id;
    } else if (logId !== undefined) {
      resolvedLogId = logId;
    }

    // Validate
    if (resolvedLogId === undefined || !playerName) {
      return res.status(400).json({
        success: false,
        message: 'uniqueId or logId and playerName are required',
      });
    }

    type TradeResult = { success: boolean; message: string; tradeId?: number };
    type BankingResult = { success: boolean; id?: number; error?: string };
    type CashResult = { success: boolean; id?: number; error?: string };
    type HoldingResult = { success: boolean; message?: string; count?: number };

    const results: {
      trades: TradeResult[];
      bankingTransactions: BankingResult[];
      cashTransactions: CashResult[];
      holdings: HoldingResult;
    } = {
      trades: [],
      bankingTransactions: [],
      cashTransactions: [],
      holdings: { success: false, count: 0 },
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
    } else {
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
    } else {
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
      } catch (err) {
      }
    } else {
    }

    // Log holdings (end-of-game positions for unrealized P&L tracking)
    if (Array.isArray(holdings) && holdings.length > 0) {
      try {
        const { bulkLogHoldings } = await import('../database/playerHoldings');
        const holdingsResult = bulkLogHoldings(
          holdings.map((h: any) => ({
            logId: resolvedLogId as number,
            playerName,
            assetCategory: h.assetCategory,
            assetName: h.assetName,
            quantity: h.quantity,
            avgPrice: h.avgPrice,
            totalInvested: h.totalInvested,
            currentPrice: h.currentPrice,
            currentValue: h.currentValue,
            unrealizedPL: h.unrealizedPL,
            gameYear: h.gameYear,
            gameMonth: h.gameMonth,
          }))
        );
        results.holdings = holdingsResult;
      } catch (err) {
      }
    } else {
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
      }
    } catch (err) {
    }

    const tradeSuccess = results.trades.filter(r => r.success).length;
    const bankingSuccess = results.bankingTransactions.filter(r => r.success).length;
    const cashSuccess = results.cashTransactions.filter(r => r.success).length;
    const holdingsCount = results.holdings.count || 0;

    res.json({
      success: true,
      message: `Uploaded ${tradeSuccess} trades, ${bankingSuccess} banking transactions, ${cashSuccess} cash transactions, and ${holdingsCount} holdings`,
      results: {
        trades: {
          success: tradeSuccess,
          total: results.trades.length,
        },
        bankingTransactions: {
          success: bankingSuccess,
          total: results.bankingTransactions.length,
        },
        cashTransactions: {
          success: cashSuccess,
          total: results.cashTransactions.length,
        },
        holdings: {
          success: results.holdings.success,
          count: holdingsCount,
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
