import { AdminSettings } from "../types";
import {
  getRandomItems,
  getRandomItem,
  FINANCIAL_QUOTES,
  AVAILABLE_STOCKS,
  AVAILABLE_INDEX_FUNDS,
  AVAILABLE_MUTUAL_FUNDS,
  AVAILABLE_COMMODITIES,
} from "../utils/constants";
import { generateAssetUnlockSchedule } from "../utils/assetUnlockCalculator";

export function generateInitialGameData(adminSettings: AdminSettings) {
  const selectedStocks = getRandomItems(AVAILABLE_STOCKS, 2, 5);

  // Best to reuse logic from useGameState - keep the same random choices
  const fundType: 'index' | 'mutual' = Math.random() > 0.5 ? 'index' : 'mutual';
  const fundName = fundType === 'index' ? getRandomItem(AVAILABLE_INDEX_FUNDS) : getRandomItem(AVAILABLE_MUTUAL_FUNDS);
  const selectedCommodity = getRandomItem(AVAILABLE_COMMODITIES);

  const selectedAssets = {
    stocks: selectedStocks,
    fundType,
    fundName,
    commodity: selectedCommodity,
  };

  const assetUnlockSchedule = generateAssetUnlockSchedule(
    adminSettings.selectedCategories,
    adminSettings.gameStartYear
  );

  const yearlyQuotes = [...FINANCIAL_QUOTES].sort(() => Math.random() - 0.5);

  return {
    selectedAssets,
    assetUnlockSchedule,
    yearlyQuotes,
  };
}
