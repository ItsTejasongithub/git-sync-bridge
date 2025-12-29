import React, { useState, useEffect, useMemo } from 'react';
import { GameState, AssetData, FDRate } from '../types';
import { SavingsAccountCard } from './SavingsAccountCard';
import { FixedDepositCard } from './FixedDepositCard';
import { TradeableAssetCard } from './TradeableAssetCard';
import { AssetEducationModal } from './AssetEducationModal';
import { MultiplayerLeaderboardSidebar } from './MultiplayerLeaderboardSidebar';
import GameEndScreen from './GameEndScreen';
import { loadCSV, parseAssetCSV, parseFDRates, getAssetPriceAtDate, getFDRateForYear } from '../utils/csvLoader';
import { ASSET_UNLOCK_TIMELINE, STARTING_CASH } from '../utils/constants';
import { ASSET_TIMELINE_DATA } from '../utils/assetUnlockCalculator';
import { getEducationContent } from '../utils/assetEducation';
import './GameScreen.css';

interface GameScreenProps {
  gameState: GameState;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onCreateFD: (amount: number, duration: 3 | 12 | 36, rate: number) => void;
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
  leaderboardData
}) => {
  // Helper function to format numbers with commas (Indian numbering system)
  const formatCurrency = (amount: number): string => {
    const [integerPart, decimalPart] = amount.toFixed(2).split('.');

    // Indian numbering: last 3 digits, then groups of 2
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);

    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }

    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return `${formatted}.${decimalPart}`;
  };

  // Dynamic asset data storage
  const [assetDataMap, setAssetDataMap] = useState<{ [key: string]: AssetData[] }>({});
  const [fdRates, setFdRates] = useState<FDRate[]>([]);

  // Education modal state
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [currentQuizCategory, setCurrentQuizCategory] = useState<string | null>(null);

  const currentYear = gameState.currentYear;
  const selectedAssets = gameState.selectedAssets;
  const adminSettings = gameState.adminSettings;

  // Calculate calendar year if admin settings are present
  const calendarYear = adminSettings
    ? adminSettings.gameStartYear + currentYear - 1
    : 2005 + currentYear - 1;

  // Load CSV data dynamically based on selected assets
  useEffect(() => {
    const loadData = async () => {
      if (!selectedAssets) return;

      try {
        const dataMap: { [key: string]: AssetData[] } = {};

        // Load FD rates
        const fdText = await loadCSV('/data/Fd_Rate/fd_rates.csv');
        setFdRates(parseFDRates(fdText));

        // Load gold data (always available)
        const physicalGoldText = await loadCSV('/data/Gold_Investments/Physical_Gold.csv');
        dataMap['Physical_Gold'] = parseAssetCSV(physicalGoldText);

        const digitalGoldText = await loadCSV('/data/Gold_Investments/Digital_Gold.csv');
        dataMap['Digital_Gold'] = parseAssetCSV(digitalGoldText);

        // Load selected Index Fund or Mutual Fund
        const fundFolder = selectedAssets.fundType === 'index' ? 'Index_Funds' : 'Mutual_Funds';
        const fundText = await loadCSV(`/data/${fundFolder}/${selectedAssets.fundName}.csv`);
        dataMap[selectedAssets.fundName] = parseAssetCSV(fundText);

        // Load selected stocks
        for (const stock of selectedAssets.stocks) {
          const stockText = await loadCSV(`/data/Indian_Stocks/${stock}.csv`);
          dataMap[stock] = parseAssetCSV(stockText);
        }

        // Load Crypto data (always BTC and ETH)
        const btcText = await loadCSV('/data/Crypto_Assets/BTC.csv');
        dataMap['BTC'] = parseAssetCSV(btcText);

        const ethText = await loadCSV('/data/Crypto_Assets/ETH.csv');
        dataMap['ETH'] = parseAssetCSV(ethText);

        // Load selected commodity
        const commodityText = await loadCSV(`/data/Commodities/${selectedAssets.commodity}.csv`);
        dataMap[selectedAssets.commodity] = parseAssetCSV(commodityText);

        // Load REIT data (always EMBASSY and MINDSPACE)
        const embassyText = await loadCSV('/data/REIT/EMBASSY.csv');
        dataMap['EMBASSY'] = parseAssetCSV(embassyText);

        const mindspaceText = await loadCSV('/data/REIT/MINDSPACE.csv');
        dataMap['MINDSPACE'] = parseAssetCSV(mindspaceText);

        setAssetDataMap(dataMap);
      } catch (error) {
        console.error('Error loading CSV data:', error);
      }
    };

    loadData();
  }, [selectedAssets]);

  // Check if asset category is unlocked based on admin settings or default timeline
  const isAssetCategoryUnlocked = (checkName: string): boolean => {
    // If admin settings exist, use the unlock schedule
    if (gameState.assetUnlockSchedule) {
      // Map common names to asset types in the schedule
      const assetTypeMap: { [key: string]: string[] } = {
        'SAVINGS_AC': ['SAVINGS_AC'],
        'FIXED_DEPOSIT': ['FD'],
        'PHYSICAL_GOLD': ['Physical_Gold'],
        'DIGITAL_GOLD': ['Digital_Gold'],
        'INDIAN_STOCKS': ['STOCKS'],
        'BTC': ['BTC'],
        'ETH': ['ETH'],
        'COMMODITY': ['COTTON', 'WHEAT', 'CRUDEOIL_WTI', 'SILVER', 'NATURALGAS', 'COPPER', 'BRENT', 'ALUMINIUM'],
        'EMBASSY': ['EMBASSY'],
        'MINDSPACE': ['MINDSPACE'],
        'INDEX_FUND': ['NIFTYBEES', 'UTINIFTETF', 'HDFCNIFETF', 'SETFNIF50', 'SBI_Bluechip', 'ICICI_Bluechip', 'Axis_Midcap', 'Kotak_Emerging', 'PGIM_Midcap', 'Nippon_SmallCap'],
        'MUTUAL_FUND': ['NIFTYBEES', 'UTINIFTETF', 'HDFCNIFETF', 'SETFNIF50', 'SBI_Bluechip', 'ICICI_Bluechip', 'Axis_Midcap', 'Kotak_Emerging', 'PGIM_Midcap', 'Nippon_SmallCap']
      };

      const assetTypesToCheck = assetTypeMap[checkName] || [checkName];

      for (let year = 1; year <= currentYear; year++) {
        const unlocks = gameState.assetUnlockSchedule[year];
        if (unlocks) {
          for (const unlock of unlocks) {
            // Check if this asset type matches
            if (assetTypesToCheck.includes(unlock.assetType)) {
              // CRITICAL: For INDEX_FUND and MUTUAL_FUND, check the selected fund's timeline
              if ((checkName === 'INDEX_FUND' || checkName === 'MUTUAL_FUND') && selectedAssets) {
                const fundTimeline = ASSET_TIMELINE_DATA[selectedAssets.fundName];
                if (fundTimeline) {
                  // Check year first, then month if year matches
                  if (calendarYear > fundTimeline.firstYear) {
                    return true;
                  } else if (calendarYear === fundTimeline.firstYear && gameState.currentMonth >= fundTimeline.firstMonth) {
                    return true;
                  } else {
                    return false; // Data not available yet
                  }
                }
              }

              // CRITICAL: Also verify calendar year AND month has reached the asset's availability
              const assetTimeline = ASSET_TIMELINE_DATA[unlock.assetType];
              if (assetTimeline) {
                // Check year first, then month if year matches
                if (calendarYear > assetTimeline.firstYear) {
                  return true;
                } else if (calendarYear === assetTimeline.firstYear && gameState.currentMonth >= assetTimeline.firstMonth) {
                  return true;
                } else {
                  return false; // Data not available yet
                }
              } else {
                // If no timeline data exists, allow unlock (backward compatibility)
                return true;
              }
            }
            // Check if category matches (for STOCKS, INDEX_FUNDS, etc.)
            if (unlock.assetType === 'STOCKS' && checkName === 'INDIAN_STOCKS') {
              return true;
            }
          }
        }
      }
      return false;
    }

    // Fallback to default timeline if no admin settings
    for (const [year, assets] of Object.entries(ASSET_UNLOCK_TIMELINE)) {
      if (assets.includes(checkName) && currentYear >= parseInt(year)) {
        // CRITICAL: Also check if calendar year has reached the asset's data availability
        const assetTypeMap: { [key: string]: string } = {
          'PHYSICAL_GOLD': 'Physical_Gold',
          'DIGITAL_GOLD': 'Digital_Gold',
          'BTC': 'BTC',
          'ETH': 'ETH'
        };

        // For INDEX_FUND and MUTUAL_FUND, check the selected fund's timeline
        if ((checkName === 'INDEX_FUND' || checkName === 'MUTUAL_FUND') && selectedAssets) {
          const fundTimeline = ASSET_TIMELINE_DATA[selectedAssets.fundName];
          if (fundTimeline) {
            // Check year first, then month if year matches
            if (calendarYear > fundTimeline.firstYear) {
              return true;
            } else if (calendarYear === fundTimeline.firstYear && gameState.currentMonth >= fundTimeline.firstMonth) {
              return true;
            } else {
              return false; // Data not available yet
            }
          }
        }

        const assetType = assetTypeMap[checkName];
        if (assetType) {
          const assetTimeline = ASSET_TIMELINE_DATA[assetType];
          if (assetTimeline) {
            // Check year first, then month if year matches
            if (calendarYear > assetTimeline.firstYear) {
              return true;
            } else if (calendarYear === assetTimeline.firstYear && gameState.currentMonth >= assetTimeline.firstMonth) {
              return true;
            } else {
              return false; // Data not available yet
            }
          }
        }

        // For assets without timeline data (like SAVINGS_AC, FIXED_DEPOSIT), allow unlock
        return true;
      }
    }
    return false;
  };

  // Legacy function name for backward compatibility
  const isAssetUnlocked = isAssetCategoryUnlocked;

  // Detect newly unlocked categories and show quiz modal
  useEffect(() => {
    const completedQuizzes = gameState.completedQuizzes || [];

    // Define category mapping for quiz detection
    const categoryMap: { [key: string]: string } = {
      'SAVINGS_AC': 'SAVINGS_AC',
      'FIXED_DEPOSIT': 'FIXED_DEPOSIT',
      'PHYSICAL_GOLD': 'GOLD',
      'DIGITAL_GOLD': 'GOLD',
      'INDIAN_STOCKS': 'STOCKS',
      'BTC': 'CRYPTO',
      'ETH': 'CRYPTO',
      'COMMODITY': 'COMMODITY',
      'INDEX_FUND': 'INDEX_FUND',
      'MUTUAL_FUND': 'MUTUAL_FUND',
      'EMBASSY': 'REIT',
      'MINDSPACE': 'REIT'
    };

    // Build dynamic list of categories to check based on user's selected assets
    const categoriesToCheck = [
      'SAVINGS_AC', 'FIXED_DEPOSIT', 'PHYSICAL_GOLD', 'INDIAN_STOCKS',
      'BTC', 'COMMODITY', 'EMBASSY'
    ];

    // Only add the fund type that user actually selected (not both!)
    if (selectedAssets) {
      if (selectedAssets.fundType === 'index') {
        categoriesToCheck.push('INDEX_FUND');
      } else {
        categoriesToCheck.push('MUTUAL_FUND');
      }
    }

    for (const category of categoriesToCheck) {
      const quizCategory = categoryMap[category];

      // Skip if quiz already completed
      if (completedQuizzes.includes(quizCategory)) continue;

      // Check if category is now unlocked
      if (isAssetCategoryUnlocked(category)) {
        // Skip if quiz modal is already showing
        if (showEducationModal) break;

        // Show quiz for this category
        const educationContent = getEducationContent(quizCategory);
        if (educationContent) {
          setCurrentQuizCategory(quizCategory);
          setShowEducationModal(true);
          // Notify server in multiplayer mode
          if (onQuizStarted) {
            onQuizStarted(quizCategory);
          }
          // Pause the game when quiz appears
          if (!gameState.isPaused) {
            onTogglePause();
          }
          break; // Show one quiz at a time
        }
      }
    }
  }, [currentYear, gameState.currentMonth, gameState.completedQuizzes, isAssetCategoryUnlocked, gameState.isPaused, onTogglePause, onQuizStarted, selectedAssets, showEducationModal]);

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
    }
  };

  // Get current FD rates (use calendar year)
  const currentFDRates = {
    threeMonth: getFDRateForYear(fdRates, calendarYear, 3),
    oneYear: getFDRateForYear(fdRates, calendarYear, 12),
    threeYear: getFDRateForYear(fdRates, calendarYear, 36)
  };

  // Helper function to get asset data safely
  const getAssetData = (assetName: string): AssetData[] => {
    return assetDataMap[assetName] || [];
  };

  // Get asset prices (use calendar year)
  const physicalGoldPrice = getAssetPriceAtDate(getAssetData('Physical_Gold'), calendarYear, gameState.currentMonth);
  const digitalGoldPrice = getAssetPriceAtDate(getAssetData('Digital_Gold'), calendarYear, gameState.currentMonth);

  // Get price history for charts (last 12 months)
  const getRecentPrices = (data: AssetData[], months: number = 12): number[] => {
    const prices: number[] = [];
    for (let i = months; i >= 0; i--) {
      let targetMonth = gameState.currentMonth - i;
      let targetCalendarYear = calendarYear;

      if (targetMonth <= 0) {
        targetMonth += 12;
        targetCalendarYear -= 1;
      }

      const price = getAssetPriceAtDate(data, targetCalendarYear, targetMonth);
      prices.push(price);
    }
    return prices;
  };

  const physicalGoldHistory = getRecentPrices(getAssetData('Physical_Gold'));
  const digitalGoldHistory = getRecentPrices(getAssetData('Digital_Gold'));

  const previousPhysicalGoldPrice = physicalGoldHistory[physicalGoldHistory.length - 2] || physicalGoldPrice;
  const previousDigitalGoldPrice = digitalGoldHistory[digitalGoldHistory.length - 2] || digitalGoldPrice;

  // Fund prices (dynamically selected) - use calendar year
  const fundPrice = selectedAssets ? getAssetPriceAtDate(getAssetData(selectedAssets.fundName), calendarYear, gameState.currentMonth) : 0;
  const fundHistory = selectedAssets ? getRecentPrices(getAssetData(selectedAssets.fundName)) : [];
  const previousFundPrice = fundHistory[fundHistory.length - 2] || fundPrice;

  // Crypto prices - use calendar year
  const btcPrice = getAssetPriceAtDate(getAssetData('BTC'), calendarYear, gameState.currentMonth);
  const btcHistory = getRecentPrices(getAssetData('BTC'));
  const previousBtcPrice = btcHistory[btcHistory.length - 2] || btcPrice;

  const ethPrice = getAssetPriceAtDate(getAssetData('ETH'), calendarYear, gameState.currentMonth);
  const ethHistory = getRecentPrices(getAssetData('ETH'));
  const previousEthPrice = ethHistory[ethHistory.length - 2] || ethPrice;

  // Commodity prices (dynamically selected) - use calendar year
  const commodityPrice = selectedAssets ? getAssetPriceAtDate(getAssetData(selectedAssets.commodity), calendarYear, gameState.currentMonth) : 0;
  const commodityHistory = selectedAssets ? getRecentPrices(getAssetData(selectedAssets.commodity)) : [];
  const previousCommodityPrice = commodityHistory[commodityHistory.length - 2] || commodityPrice;

  // REIT prices - use calendar year
  const embassyPrice = getAssetPriceAtDate(getAssetData('EMBASSY'), calendarYear, gameState.currentMonth);
  const embassyHistory = getRecentPrices(getAssetData('EMBASSY'));
  const previousEmbassyPrice = embassyHistory[embassyHistory.length - 2] || embassyPrice;

  const mindspacePrice = getAssetPriceAtDate(getAssetData('MINDSPACE'), calendarYear, gameState.currentMonth);
  const mindspaceHistory = getRecentPrices(getAssetData('MINDSPACE'));
  const previousMindspacePrice = mindspaceHistory[mindspaceHistory.length - 2] || mindspacePrice;

  // Helper function to get stock price data dynamically - use calendar year
  const getStockPriceData = (stockName: string) => {
    const data = getAssetData(stockName);
    const price = getAssetPriceAtDate(data, calendarYear, gameState.currentMonth);
    const history = getRecentPrices(data);
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

    // Fixed deposits
    gameState.fixedDeposits.forEach(fd => {
      const fdValue = fd.isMatured ? fd.amount * (1 + fd.interestRate / 100) : fd.amount;
      currentValue += fdValue;
    });

    // Gold
    const goldValue =
      (gameState.holdings.physicalGold.quantity * physicalGoldPrice) +
      (gameState.holdings.digitalGold.quantity * digitalGoldPrice);
    currentValue += goldValue;

    // Funds
    const fundsValue =
      (gameState.holdings.indexFund.quantity * fundPrice) +
      (gameState.holdings.mutualFund.quantity * fundPrice);
    currentValue += fundsValue;

    // Stocks
    let stocksValue = 0;
    Object.entries(gameState.holdings.stocks).forEach(([stockName, holding]) => {
      if (holding.quantity > 0 && assetDataMap[stockName]) {
        const stockPrice = getAssetPriceAtDate(assetDataMap[stockName], calendarYear, gameState.currentMonth);
        stocksValue += holding.quantity * stockPrice;
      }
    });
    currentValue += stocksValue;

    // Crypto
    const cryptoValue =
      ((gameState.holdings.crypto['BTC']?.quantity || 0) * btcPrice) +
      ((gameState.holdings.crypto['ETH']?.quantity || 0) * ethPrice);
    currentValue += cryptoValue;

    // Commodities
    const commoditiesValue = gameState.holdings.commodity.quantity * commodityPrice;
    currentValue += commoditiesValue;

    // REITs
    const reitsValue =
      ((gameState.holdings.reits['EMBASSY']?.quantity || 0) * embassyPrice) +
      ((gameState.holdings.reits['MINDSPACE']?.quantity || 0) * mindspacePrice);
    currentValue += reitsValue;

    return {
      networth: currentValue,
      breakdown: {
        cash: pocketCashValue,
        savings: savingsValue,
        gold: goldValue,
        funds: fundsValue,
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
    physicalGoldPrice,
    digitalGoldPrice,
    fundPrice,
    btcPrice,
    ethPrice,
    commodityPrice,
    embassyPrice,
    mindspacePrice,
    assetDataMap,
    calendarYear,
  ]);

  // Notify parent component when networth changes (for multiplayer sync)
  useEffect(() => {
    if (onNetworthCalculated) {
      onNetworthCalculated(networthData.networth, networthData.breakdown);
    }
  }, [networthData, onNetworthCalculated]);

  // Check if game has ended
  const isGameEnded = !gameState.isStarted && gameState.currentYear === 20;

  // If game ended, show end screen
  if (isGameEnded) {
    return (
      <GameEndScreen
        gameState={gameState}
        isMultiplayer={showLeaderboard}
        leaderboardData={leaderboardData}
        onReturnToMenu={onReturnToMenu || (() => window.location.reload())}
      />
    );
  }

  return (
    <div className="game-screen">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="logo-banner">
          <h1 className="game-logo">BULL RUN</h1>
        </div>

        <div className="game-info">
          <p className="quote">
            {gameState.yearlyQuotes && gameState.yearlyQuotes[gameState.currentYear - 1]
              ? gameState.yearlyQuotes[gameState.currentYear - 1]
              : "Rule No. 1 is never lose money. Rule No. 2 is never forget Rule No. 1."}
          </p>
        </div>

        <div className="pocket-cash">
          <div className="pocket-label">Pocket Cash</div>
          <div className="pocket-amount">₹{formatCurrency(gameState.pocketCash)}</div>
        </div>

        {/* Net Worth Section */}
        {(() => {
          // Use pre-calculated networth from useMemo (optimization - no duplicate calculation)
          const netWorth = networthData.networth;
          const breakdown: { name: string; value: number; percentage: number }[] = [];

          // Build breakdown array for display (using pre-calculated values)
          if (netWorth > 0) {
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

          // Calculate percentage gain/loss based on starting cash (₹1,00,000)
          const gainFromStart = netWorth - STARTING_CASH;
          const gainPercentage = (gainFromStart / STARTING_CASH) * 100;

          return (
            <div className="net-worth">
              <div className="net-worth-label">Net Worth</div>
              <div className="net-worth-amount">₹{formatCurrency(netWorth)}</div>
              <div className="net-worth-pl" style={{ color: gainFromStart >= 0 ? '#48ff00ff' : 'rgba(208, 0, 0, 1)' }}>
                {gainFromStart >= 0 ? '+' : ''}₹{formatCurrency(gainFromStart)} ({gainFromStart >= 0 ? '+' : ''}{gainPercentage.toFixed(2)}%)
              </div>

              <div className="net-worth-breakdown">
                <div className="breakdown-title">Portfolio Breakdown</div>
                {breakdown.map((item, idx) => (
                  <div key={idx} className="breakdown-item">
                    <span className="breakdown-name">{item.name}</span>
                    <span className="breakdown-percentage">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
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
          <div>Year: {currentYear}/20</div>
          {adminSettings && !adminSettings.hideCurrentYear && (
            <div>Calendar: {calendarYear}</div>
          )}
          <div>Month: {gameState.currentMonth}</div>
        </div>

        {showPauseButton && (
          <button className="pause-button" onClick={onTogglePause}>
            {gameState.isPaused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
        )}

        {/* Multiplayer Leaderboard */}
        {showLeaderboard && <MultiplayerLeaderboardSidebar />}
      </div>

      {/* Main Content */}
      <div className={`main-content year-${currentYear}`}>
        {/* Dynamic Layout Based on Unlocked Assets */}
        <div className="dynamic-assets-layout">
            {/* BANKING Section */}
            <section className="banking-section">
              <h2 className="section-title">BANKING</h2>
              <div className="section-cards">
                <SavingsAccountCard
                  balance={gameState.savingsAccount.balance}
                  pocketCash={gameState.pocketCash}
                  onDeposit={onDeposit}
                  onWithdraw={onWithdraw}
                />
                {isAssetUnlocked('FIXED_DEPOSIT') && (
                  <FixedDepositCard
                    fixedDeposits={gameState.fixedDeposits}
                    pocketCash={gameState.pocketCash}
                    currentRates={currentFDRates}
                    onCreate={onCreateFD}
                    onCollect={onCollectFD}
                    onBreak={onBreakFD}
                  />
                )}
              </div>
            </section>

            {/* GOLD Section */}
            {(isAssetUnlocked('PHYSICAL_GOLD') || isAssetUnlocked('DIGITAL_GOLD')) && (
              <section className="gold-section">
                <h2 className="section-title">GOLD</h2>
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
                    />
                  )}
                </div>
              </section>
            )}

            {/* INDEX FUND Section */}
            {isAssetUnlocked(selectedAssets?.fundType === 'index' ? 'INDEX_FUND' : 'MUTUAL_FUND') && (
              <section className="index-section">
                <h2 className="section-title">{selectedAssets?.fundType === 'index' ? 'INDEX FUND' : 'MUTUAL FUND'}</h2>
                <div className="section-cards">
                  {selectedAssets && (
                    <TradeableAssetCard
                      name={selectedAssets.fundName}
                      currentPrice={fundPrice}
                      previousPrice={previousFundPrice}
                      priceHistory={fundHistory}
                      holding={selectedAssets.fundType === 'index' ? gameState.holdings.indexFund : gameState.holdings.mutualFund}
                      pocketCash={gameState.pocketCash}
                      unit="/share"
                      onBuy={(qty) => onBuyAsset(selectedAssets.fundType === 'index' ? 'indexFund' : 'mutualFund', selectedAssets.fundName, qty, fundPrice)}
                      onSell={(qty) => onSellAsset(selectedAssets.fundType === 'index' ? 'indexFund' : 'mutualFund', selectedAssets.fundName, qty, fundPrice)}
                    />
                  )}
                </div>
              </section>
            )}

            {/* INDIVIDUAL STOCKS Section - Dynamic */}
            {isAssetUnlocked('INDIAN_STOCKS') && selectedAssets && (
              <section className="stocks-section">
                <h2 className="section-title">INDIVIDUAL STOCKS</h2>
                <div className="section-cards">
                  {selectedAssets.stocks
                    .filter((stockName) => {
                      // Only show stocks whose data is available at the current calendar year/month
                      const stockTimeline = ASSET_TIMELINE_DATA[stockName];
                      if (!stockTimeline) return false;

                      // Check if stock data is available for current calendar year and month
                      if (calendarYear > stockTimeline.firstYear) {
                        return true;
                      } else if (calendarYear === stockTimeline.firstYear && gameState.currentMonth >= stockTimeline.firstMonth) {
                        return true;
                      } else {
                        return false; // Data not available yet
                      }
                    })
                    .map((stockName) => {
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
                        />
                      );
                    })}
                </div>
              </section>
            )}

            {/* CRYPTOCURRENCY Section */}
            {(isAssetUnlocked('BTC') || isAssetUnlocked('ETH')) && (
              <section className="crypto-section">
                <h2 className="section-title">CRYPTOCURRENCY</h2>
                <div className="section-cards">
                  {isAssetUnlocked('BTC') && (
                    <TradeableAssetCard
                      name="BTC"
                      currentPrice={btcPrice}
                      previousPrice={previousBtcPrice}
                      priceHistory={btcHistory}
                      holding={gameState.holdings.crypto['BTC'] || { quantity: 0, avgPrice: 0, totalInvested: 0 }}
                      pocketCash={gameState.pocketCash}
                      unit="/coin"
                      onBuy={(qty) => onBuyAsset('crypto', 'BTC', qty, btcPrice)}
                      onSell={(qty) => onSellAsset('crypto', 'BTC', qty, btcPrice)}
                    />
                  )}
                  {isAssetUnlocked('ETH') && (
                    <TradeableAssetCard
                      name="ETH"
                      currentPrice={ethPrice}
                      previousPrice={previousEthPrice}
                      priceHistory={ethHistory}
                      holding={gameState.holdings.crypto['ETH'] || { quantity: 0, avgPrice: 0, totalInvested: 0 }}
                      pocketCash={gameState.pocketCash}
                      unit="/coin"
                      onBuy={(qty) => onBuyAsset('crypto', 'ETH', qty, ethPrice)}
                      onSell={(qty) => onSellAsset('crypto', 'ETH', qty, ethPrice)}
                    />
                  )}
                </div>
              </section>
            )}

            {/* COMMODITY Section - Dynamic */}
            {isAssetUnlocked('COMMODITY') && selectedAssets && (
              <section className="commodity-section">
                <h2 className="section-title">COMMODITY</h2>
                <div className="section-cards">
                  <TradeableAssetCard
                    name={selectedAssets.commodity}
                    currentPrice={commodityPrice}
                    previousPrice={previousCommodityPrice}
                    priceHistory={commodityHistory}
                    holding={gameState.holdings.commodity}
                    pocketCash={gameState.pocketCash}
                    unit="/oz"
                    onBuy={(qty) => onBuyAsset('commodity', selectedAssets.commodity, qty, commodityPrice)}
                    onSell={(qty) => onSellAsset('commodity', selectedAssets.commodity, qty, commodityPrice)}
                  />
                </div>
              </section>
            )}

            {/* REITs Section */}
            {(isAssetUnlocked('EMBASSY') || isAssetUnlocked('MINDSPACE')) && (
              <section className="reit-section">
                <h2 className="section-title">REITs</h2>
                <div className="section-cards">
                  {isAssetUnlocked('EMBASSY') && (
                    <TradeableAssetCard
                      name="EMBASSY"
                      currentPrice={embassyPrice}
                      previousPrice={previousEmbassyPrice}
                      priceHistory={embassyHistory}
                      holding={gameState.holdings.reits['EMBASSY'] || { quantity: 0, avgPrice: 0, totalInvested: 0 }}
                      pocketCash={gameState.pocketCash}
                      unit="/share"
                      onBuy={(qty) => onBuyAsset('reits', 'EMBASSY', qty, embassyPrice)}
                      onSell={(qty) => onSellAsset('reits', 'EMBASSY', qty, embassyPrice)}
                    />
                  )}
                  {isAssetUnlocked('MINDSPACE') && (
                    <TradeableAssetCard
                      name="MINDSPACE"
                      currentPrice={mindspacePrice}
                      previousPrice={previousMindspacePrice}
                      priceHistory={mindspaceHistory}
                      holding={gameState.holdings.reits['MINDSPACE'] || { quantity: 0, avgPrice: 0, totalInvested: 0 }}
                      pocketCash={gameState.pocketCash}
                      unit="/share"
                      onBuy={(qty) => onBuyAsset('reits', 'MINDSPACE', qty, mindspacePrice)}
                      onSell={(qty) => onSellAsset('reits', 'MINDSPACE', qty, mindspacePrice)}
                    />
                  )}
                </div>
              </section>
            )}
        </div>
      </div>

      {/* Education Quiz Modal */}
      <AssetEducationModal
        isOpen={showEducationModal}
        content={currentQuizCategory ? getEducationContent(currentQuizCategory) : null}
        onComplete={handleQuizComplete}
      />
    </div>
  );
};
