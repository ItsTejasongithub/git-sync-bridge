import { GameState, AssetData } from '../types';
import { getAssetPriceAtDate } from './csvLoader';

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

  // Add FD values
  gameState.fixedDeposits.forEach((fd) => {
    const fdValue = fd.isMatured
      ? fd.amount * (1 + fd.interestRate / 100)
      : fd.amount;
    currentValue += fdValue;
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
  if (gameState.holdings.commodity.quantity > 0 && gameState.selectedAssets?.commodityName) {
    const commodityData = assetDataMap[gameState.selectedAssets.commodityName];
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
  let fundsValue = 0;
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

  // Funds
  if (gameState.holdings.indexFund.quantity > 0 && gameState.selectedAssets?.fundName) {
    const fundData = assetDataMap[gameState.selectedAssets.fundName];
    if (fundData) {
      const price = getAssetPriceAtDate(fundData, calendarYear, gameState.currentMonth);
      fundsValue += gameState.holdings.indexFund.quantity * price;
    }
  }
  if (gameState.holdings.mutualFund.quantity > 0 && gameState.selectedAssets?.fundName) {
    const fundData = assetDataMap[gameState.selectedAssets.fundName];
    if (fundData) {
      const price = getAssetPriceAtDate(fundData, calendarYear, gameState.currentMonth);
      fundsValue += gameState.holdings.mutualFund.quantity * price;
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
  if (gameState.holdings.commodity.quantity > 0 && gameState.selectedAssets?.commodityName) {
    const commodityData = assetDataMap[gameState.selectedAssets.commodityName];
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

  return {
    cash: gameState.pocketCash,
    savings: gameState.savingsAccount.balance,
    gold: goldValue,
    funds: fundsValue,
    stocks: stocksValue,
    crypto: cryptoValue,
    commodities: commoditiesValue,
    reits: reitsValue,
  };
}
