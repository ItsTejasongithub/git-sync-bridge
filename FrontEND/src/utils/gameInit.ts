import { AdminSettings } from "../types";
import { FINANCIAL_QUOTES } from "../utils/constants";
import { generateAssetUnlockSchedule, extractSelectedAssetsFromSchedule } from "../utils/assetUnlockCalculator";
import { generateQuestionIndices } from "../utils/assetEducation";

export function generateInitialGameData(adminSettings: AdminSettings) {
  // Generate unlock schedule first
  const assetUnlockSchedule = generateAssetUnlockSchedule(
    adminSettings.selectedCategories,
    adminSettings.gameStartYear
  );

  // Extract selected assets from the schedule (ensures consistency)
  const assetsFromSchedule = extractSelectedAssetsFromSchedule(assetUnlockSchedule);

  // Determine fund type from fund name
  const fundType: 'index' | 'mutual' = assetsFromSchedule.fundName.includes('NIFTY') ||
                                       assetsFromSchedule.fundName.includes('ETF') ||
                                       assetsFromSchedule.fundName === 'NIFTYBEES' ||
                                       assetsFromSchedule.fundName === 'SETFNIF50' ||
                                       assetsFromSchedule.fundName === 'UTINIFTETF' ||
                                       assetsFromSchedule.fundName === 'HDFCNIFETF' ||
                                       assetsFromSchedule.fundName === 'ICICIB22'
                                       ? 'index' : 'mutual';

  const selectedAssets = {
    stocks: assetsFromSchedule.stocks,
    fundType,
    fundName: assetsFromSchedule.fundName,
    indexFunds: assetsFromSchedule.indexFunds,
    mutualFunds: assetsFromSchedule.mutualFunds,
    commodity: assetsFromSchedule.commodity,
    reit: assetsFromSchedule.reit,
  };

  const yearlyQuotes = [...FINANCIAL_QUOTES].sort(() => Math.random() - 0.5);

  // Generate random question indices for quiz (one per category, consistent for all players)
  const quizQuestionIndices = generateQuestionIndices();

  return {
    selectedAssets,
    assetUnlockSchedule,
    yearlyQuotes,
    quizQuestionIndices,
  };
}
