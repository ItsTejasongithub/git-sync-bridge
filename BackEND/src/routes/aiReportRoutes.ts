import { Router, Request, Response } from 'express';
import { generateTradingReport } from '../services/aiReport';
import { getPlayerLogs } from '../database/playerLogs';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { logId, uniqueId, reportId, summary, trades } = req.body;

    // Accept either numeric logId (may be 0) OR uniqueId (preferred)
    let playerLog: any | null = null;
    if (typeof uniqueId === 'string') {
      const { getPlayerLogByUniqueId } = await import('../database/playerLogs');
      playerLog = getPlayerLogByUniqueId(uniqueId);
    } else if (logId !== undefined && logId !== null) {
      const logs = getPlayerLogs();
      playerLog = logs.find((log) => log.id === logId) || null;
    }

    if (!playerLog) {
      return res.status(404).json({
        success: false,
        message: 'Player log not found (provide uniqueId or valid logId)',
      });
    }

    // If caller provided precomputed summary/trades and a reportId, prefer those to save tokens
    const result = await generateTradingReport({
      logId: playerLog.id,
      uniqueId: playerLog.uniqueId,
      playerName: playerLog.playerName,
      playerAge: playerLog.playerAge || 0,
      finalNetworth: playerLog.finalNetworth,
      finalCAGR: playerLog.finalCAGR || 0,
      profitLoss: playerLog.profitLoss || 0,
      reportId: reportId || null,
      precomputedSummary: summary || null,
      precomputedTrades: Array.isArray(trades) ? trades : null,
    });

    if (result.success) {
      res.json({
        success: true,
        report: result.report,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Failed to generate report',
      });
    }
  } catch (error: any) {
    console.error('Generate report route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
});

export default router;
