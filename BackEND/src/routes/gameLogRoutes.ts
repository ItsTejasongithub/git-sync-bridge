import { Router, Request, Response } from 'express';
import { logPlayerGame, LogPlayerGameParams } from '../database/playerLogs';

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

    console.log('Logging game with params:', { playerName, playerAge, gameMode, finalNetworth });

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

export default router;
