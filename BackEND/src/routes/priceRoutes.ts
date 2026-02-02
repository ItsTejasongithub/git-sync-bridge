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
 * Get Fixed Deposit rates for all years based on National Savings Time Deposit Account Scheme
 * Returns: { year: { 12: rate, 24: rate, 36: rate } }
 * Keys: 12 = 1 year, 24 = 2 years, 36 = 3 years
 */
router.get('/fd-rates', (req: Request, res: Response) => {
  // Historical FD rates from National Savings Time Deposit Account Scheme
  // Rates are annual percentages for 1 year, 2 years, and 3 years tenure
  const fdRates: { [year: number]: { 12: number; 24: number; 36: number } } = {
    1981: { 12: 8.50, 24: 9.50, 36: 10.50 },
    1982: { 12: 9.00, 24: 9.75, 36: 10.50 },
    1983: { 12: 9.00, 24: 9.75, 36: 10.50 },
    1984: { 12: 9.00, 24: 9.75, 36: 10.50 },
    1985: { 12: 9.50, 24: 10.00, 36: 10.50 },
    1986: { 12: 9.50, 24: 10.00, 36: 10.50 },
    1987: { 12: 9.50, 24: 10.00, 36: 10.50 },
    1988: { 12: 9.50, 24: 10.00, 36: 10.50 },
    1989: { 12: 9.50, 24: 10.00, 36: 10.50 },
    1990: { 12: 9.50, 24: 10.00, 36: 10.50 },
    1991: { 12: 12.00, 24: 12.00, 36: 13.00 },
    1992: { 12: 12.00, 24: 12.00, 36: 13.00 },
    1993: { 12: 10.50, 24: 11.00, 36: 12.00 },
    1994: { 12: 10.50, 24: 11.00, 36: 12.00 },
    1995: { 12: 10.50, 24: 11.00, 36: 12.00 },
    1996: { 12: 10.50, 24: 11.00, 36: 12.00 },
    1997: { 12: 10.50, 24: 11.00, 36: 12.00 },
    1998: { 12: 10.50, 24: 11.00, 36: 12.00 },
    1999: { 12: 9.00, 24: 10.00, 36: 11.00 },
    2000: { 12: 8.00, 24: 9.00, 36: 10.00 },
    2001: { 12: 7.50, 24: 8.00, 36: 9.00 },
    2002: { 12: 7.25, 24: 7.50, 36: 8.25 },
    2003: { 12: 6.25, 24: 6.50, 36: 7.25 },
    2004: { 12: 6.25, 24: 6.50, 36: 7.25 },
    2005: { 12: 6.25, 24: 6.50, 36: 7.25 },
    2006: { 12: 6.25, 24: 6.50, 36: 7.25 },
    2007: { 12: 6.25, 24: 6.50, 36: 7.25 },
    2008: { 12: 6.25, 24: 6.50, 36: 7.25 },
    2009: { 12: 6.25, 24: 6.50, 36: 7.25 },
    2010: { 12: 6.25, 24: 6.50, 36: 7.25 },
    2011: { 12: 6.25, 24: 6.50, 36: 7.25 },
    2012: { 12: 8.20, 24: 8.30, 36: 8.40 },
    2013: { 12: 8.20, 24: 8.20, 36: 8.30 },
    2014: { 12: 8.40, 24: 8.40, 36: 8.40 },
    2015: { 12: 8.40, 24: 8.40, 36: 8.40 },
    2016: { 12: 7.10, 24: 7.20, 36: 7.40 },
    2017: { 12: 6.90, 24: 7.00, 36: 7.20 },
    2018: { 12: 6.60, 24: 6.70, 36: 6.90 },
    2019: { 12: 7.00, 24: 7.00, 36: 7.00 },
    2020: { 12: 5.50, 24: 5.50, 36: 5.50 },
    2021: { 12: 5.50, 24: 5.50, 36: 5.50 },
    2022: { 12: 5.50, 24: 5.70, 36: 5.80 },
    2023: { 12: 6.80, 24: 6.90, 36: 7.00 },
    2024: { 12: 6.90, 24: 7.00, 36: 7.10 },
    2025: { 12: 6.90, 24: 7.00, 36: 7.10 },
    2026: { 12: 6.90, 24: 7.00, 36: 7.10 },
  };

  res.json({
    success: true,
    data: fdRates,
  });
});

export default router;
