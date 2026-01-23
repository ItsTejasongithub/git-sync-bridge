/**
 * Price Store
 * Reactive store for server-provided asset prices
 * Used in multiplayer mode when prices come from encrypted server broadcasts
 */

export type PriceListener = (prices: { [symbol: string]: number }) => void;

class PriceStore {
  private prices: { [symbol: string]: number } = {};
  private listeners: Set<PriceListener> = new Set();
  private lastUpdate: number = 0;
  private enabled: boolean = false;

  /**
   * Enable the price store (use server prices)
   */
  enable(): void {
    this.enabled = true;
    console.log('📊 Price store enabled (using server prices)');
  }

  /**
   * Disable the price store (fall back to CSV)
   */
  disable(): void {
    this.enabled = false;
    console.log('📊 Price store disabled (using CSV prices)');
  }

  /**
   * Check if price store is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Update prices from decrypted server data
   */
  updatePrices(newPrices: { [symbol: string]: number }): void {
    const priceCount = Object.keys(newPrices).length;
    console.log(`💰 Price store updated with ${priceCount} prices`);
    this.prices = { ...newPrices };
    this.lastUpdate = Date.now();
    this.notifyListeners();
  }

  /**
   * Get price for a specific symbol
   * Returns 0 if not found
   */
  getPrice(symbol: string): number {
    return this.prices[symbol] ?? 0;
  }

  /**
   * Get all current prices
   */
  getAllPrices(): { [symbol: string]: number } {
    return { ...this.prices };
  }

  /**
   * Check if we have a price for a symbol
   */
  hasPrice(symbol: string): boolean {
    return symbol in this.prices && this.prices[symbol] > 0;
  }

  /**
   * Get the number of symbols we have prices for
   */
  getSymbolCount(): number {
    return Object.keys(this.prices).length;
  }

  /**
   * Get timestamp of last price update
   */
  getLastUpdateTime(): number {
    return this.lastUpdate;
  }

  /**
   * Subscribe to price updates
   * Returns unsubscribe function
   */
  subscribe(listener: PriceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Clear all prices and listeners
   */
  clear(): void {
    this.prices = {};
    this.lastUpdate = 0;
    this.enabled = false;
    // Don't clear listeners - they might still be needed
  }

  /**
   * Clear everything including listeners
   */
  reset(): void {
    this.prices = {};
    this.lastUpdate = 0;
    this.enabled = false;
    this.listeners.clear();
  }

  private notifyListeners(): void {
    const currentPrices = this.getAllPrices();
    this.listeners.forEach((listener) => {
      try {
        listener(currentPrices);
      } catch (error) {
        console.error('Error in price listener:', error);
      }
    });
  }
}

// Export singleton instance
export const priceStore = new PriceStore();

// Export type for React hooks
export type { PriceStore };
