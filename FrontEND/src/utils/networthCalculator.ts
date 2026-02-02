import { GameState, AssetData } from '../types';
import { getAssetPriceAtDate } from './csvLoader';

/**
 * Type for a price lookup function
 */
export type PriceGetter = (symbol: string) => number;

/**
 * Calculate total capital invested (initial + recurring income)
 */
export function calculateTotalCapital(gameState: GameState): number {
  const initialCash = gameState.adminSettings?.initialPocketCash || 100000;
  const recurringIncome = gameState.adminSettings?.recurringIncome || 0;

  // Count how many times recurring income was added (every 6 months)
  const totalMonths = (gameState.currentYear - 1) * 12 + gameState.currentMonth;
  const recurringPayments = Math.floor(totalMonths / 6);

  return initialCash + (recurringIncome * recurringPayments);
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
export function calculateCAGR(initialValue: number, finalValue: number, years: number): number {
  if (initialValue <= 0 || years <= 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

/**
 * Calculates the current net worth of a player based on their game state and current asset prices.
 * This is the authoritative calculation used for both display and leaderboard sync.
 */
export function calculateNetworth(
  gameState: GameState,
  assetDataMap: { [key: string]: AssetData[] },
  calendarYear: number
): number {
  let currentValue = 0;

  // Add pocket cash
  currentValue += gameState.pocketCash;

  // Add savings
  currentValue += gameState.savingsAccount.balance;

  // Add FD values with accrued interest (rates are PA)
  gameState.fixedDeposits.forEach((fd) => {
    const durationInYears = fd.duration / 12;
    const totalReturn = (fd.interestRate / 100) * durationInYears;

    if (fd.isMatured) {
      currentValue += fd.amount * (1 + totalReturn);
    } else {
      // Calculate time-weighted interest for non-matured FDs
      const startYear = fd.startYear;
      const startMonth = fd.startMonth;
      const currentYear = gameState.currentYear;
      const currentMonth = gameState.currentMonth;
      let monthsElapsed = (currentYear - startYear) * 12 + (currentMonth - startMonth);
      monthsElapsed = Math.max(0, Math.min(monthsElapsed, fd.duration));
      const progress = monthsElapsed / fd.duration;
      const interestAccrued = (fd.amount * totalReturn) * progress;
      currentValue += fd.amount + interestAccrued;
    }
  });

  // Physical Gold
  if (gameState.holdings.physicalGold.quantity > 0 && assetDataMap['Physical_Gold']) {
    const price = getAssetPriceAtDate(assetDataMap['Physical_Gold'], calendarYear, gameState.currentMonth);
    currentValue += gameState.holdings.physicalGold.quantity * price;
  }

  // Digital Gold
  if (gameState.holdings.digitalGold.quantity > 0 && assetDataMap['Digital_Gold']) {
    const price = getAssetPriceAtDate(assetDataMap['Digital_Gold'], calendarYear, gameState.currentMonth);
    currentValue += gameState.holdings.digitalGold.quantity * price;
  }

  // Index Fund
  if (gameState.holdings.indexFund.quantity > 0 && gameState.selectedAssets?.fundName) {
    const fundData = assetDataMap[gameState.selectedAssets.fundName];
    if (fundData) {
      const price = getAssetPriceAtDate(fundData, calendarYear, gameState.currentMonth);
      currentValue += gameState.holdings.indexFund.quantity * price;
    }
  }

  // Mutual Fund
  if (gameState.holdings.mutualFund.quantity > 0 && gameState.selectedAssets?.fundName) {
    const fundData = assetDataMap[gameState.selectedAssets.fundName];
    if (fundData) {
      const price = getAssetPriceAtDate(fundData, calendarYear, gameState.currentMonth);
      currentValue += gameState.holdings.mutualFund.quantity * price;
    }
  }

  // Stocks
  Object.entries(gameState.holdings.stocks).forEach(([stockName, holding]) => {
    if (holding.quantity > 0 && assetDataMap[stockName]) {
      const price = getAssetPriceAtDate(assetDataMap[stockName], calendarYear, gameState.currentMonth);
      currentValue += holding.quantity * price;
    }
  });

  // Crypto
  if (gameState.holdings.crypto['BTC']?.quantity > 0 && assetDataMap['BTC']) {
    const price = getAssetPriceAtDate(assetDataMap['BTC'], calendarYear, gameState.currentMonth);
    currentValue += gameState.holdings.crypto['BTC'].quantity * price;
  }
  if (gameState.holdings.crypto['ETH']?.quantity > 0 && assetDataMap['ETH']) {
    const price = getAssetPriceAtDate(assetDataMap['ETH'], calendarYear, gameState.currentMonth);
    currentValue += gameState.holdings.crypto['ETH'].quantity * price;
  }

  // Commodity
  if (gameState.holdings.commodity.quantity > 0 && gameState.selectedAssets?.commodity) {
    const commodityData = assetDataMap[gameState.selectedAssets.commodity];
    if (commodityData) {
      const price = getAssetPriceAtDate(commodityData, calendarYear, gameState.currentMonth);
      currentValue += gameState.holdings.commodity.quantity * price;
    }
  }

  // REITs
  if (gameState.holdings.reits['EMBASSY']?.quantity > 0 && assetDataMap['EMBASSY']) {
    const price = getAssetPriceAtDate(assetDataMap['EMBASSY'], calendarYear, gameState.currentMonth);
    currentValue += gameState.holdings.reits['EMBASSY'].quantity * price;
  }
  if (gameState.holdings.reits['MINDSPACE']?.quantity > 0 && assetDataMap['MINDSPACE']) {
    const price = getAssetPriceAtDate(assetDataMap['MINDSPACE'], calendarYear, gameState.currentMonth);
    currentValue += gameState.holdings.reits['MINDSPACE'].quantity * price;
  }

  return currentValue;
}

/**
 * Calculates portfolio breakdown by asset category
 */
export function calculatePortfolioBreakdown(
  gameState: GameState,
  assetDataMap: { [key: string]: AssetData[] },
  calendarYear: number
) {
  let goldValue = 0;
  let indexFundsValue = 0;
  let mutualFundsValue = 0;
  let stocksValue = 0;
  let cryptoValue = 0;
  let commoditiesValue = 0;
  let reitsValue = 0;

  // Gold
  if (gameState.holdings.physicalGold.quantity > 0 && assetDataMap['Physical_Gold']) {
    const price = getAssetPriceAtDate(assetDataMap['Physical_Gold'], calendarYear, gameState.currentMonth);
    goldValue += gameState.holdings.physicalGold.quantity * price;
  }
  if (gameState.holdings.digitalGold.quantity > 0 && assetDataMap['Digital_Gold']) {
    const price = getAssetPriceAtDate(assetDataMap['Digital_Gold'], calendarYear, gameState.currentMonth);
    goldValue += gameState.holdings.digitalGold.quantity * price;
  }

  // Index Funds (separate from Mutual Funds)
  if (typeof gameState.holdings.indexFund === 'object') {
    if ('quantity' in gameState.holdings.indexFund && gameState.holdings.indexFund.quantity > 0 && gameState.selectedAssets?.fundName) {
      const fundData = assetDataMap[gameState.selectedAssets.fundName];
      if (fundData) {
        const price = getAssetPriceAtDate(fundData, calendarYear, gameState.currentMonth);
        indexFundsValue += gameState.holdings.indexFund.quantity * price;
      }
    } else {
      Object.entries(gameState.holdings.indexFund).forEach(([fundName, holding]: [string, any]) => {
        if (holding.quantity > 0 && assetDataMap[fundName]) {
          const price = getAssetPriceAtDate(assetDataMap[fundName], calendarYear, gameState.currentMonth);
          indexFundsValue += holding.quantity * price;
        }
      });
    }
  }

  // Mutual Funds (separate from Index Funds)
  if (typeof gameState.holdings.mutualFund === 'object') {
    if ('quantity' in gameState.holdings.mutualFund && gameState.holdings.mutualFund.quantity > 0 && gameState.selectedAssets?.fundName) {
      const fundData = assetDataMap[gameState.selectedAssets.fundName];
      if (fundData) {
        const price = getAssetPriceAtDate(fundData, calendarYear, gameState.currentMonth);
        mutualFundsValue += gameState.holdings.mutualFund.quantity * price;
      }
    } else {
      Object.entries(gameState.holdings.mutualFund).forEach(([fundName, holding]: [string, any]) => {
        if (holding.quantity > 0 && assetDataMap[fundName]) {
          const price = getAssetPriceAtDate(assetDataMap[fundName], calendarYear, gameState.currentMonth);
          mutualFundsValue += holding.quantity * price;
        }
      });
    }
  }

  // Stocks
  Object.entries(gameState.holdings.stocks).forEach(([stockName, holding]) => {
    if (holding.quantity > 0 && assetDataMap[stockName]) {
      const price = getAssetPriceAtDate(assetDataMap[stockName], calendarYear, gameState.currentMonth);
      stocksValue += holding.quantity * price;
    }
  });

  // Crypto
  if (gameState.holdings.crypto['BTC']?.quantity > 0 && assetDataMap['BTC']) {
    const price = getAssetPriceAtDate(assetDataMap['BTC'], calendarYear, gameState.currentMonth);
    cryptoValue += gameState.holdings.crypto['BTC'].quantity * price;
  }
  if (gameState.holdings.crypto['ETH']?.quantity > 0 && assetDataMap['ETH']) {
    const price = getAssetPriceAtDate(assetDataMap['ETH'], calendarYear, gameState.currentMonth);
    cryptoValue += gameState.holdings.crypto['ETH'].quantity * price;
  }

  // Commodity
  if (gameState.holdings.commodity.quantity > 0 && gameState.selectedAssets?.commodity) {
    const commodityData = assetDataMap[gameState.selectedAssets.commodity];
    if (commodityData) {
      const price = getAssetPriceAtDate(commodityData, calendarYear, gameState.currentMonth);
      commoditiesValue += gameState.holdings.commodity.quantity * price;
    }
  }

  // REITs
  if (gameState.holdings.reits['EMBASSY']?.quantity > 0 && assetDataMap['EMBASSY']) {
    const price = getAssetPriceAtDate(assetDataMap['EMBASSY'], calendarYear, gameState.currentMonth);
    reitsValue += gameState.holdings.reits['EMBASSY'].quantity * price;
  }
  if (gameState.holdings.reits['MINDSPACE']?.quantity > 0 && assetDataMap['MINDSPACE']) {
    const price = getAssetPriceAtDate(assetDataMap['MINDSPACE'], calendarYear, gameState.currentMonth);
    reitsValue += gameState.holdings.reits['MINDSPACE'].quantity * price;
  }

  // Calculate FD value with accrued interest (rates are PA)
  let fdValue = 0;
  gameState.fixedDeposits.forEach((fd) => {
    const durationInYears = fd.duration / 12;
    const totalReturn = (fd.interestRate / 100) * durationInYears;

    if (fd.isMatured) {
      fdValue += fd.amount * (1 + totalReturn);
    } else {
      const startYear = fd.startYear;
      const startMonth = fd.startMonth;
      const currentYear = gameState.currentYear;
      const currentMonth = gameState.currentMonth;
      let monthsElapsed = (currentYear - startYear) * 12 + (currentMonth - startMonth);
      monthsElapsed = Math.max(0, Math.min(monthsElapsed, fd.duration));
      const progress = monthsElapsed / fd.duration;
      const interestAccrued = (fd.amount * totalReturn) * progress;
      fdValue += fd.amount + interestAccrued;
    }
  });

  return {
    cash: gameState.pocketCash,
    savings: gameState.savingsAccount.balance,
    fixedDeposits: fdValue,
    gold: goldValue,
    indexFunds: indexFundsValue,
    mutualFunds: mutualFundsValue,
    stocks: stocksValue,
    crypto: cryptoValue,
    commodities: commoditiesValue,
    reits: reitsValue,
  };
}

/**
 * Calculates networth using a price getter function (for API-based prices)
 */
export function calculateNetworthWithPrices(
  gameState: GameState,
  getPrice: PriceGetter
): number {
  let currentValue = 0;

  // Add pocket cash
  currentValue += gameState.pocketCash;

  // Add savings
  currentValue += gameState.savingsAccount.balance;

  // Add FD values with accrued interest (rates are PA)
  gameState.fixedDeposits.forEach((fd) => {
    const durationInYears = fd.duration / 12;
    const totalReturn = (fd.interestRate / 100) * durationInYears;

    if (fd.isMatured) {
      currentValue += fd.amount * (1 + totalReturn);
    } else {
      const startYear = fd.startYear;
      const startMonth = fd.startMonth;
      const currentYear = gameState.currentYear;
      const currentMonth = gameState.currentMonth;
      let monthsElapsed = (currentYear - startYear) * 12 + (currentMonth - startMonth);
      monthsElapsed = Math.max(0, Math.min(monthsElapsed, fd.duration));
      const progress = monthsElapsed / fd.duration;
      const interestAccrued = (fd.amount * totalReturn) * progress;
      currentValue += fd.amount + interestAccrued;
    }
  });

  // Physical Gold
  if (gameState.holdings.physicalGold.quantity > 0) {
    const price = getPrice('Physical_Gold');
    currentValue += gameState.holdings.physicalGold.quantity * price;
  }

  // Digital Gold
  if (gameState.holdings.digitalGold.quantity > 0) {
    const price = getPrice('Digital_Gold');
    currentValue += gameState.holdings.digitalGold.quantity * price;
  }

  // Index Fund
  if (gameState.holdings.indexFund.quantity > 0 && gameState.selectedAssets?.fundName) {
    const price = getPrice(gameState.selectedAssets.fundName);
    currentValue += gameState.holdings.indexFund.quantity * price;
  }

  // Mutual Fund
  if (gameState.holdings.mutualFund.quantity > 0 && gameState.selectedAssets?.fundName) {
    const price = getPrice(gameState.selectedAssets.fundName);
    currentValue += gameState.holdings.mutualFund.quantity * price;
  }

  // Stocks
  Object.entries(gameState.holdings.stocks).forEach(([stockName, holding]) => {
    if (holding.quantity > 0) {
      const price = getPrice(stockName);
      currentValue += holding.quantity * price;
    }
  });

  // Crypto
  if (gameState.holdings.crypto['BTC']?.quantity > 0) {
    const price = getPrice('BTC');
    currentValue += gameState.holdings.crypto['BTC'].quantity * price;
  }
  if (gameState.holdings.crypto['ETH']?.quantity > 0) {
    const price = getPrice('ETH');
    currentValue += gameState.holdings.crypto['ETH'].quantity * price;
  }

  // Commodity
  if (gameState.holdings.commodity.quantity > 0 && gameState.selectedAssets?.commodity) {
    const price = getPrice(gameState.selectedAssets.commodity);
    currentValue += gameState.holdings.commodity.quantity * price;
  }

  // REITs
  if (gameState.holdings.reits['EMBASSY']?.quantity > 0) {
    const price = getPrice('EMBASSY');
    currentValue += gameState.holdings.reits['EMBASSY'].quantity * price;
  }
  if (gameState.holdings.reits['MINDSPACE']?.quantity > 0) {
    const price = getPrice('MINDSPACE');
    currentValue += gameState.holdings.reits['MINDSPACE'].quantity * price;
  }

  return currentValue;
}

/**
 * Calculates portfolio breakdown using a price getter function (for API-based prices)
 */
export function calculatePortfolioBreakdownWithPrices(
  gameState: GameState,
  getPrice: PriceGetter
) {
  let goldValue = 0;
  let indexFundsValue = 0;
  let mutualFundsValue = 0;
  let stocksValue = 0;
  let cryptoValue = 0;
  let commoditiesValue = 0;
  let reitsValue = 0;

  // Gold
  if (gameState.holdings.physicalGold.quantity > 0) {
    const price = getPrice('Physical_Gold');
    goldValue += gameState.holdings.physicalGold.quantity * price;
  }
  if (gameState.holdings.digitalGold.quantity > 0) {
    const price = getPrice('Digital_Gold');
    goldValue += gameState.holdings.digitalGold.quantity * price;
  }

  // Index Funds (separate from Mutual Funds)
  if (typeof gameState.holdings.indexFund === 'object') {
    // Handle both old structure (single object) and new structure (dictionary)
    if ('quantity' in gameState.holdings.indexFund && gameState.holdings.indexFund.quantity > 0 && gameState.selectedAssets?.fundName) {
      const price = getPrice(gameState.selectedAssets.fundName);
      const value = gameState.holdings.indexFund.quantity * price;
      console.log('📊 Index Fund (single):', {
        fundName: gameState.selectedAssets.fundName,
        quantity: gameState.holdings.indexFund.quantity,
        price,
        value
      });
      indexFundsValue += value;
    } else {
      // Dictionary structure
      Object.entries(gameState.holdings.indexFund).forEach(([fundName, holding]: [string, any]) => {
        if (holding.quantity > 0) {
          const price = getPrice(fundName);
          const value = holding.quantity * price;
          console.log('📊 Index Fund (dict):', {
            fundName,
            quantity: holding.quantity,
            price,
            value
          });
          indexFundsValue += value;
        }
      });
    }
  }

  // Mutual Funds (separate from Index Funds)
  if (typeof gameState.holdings.mutualFund === 'object') {
    // Handle both old structure (single object) and new structure (dictionary)
    if ('quantity' in gameState.holdings.mutualFund && gameState.holdings.mutualFund.quantity > 0 && gameState.selectedAssets?.fundName) {
      const price = getPrice(gameState.selectedAssets.fundName);
      const value = gameState.holdings.mutualFund.quantity * price;
      console.log('📊 Mutual Fund (single):', {
        fundName: gameState.selectedAssets.fundName,
        quantity: gameState.holdings.mutualFund.quantity,
        price,
        value
      });
      mutualFundsValue += value;
    } else {
      // Dictionary structure
      Object.entries(gameState.holdings.mutualFund).forEach(([fundName, holding]: [string, any]) => {
        if (holding.quantity > 0) {
          const price = getPrice(fundName);
          const value = holding.quantity * price;
          console.log('📊 Mutual Fund (dict):', {
            fundName,
            quantity: holding.quantity,
            price,
            value
          });
          mutualFundsValue += value;
        }
      });
    }
  }

  // Stocks
  Object.entries(gameState.holdings.stocks).forEach(([stockName, holding]) => {
    if (holding.quantity > 0) {
      const price = getPrice(stockName);
      stocksValue += holding.quantity * price;
    }
  });

  // Crypto
  if (gameState.holdings.crypto['BTC']?.quantity > 0) {
    const price = getPrice('BTC');
    cryptoValue += gameState.holdings.crypto['BTC'].quantity * price;
  }
  if (gameState.holdings.crypto['ETH']?.quantity > 0) {
    const price = getPrice('ETH');
    cryptoValue += gameState.holdings.crypto['ETH'].quantity * price;
  }

  // Commodity
  if (gameState.holdings.commodity.quantity > 0 && gameState.selectedAssets?.commodity) {
    const price = getPrice(gameState.selectedAssets.commodity);
    commoditiesValue += gameState.holdings.commodity.quantity * price;
  }

  // REITs
  if (gameState.holdings.reits['EMBASSY']?.quantity > 0) {
    const price = getPrice('EMBASSY');
    reitsValue += gameState.holdings.reits['EMBASSY'].quantity * price;
  }
  if (gameState.holdings.reits['MINDSPACE']?.quantity > 0) {
    const price = getPrice('MINDSPACE');
    reitsValue += gameState.holdings.reits['MINDSPACE'].quantity * price;
  }

  // Calculate FD value with accrued interest (rates are PA)
  let fdValue = 0;
  gameState.fixedDeposits.forEach((fd) => {
    const durationInYears = fd.duration / 12;
    const totalReturn = (fd.interestRate / 100) * durationInYears;

    if (fd.isMatured) {
      fdValue += fd.amount * (1 + totalReturn);
    } else {
      const startYear = fd.startYear;
      const startMonth = fd.startMonth;
      const currentYear = gameState.currentYear;
      const currentMonth = gameState.currentMonth;
      let monthsElapsed = (currentYear - startYear) * 12 + (currentMonth - startMonth);
      monthsElapsed = Math.max(0, Math.min(monthsElapsed, fd.duration));
      const progress = monthsElapsed / fd.duration;
      const interestAccrued = (fd.amount * totalReturn) * progress;
      fdValue += fd.amount + interestAccrued;
    }
  });


  const breakdown = {
    cash: gameState.pocketCash,
    savings: gameState.savingsAccount.balance,
    fixedDeposits: fdValue,
    gold: goldValue,
    indexFunds: indexFundsValue,
    mutualFunds: mutualFundsValue,
    stocks: stocksValue,
    crypto: cryptoValue,
    commodities: commoditiesValue,
    reits: reitsValue,
  };

  // Validate breakdown sums correctly
  const breakdownTotal = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const networth = calculateNetworthWithPrices(gameState, getPrice);
  const discrepancy = Math.abs(breakdownTotal - networth);

  if (discrepancy > networth * 0.01) { // More than 1% error
    console.error('❌ PORTFOLIO BREAKDOWN MISMATCH:', {
      networth,
      breakdownTotal,
      discrepancy,
      discrepancyPercent: ((discrepancy / networth) * 100).toFixed(2) + '%',
      breakdown,
      note: 'Breakdown values do not sum to networth!'
    });
  }

  return breakdown;
}
