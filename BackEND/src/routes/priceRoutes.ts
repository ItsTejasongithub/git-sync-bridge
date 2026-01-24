/**
 * Price API Routes
 * Provides REST endpoints for fetching asset prices from PostgreSQL
 * Used by solo mode and as fallback for multiplayer
 */

import { Router, Request, Response } from 'express';
import { isPostgresPoolInitialized } from '../database/postgresDb';
import {
  getPricesForDate,
  getAssetMetadata,
  preloadPricesForGame,
  getGameSymbols,
} from '../services/marketDataService';

const router = Router();

/**
 * GET /api/prices/current
 * Get current prices for specified symbols at a given date
 * Query params:
 *   - symbols: comma-separated list of asset symbols
 *   - year: calendar year
 *   - month: month (1-12)
 */
router.get('/current', async (req: Request, res: Response) => {
  try {
    // SECURITY: Check if request is from multiplayer client
    const multiplayerMode = req.headers['x-multiplayer-mode'];

    if (multiplayerMode === 'true') {
      console.warn(`⚠️ SECURITY: Blocked direct API access from multiplayer client`);
      return res.status(403).json({
        success: false,
        error: 'Direct API access forbidden in multiplayer mode. Use encrypted WebSocket.',
      });
    }

    if (!isPostgresPoolInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    const { symbols, year, month } = req.query;

    if (!symbols || !year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: symbols, year, month',
      });
    }

    const symbolList = (symbols as string).split(',').map((s) => s.trim());
    const yearNum = parseInt(year as string, 10);
    const monthNum = parseInt(month as string, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year or month',
      });
    }

    const prices = await getPricesForDate(symbolList, yearNum, monthNum);

    res.json({
      success: true,
      data: {
        prices,
        year: yearNum,
        month: monthNum,
      },
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prices',
    });
  }
});

/**
 * POST /api/prices/batch
 * Get prices for multiple months at once (for chart history)
 * Body:
 *   - symbols: array of asset symbols
 *   - startYear: starting calendar year
 *   - startMonth: starting month
 *   - months: number of months to fetch
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    if (!isPostgresPoolInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    const { symbols, startYear, startMonth, months = 12 } = req.body;

    if (!symbols || !Array.isArray(symbols) || !startYear || !startMonth) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    const results: { [key: string]: { year: number; month: number; prices: any }[] } = {};

    // Initialize results for each symbol
    symbols.forEach((symbol: string) => {
      results[symbol] = [];
    });

    // Fetch prices for each month
    let currentYear = startYear;
    let currentMonth = startMonth;

    for (let i = 0; i < months; i++) {
      try {
        const prices = await getPricesForDate(symbols, currentYear, currentMonth);

        symbols.forEach((symbol: string) => {
          results[symbol].push({
            year: currentYear,
            month: currentMonth,
            prices: prices[symbol] || 0,
          });
        });
      } catch (priceError: any) {
        console.error(`⚠️ Error fetching prices for ${currentYear}-${currentMonth}:`, priceError.message);
        // Add zero prices for this month to avoid breaking the response
        symbols.forEach((symbol: string) => {
          results[symbol].push({
            year: currentYear,
            month: currentMonth,
            prices: 0,
          });
        });
      }

      // Advance to next month
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error fetching batch prices:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch batch prices',
    });
  }
});

/**
 * POST /api/prices/preload
 * Preload prices for a game session
 * Body:
 *   - selectedAssets: game's selected assets configuration
 *   - startYear: game start year
 *   - totalYears: number of years to preload (default 20)
 */
router.post('/preload', async (req: Request, res: Response) => {
  try {
    if (!isPostgresPoolInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    const { selectedAssets, startYear, totalYears = 20 } = req.body;

    if (!selectedAssets || !startYear) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    const symbols = getGameSymbols(selectedAssets);
    await preloadPricesForGame(symbols, startYear, totalYears);

    res.json({
      success: true,
      data: {
        symbols,
        startYear,
        totalYears,
        message: 'Prices preloaded successfully',
      },
    });
  } catch (error) {
    console.error('Error preloading prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to preload prices',
    });
  }
});

/**
 * GET /api/prices/metadata
 * Get metadata about available assets
 */
router.get('/metadata', async (req: Request, res: Response) => {
  try {
    if (!isPostgresPoolInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    const metadata = await getAssetMetadata();

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metadata',
    });
  }
});

/**
 * GET /api/prices/health
 * Check if price service is available
 */
router.get('/health', (req: Request, res: Response) => {
  const isAvailable = isPostgresPoolInitialized();

  res.json({
    success: true,
    data: {
      available: isAvailable,
      message: isAvailable
        ? 'Price service is available'
        : 'Price service unavailable - PostgreSQL not connected',
    },
  });
});

/**
 * GET /api/prices/fd-rates
 * Get Fixed Deposit rates for all years
 * Returns: { year: { 3: rate, 12: rate, 36: rate } }
 */
router.get('/fd-rates', (req: Request, res: Response) => {
  // Historical FD rates (3 months, 1 year, 3 years tenure)
  const fdRates: { [year: number]: { 3: number; 12: number; 36: number } } = {
    2005: { 3: 3.5, 12: 4.0, 36: 4.5 },
    2006: { 3: 3.8, 12: 4.2, 36: 4.8 },
    2007: { 3: 4.2, 12: 4.8, 36: 5.2 },
    2008: { 3: 5.0, 12: 5.5, 36: 6.0 },
    2009: { 3: 4.5, 12: 5.0, 36: 5.5 },
    2010: { 3: 4.0, 12: 4.5, 36: 5.0 },
    2011: { 3: 4.8, 12: 5.2, 36: 5.8 },
    2012: { 3: 4.5, 12: 5.0, 36: 5.5 },
    2013: { 3: 4.2, 12: 4.8, 36: 5.2 },
    2014: { 3: 3.8, 12: 4.2, 36: 4.8 },
    2015: { 3: 3.5, 12: 4.0, 36: 4.5 },
    2016: { 3: 3.3, 12: 3.8, 36: 4.3 },
    2017: { 3: 3.5, 12: 4.0, 36: 4.5 },
    2018: { 3: 4.0, 12: 4.5, 36: 5.0 },
    2019: { 3: 4.5, 12: 5.0, 36: 5.5 },
    2020: { 3: 4.0, 12: 4.5, 36: 5.0 },
    2021: { 3: 3.5, 12: 4.0, 36: 4.5 },
    2022: { 3: 4.0, 12: 4.5, 36: 5.0 },
    2023: { 3: 4.5, 12: 5.0, 36: 5.5 },
    2024: { 3: 5.0, 12: 5.5, 36: 6.0 },
    2025: { 3: 5.2, 12: 5.8, 36: 6.2 },
  };

  res.json({
    success: true,
    data: fdRates,
  });
});

export default router;
