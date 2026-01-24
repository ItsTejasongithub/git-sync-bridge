/**
 * usePrices Hook
 * Provides asset prices from PostgreSQL database via API
 * Works for both solo and multiplayer modes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { priceStore } from '../stores/priceStore';
import { fetchPrices, fetchPriceHistory, getGameSymbols } from '../services/priceApi';

interface UsePricesOptions {
  selectedAssets: any;
  calendarYear: number;
  currentMonth: number;
  isMultiplayer?: boolean;
}

interface UsePricesReturn {
  getPrice: (symbol: string) => number;
  getPriceHistory: (symbol: string, months?: number) => number[];
  isLoading: boolean;
  isUsingServerPrices: boolean;
  lastUpdate: number;
  refreshPrices: () => Promise<void>;
}

/**
 * Hook to get asset prices from PostgreSQL database
 */
export function usePrices(options: UsePricesOptions): UsePricesReturn {
  const { selectedAssets, calendarYear, currentMonth, isMultiplayer = false } = options;

  const [prices, setPrices] = useState<{ [symbol: string]: number }>({});
  const [priceHistoryCache, setPriceHistoryCache] = useState<{ [symbol: string]: number[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [isUsingServerPrices, setIsUsingServerPrices] = useState(false);

  // Track the last fetch parameters to avoid duplicate fetches
  const lastFetchRef = useRef<string>('');

  // Keep track of last known good history per symbol (to avoid flashing zeros)
  const lastKnownHistoryRef = useRef<{ [symbol: string]: number[] }>({});

  // Track in-flight history fetches to prevent duplicate requests
  const pendingHistoryFetches = useRef<Set<string>>(new Set());

  // Get the list of symbols needed
  const symbols = selectedAssets ? getGameSymbols(selectedAssets) : [];

  // Fetch prices from API (for solo mode or initial load)
  const fetchPricesFromApi = useCallback(async () => {
    if (symbols.length === 0) return;

    const fetchKey = `${calendarYear}-${currentMonth}-${symbols.join(',')}`;
    if (fetchKey === lastFetchRef.current) return;

    setIsLoading(true);
    try {
      const newPrices = await fetchPrices(symbols, calendarYear, currentMonth, isMultiplayer);
      if (Object.keys(newPrices).length > 0) {
        setPrices(newPrices);
        setLastUpdate(Date.now());
        setIsUsingServerPrices(true);
        lastFetchRef.current = fetchKey;
      }
    } catch (error) {
      // Errors are already logged in priceApi, just update loading state
    } finally {
      setIsLoading(false);
    }
  }, [symbols, calendarYear, currentMonth]);

  // In multiplayer mode, also listen to price store updates (encrypted broadcasts)
  useEffect(() => {
    if (isMultiplayer) {
      // Subscribe to encrypted price updates from WebSocket
      const unsubscribe = priceStore.subscribe((newPrices) => {
        if (Object.keys(newPrices).length > 0) {
          setPrices(newPrices);
          setLastUpdate(Date.now());
          setIsUsingServerPrices(true);
        }
      });

      // Check if price store already has prices
      if (priceStore.isEnabled()) {
        const storePrices = priceStore.getAllPrices();
        if (Object.keys(storePrices).length > 0) {
          setPrices(storePrices);
          setIsUsingServerPrices(true);
        }
      }

      return () => {
        unsubscribe();
      };
    }
  }, [isMultiplayer]);

  // Fetch prices when year/month changes
  useEffect(() => {
    if (isMultiplayer) {
      // SECURITY: In multiplayer, ONLY use encrypted WebSocket prices
      // Do NOT fall back to API if encryption is not ready
      if (!priceStore.isEnabled()) {
        console.log('⏳ Waiting for encrypted price broadcast (key exchange in progress)...');
        return;
      }
      // Encrypted prices are being received via WebSocket - no API fetch needed
      return;
    } else {
      // Solo mode: fetch from API
      fetchPricesFromApi();
    }
  }, [calendarYear, currentMonth, fetchPricesFromApi, isMultiplayer]);

  // Get price for a symbol
  const getPrice = useCallback(
    (symbol: string): number => {
      return prices[symbol] ?? 0;
    },
    [prices]
  );

  // Get price history for charts
  const getPriceHistoryForSymbol = useCallback(
    (symbol: string, months: number = 12): number[] => {
      // Check cache first (exact match for current time period)
      const cacheKey = `${symbol}-${calendarYear}-${currentMonth}-${months}`;
      if (priceHistoryCache[cacheKey]) {
        // Update last known good history
        lastKnownHistoryRef.current[symbol] = priceHistoryCache[cacheKey];
        return priceHistoryCache[cacheKey];
      }

      // Check if we're already fetching this data
      if (!pendingHistoryFetches.current.has(cacheKey)) {
        pendingHistoryFetches.current.add(cacheKey);

        // Fetch async and update cache
        fetchPriceHistory([symbol], calendarYear, currentMonth, months + 1)
          .then((history) => {
            if (history[symbol] && history[symbol].length > 0) {
              // Only update if we got valid data (not all zeros)
              const hasValidData = history[symbol].some((v) => v > 0);
              if (hasValidData) {
                setPriceHistoryCache((prev) => ({
                  ...prev,
                  [cacheKey]: history[symbol],
                }));
                // Update last known good history
                lastKnownHistoryRef.current[symbol] = history[symbol];
              }
            }
          })
          .catch(() => {
            // Errors are already logged in priceApi
          })
          .finally(() => {
            pendingHistoryFetches.current.delete(cacheKey);
          });
      }

      // Return last known good history for this symbol (smooth transition)
      // Only return zeros if we've never had data for this symbol
      const lastKnown = lastKnownHistoryRef.current[symbol];
      if (lastKnown && lastKnown.length > 0 && lastKnown.some((v) => v > 0)) {
        return lastKnown;
      }

      // No previous data - return zeros (first load)
      return new Array(months + 1).fill(0);
    },
    [calendarYear, currentMonth, priceHistoryCache]
  );

  // Manual refresh
  const refreshPrices = useCallback(async () => {
    lastFetchRef.current = ''; // Reset to force fetch
    await fetchPricesFromApi();
  }, [fetchPricesFromApi]);

  return {
    getPrice,
    getPriceHistory: getPriceHistoryForSymbol,
    isLoading,
    isUsingServerPrices,
    lastUpdate,
    refreshPrices,
  };
}

/**
 * Standalone function to get price history
 * Used by components that need history without the full hook
 */
export async function getStandalonePriceHistory(
  symbols: string[],
  calendarYear: number,
  currentMonth: number,
  months: number = 12
): Promise<{ [symbol: string]: number[] }> {
  return fetchPriceHistory(symbols, calendarYear, currentMonth, months);
}
