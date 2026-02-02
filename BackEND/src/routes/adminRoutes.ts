import { Router, Request, Response } from 'express';
import { authenticateAdmin, createAdminAccount, changeAdminPassword } from '../database/adminAuth';
import { getAdminSettings, updateAdminSettings, resetAdminSettings } from '../database/adminSettings';
import { getPlayerLogs, getPlayerStats, deletePlayerLogs } from '../database/playerLogs';

const router = Router();

/**
 * POST /api/admin/auth/login
 * Authenticate admin user
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const result = await authenticateAdmin(username, password);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/admin/auth/create
 * Create new admin account
 */
router.post('/auth/create', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const result = await createAdminAccount(username, password);

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Create account error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/admin/auth/change-password
 * Change admin password
 */
router.post('/auth/change-password', async (req: Request, res: Response) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const result = await changeAdminPassword(username, oldPassword, newPassword);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/settings
 * Get current admin settings
 */
router.get('/settings', (req: Request, res: Response) => {
  try {
    const settings = getAdminSettings();

    if (settings) {
      return res.status(200).json({ success: true, settings });
    } else {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/settings
 * Update admin settings
 */
router.put('/settings', (req: Request, res: Response) => {
  try {
    const settings = req.body;

    // Validate settings
    if (!settings.selectedCategories || !Array.isArray(settings.selectedCategories)) {
      return res.status(400).json({ success: false, message: 'Invalid selectedCategories' });
    }

    if (!settings.selectedCategories.includes('BANKING')) {
      return res.status(400).json({ success: false, message: 'BANKING category is mandatory' });
    }

    if (typeof settings.gameStartYear !== 'number' || settings.gameStartYear < 1996 || settings.gameStartYear > 2025) {
      return res.status(400).json({ success: false, message: 'Invalid gameStartYear (must be between 1996-2025)' });
    }

    if (typeof settings.initialPocketCash !== 'number' || settings.initialPocketCash < 0) {
      return res.status(400).json({ success: false, message: 'Invalid initialPocketCash' });
    }

    if (typeof settings.recurringIncome !== 'number' || settings.recurringIncome < 0) {
      return res.status(400).json({ success: false, message: 'Invalid recurringIncome' });
    }

    if (typeof settings.eventsCount !== 'number' || settings.eventsCount < 1 || settings.eventsCount > 20) {
      return res.status(400).json({ success: false, message: 'Invalid eventsCount (must be a number between 1 and 20)' });
    }

    const result = updateAdminSettings(settings);

    if (result.success) {
      return res.status(200).json({ ...result, settings });
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/admin/settings/reset
 * Reset admin settings to default
 */
router.post('/settings/reset', (req: Request, res: Response) => {
  try {
    const result = resetAdminSettings();

    if (result.success) {
      const settings = getAdminSettings();
      return res.status(200).json({ ...result, settings });
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Reset settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/logs
 * Get player logs with optional filters
 */
router.get('/logs', (req: Request, res: Response) => {
  try {
    const { gameMode, playerName, roomId, limit, offset } = req.query;

    const filters: any = {};

    if (gameMode === 'solo' || gameMode === 'multiplayer') {
      filters.gameMode = gameMode;
    }

    if (playerName && typeof playerName === 'string') {
      filters.playerName = playerName;
    }

    if (roomId && typeof roomId === 'string') {
      filters.roomId = roomId;
    }

    if (limit && typeof limit === 'string') {
      filters.limit = parseInt(limit, 10);
    }

    if (offset && typeof offset === 'string') {
      filters.offset = parseInt(offset, 10);
    }

    const logs = getPlayerLogs(filters);

    return res.status(200).json({ success: true, logs, count: logs.length });
  } catch (error) {
    console.error('Get logs error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/stats
 * Get player statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const { playerName } = req.query;

    const stats = getPlayerStats(playerName as string | undefined);

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/logs
 * Delete player logs
 */
router.delete('/logs', (req: Request, res: Response) => {
  try {
    const { logIds } = req.body;

    if (!Array.isArray(logIds) || logIds.length === 0) {
      return res.status(400).json({ success: false, message: 'logIds array is required' });
    }

    const result = deletePlayerLogs(logIds);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete logs error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/admin/asset-metadata
 * Get asset metadata from PostgreSQL database
 */
router.get('/asset-metadata', async (req: Request, res: Response) => {
  try {
    const { getAssetMetadata } = await import('../services/marketDataService');
    const metadata = await getAssetMetadata();

    return res.status(200).json({
      success: true,
      metadata,
      count: metadata.length
    });
  } catch (error) {
    console.error('Get asset metadata error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});


export default router;
