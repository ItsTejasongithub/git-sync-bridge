/**
 * Market Data Service
 * Fetches asset prices from PostgreSQL database
 * Provides caching for performance during game sessions
 */

import { getPostgresPool } from '../database/postgresDb';

export interface PriceSnapshot {
  [symbol: string]: number; // symbol -> close price
}

export interface AssetMetadata {
  category: string;
  assetName: string;
  ticker: string;
  firstDate: Date;
  lastDate: Date;
  totalRecords: number;
}

// In-memory price cache for performance (keyed by "YYYY-MM")
const priceCache: Map<string, PriceSnapshot> = new Map();
const CACHE_MAX_SIZE = 300; // ~25 years * 12 months

/**
 * Get prices for a list of symbols at a specific year/month
 * Uses caching to avoid repeated database queries
 */
export async function getPricesForDate(
  symbols: string[],
  year: number,
  month: number
): Promise<PriceSnapshot> {
  const cacheKey = `${year}-${String(month).padStart(2, '0')}`;

  // Check cache first
  const cached = priceCache.get(cacheKey);
  if (cached) {
    // Check if all requested symbols are in cache
    const allPresent = symbols.every((s) => s in cached);
    if (allPresent) {
      return filterSnapshot(cached, symbols);
    }
  }

  const pool = getPostgresPool();

  // Build target date (first day of the month)
  const targetDate = `${year}-${String(month).padStart(2, '0')}-01`;

  // Query: Get the closest price on or before target date for each symbol
  // This handles cases where market was closed on the exact date
  const query = `
    WITH target AS (
      SELECT $1::date AS target_date
    ),
    ranked_prices AS (
      SELECT
        asset_name,
        close_price,
        date,
        ROW_NUMBER() OVER (
          PARTITION BY asset_name
          ORDER BY
            CASE WHEN date <= (SELECT target_date FROM target) THEN 0 ELSE 1 END,
            ABS(date - (SELECT target_date FROM target))
        ) as rn
      FROM asset_prices
      WHERE asset_name = ANY($2::text[])
        AND date >= ($1::date - INTERVAL '60 days')
        AND date <= ($1::date + INTERVAL '30 days')
    )
    SELECT asset_name, close_price
    FROM ranked_prices
    WHERE rn = 1
  `;

  const result = await pool.query(query, [targetDate, symbols]);

  const snapshot: PriceSnapshot = cached ? { ...cached } : {};

  for (const row of result.rows) {
    if (row.close_price !== null) {
      snapshot[row.asset_name] = parseFloat(row.close_price);
    }
  }

  // Handle Physical_Gold specially - ALWAYS use the INR converted table
  // Remove any USD price that may have been fetched from asset_prices
  if (symbols.includes('Physical_Gold')) {
    const goldQuery = `
      SELECT close_inr_per_10g
      FROM physical_gold_inr
      WHERE date <= $1::date
      ORDER BY date DESC
      LIMIT 1
    `;
    const goldResult = await pool.query(goldQuery, [targetDate]);
    if (goldResult.rows.length > 0 && goldResult.rows[0].close_inr_per_10g) {
      snapshot['Physical_Gold'] = parseFloat(goldResult.rows[0].close_inr_per_10g);
    }
  }

  // Update cache
  updateCache(cacheKey, snapshot);

  return filterSnapshot(snapshot, symbols);
}

/**
 * Preload prices for an entire game session
 * Call this when a game starts to warm up the cache
 */
