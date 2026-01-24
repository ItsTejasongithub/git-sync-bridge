import { Router, Request, Response } from 'express';
import { logPlayerGame, LogPlayerGameParams, getPlayerLogs } from '../database/playerLogs';

const router = Router();

/**
 * POST /api/game/log
 * Log a completed game
 */
router.post('/log', (req: Request, res: Response) => {
  try {
    const {
      gameMode,
      playerName,
      playerAge,
      roomId,
      finalNetworth,
      finalCAGR,
      profitLoss,
      portfolioBreakdown,
      adminSettings,
      gameDurationMinutes,
    } = req.body;

    // Validate required fields
    if (!gameMode || !playerName || finalNetworth === undefined || !portfolioBreakdown || !adminSettings) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: gameMode, playerName, finalNetworth, portfolioBreakdown, adminSettings',
      });
    }

    if (gameMode !== 'solo' && gameMode !== 'multiplayer') {
      return res.status(400).json({
        success: false,
        message: 'Invalid gameMode (must be "solo" or "multiplayer")',
      });
    }

    const params: LogPlayerGameParams = {
      gameMode,
      playerName,
      playerAge,
      roomId,
      finalNetworth,
      finalCAGR,
      profitLoss,
      portfolioBreakdown,
      adminSettings,
      gameDurationMinutes,
    };

    const result = logPlayerGame(params);

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('Log game error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/game/final-leaderboard/:roomId
 * Get final leaderboard from database for a completed multiplayer game
 * This ensures accurate final networth values from DB instead of socket updates
 */
router.get('/final-leaderboard/:roomId', (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required',
      });
    }

    // Get all player logs for this room from the database
    const logs = getPlayerLogs({ roomId, gameMode: 'multiplayer' });

    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No game logs found for this room',
      });
    }

    // Deduplicate logs by playerName (case-insensitive) and pick the latest completed log per player
    const latestByPlayer = new Map<string, typeof logs[0]>();
    for (const log of logs) {
      const key = (log.playerName || '').trim().toLowerCase();
      if (!latestByPlayer.has(key)) {
        latestByPlayer.set(key, log);
      }
    }

    const uniqueLogs = Array.from(latestByPlayer.values());

    // Transform DB logs to leaderboard format using unique log id as stable identifier
    const leaderboard = uniqueLogs
      .map(log => ({
        playerId: log.uniqueId, // Unique log identifier for this player's final result
        playerName: log.playerName,
        networth: log.finalNetworth,
        portfolioBreakdown: log.portfolioBreakdown,
        completedAt: log.completedAt,
      }))
      .sort((a, b) => b.networth - a.networth); // Sort by networth descending

    return res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error('Get final leaderboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch final leaderboard',
    });
  }
});

export default router;
