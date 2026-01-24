/**
 * Server-Side Networth Validator
 * Validates client-reported networth against server-calculated values
 * Ensures clients cannot cheat by reporting false networth
 */

import { PriceSnapshot } from './marketDataService';

// Tolerance for floating-point differences (0.5%)
const TOLERANCE_PERCENT = 0.5;

interface AssetHolding {
  quantity: number;
  avgPrice: number;
  totalInvested: number;
}

interface Holdings {
  physicalGold: AssetHolding;
  digitalGold: AssetHolding;
  indexFund: AssetHolding;
  mutualFund: AssetHolding;
  stocks: { [key: string]: AssetHolding };
  crypto: { [key: string]: AssetHolding };
  commodity: AssetHolding;
  reits: { [key: string]: AssetHolding };
}

interface FixedDeposit {
  id: string;
  amount: number;
  duration: number; // months
  interestRate: number;
  startYear: number;
  startMonth: number;
  isMatured: boolean;
}

interface PortfolioBreakdown {
  cash: number;
  savings: number;
  gold: number;
  funds: number;
  stocks: number;
  crypto: number;
  commodities: number;
  reits: number;
}

interface ValidationResult {
  valid: boolean;
  serverNetworth: number;
  clientNetworth: number;
  deviation: number; // percentage
  breakdown: { [category: string]: number };
}

/**
 * Calculate networth on the server using authoritative prices
 */
export function calculateServerNetworth(
  pocketCash: number,
  savingsBalance: number,
  fixedDeposits: FixedDeposit[],
  holdings: Holdings,
  prices: PriceSnapshot,
  selectedAssets: any,
  currentYear: number,
  currentMonth: number
): { networth: number; breakdown: { [category: string]: number } } {
  let total = 0;
  const breakdown: { [category: string]: number } = {};

  // Pocket cash
  breakdown.cash = pocketCash || 0;
  total += breakdown.cash;

  // Savings
  breakdown.savings = savingsBalance || 0;
  total += breakdown.savings;

  // Fixed deposits with accrued interest
  let fdTotal = 0;
  if (fixedDeposits && Array.isArray(fixedDeposits)) {
    for (const fd of fixedDeposits) {
      const durationInYears = fd.duration / 12;
      const totalReturn = (fd.interestRate / 100) * durationInYears;

      if (fd.isMatured) {
        fdTotal += fd.amount * (1 + totalReturn);
      } else {
        let monthsElapsed =
          (currentYear - fd.startYear) * 12 + (currentMonth - fd.startMonth);
        monthsElapsed = Math.max(0, Math.min(monthsElapsed, fd.duration));
        const progress = monthsElapsed / fd.duration;
        const interestAccrued = fd.amount * totalReturn * progress;
        fdTotal += fd.amount + interestAccrued;
      }
    }
  }
  breakdown.fixedDeposits = fdTotal;
  total += fdTotal;

  // Gold
  const goldValue =
    (holdings?.physicalGold?.quantity || 0) * (prices['Physical_Gold'] || 0) +
    (holdings?.digitalGold?.quantity || 0) * (prices['Digital_Gold'] || 0);
  breakdown.gold = goldValue;
  total += goldValue;

  // Funds
  const fundPrice = selectedAssets?.fundName ? prices[selectedAssets.fundName] || 0 : 0;
  const fundsValue =
    (holdings?.indexFund?.quantity || 0) * fundPrice +
    (holdings?.mutualFund?.quantity || 0) * fundPrice;
  breakdown.funds = fundsValue;
  total += fundsValue;

  // Stocks
  let stocksValue = 0;
  if (holdings?.stocks) {
    for (const [symbol, holding] of Object.entries(holdings.stocks)) {
      if (holding && holding.quantity > 0) {
        stocksValue += holding.quantity * (prices[symbol] || 0);
      }
    }
  }
  breakdown.stocks = stocksValue;
  total += stocksValue;

  // Crypto
  const cryptoValue =
    (holdings?.crypto?.['BTC']?.quantity || 0) * (prices['BTC'] || 0) +
    (holdings?.crypto?.['ETH']?.quantity || 0) * (prices['ETH'] || 0);
  breakdown.crypto = cryptoValue;
  total += cryptoValue;

  // Commodities
  const commodityPrice = selectedAssets?.commodity
    ? prices[selectedAssets.commodity] || 0
    : 0;
  const commoditiesValue = (holdings?.commodity?.quantity || 0) * commodityPrice;
  breakdown.commodities = commoditiesValue;
  total += commoditiesValue;

  // REITs
  const reitsValue =
    (holdings?.reits?.['EMBASSY']?.quantity || 0) * (prices['EMBASSY'] || 0) +
    (holdings?.reits?.['MINDSPACE']?.quantity || 0) * (prices['MINDSPACE'] || 0);
  breakdown.reits = reitsValue;
  total += reitsValue;

  return { networth: total, breakdown };
}

/**
 * Validate client networth against server calculation
 */
export function validateNetworth(
  clientNetworth: number,
  serverNetworth: number
): ValidationResult {
  // Handle edge cases
  if (serverNetworth === 0 && clientNetworth === 0) {
    return {
      valid: true,
      serverNetworth: 0,
      clientNetworth: 0,
      deviation: 0,
      breakdown: {},
    };
  }

  // Calculate deviation percentage
  const deviation =
    serverNetworth > 0
      ? Math.abs(clientNetworth - serverNetworth) / serverNetworth * 100
      : clientNetworth > 0
      ? 100 // Server says 0 but client says non-zero
      : 0;

  return {
    valid: deviation <= TOLERANCE_PERCENT,
    serverNetworth,
    clientNetworth,
    deviation,
    breakdown: {},
  };
}

/**
 * Full validation with detailed breakdown
 */
export function fullValidation(
  clientNetworth: number,
  clientBreakdown: PortfolioBreakdown,
  pocketCash: number,
  savingsBalance: number,
  fixedDeposits: FixedDeposit[],
  holdings: Holdings,
  prices: PriceSnapshot,
  selectedAssets: any,
  currentYear: number,
  currentMonth: number
): ValidationResult {
  const { networth: serverNetworth, breakdown } = calculateServerNetworth(
    pocketCash,
    savingsBalance,
    fixedDeposits,
    holdings,
    prices,
    selectedAssets,
    currentYear,
    currentMonth
  );

  const result = validateNetworth(clientNetworth, serverNetworth);
  result.breakdown = breakdown;

  return result;
}

/**
 * Get tolerance threshold value
 */
export function getTolerancePercent(): number {
  return TOLERANCE_PERCENT;
}
