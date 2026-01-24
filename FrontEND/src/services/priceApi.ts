/**
 * Price API Service
 * Fetches asset prices from the backend PostgreSQL database
 * Used for both solo and multiplayer modes
 */

import { getServerUrl } from '../utils/getServerUrl';

const SERVER_URL = getServerUrl();

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 10000;

// Track in-flight requests to prevent duplicates
const inFlightRequests: Map<string, Promise<any>> = new Map();

/**
 * Wrapper for fetch with timeout support
 */
async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms: ${url}`);
    }
    throw error;
  }
}

export interface PriceResponse {
  success: boolean;
  data?: {
    prices: { [symbol: string]: number };
    year: number;
    month: number;
  };
  error?: string;
}

export interface BatchPriceResponse {
  success: boolean;
  data?: {
    [symbol: string]: Array<{ year: number; month: number; prices: number }>;
  };
  error?: string;
}

export interface HealthResponse {
  success: boolean;
  data?: {
    available: boolean;
    message: string;
  };
  error?: string;
}

export interface FDRatesResponse {
  success: boolean;
  data?: {
    [year: number]: { 3: number; 12: number; 36: number };
  };
  error?: string;
}

// Cache for prices to reduce API calls
const priceCache: Map<string, { [symbol: string]: number }> = new Map();
const CACHE_MAX_SIZE = 300;

/**
 * Check if the price service is available
 */
export async function checkPriceServiceHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${SERVER_URL}/api/prices/health`);
    if (!response.ok) {
      return false;
    }
    const data: HealthResponse = await response.json();
    return data.success && data.data?.available === true;
  } catch (error) {
    // Silent fail for health check - don't spam console
    return false;
  }
}

/**
 * Fetch FD rates for all years
 */
export async function fetchFDRates(): Promise<{ [year: number]: { 3: number; 12: number; 36: number } }> {
  try {
    const response = await fetchWithTimeout(`${SERVER_URL}/api/prices/fd-rates`);
    if (!response.ok) {
      return {};
    }
    const data: FDRatesResponse = await response.json();

    if (data.success && data.data) {
      return data.data;
    }

    return {};
  } catch (error) {
    if (error instanceof Error && !error.message.includes('timeout')) {
    }
    return {};
  }
}

/**
 * Get prices for symbols at a specific date
 */
export async function fetchPrices(
  symbols: string[],
  year: number,
  month: number,
  isMultiplayer: boolean = false
): Promise<{ [symbol: string]: number }> {
  // SECURITY: Block direct API access in multiplayer mode
  if (isMultiplayer) {
    console.error('❌ SECURITY VIOLATION: Direct price API access blocked in multiplayer mode');
    console.error('   Multiplayer clients must use encrypted WebSocket prices only');
    return {};
  }

  // Validate inputs
  if (!symbols || symbols.length === 0) {
    return {};
  }

  const cacheKey = `${year}-${String(month).padStart(2, '0')}`;

  // Check cache first
  const cached = priceCache.get(cacheKey);
  if (cached) {
    const allPresent = symbols.every((s) => s in cached);
    if (allPresent) {
      return filterPrices(cached, symbols);
    }
  }

  // Deduplicate in-flight requests
  const requestKey = `prices-${cacheKey}-${symbols.sort().join(',')}`;
  const existingRequest = inFlightRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const requestPromise = (async () => {
    try {
      const symbolsParam = symbols.join(',');
      const url = `${SERVER_URL}/api/prices/current?symbols=${encodeURIComponent(symbolsParam)}&year=${year}&month=${month}`;

      const response = await fetchWithTimeout(url, {
        headers: {
          'x-multiplayer-mode': isMultiplayer ? 'true' : 'false'
        }
      });

      if (!response.ok) {
        return {};
      }

      const data: PriceResponse = await response.json();

      if (data.success && data.data) {
        // Update cache
        const existing = priceCache.get(cacheKey) || {};
        const merged = { ...existing, ...data.data.prices };
        updateCache(cacheKey, merged);

        return data.data.prices;
      }

      if (data.error === 'Database not available') {
        // PostgreSQL not connected - this is expected in some scenarios
      } else {
      }
      return {};
    } catch (error) {
      if (error instanceof Error) {
        // Don't spam console with repeated timeout errors
        if (!error.message.includes('timeout')) {
        }
      }
      return {};
    } finally {
      // Clean up in-flight request tracking
      inFlightRequests.delete(requestKey);
    }
  })();

  inFlightRequests.set(requestKey, requestPromise);
  return requestPromise;
}