export async function preloadPricesForGame(
  symbols: string[],
  startYear: number,
  totalYears: number = 20
): Promise<void> {
  console.log(
    `📈 Preloading prices for ${symbols.length} symbols, ${totalYears} years from ${startYear}`
  );

  const startTime = Date.now();

  // Batch query for all prices in the date range
  const pool = getPostgresPool();

  const startDate = `${startYear}-01-01`;
  const endDate = `${startYear + totalYears}-12-31`;

  // Fetch all prices in range
  const query = `
    SELECT
      asset_name,
      date,
      close_price
    FROM asset_prices
    WHERE asset_name = ANY($1::text[])
      AND date >= $2::date
      AND date <= $3::date
    ORDER BY date
  `;

  const result = await pool.query(query, [symbols, startDate, endDate]);

  // Also fetch Physical Gold INR prices
  const goldQuery = `
    SELECT date, close_inr_per_10g
    FROM physical_gold_inr
    WHERE date >= $1::date AND date <= $2::date
    ORDER BY date
  `;
  const goldResult = await pool.query(goldQuery, [startDate, endDate]);

  // Organize prices by month
  const monthlyPrices: Map<string, PriceSnapshot> = new Map();

  for (const row of result.rows) {
    const date = new Date(row.date);
    const cacheKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyPrices.has(cacheKey)) {
      monthlyPrices.set(cacheKey, {});
    }

    const snapshot = monthlyPrices.get(cacheKey)!;
    // Keep the latest price for each symbol in the month
    snapshot[row.asset_name] = parseFloat(row.close_price);
  }

  // Add Physical Gold INR prices
  for (const row of goldResult.rows) {
    const date = new Date(row.date);
    const cacheKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyPrices.has(cacheKey)) {
      monthlyPrices.set(cacheKey, {});
    }

    const snapshot = monthlyPrices.get(cacheKey)!;
    snapshot['Physical_Gold'] = parseFloat(row.close_inr_per_10g);
  }

  // Populate the cache
  monthlyPrices.forEach((snapshot, key) => {
    priceCache.set(key, snapshot);
  });

  const duration = Date.now() - startTime;
  console.log(
    `   ✅ Preloaded ${monthlyPrices.size} monthly snapshots in ${duration}ms`
  );
}

/**
 * Get all symbols that will be used in a game session
 * Based on the selectedAssets from game initialization
 */
export function getGameSymbols(selectedAssets: any): string[] {
  const symbols: string[] = [];

  // Gold (always available)
  symbols.push('Physical_Gold', 'Digital_Gold');

  // Index/Mutual Fund (one selected)
  if (selectedAssets?.fundName) {
    symbols.push(selectedAssets.fundName);
  }

  // Stocks (array of selected stocks)
  if (selectedAssets?.stocks && Array.isArray(selectedAssets.stocks)) {
    symbols.push(...selectedAssets.stocks);
  }

  // Crypto (always available after unlock)
  symbols.push('BTC', 'ETH');

  // Commodity (one selected)
  if (selectedAssets?.commodity) {
    symbols.push(selectedAssets.commodity);
  }

  // REITs (always available after unlock)
  symbols.push('EMBASSY', 'MINDSPACE');

  return [...new Set(symbols)]; // Remove duplicates
}

/**
 * Clear the price cache
 * Useful for testing or memory management
 */
export function clearPriceCache(): void {
  priceCache.clear();
  console.log('Price cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: priceCache.size,
    maxSize: CACHE_MAX_SIZE,
  };
}

// Helper: Filter snapshot to only include requested symbols
function filterSnapshot(
  snapshot: PriceSnapshot,
  symbols: string[]
): PriceSnapshot {
  const filtered: PriceSnapshot = {};
  for (const symbol of symbols) {
    if (symbol in snapshot) {
      filtered[symbol] = snapshot[symbol];
    }
  }
  return filtered;
}

// Helper: Update cache with LRU eviction
function updateCache(key: string, snapshot: PriceSnapshot): void {
  if (priceCache.size >= CACHE_MAX_SIZE) {
    // Remove oldest entry (first key in Map iteration order)
    const oldestKey = priceCache.keys().next().value;
    if (oldestKey) {
      priceCache.delete(oldestKey);
    }
  }
  priceCache.set(key, snapshot);
}

/**
 * Get asset metadata for all configured assets
 * Useful for debugging and admin UI
 */
export async function getAssetMetadata(): Promise<AssetMetadata[]> {
  const pool = getPostgresPool();

  const query = `
    SELECT
      category,
      asset_name,
      ticker,
      first_date,
      last_date,
      total_records
    FROM asset_metadata
    ORDER BY category, asset_name
  `;

  const result = await pool.query(query);

  return result.rows.map((row) => ({
    category: row.category,
    assetName: row.asset_name,
    ticker: row.ticker,
    firstDate: new Date(row.first_date),
    lastDate: new Date(row.last_date),
    totalRecords: parseInt(row.total_records, 10),
  }));
}
