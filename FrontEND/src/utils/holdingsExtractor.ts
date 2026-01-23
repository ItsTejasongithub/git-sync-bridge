import { GameState, AssetData } from '../types';
import { getAssetPriceAtDate } from './csvLoader';
import type { PriceGetter } from './networthCalculator';

export interface HoldingData {
  assetCategory: string;
  assetName: string;
  quantity: number;
  avgPrice: number;
  totalInvested: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPL: number;
  gameYear: number;
  gameMonth: number;
}

/**
 * Extract all holdings from game state with current prices for accurate P&L tracking
 * This ensures every penny is accounted for in the database
 */
export function extractHoldingsData(
  gameState: GameState,
  assetDataMap: { [key: string]: AssetData[] },
  calendarYear: number
): HoldingData[] {
  const holdings: HoldingData[] = [];
  const { currentYear: gameYear, currentMonth: gameMonth } = gameState;

  // Physical Gold
  if (gameState.holdings.physicalGold.quantity > 0 && assetDataMap['Physical_Gold']) {
    const currentPrice = getAssetPriceAtDate(assetDataMap['Physical_Gold'], calendarYear, gameMonth);
    const holding = gameState.holdings.physicalGold;
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'gold',
      assetName: 'Physical_Gold',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Digital Gold
  if (gameState.holdings.digitalGold.quantity > 0 && assetDataMap['Digital_Gold']) {
    const currentPrice = getAssetPriceAtDate(assetDataMap['Digital_Gold'], calendarYear, gameMonth);
    const holding = gameState.holdings.digitalGold;
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'gold',
      assetName: 'Digital_Gold',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Index Fund
  if (gameState.holdings.indexFund.quantity > 0 && gameState.selectedAssets?.fundName) {
    const fundData = assetDataMap[gameState.selectedAssets.fundName];
    if (fundData) {
      const currentPrice = getAssetPriceAtDate(fundData, calendarYear, gameMonth);
      const holding = gameState.holdings.indexFund;
      const currentValue = holding.quantity * currentPrice;
      const unrealizedPL = currentValue - holding.totalInvested;

      holdings.push({
        assetCategory: 'funds',
        assetName: gameState.selectedAssets.fundName,
        quantity: holding.quantity,
        avgPrice: holding.avgPrice,
        totalInvested: holding.totalInvested,
        currentPrice,
        currentValue,
        unrealizedPL,
        gameYear,
        gameMonth,
      });
    }
  }

  // Mutual Fund
  if (gameState.holdings.mutualFund.quantity > 0 && gameState.selectedAssets?.fundName) {
    const fundData = assetDataMap[gameState.selectedAssets.fundName];
    if (fundData) {
      const currentPrice = getAssetPriceAtDate(fundData, calendarYear, gameMonth);
      const holding = gameState.holdings.mutualFund;
      const currentValue = holding.quantity * currentPrice;
      const unrealizedPL = currentValue - holding.totalInvested;

      holdings.push({
        assetCategory: 'funds',
        assetName: `${gameState.selectedAssets.fundName}_MUTUAL`,
        quantity: holding.quantity,
        avgPrice: holding.avgPrice,
        totalInvested: holding.totalInvested,
        currentPrice,
        currentValue,
        unrealizedPL,
        gameYear,
        gameMonth,
      });
    }
  }

  // Stocks
  Object.entries(gameState.holdings.stocks).forEach(([stockName, holding]) => {
    if (holding.quantity > 0 && assetDataMap[stockName]) {
      const currentPrice = getAssetPriceAtDate(assetDataMap[stockName], calendarYear, gameMonth);
      const currentValue = holding.quantity * currentPrice;
      const unrealizedPL = currentValue - holding.totalInvested;

      holdings.push({
        assetCategory: 'stocks',
        assetName: stockName,
        quantity: holding.quantity,
        avgPrice: holding.avgPrice,
        totalInvested: holding.totalInvested,
        currentPrice,
        currentValue,
        unrealizedPL,
        gameYear,
        gameMonth,
      });
    }
  });

  // Crypto - BTC
  if (gameState.holdings.crypto['BTC']?.quantity > 0 && assetDataMap['BTC']) {
    const currentPrice = getAssetPriceAtDate(assetDataMap['BTC'], calendarYear, gameMonth);
    const holding = gameState.holdings.crypto['BTC'];
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'crypto',
      assetName: 'BTC',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Crypto - ETH
  if (gameState.holdings.crypto['ETH']?.quantity > 0 && assetDataMap['ETH']) {
    const currentPrice = getAssetPriceAtDate(assetDataMap['ETH'], calendarYear, gameMonth);
    const holding = gameState.holdings.crypto['ETH'];
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'crypto',
      assetName: 'ETH',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Commodity
  if (gameState.holdings.commodity.quantity > 0 && gameState.selectedAssets?.commodity) {
    const commodityData = assetDataMap[gameState.selectedAssets.commodity];
    if (commodityData) {
      const currentPrice = getAssetPriceAtDate(commodityData, calendarYear, gameMonth);
      const holding = gameState.holdings.commodity;
      const currentValue = holding.quantity * currentPrice;
      const unrealizedPL = currentValue - holding.totalInvested;

      holdings.push({
        assetCategory: 'commodities',
        assetName: gameState.selectedAssets.commodity,
        quantity: holding.quantity,
        avgPrice: holding.avgPrice,
        totalInvested: holding.totalInvested,
        currentPrice,
        currentValue,
        unrealizedPL,
        gameYear,
        gameMonth,
      });
    }
  }

  // REITs - EMBASSY
  if (gameState.holdings.reits['EMBASSY']?.quantity > 0 && assetDataMap['EMBASSY']) {
    const currentPrice = getAssetPriceAtDate(assetDataMap['EMBASSY'], calendarYear, gameMonth);
    const holding = gameState.holdings.reits['EMBASSY'];
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'reits',
      assetName: 'EMBASSY',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // REITs - MINDSPACE
  if (gameState.holdings.reits['MINDSPACE']?.quantity > 0 && assetDataMap['MINDSPACE']) {
    const currentPrice = getAssetPriceAtDate(assetDataMap['MINDSPACE'], calendarYear, gameMonth);
    const holding = gameState.holdings.reits['MINDSPACE'];
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'reits',
      assetName: 'MINDSPACE',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Log summary
  const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalUnrealizedPL = holdings.reduce((sum, h) => sum + h.unrealizedPL, 0);

  console.log('💼 Holdings extracted:', {
    count: holdings.length,
    totalInvested: `₹${totalInvested.toLocaleString('en-IN')}`,
    totalValue: `₹${totalValue.toLocaleString('en-IN')}`,
    unrealizedPL: `₹${totalUnrealizedPL.toLocaleString('en-IN')}`,
    plPercentage: totalInvested > 0 ? `${((totalUnrealizedPL / totalInvested) * 100).toFixed(2)}%` : '0%',
  });

  return holdings;
}

/**
 * Calculate total unrealized P&L from holdings
 */
export function calculateTotalUnrealizedPL(holdings: HoldingData[]): number {
  return holdings.reduce((sum, h) => sum + h.unrealizedPL, 0);
}

/**
 * Get holdings summary by category
 */
export function getHoldingsSummaryByCategory(holdings: HoldingData[]): {
  [category: string]: {
    totalInvested: number;
    currentValue: number;
    unrealizedPL: number;
    count: number;
  };
} {
  const summary: {
    [category: string]: {
      totalInvested: number;
      currentValue: number;
      unrealizedPL: number;
      count: number;
    };
  } = {};

  holdings.forEach(holding => {
    if (!summary[holding.assetCategory]) {
      summary[holding.assetCategory] = {
        totalInvested: 0,
        currentValue: 0,
        unrealizedPL: 0,
        count: 0,
      };
    }

    summary[holding.assetCategory].totalInvested += holding.totalInvested;
    summary[holding.assetCategory].currentValue += holding.currentValue;
    summary[holding.assetCategory].unrealizedPL += holding.unrealizedPL;
    summary[holding.assetCategory].count += 1;
  });

  return summary;
}

/**
 * Extract all holdings from game state with current prices using a price getter function
 * This is the API-based version that doesn't require assetDataMap
 */
export function extractHoldingsDataWithPrices(
  gameState: GameState,
  getPrice: PriceGetter
): HoldingData[] {
  const holdings: HoldingData[] = [];
  const { currentYear: gameYear, currentMonth: gameMonth } = gameState;

  // Physical Gold
  if (gameState.holdings.physicalGold.quantity > 0) {
    const currentPrice = getPrice('Physical_Gold');
    const holding = gameState.holdings.physicalGold;
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'gold',
      assetName: 'Physical_Gold',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Digital Gold
  if (gameState.holdings.digitalGold.quantity > 0) {
    const currentPrice = getPrice('Digital_Gold');
    const holding = gameState.holdings.digitalGold;
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'gold',
      assetName: 'Digital_Gold',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Index Fund
  if (gameState.holdings.indexFund.quantity > 0 && gameState.selectedAssets?.fundName) {
    const currentPrice = getPrice(gameState.selectedAssets.fundName);
    const holding = gameState.holdings.indexFund;
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'funds',
      assetName: gameState.selectedAssets.fundName,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Mutual Fund
  if (gameState.holdings.mutualFund.quantity > 0 && gameState.selectedAssets?.fundName) {
    const currentPrice = getPrice(gameState.selectedAssets.fundName);
    const holding = gameState.holdings.mutualFund;
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'funds',
      assetName: gameState.selectedAssets.fundName,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Stocks
  Object.entries(gameState.holdings.stocks).forEach(([stockName, holding]) => {
    if (holding.quantity > 0) {
      const currentPrice = getPrice(stockName);
      const currentValue = holding.quantity * currentPrice;
      const unrealizedPL = currentValue - holding.totalInvested;

      holdings.push({
        assetCategory: 'stocks',
        assetName: stockName,
        quantity: holding.quantity,
        avgPrice: holding.avgPrice,
        totalInvested: holding.totalInvested,
        currentPrice,
        currentValue,
        unrealizedPL,
        gameYear,
        gameMonth,
      });
    }
  });

  // Crypto - BTC
  if (gameState.holdings.crypto['BTC']?.quantity > 0) {
    const currentPrice = getPrice('BTC');
    const holding = gameState.holdings.crypto['BTC'];
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'crypto',
      assetName: 'BTC',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Crypto - ETH
  if (gameState.holdings.crypto['ETH']?.quantity > 0) {
    const currentPrice = getPrice('ETH');
    const holding = gameState.holdings.crypto['ETH'];
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'crypto',
      assetName: 'ETH',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // Commodity
  if (gameState.holdings.commodity.quantity > 0 && gameState.selectedAssets?.commodity) {
    const currentPrice = getPrice(gameState.selectedAssets.commodity);
    const holding = gameState.holdings.commodity;
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'commodities',
      assetName: gameState.selectedAssets.commodity,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // REITs - EMBASSY
  if (gameState.holdings.reits['EMBASSY']?.quantity > 0) {
    const currentPrice = getPrice('EMBASSY');
    const holding = gameState.holdings.reits['EMBASSY'];
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'reits',
      assetName: 'EMBASSY',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  // REITs - MINDSPACE
  if (gameState.holdings.reits['MINDSPACE']?.quantity > 0) {
    const currentPrice = getPrice('MINDSPACE');
    const holding = gameState.holdings.reits['MINDSPACE'];
    const currentValue = holding.quantity * currentPrice;
    const unrealizedPL = currentValue - holding.totalInvested;

    holdings.push({
      assetCategory: 'reits',
      assetName: 'MINDSPACE',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      totalInvested: holding.totalInvested,
      currentPrice,
      currentValue,
      unrealizedPL,
      gameYear,
      gameMonth,
    });
  }

  return holdings;
}