/**
 * Fetch price history for charts
 */
export async function fetchPriceHistory(
  symbols: string[],
  endYear: number,
  endMonth: number,
  months: number = 12
): Promise<{ [symbol: string]: number[] }> {
  // Validate inputs
  if (!symbols || symbols.length === 0 || months <= 0) {
    return {};
  }

  // Calculate start date
  let startYear = endYear;
  let startMonth = endMonth - months + 1;

  while (startMonth <= 0) {
    startMonth += 12;
    startYear--;
  }

  // Deduplicate in-flight requests
  const requestKey = `history-${symbols.sort().join(',')}-${startYear}-${startMonth}-${months}`;
  const existingRequest = inFlightRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const requestPromise = (async () => {
    try {
      const response = await fetchWithTimeout(`${SERVER_URL}/api/prices/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbols,
          startYear,
          startMonth,
          months,
        }),
      });

      if (!response.ok) {
        return {};
      }

      const data: BatchPriceResponse = await response.json();

      if (data.success && data.data) {
        // Convert to array format
        const result: { [symbol: string]: number[] } = {};
        for (const [symbol, entries] of Object.entries(data.data)) {
          result[symbol] = entries.map((e) => e.prices);
        }
        return result;
      }

      if (data.error === 'Database not available') {
        // PostgreSQL not connected - this is expected in some scenarios
      } else {
      }
      return {};
    } catch (error) {
      if (error instanceof Error) {
        // Don't spam console with repeated timeout errors
        if (!error.message.includes('timeout')) {
        }
      }
      return {};
    } finally {
      // Clean up in-flight request tracking
      inFlightRequests.delete(requestKey);
    }
  })();

  inFlightRequests.set(requestKey, requestPromise);
  return requestPromise;
}

/**
 * Preload prices for a game session
 */
export async function preloadGamePrices(
  selectedAssets: any,
  startYear: number,
  totalYears: number = 20
): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${SERVER_URL}/api/prices/preload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedAssets,
        startYear,
        totalYears,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    if (error instanceof Error && !error.message.includes('timeout')) {
    }
    return false;
  }
}

/**
 * Get all symbols needed for a game
 */
export function getGameSymbols(selectedAssets: any): string[] {
  const symbols: string[] = [];

  // Gold (always available)
  symbols.push('Physical_Gold', 'Digital_Gold');

  // Fund
  if (selectedAssets?.fundName) {
    symbols.push(selectedAssets.fundName);
  }

  // Stocks
  if (selectedAssets?.stocks && Array.isArray(selectedAssets.stocks)) {
    symbols.push(...selectedAssets.stocks);
  }

  // Crypto
  symbols.push('BTC', 'ETH');

  // Commodity
  if (selectedAssets?.commodity) {
    symbols.push(selectedAssets.commodity);
  }

  // REITs
  symbols.push('EMBASSY', 'MINDSPACE');

  return [...new Set(symbols)];
}

/**
 * Clear the price cache
 */
export function clearPriceCache(): void {
  priceCache.clear();
}

// Helper functions
function filterPrices(
  prices: { [symbol: string]: number },
  symbols: string[]
): { [symbol: string]: number } {
  const filtered: { [symbol: string]: number } = {};
  for (const symbol of symbols) {
    if (symbol in prices) {
      filtered[symbol] = prices[symbol];
    }
  }
  return filtered;
}

function updateCache(key: string, prices: { [symbol: string]: number }): void {
  if (priceCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = priceCache.keys().next().value;
    if (oldestKey) {
      priceCache.delete(oldestKey);
    }
  }
  priceCache.set(key, prices);
}
