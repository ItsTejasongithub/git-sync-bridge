import React, { useState, useEffect, useMemo } from 'react';
import { GameState } from '../types';
import { SavingsAccountCard } from './SavingsAccountCard';
import { FixedDepositCard } from './FixedDepositCard';
import { TradeableAssetCard } from './TradeableAssetCard';
import { AssetEducationModal } from './AssetEducationModal';
import { MultiplayerLeaderboardSidebar } from './MultiplayerLeaderboardSidebar';
import GameEndScreen from './GameEndScreen';
import { LifeEventPopup } from './LifeEventPopup';
import { usePrices } from '../hooks/usePrices';
import { fetchFDRates } from '../services/priceApi';
import { socketService } from '../services/socketService';
import { TOTAL_GAME_YEARS, CALENDAR_YEAR_TRIGGERS, formatIndianNumber, COMMODITY_UNITS } from '../utils/constants';
import { ASSET_TIMELINE_DATA } from '../utils/assetUnlockCalculator';
import { getEducationContent } from '../utils/assetEducation';
import { calculateTotalCapital, calculateCAGR } from '../utils/networthCalculator';
import { TotalReceivedBreakdown } from './TotalReceivedBreakdown';
import './GameScreen.css';

interface GameScreenProps {
  gameState: GameState;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onCreateFD: (amount: number, duration: 12 | 24 | 36, rate: number) => void;
  onCollectFD: (fdId: string) => void;
  onBreakFD: (fdId: string) => void;
  onBuyAsset: (assetType: string, assetName: string, quantity: number, price: number) => void;
  onSellAsset: (assetType: string, assetName: string, quantity: number, price: number) => void;
  onTogglePause: () => void;
  onMarkQuizCompleted: (category: string) => void;
  onQuizStarted?: (category: string) => void; // Optional for multiplayer
  onNetworthCalculated?: (networth: number, breakdown: any) => void; // Callback when networth is calculated
  showLeaderboard?: boolean; // Show leaderboard in multiplayer mode
  showPauseButton?: boolean; // Control visibility of pause button (host/admin only)
  onReturnToMenu?: () => void; // Return to main menu from end screen
  leaderboardData?: Array<{ playerId: string; playerName: string; networth: number; portfolioBreakdown?: any; }>;
  isTransacting?: boolean; // When true, disable buy/sell UI to avoid duplicate transactions
  playerName?: string; // Player name for logging
  playerAge?: number; // Player age for logging
  roomId?: string; // Room ID for multiplayer logging
  lifeEventPopup?: any; // Active life event to display
  clearLifeEventPopup?: () => void;
  onFinalNetworthSync?: (networth: number, portfolioBreakdown: any) => void; // Final networth sync for multiplayer
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  onDeposit,
  onWithdraw,
  onCreateFD,
  onCollectFD,
  onBreakFD,
  onBuyAsset,
  onSellAsset,
  onTogglePause,
  onMarkQuizCompleted,
  onQuizStarted,
  onNetworthCalculated,
  showLeaderboard = false,
  showPauseButton = true,
  onReturnToMenu,
  leaderboardData,
  isTransacting = false,
  playerName,
  playerAge,
  roomId,
  lifeEventPopup,
  clearLifeEventPopup,
  onFinalNetworthSync
}) => {
  // Helper function to format numbers with commas (Indian numbering system)
  // Always returns whole numbers (no decimals) for kid-friendly UI
  const formatCurrency = (amount: number): string => {
    return formatIndianNumber(amount);
  };

  // FD rates storage
  const [fdRates, setFdRates] = useState<{ [year: number]: { 12: number; 24: number; 36: number } }>({});

  // Education modal state
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [currentQuizCategory, setCurrentQuizCategory] = useState<string | null>(null);
  const [quizEnabled, setQuizEnabled] = useState(true); // Track if quiz should be shown

  // Net worth tooltip uses same wrapper/hover behavior as pocket tooltip
  // (No manual positioning required)

  const currentYear = gameState.currentYear;
  const selectedAssets = gameState.selectedAssets;
  const adminSettings = gameState.adminSettings;

  // Calculate calendar year if admin settings are present
  const calendarYear = adminSettings
    ? adminSettings.gameStartYear + currentYear - 1
    : 2005 + currentYear - 1;

  // Use server prices in multiplayer mode when available
  const { getPrice, getPriceHistory } = usePrices({
    selectedAssets,
    calendarYear,
    currentMonth: gameState.currentMonth,
    isMultiplayer: showLeaderboard,
  });

  // Request key exchange when joining a multiplayer game
  useEffect(() => {
    if (showLeaderboard && !socketService.isUsingServerPrices()) {
      // SECURITY: Key exchange is MANDATORY for multiplayer
      socketService.requestKeyExchange().then((result) => {
        if (result.success) {
        } else {
          // FAIL HARD - encryption is required for multiplayer
          console.error('❌ CRITICAL SECURITY ERROR: Key exchange failed');
          console.error('   Encrypted prices are unavailable. This is a fatal error in multiplayer mode.');
          console.error('   Ensure PostgreSQL is running and market data is initialized on the server.');

          // Block game execution
          alert(
            'SECURITY ERROR: Unable to establish encrypted connection.\n\n' +
            'Multiplayer mode requires encrypted price data from the server.\n\n' +
            'This game cannot continue. Please contact the game host.\n\n' +
            'Technical details:\n' +
            '- Key exchange failed\n' +
            '- PostgreSQL may not be running\n' +
            '- Market data may not be initialized'
          );

          // Return to menu if possible
          if (onReturnToMenu) {
            setTimeout(() => onReturnToMenu(), 1000);
          }
        }
      }).catch((err) => {
        console.error('❌ Key exchange error:', err);
        alert('Failed to establish secure connection. Returning to menu.');
        if (onReturnToMenu) {
          setTimeout(() => onReturnToMenu(), 1000);
        }
      });
    }
  }, [showLeaderboard]);

  // Load FD rates from API
  useEffect(() => {
    const loadFDRates = async () => {
      try {
        const rates = await fetchFDRates();
        setFdRates(rates);
      } catch (error) {
        console.error('Error loading FD rates:', error);
      }
    };

    loadFDRates();
  }, []);

  // Check if asset category is unlocked based on the assetUnlockSchedule
  // This ensures both solo and multiplayer modes use the same unlock logic
  const isAssetCategoryUnlocked = (checkName: string): boolean => {
    // PRIORITY 1: Use assetUnlockSchedule if available (new system)
    if (gameState.assetUnlockSchedule) {
      // Check if this asset has been unlocked in any year up to currentYear
      for (let year = 1; year <= currentYear; year++) {
        const unlocks = gameState.assetUnlockSchedule[year];
        if (unlocks) {
          for (const unlock of unlocks) {
            // Check direct match
            if (unlock.assetType === checkName) {
              return true;
            }
            // Check if it's in the assetNames array (for stocks, funds, etc.)
            if (unlock.assetNames && unlock.assetNames.includes(checkName)) {
              return true;
            }
            // Check category matches for generic checks
            if (unlock.category === checkName) {
              return true;
            }
            // Special handling for BANKING category (combines SAVINGS_AC and FD)
            if (checkName === 'BANKING' && (unlock.assetType === 'SAVINGS_AC' || unlock.assetType === 'FD')) {
              return true;
            }
            if ((checkName === 'SAVINGS_AC' || checkName === 'FIXED_DEPOSIT') && unlock.category === 'BANKING') {
              return true;
            }
            // Special handling for GOLD category
            if (checkName === 'PHYSICAL_GOLD' && unlock.assetType === 'Physical_Gold') {
              return true;
            }
            if (checkName === 'DIGITAL_GOLD' && unlock.assetType === 'Digital_Gold') {
              return true;
            }
            // Special handling for stocks
            if (checkName === 'INDIAN_STOCKS' && unlock.category === 'STOCKS') {
              return true;
            }
            // Special handling for REITs
            if (checkName === 'REIT' && unlock.category === 'REIT') {
              return true;
            }
            if ((checkName === 'EMBASSY' || checkName === 'MINDSPACE') && unlock.category === 'REIT') {
              return true;
            }
            // Special handling for commodities
            if (checkName === 'COMMODITY' && unlock.category === 'COMMODITIES') {
              return true;
            }
          }
        }
      }
      // If we have a schedule but didn't find the asset, it's not unlocked
      return false;
    }

    // FALLBACK: Use hardcoded logic if no schedule available (legacy/quick start mode)
    // BANKING (Savings + FD combined) - Always enabled at game start (Year 1)
    if (checkName === 'BANKING' || checkName === 'SAVINGS_AC' || checkName === 'FIXED_DEPOSIT') {
      return currentYear >= 1;
    }

    // Physical Gold - Unlocks at Year 2
    if (checkName === 'PHYSICAL_GOLD') {
      return currentYear >= 2;
    }

    // Commodity - Unlocks at Year 3
    if (checkName === 'COMMODITY') {
      return currentYear >= 3;
    }

    // Stocks - Unlocks at Year 4
    if (checkName === 'INDIAN_STOCKS') {
      return currentYear >= 4;
    }

    // Index Fund - Unlocks when calendar year >= 2009
    if (checkName === 'INDEX_FUND') {
      const triggerYear = CALENDAR_YEAR_TRIGGERS.INDEX_FUND || 2009;
      return calendarYear >= triggerYear;
    }

    // Mutual Fund - Unlocks when calendar year >= 2017
    if (checkName === 'MUTUAL_FUND') {
      const triggerYear = CALENDAR_YEAR_TRIGGERS.MUTUAL_FUND || 2017;
      return calendarYear >= triggerYear;
    }

    // Gold ETF (Digital Gold) - Unlocks when calendar year >= 2012
    if (checkName === 'DIGITAL_GOLD') {
      const triggerYear = CALENDAR_YEAR_TRIGGERS.DIGITAL_GOLD || 2012;
      return calendarYear >= triggerYear;
    }

    // REITs - Use the selected REIT's actual data (no hardcoding)
    if (checkName === 'EMBASSY' || checkName === 'MINDSPACE' || checkName === 'REIT') {
      const reitName = selectedAssets?.reit || 'EMBASSY';
      const reitData = ASSET_TIMELINE_DATA[reitName];
      if (!reitData) return false;
      if (calendarYear > reitData.firstYear) return true;
      if (calendarYear === reitData.firstYear && gameState.currentMonth >= reitData.firstMonth) return true;
      return false;
    }

    // DISABLED CATEGORIES (CRYPTO, FOREX)
    if (checkName === 'BTC' || checkName === 'ETH' || checkName === 'CRYPTO') {
      return false;
    }

    if (checkName === 'FOREX' || checkName === 'USDINR' || checkName === 'EURINR' || checkName === 'GBPINR') {
      return false;
    }

    return false;
  };

  // Check if asset category is unlocking RIGHT NOW (at this exact moment)
  // Quiz appears when the FIRST selected asset in the category becomes available
  const isAssetUnlockingNow = (checkName: string): boolean => {
    // PRIORITY 1: Use assetUnlockSchedule if available (new system)
    if (gameState.assetUnlockSchedule) {
      // For MUTUAL_FUND and INDEX_FUND: These are calendar-year based unlocks where
      // the actual fund data availability (firstMonth) may differ from Month 1.
      // Quiz should trigger at the EXACT month when the first fund becomes available.
      if (checkName === 'MUTUAL_FUND') {
        // Check if mutual fund unlock is scheduled for ANY year up to current
        let isScheduledForCurrentCalendarYear = false;
        for (let year = 1; year <= currentYear; year++) {
          const unlocks = gameState.assetUnlockSchedule[year];
          if (unlocks) {
            for (const unlock of unlocks) {
              if (unlock.assetType === 'MUTUAL_FUND' && unlock.calendarYear === calendarYear) {
                isScheduledForCurrentCalendarYear = true;
                break;
              }
            }
          }
          if (isScheduledForCurrentCalendarYear) break;
        }

        if (isScheduledForCurrentCalendarYear && selectedAssets?.mutualFunds && selectedAssets.mutualFunds.length > 0) {
          // Find the earliest available mutual fund's first month
          let earliestYear = 9999;
          let earliestMonth = 12;
          for (const fundName of selectedAssets.mutualFunds) {
            const fundData = ASSET_TIMELINE_DATA[fundName];
            if (fundData) {
              if (fundData.firstYear < earliestYear ||
                (fundData.firstYear === earliestYear && fundData.firstMonth < earliestMonth)) {
                earliestYear = fundData.firstYear;
                earliestMonth = fundData.firstMonth;
              }
            }
          }
          // Quiz triggers at the EXACT moment the first fund becomes available
          if (earliestYear !== 9999) {
            return calendarYear === earliestYear && gameState.currentMonth === earliestMonth;
          }
        }
        return false;
      }

      if (checkName === 'INDEX_FUND') {
        // Check if index fund unlock is scheduled for ANY year up to current
        let isScheduledForCurrentCalendarYear = false;
        for (let year = 1; year <= currentYear; year++) {
          const unlocks = gameState.assetUnlockSchedule[year];
          if (unlocks) {
            for (const unlock of unlocks) {
              if (unlock.assetType === 'INDEX_FUND' && unlock.calendarYear === calendarYear) {
                isScheduledForCurrentCalendarYear = true;
                break;
              }
            }
          }
          if (isScheduledForCurrentCalendarYear) break;
        }

        if (isScheduledForCurrentCalendarYear && selectedAssets?.indexFunds && selectedAssets.indexFunds.length > 0) {
          // Find the earliest available index fund's first month
          let earliestYear = 9999;
          let earliestMonth = 12;
          for (const fundName of selectedAssets.indexFunds) {
            const fundData = ASSET_TIMELINE_DATA[fundName];
            if (fundData) {
              if (fundData.firstYear < earliestYear ||
                (fundData.firstYear === earliestYear && fundData.firstMonth < earliestMonth)) {
                earliestYear = fundData.firstYear;
                earliestMonth = fundData.firstMonth;
              }
            }
          }
          // Quiz triggers at the EXACT moment the first fund becomes available
          if (earliestYear !== 9999) {
            return calendarYear === earliestYear && gameState.currentMonth === earliestMonth;
          }
        }
        return false;
      }

      // For REITs: Calendar-year based unlock where data availability may differ from Month 1
      // EMBASSY starts March 2019, MINDSPACE starts August 2020
      if (checkName === 'REIT' || checkName === 'EMBASSY' || checkName === 'MINDSPACE') {
        const reitName = selectedAssets?.reit || 'EMBASSY';
        const reitData = ASSET_TIMELINE_DATA[reitName];
        if (!reitData) return false;

        // Check if REIT unlock is scheduled in the schedule
        let isScheduledForThisReit = false;
        for (let year = 1; year <= currentYear; year++) {
          const unlocks = gameState.assetUnlockSchedule[year];
          if (unlocks) {
            for (const unlock of unlocks) {
              if (unlock.category === 'REIT' && unlock.assetType === reitName) {
                isScheduledForThisReit = true;
                break;
              }
            }
          }
          if (isScheduledForThisReit) break;
        }

        if (isScheduledForThisReit) {
          // Quiz triggers at the EXACT moment the REIT data becomes available
          return calendarYear === reitData.firstYear && gameState.currentMonth === reitData.firstMonth;
        }
        return false;
      }

      // For other assets: Check if unlocking at Month 1 of the scheduled year
      const currentUnlocks = gameState.assetUnlockSchedule[currentYear];
      if (currentUnlocks && gameState.currentMonth === 1) { // Assets unlock at month 1 of their year
        for (const unlock of currentUnlocks) {
          // Check direct match
          if (unlock.assetType === checkName) {
            return true;
          }
          // Check if it's in the assetNames array (for stocks, funds, etc.)
          if (unlock.assetNames && unlock.assetNames.includes(checkName)) {
            return true;
          }
          // Check category matches for generic checks
          if (unlock.category === checkName) {
            return true;
          }
          // Special handling for BANKING category (combines SAVINGS_AC and FD)
          if (checkName === 'BANKING' && (unlock.assetType === 'SAVINGS_AC' || unlock.assetType === 'FD')) {
            return true;
          }
          if ((checkName === 'SAVINGS_AC' || checkName === 'FIXED_DEPOSIT') && unlock.category === 'BANKING') {
            return true;
          }
          // Special handling for GOLD category
          if (checkName === 'PHYSICAL_GOLD' && unlock.assetType === 'Physical_Gold') {
            return true;
          }
          if (checkName === 'DIGITAL_GOLD' && unlock.assetType === 'Digital_Gold') {
            return true;
          }
          // Special handling for stocks
          if (checkName === 'INDIAN_STOCKS' && unlock.category === 'STOCKS') {
            return true;
          }
          // Special handling for commodities
          if (checkName === 'COMMODITY' && unlock.category === 'COMMODITIES') {
            return true;
          }
        }
      }
      // If we have a schedule but didn't find the asset unlocking now, return false
      return false;
    }

    // FALLBACK: Use hardcoded logic if no schedule available (legacy/quick start mode)
    // ===== GAME YEAR BASED UNLOCKS =====

    // BANKING (Savings + FD) - Unlocks at Year 1, Month 1 (game start)
    if (checkName === 'BANKING' || checkName === 'SAVINGS_AC' || checkName === 'FIXED_DEPOSIT') {
      return currentYear === 1 && gameState.currentMonth === 1;
    }

    // Physical Gold - Unlocks at start of Year 2
    if (checkName === 'PHYSICAL_GOLD') {
      return currentYear === 2 && gameState.currentMonth === 1;
    }

    // Commodity - Unlocks at start of Year 3 (consistent with Banking/Gold)
    if (checkName === 'COMMODITY') {
      return currentYear === 3 && gameState.currentMonth === 1;
    }

    // Stocks - Check when the FIRST selected stock has data (progressive unlock)
    if (checkName === 'INDIAN_STOCKS') {
      if (!selectedAssets?.stocks || selectedAssets.stocks.length === 0) return false;

      // Find the earliest available stock
      let earliestYear = 9999;
      let earliestMonth = 12;

      for (const stockName of selectedAssets.stocks) {
        const stockData = ASSET_TIMELINE_DATA[stockName];
        if (stockData) {
          if (stockData.firstYear < earliestYear ||
            (stockData.firstYear === earliestYear && stockData.firstMonth < earliestMonth)) {
            earliestYear = stockData.firstYear;
            earliestMonth = stockData.firstMonth;
          }
        }
      }

      if (earliestYear === 9999) return false;
      return calendarYear === earliestYear && gameState.currentMonth === earliestMonth;
    }

    // ===== CALENDAR YEAR BASED UNLOCKS =====

    // Index Fund - Check when the FIRST selected index fund has data
    if (checkName === 'INDEX_FUND') {
      if (!selectedAssets?.indexFunds || selectedAssets.indexFunds.length === 0) return false;

      // Find the earliest available index fund
      let earliestYear = 9999;
      let earliestMonth = 12;

      for (const fundName of selectedAssets.indexFunds) {
        const fundData = ASSET_TIMELINE_DATA[fundName];
        if (fundData) {
          if (fundData.firstYear < earliestYear ||
            (fundData.firstYear === earliestYear && fundData.firstMonth < earliestMonth)) {
            earliestYear = fundData.firstYear;
            earliestMonth = fundData.firstMonth;
          }
        }
      }

      if (earliestYear === 9999) return false;
      return calendarYear === earliestYear && gameState.currentMonth === earliestMonth;
    }

    // Mutual Fund - Check when the FIRST selected mutual fund has data
    if (checkName === 'MUTUAL_FUND') {
      if (!selectedAssets?.mutualFunds || selectedAssets.mutualFunds.length === 0) return false;

      // Find the earliest available mutual fund
      let earliestYear = 9999;
      let earliestMonth = 12;

      for (const fundName of selectedAssets.mutualFunds) {
        const fundData = ASSET_TIMELINE_DATA[fundName];
        if (fundData) {
          if (fundData.firstYear < earliestYear ||
            (fundData.firstYear === earliestYear && fundData.firstMonth < earliestMonth)) {
            earliestYear = fundData.firstYear;
            earliestMonth = fundData.firstMonth;
          }
        }
      }

      if (earliestYear === 9999) return false;
      return calendarYear === earliestYear && gameState.currentMonth === earliestMonth;
    }

    // Digital Gold - Check actual data availability
    if (checkName === 'DIGITAL_GOLD') {
      const digitalGoldData = ASSET_TIMELINE_DATA['Digital_Gold'];
      if (!digitalGoldData) return false;
      return calendarYear === digitalGoldData.firstYear && gameState.currentMonth === digitalGoldData.firstMonth;
    }

    // REITs - Check when the selected REIT has data (EMBASSY or MINDSPACE)
    if (checkName === 'EMBASSY' || checkName === 'MINDSPACE' || checkName === 'REIT') {
      const reitName = selectedAssets?.reit || 'EMBASSY';
      const reitData = ASSET_TIMELINE_DATA[reitName];
      if (!reitData) return false;
      return calendarYear === reitData.firstYear && gameState.currentMonth === reitData.firstMonth;
    }

    // Disabled categories never unlock
    if (checkName === 'BTC' || checkName === 'ETH' || checkName === 'CRYPTO' ||
      checkName === 'FOREX' || checkName === 'USDINR' || checkName === 'EURINR' || checkName === 'GBPINR') {
      return false;
    }

    return false;
  };

  // Legacy function name for backward compatibility
  const isAssetUnlocked = isAssetCategoryUnlocked;

  // Detect newly unlocked categories and show quiz modal
  useEffect(() => {
    const completedQuizzes = gameState.completedQuizzes || [];

    // Define category mapping for quiz detection
    // BANKING category combines Savings Account and FDs (one quiz at Year 1)
    // INDEX_FUND and MUTUAL_FUND are separate categories with their own quizzes
    const categoryMap: { [key: string]: string } = {
      'SAVINGS_AC': 'BANKING',      // Combined into BANKING
      'FIXED_DEPOSIT': 'BANKING',   // Combined into BANKING
      'BANKING': 'BANKING',         // Direct mapping
      'PHYSICAL_GOLD': 'GOLD',
      'DIGITAL_GOLD': 'GOLD',
      'INDIAN_STOCKS': 'STOCKS',
      'BTC': 'CRYPTO',
      'ETH': 'CRYPTO',
      'COMMODITY': 'COMMODITY',
      'INDEX_FUND': 'INDEX_FUND',   // Separate quiz (unlocks at calendar 2009)
      'MUTUAL_FUND': 'MUTUAL_FUND', // Separate quiz (unlocks at calendar 2017)
      'EMBASSY': 'REIT',
      'MINDSPACE': 'REIT'
    };

    // IMPORTANT: Wait for adminSettings to be available before checking quiz unlock
    // This prevents race condition where quiz triggers before multiplayer settings are loaded
    if (!adminSettings) {
      return;
    }

    // Build list of categories to check for quiz unlock
    // BANKING = Savings + FD combined (one quiz at Year 1)
    // INDEX_FUND and MUTUAL_FUND are separate (unlock at different calendar years)
    const categoriesToCheck = [
      'BANKING',        // Combined Savings + FD quiz at Year 1
      'PHYSICAL_GOLD',  // Year 2
      'COMMODITY',      // Year 3
      'INDIAN_STOCKS',  // Year 4
      'INDEX_FUND',     // Calendar 2009
      'MUTUAL_FUND',    // Calendar 2017
      selectedAssets?.reit || 'EMBASSY'  // Use selected REIT (EMBASSY or MINDSPACE)
    ];
    // Note: CRYPTO (BTC) is disabled in current game version

    for (const category of categoriesToCheck) {
      const quizCategory = categoryMap[category];

      // Skip if quiz already completed
      if (completedQuizzes.includes(quizCategory)) continue;

      // Check if category is unlocking RIGHT NOW (quiz appears at unlock time)
      if (isAssetUnlockingNow(category)) {
        // Skip if quiz modal is already showing
        if (showEducationModal) break;

        // Check if quiz is enabled in admin settings
        const isQuizEnabled = adminSettings?.enableQuiz !== false; // Default to true if not set

        // Show modal (either with quiz or just notification)
        const educationContent = getEducationContent(quizCategory);
        if (educationContent) {
          setCurrentQuizCategory(quizCategory);
          setQuizEnabled(isQuizEnabled);
          setShowEducationModal(true);

          // Notify server in multiplayer mode
          if (onQuizStarted) {
            onQuizStarted(quizCategory);
          }

          // Only pause the game if quiz is enabled
          if (isQuizEnabled && !gameState.isPaused) {
            onTogglePause();
          }

          break; // Show one modal at a time
        }
      }
    }
  }, [currentYear, gameState.currentMonth, gameState.completedQuizzes, isAssetUnlockingNow, gameState.isPaused, onTogglePause, onQuizStarted, selectedAssets, showEducationModal, adminSettings]);

  // Handle quiz completion
  const handleQuizComplete = () => {
    if (currentQuizCategory) {
      onMarkQuizCompleted(currentQuizCategory);
      setShowEducationModal(false);
      setCurrentQuizCategory(null);
      // Unpause the game when quiz is completed (only in solo mode)
      // In multiplayer, the server controls pause state
      if (gameState.isPaused && !showLeaderboard) {
        onTogglePause();
      }
    } else {
      setShowEducationModal(false);
    }
  };

  const currentFDRates = {
    oneYear: fdRates[calendarYear]?.['12'] ?? 5.0,
    twoYear: fdRates[calendarYear]?.['24'] ?? 6.0,
    threeYear: fdRates[calendarYear]?.['36'] ?? 7.0
  };

  // Get asset prices from API/server
  const physicalGoldPrice = getPrice('Physical_Gold');
  const digitalGoldPrice = getPrice('Digital_Gold');

  const physicalGoldHistory = getPriceHistory('Physical_Gold', 12);
  const digitalGoldHistory = getPriceHistory('Digital_Gold', 12);

  const previousPhysicalGoldPrice = physicalGoldHistory[physicalGoldHistory.length - 2] || physicalGoldPrice;
  const previousDigitalGoldPrice = digitalGoldHistory[digitalGoldHistory.length - 2] || digitalGoldPrice;


  // Commodity prices (dynamically selected)
  const commodityPrice = selectedAssets ? getPrice(selectedAssets.commodity) : 0;
  const commodityHistory = selectedAssets ? getPriceHistory(selectedAssets.commodity, 12) : [];
  const previousCommodityPrice = commodityHistory[commodityHistory.length - 2] || commodityPrice;

  // REIT prices (randomly selected EMBASSY or MINDSPACE)
  const reitPrice = selectedAssets ? getPrice(selectedAssets.reit) : 0;
  const reitHistory = selectedAssets ? getPriceHistory(selectedAssets.reit, 12) : [];
  const previousReitPrice = reitHistory[reitHistory.length - 2] || reitPrice;

  // Helper function to get stock price data dynamically
  const getStockPriceData = (stockName: string) => {
    const price = getPrice(stockName);
    const history = getPriceHistory(stockName, 12);
    const previousPrice = history[history.length - 2] || price;
    return { price, history, previousPrice };
  };

  // Calculate networth and portfolio breakdown ONCE using useMemo (optimization to avoid recalculation)
  const networthData = useMemo(() => {
    let currentValue = 0;

    // Pocket cash
    const pocketCashValue = gameState.pocketCash;
    currentValue += pocketCashValue;

    // Savings
    const savingsValue = gameState.savingsAccount.balance;
    currentValue += savingsValue;

    // Fixed deposits (include time-weighted accrued interest for non-matured FDs, rates are PA)
    let fdTotal = 0;
    gameState.fixedDeposits.forEach(fd => {
      const durationInYears = fd.duration / 12;
      const totalReturn = (fd.interestRate / 100) * durationInYears;

      if (fd.isMatured) {
        fdTotal += fd.amount * (1 + totalReturn);
      } else {
        const startYear = fd.startYear;
        const startMonth = fd.startMonth;
        let monthsElapsed = (gameState.currentYear - startYear) * 12 + (gameState.currentMonth - startMonth);
        monthsElapsed = Math.max(0, Math.min(monthsElapsed, fd.duration));
        const progress = monthsElapsed / fd.duration;
        const interestAccrued = (fd.amount * totalReturn) * progress;
        fdTotal += fd.amount + interestAccrued;
      }
    });
    currentValue += fdTotal;

    // Gold
    const goldValue =
      (gameState.holdings.physicalGold.quantity * physicalGoldPrice) +
      (gameState.holdings.digitalGold.quantity * digitalGoldPrice);
    currentValue += goldValue;

    // Index Funds (separate from Mutual Funds for detailed breakdown)
    let indexFundsValue = 0;
    Object.entries(gameState.holdings.indexFund).forEach(([fundName, holding]) => {
      if (holding.quantity > 0) {
        const fundPrice = getPrice(fundName);
        indexFundsValue += holding.quantity * fundPrice;
      }
    });
    currentValue += indexFundsValue;

    // Mutual Funds (separate from Index Funds for detailed breakdown)
    let mutualFundsValue = 0;
    Object.entries(gameState.holdings.mutualFund).forEach(([fundName, holding]) => {
      if (holding.quantity > 0) {
        const fundPrice = getPrice(fundName);
        mutualFundsValue += holding.quantity * fundPrice;
      }
    });
    currentValue += mutualFundsValue;

    // Stocks
    let stocksValue = 0;
    Object.entries(gameState.holdings.stocks).forEach(([stockName, holding]) => {
      if (holding.quantity > 0) {
        const stockPrice = getPrice(stockName);
        stocksValue += holding.quantity * stockPrice;
      }
    });
    currentValue += stocksValue;

    // Crypto (disabled - not part of unlock schedule, but kept for backward compatibility)
    const cryptoValue =
      ((gameState.holdings.crypto['BTC']?.quantity || 0) * getPrice('BTC')) +
      ((gameState.holdings.crypto['ETH']?.quantity || 0) * getPrice('ETH'));
    currentValue += cryptoValue;

    // Commodities
    const commoditiesValue = gameState.holdings.commodity.quantity * commodityPrice;
    currentValue += commoditiesValue;

    // REITs (randomly selected EMBASSY or MINDSPACE)
    const selectedReit = selectedAssets?.reit || 'EMBASSY';
    const reitsValue = (gameState.holdings.reits[selectedReit]?.quantity || 0) * reitPrice;
    currentValue += reitsValue;

    return {
      networth: currentValue,
      breakdown: {
        cash: pocketCashValue,
        savings: savingsValue,
        fixedDeposits: fdTotal,
        gold: goldValue,
        indexFunds: indexFundsValue,
        mutualFunds: mutualFundsValue,
        stocks: stocksValue,
        crypto: cryptoValue,
        commodities: commoditiesValue,
        reits: reitsValue,
      }
    };
  }, [
    gameState.pocketCash,
    gameState.savingsAccount.balance,
    gameState.fixedDeposits,
    gameState.holdings,
    gameState.currentMonth,
    gameState.currentYear,
    physicalGoldPrice,
    digitalGoldPrice,
    commodityPrice,
    reitPrice,
    calendarYear,
    getPrice,
  ]);

  // Notify parent component when networth changes (for multiplayer sync)
  useEffect(() => {
    if (onNetworthCalculated) {
      onNetworthCalculated(networthData.networth, networthData.breakdown);
    }
  }, [networthData, onNetworthCalculated]);

  // Check if game has ended
  // Use TOTAL_GAME_YEARS so detection remains correct even if constants change
  const isGameEnded = !gameState.isStarted && gameState.currentYear >= TOTAL_GAME_YEARS;

  // IMPORTANT: This hook must be before the early return to avoid hooks order violation
  useEffect(() => {
  }, [lifeEventPopup]);

  // If game ended, show end screen
  if (isGameEnded) {
    return (
      <GameEndScreen
        gameState={gameState}
        isMultiplayer={showLeaderboard}
        calendarYear={calendarYear}
        leaderboardData={leaderboardData}
        onReturnToMenu={onReturnToMenu || (() => window.location.reload())}
        playerName={playerName}
        playerAge={playerAge}
        roomId={roomId}
        onFinalNetworthSync={onFinalNetworthSync}
      />
    );
  }

  return (
    <div className="game-screen">
      {lifeEventPopup && <LifeEventPopup event={lifeEventPopup} onClose={() => { if (clearLifeEventPopup) clearLifeEventPopup(); }} />}
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-fixed">
          <div className="logo-banner">
            <h1 className="game-logo">BULL RUN</h1>
          </div>
        </div>

        <div className="sidebar-scrollable">
          <div className="game-info">
            <p className="quote">
              {gameState.yearlyQuotes && gameState.yearlyQuotes[gameState.currentYear - 1]
                ? gameState.yearlyQuotes[gameState.currentYear - 1]
                : "Rule No. 1 is never lose money. Rule No. 2 is never forget Rule No. 1."}
            </p>
          </div>

          <TotalReceivedBreakdown
            totalReceived={gameState.pocketCashReceivedTotal || 0}
            cashTransactions={gameState.cashTransactions || []}
            initialCash={gameState.adminSettings?.initialPocketCash || 0}
          />
          <div className="flow-arrow">↓</div>
          <div className={`pocket-cash ${gameState.pocketCash < 0 ? 'debt' : ''}`}>
            <div className="pocket-label">
              Pocket Cash
              {gameState.pocketCash < 0 && <span className="debt-indicator">You are in debt</span>}
            </div>
            <div className="pocket-amount">₹{formatCurrency(gameState.pocketCash)}</div>
          </div>
          <div className="flow-arrow">↓</div>
          {/* Net Worth Section */}
          {(() => {
            // Use pre-calculated networth from useMemo (optimization - no duplicate calculation)
            const netWorth = networthData.networth;
            const breakdown: { name: string; value: number; percentage: number }[] = [];

            // Build breakdown array for display (using pre-calculated values)
            if (netWorth > 0) {
              // Include Pocket Cash in breakdown
              if (networthData.breakdown.cash > 0) {
                breakdown.push({
                  name: 'Pocket Cash',
                  value: networthData.breakdown.cash,
                  percentage: (networthData.breakdown.cash / netWorth) * 100
                });
              }
              if (networthData.breakdown.savings > 0) {
                breakdown.push({
                  name: 'Savings',
                  value: networthData.breakdown.savings,
                  percentage: (networthData.breakdown.savings / netWorth) * 100
                });
              }
              if (networthData.breakdown.fixedDeposits > 0) {
                breakdown.push({
                  name: 'Fixed Deposits',
                  value: networthData.breakdown.fixedDeposits,
                  percentage: (networthData.breakdown.fixedDeposits / netWorth) * 100
                });
              }
              if (networthData.breakdown.gold > 0) {
                breakdown.push({
                  name: 'Gold',
                  value: networthData.breakdown.gold,
                  percentage: (networthData.breakdown.gold / netWorth) * 100
                });
              }
              if (networthData.breakdown.funds > 0) {
                breakdown.push({
                  name: 'Funds',
                  value: networthData.breakdown.funds,
                  percentage: (networthData.breakdown.funds / netWorth) * 100
                });
              }
              if (networthData.breakdown.stocks > 0) {
                breakdown.push({
                  name: 'Stocks',
                  value: networthData.breakdown.stocks,
                  percentage: (networthData.breakdown.stocks / netWorth) * 100
                });
              }
              if (networthData.breakdown.crypto > 0) {
                breakdown.push({
                  name: 'Crypto',
                  value: networthData.breakdown.crypto,
                  percentage: (networthData.breakdown.crypto / netWorth) * 100
                });
              }
              if (networthData.breakdown.commodities > 0) {
                breakdown.push({
                  name: 'Commodity',
                  value: networthData.breakdown.commodities,
                  percentage: (networthData.breakdown.commodities / netWorth) * 100
                });
              }
              if (networthData.breakdown.reits > 0) {
                breakdown.push({
                  name: 'REITs',
                  value: networthData.breakdown.reits,
                  percentage: (networthData.breakdown.reits / netWorth) * 100
                });
              }
            }

            // Calculate percentage gain/loss based on total capital (initial + recurring income)
            const totalCapital = calculateTotalCapital(gameState);
            const gainFromStart = netWorth - totalCapital;
            const gainPercentage = totalCapital > 0 ? (gainFromStart / totalCapital) * 100 : 0;

            // Compute invested amounts per category
            const fdInvested = (gameState.fixedDeposits || []).reduce((s, fd) => s + (fd.amount || 0), 0);

            // For Savings: use totalDeposited if available
            // If not tracked (old games), approximate using reverse compound interest
            let savingsInvested = 0;
            if (gameState.savingsAccount.totalDeposited !== undefined) {
              savingsInvested = gameState.savingsAccount.totalDeposited;
            } else if (gameState.savingsAccount.balance > 0) {
              // Reverse compound interest: P = A / (1 + r/12)^months
              const monthsElapsed = (gameState.currentYear - 1) * 12 + gameState.currentMonth;
              const monthlyRate = gameState.savingsAccount.interestRate / 12;
              savingsInvested = gameState.savingsAccount.balance / Math.pow(1 + monthlyRate, monthsElapsed);
            }

            const investedMap: { [k: string]: number } = {
              'Pocket Cash': 0, // Pocket cash has no P&L (it's just cash)
              'Savings': savingsInvested,
              'Fixed Deposits': fdInvested,
              'Gold': (gameState.holdings.physicalGold.totalInvested || 0) + (gameState.holdings.digitalGold.totalInvested || 0),
              'Funds': Object.values(gameState.holdings.indexFund || {}).reduce((s: number, h: any) => s + (h.totalInvested || 0), 0) + Object.values(gameState.holdings.mutualFund || {}).reduce((s: number, h: any) => s + (h.totalInvested || 0), 0),
              'Stocks': Object.values(gameState.holdings.stocks || {}).reduce((s: number, h: any) => s + (h.totalInvested || 0), 0),
              'Crypto': Object.values(gameState.holdings.crypto || {}).reduce((s: number, h: any) => s + (h.totalInvested || 0), 0),
              'Commodity': gameState.holdings.commodity.totalInvested || 0,
              'REITs': Object.values(gameState.holdings.reits || {}).reduce((s: number, h: any) => s + (h.totalInvested || 0), 0)
            };

            // Build items enriched with invested & pnl (only for tradeable assets with totalInvested)
            const items = breakdown.map(item => {
              const invested = investedMap[item.name] || 0;
              const pnl = invested > 0 ? item.value - invested : 0;
              const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
              return { ...item, invested, pnl, pnlPercent };
            });

            // Determine highlight: prefer tradeable assets (not Savings/FD) with highest positive P&L %; else largest holding
            const tradeableAssets = ['Gold', 'Funds', 'Stocks', 'Crypto', 'Commodity', 'REITs'];
            const tradeableItems = items.filter((it: any) => tradeableAssets.includes(it.name) && it.invested > 0 && it.pnl > 0);
            let highlightName: string | null = null;
            let isTopPerformer = false;
            if (tradeableItems.length > 0) {
              const maxPnlEntry = tradeableItems.reduce((best: any, it: any) => it.pnlPercent > best.pnlPercent ? it : best);
              highlightName = maxPnlEntry.name;
              isTopPerformer = true;
            } else {
              const maxValueEntry = items.reduce((best: any, it: any) => !best || it.value > best.value ? it : best, null as any);
              highlightName = maxValueEntry?.name || null;
            }

            // Compute CAGR display using total capital and years elapsed
            const totalMonths = (gameState.currentYear - 1) * 12 + gameState.currentMonth;
            const yearsElapsed = Math.max(0.0001, totalMonths / 12); // avoid divide-by-zero
            const cagr = calculateCAGR(totalCapital, netWorth, yearsElapsed);

            return (
              <div className="net-worth">
                <div className="net-worth-label">Net Worth</div>
                <div className="net-tooltip-wrapper">
                  <div className="net-worth-amount">₹{formatCurrency(netWorth)}</div>

                  <div className="net-worth-breakdown">
                    <div className="breakdown-title">Portfolio Breakdown</div>
                    <div className="cagr">CAGR: {cagr.toFixed(2)}%</div>
                    {(() => {
                      // put highlighted item first so it appears at the top of the breakdown
                      const displayItems = highlightName ? [items.find(i => i.name === highlightName)!, ...items.filter(i => i.name !== highlightName)] : items;
                      const highlightReason = isTopPerformer ? 'Top Performer' : 'Largest Holding';

                      return displayItems.map((item, idx) => (
                        <div key={idx} className={`breakdown-item ${item.name === highlightName ? 'highlight' : ''}`}>
                          <span className="breakdown-name">
                            {item.name}
                            {item.name === highlightName && (
                              <span className="highlight-badge">{highlightReason}</span>
                            )}
                          </span>
                          <span className="breakdown-percentage">
                            ₹{formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)
                            {item.invested > 0 && (
                              <span style={{ color: item.pnl >= 0 ? '#48ff00' : '#d00000', marginLeft: '8px', fontSize: '11px' }}>
                                {item.pnl >= 0 ? '+' : ''}{item.pnlPercent.toFixed(1)}%
                              </span>
                            )}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="net-worth-pl" style={{ color: gainFromStart >= 0 ? '#48ff00ff' : 'rgba(208, 0, 0, 1)' }}>
                  {gainFromStart >= 0 ? '+' : ''}₹{formatCurrency(gainFromStart)} ({gainFromStart >= 0 ? '+' : ''}{gainPercentage.toFixed(2)}%)
                </div>
              </div>
            );
          })()}

          {/* Leaderboard - Hidden in Solo Mode, will be used in Multi Mode */}
          {/* <div className="leaderboard">
          <h3>Leaderboard</h3>
          <ol>
            <li>__________</li>
            <li>__________</li>
            <li>__________</li>
            <li>__________</li>
            <li>__________</li>
          </ol>
        </div> */}

          <div className="game-timer">
            <div>
              <span>Year</span>
              <span>{currentYear}/20</span>
            </div>
            {adminSettings && !adminSettings.hideCurrentYear && (
              <div>
                <span>Calendar</span>
                <span>{calendarYear}</span>
              </div>
            )}
            <div>
              <span>Month</span>
              <span>{gameState.currentMonth}</span>
            </div>
          </div>

          {showPauseButton && (
            <button className="pause-button" onClick={onTogglePause}>
              {gameState.isPaused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
          )}

          {/* Multiplayer Leaderboard */}
          {showLeaderboard && <MultiplayerLeaderboardSidebar />}
        </div>
      </div>

      {/* Main Content - Grouped Sections with Headers */}
      <div className={`main-content year-${currentYear}`}>
        <div className="dynamic-assets-layout">
          {/* ===== FIRST ROW: BANKING AND GOLD ONLY ===== */}
          <div className="first-row-container">
            {/* ===== BANKING SECTION ===== */}
            <section className="banking-section">
              <h3 className="section-header">BANKING</h3>
              <div className="section-cards">
                <SavingsAccountCard
                  balance={gameState.savingsAccount.balance}
                  pocketCash={gameState.pocketCash}
                  onDeposit={onDeposit}
                  onWithdraw={onWithdraw}
                />

                <FixedDepositCard
                  fixedDeposits={gameState.fixedDeposits}
                  pocketCash={gameState.pocketCash}
                  currentRates={currentFDRates}
                  currentYear={currentYear}
                  currentMonth={gameState.currentMonth}
                  onCreate={onCreateFD}
                  onCollect={onCollectFD}
                  onBreak={onBreakFD}
                />
              </div>
            </section>

            {/* ===== GOLD SECTION ===== */}
            {(isAssetUnlocked('PHYSICAL_GOLD') || isAssetUnlocked('DIGITAL_GOLD')) && (
              <section className="gold-section">
                <h3 className="section-header">GOLD</h3>
                <div className="section-cards">
                  {isAssetUnlocked('PHYSICAL_GOLD') && (
                    <TradeableAssetCard
                      name="PHYSICAL GOLD"
                      currentPrice={physicalGoldPrice}
                      previousPrice={previousPhysicalGoldPrice}
                      priceHistory={physicalGoldHistory}
                      holding={gameState.holdings.physicalGold}
                      pocketCash={gameState.pocketCash}
                      unit="/10g"
                      onBuy={(qty) => onBuyAsset('physicalGold', 'Physical_Gold', qty, physicalGoldPrice)}
                      onSell={(qty) => onSellAsset('physicalGold', 'Physical_Gold', qty, physicalGoldPrice)}
                      isTransacting={isTransacting}
                    />
                  )}

                  {isAssetUnlocked('DIGITAL_GOLD') && (
                    <TradeableAssetCard
                      name="DIGITAL GOLD"
                      currentPrice={digitalGoldPrice}
                      previousPrice={previousDigitalGoldPrice}
                      priceHistory={digitalGoldHistory}
                      holding={gameState.holdings.digitalGold}
                      pocketCash={gameState.pocketCash}
                      unit="/share"
                      onBuy={(qty) => onBuyAsset('digitalGold', 'Digital_Gold', qty, digitalGoldPrice)}
                      onSell={(qty) => onSellAsset('digitalGold', 'Digital_Gold', qty, digitalGoldPrice)}
                      isTransacting={isTransacting}
                    />
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ===== INDIVIDUAL STOCKS SECTION ===== */}
          {(() => {
            if (!isAssetUnlocked('INDIAN_STOCKS') || !selectedAssets) return null;

            const availableStocks = selectedAssets.stocks
              .filter((stockName) => {
                const stockTimeline = ASSET_TIMELINE_DATA[stockName];
                if (!stockTimeline) return false;
                if (calendarYear > stockTimeline.firstYear) return true;
                if (calendarYear === stockTimeline.firstYear && gameState.currentMonth >= stockTimeline.firstMonth) return true;
                return false;
              });

            if (availableStocks.length === 0) return null;

            return (
              <section className="stocks-section">
                <h3 className="section-header">INDIVIDUAL STOCKS</h3>
                <div className="section-cards">
                  {availableStocks.map((stockName) => {
                    const stockData = getStockPriceData(stockName);
                    return (
                      <TradeableAssetCard
                        key={stockName}
                        name={stockName}
                        currentPrice={stockData.price}
                        previousPrice={stockData.previousPrice}
                        priceHistory={stockData.history}
                        holding={gameState.holdings.stocks[stockName] || { quantity: 0, avgPrice: 0, totalInvested: 0 }}
                        pocketCash={gameState.pocketCash}
                        unit="/share"
                        onBuy={(qty) => onBuyAsset('stocks', stockName, qty, stockData.price)}
                        onSell={(qty) => onSellAsset('stocks', stockName, qty, stockData.price)}
                        isStock={true}
                        isTransacting={isTransacting}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* ===== INDEX FUNDS SECTION ===== */}
          {(() => {
            if (!isAssetUnlocked('INDEX_FUND') || !selectedAssets?.indexFunds || selectedAssets.indexFunds.length === 0) return null;

            const availableIndexFunds = selectedAssets.indexFunds.filter((fundName) => {
              const fundTimeline = ASSET_TIMELINE_DATA[fundName];
              if (!fundTimeline) return false;
              if (calendarYear > fundTimeline.firstYear) return true;
              if (calendarYear === fundTimeline.firstYear && gameState.currentMonth >= fundTimeline.firstMonth) return true;
              return false;
            });

            if (availableIndexFunds.length === 0) return null;

            return (
              <section className="index-section">
                <h3 className="section-header">INDEX FUNDS</h3>
                <div className="section-cards">
                  {availableIndexFunds.map((fundName) => {
                    const fundPrice = getPrice(fundName);
                    const fundHistory = getPriceHistory(fundName, 12);
                    const previousFundPrice = fundHistory[fundHistory.length - 2] || fundPrice;

                    return (
                      <TradeableAssetCard
                        key={fundName}
                        name={fundName}
                        currentPrice={fundPrice}
                        previousPrice={previousFundPrice}
                        priceHistory={fundHistory}
                        holding={gameState.holdings.indexFund[fundName] || { quantity: 0, avgPrice: 0, totalInvested: 0 }}
                        pocketCash={gameState.pocketCash}
                        unit="/unit"
                        onBuy={(qty) => onBuyAsset('indexFund', fundName, qty, fundPrice)}
                        onSell={(qty) => onSellAsset('indexFund', fundName, qty, fundPrice)}
                        isTransacting={isTransacting}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* ===== MUTUAL FUNDS SECTION ===== */}
          {(() => {
            if (!isAssetUnlocked('MUTUAL_FUND') || !selectedAssets?.mutualFunds || selectedAssets.mutualFunds.length === 0) return null;

            const availableMutualFunds = selectedAssets.mutualFunds.filter((fundName) => {
              const fundTimeline = ASSET_TIMELINE_DATA[fundName];
              if (!fundTimeline) return false;
              if (calendarYear > fundTimeline.firstYear) return true;
              if (calendarYear === fundTimeline.firstYear && gameState.currentMonth >= fundTimeline.firstMonth) return true;
              return false;
            });

            if (availableMutualFunds.length === 0) return null;

            return (
              <section className="mutual-section">
                <h3 className="section-header">MUTUAL FUNDS</h3>
                <div className="section-cards">
                  {availableMutualFunds.map((fundName) => {
                    const fundPrice = getPrice(fundName);
                    const fundHistory = getPriceHistory(fundName, 12);
                    const previousFundPrice = fundHistory[fundHistory.length - 2] || fundPrice;

                    return (
                      <TradeableAssetCard
                        key={fundName}
                        name={fundName}
                        currentPrice={fundPrice}
                        previousPrice={previousFundPrice}
                        priceHistory={fundHistory}
                        holding={gameState.holdings.mutualFund[fundName] || { quantity: 0, avgPrice: 0, totalInvested: 0 }}
                        pocketCash={gameState.pocketCash}
                        unit="/unit"
                        onBuy={(qty) => onBuyAsset('mutualFund', fundName, qty, fundPrice)}
                        onSell={(qty) => onSellAsset('mutualFund', fundName, qty, fundPrice)}
                        isTransacting={isTransacting}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* ===== COMMODITY SECTION ===== */}
          {isAssetUnlocked('COMMODITY') && selectedAssets && (
            <section className="commodity-section">
              <h3 className="section-header">COMMODITY</h3>
              <div className="section-cards">
                <TradeableAssetCard
                  name={selectedAssets.commodity}
                  currentPrice={commodityPrice}
                  previousPrice={previousCommodityPrice}
                  priceHistory={commodityHistory}
                  holding={gameState.holdings.commodity}
                  pocketCash={gameState.pocketCash}
                  unit={COMMODITY_UNITS[selectedAssets.commodity] || '/oz'}
                  onBuy={(qty) => onBuyAsset('commodity', selectedAssets.commodity, qty, commodityPrice)}
                  onSell={(qty) => onSellAsset('commodity', selectedAssets.commodity, qty, commodityPrice)}
                  isTransacting={isTransacting}
                />
              </div>
            </section>
          )}

          {/* ===== REITS SECTION ===== */}
          {selectedAssets && isAssetUnlocked(selectedAssets.reit) && (
            <section className="reit-section">
              <h3 className="section-header">REITs</h3>
              <div className="section-cards">
                <TradeableAssetCard
                  name={selectedAssets.reit}
                  currentPrice={reitPrice}
                  previousPrice={previousReitPrice}
                  priceHistory={reitHistory}
                  holding={gameState.holdings.reits[selectedAssets.reit] || { quantity: 0, avgPrice: 0, totalInvested: 0 }}
                  pocketCash={gameState.pocketCash}
                  unit="/unit"
                  onBuy={(qty) => onBuyAsset('reits', selectedAssets.reit, qty, reitPrice)}
                  onSell={(qty) => onSellAsset('reits', selectedAssets.reit, qty, reitPrice)}
                  isTransacting={isTransacting}
                />
              </div>
            </section>
          )}
        </div>
      </div>
      {/* Education Quiz Modal / Unlock Notification */}
      <AssetEducationModal
        isOpen={showEducationModal}
        content={currentQuizCategory ? getEducationContent(currentQuizCategory) : null}
        questionIndex={currentQuizCategory && gameState.quizQuestionIndices ? gameState.quizQuestionIndices[currentQuizCategory] : undefined}
        onComplete={handleQuizComplete}
        showQuiz={quizEnabled}
      />
    </div>
  );
};
