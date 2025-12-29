import { useState, useEffect, useCallback } from 'react';
import { GameState, FixedDeposit, AssetHolding, SelectedAssets, AdminSettings } from '../types';
import {
  MONTH_DURATION_MS,
  STARTING_CASH,
  SAVINGS_INTEREST_RATE,
  TOTAL_GAME_YEARS,
  AVAILABLE_STOCKS,
  AVAILABLE_INDEX_FUNDS,
  AVAILABLE_MUTUAL_FUNDS,
  AVAILABLE_COMMODITIES,
  FINANCIAL_QUOTES,
  getRandomItems,
  getRandomItem
} from '../utils/constants';
import { generateAssetUnlockSchedule } from '../utils/assetUnlockCalculator';

const initialHoldings = {
  physicalGold: { quantity: 0, avgPrice: 0, totalInvested: 0 },
  digitalGold: { quantity: 0, avgPrice: 0, totalInvested: 0 },
  indexFund: { quantity: 0, avgPrice: 0, totalInvested: 0 },
  mutualFund: { quantity: 0, avgPrice: 0, totalInvested: 0 },
  stocks: {},
  crypto: {},
  commodity: { quantity: 0, avgPrice: 0, totalInvested: 0 },
  reits: {}
};

export const useGameState = (isMultiplayer: boolean = false) => {
  const [gameState, setGameState] = useState<GameState>({
    mode: 'menu',
    currentYear: 1,
    currentMonth: 1,
    pocketCash: STARTING_CASH,
    savingsAccount: { balance: 0, interestRate: SAVINGS_INTEREST_RATE },
    fixedDeposits: [],
    holdings: initialHoldings,
    gameStartTime: 0,
    isPaused: false,
    completedQuizzes: []
  });

  // Debug: Monitor pocket cash changes
  useEffect(() => {
    console.log(`💵 Pocket Cash State: ₹${gameState.pocketCash.toFixed(2)}`);
  }, [gameState.pocketCash]);

  // Start game timer (disabled in multiplayer mode - server controls time)
  useEffect(() => {
    if (gameState.mode !== 'solo' || gameState.isPaused || isMultiplayer) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        // Check if game has ended before processing
        if (prev.currentYear > TOTAL_GAME_YEARS) {
          return prev;
        }

        let newMonth = prev.currentMonth + 1;
        let newYear = prev.currentYear;

        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }

        // Stop at year 20, month 12 - don't increment to year 21
        if (newYear > TOTAL_GAME_YEARS) {
          clearInterval(interval);
          return {
            ...prev,
            currentYear: TOTAL_GAME_YEARS,
            currentMonth: 12,
            isStarted: false, // Mark game as ended
          };
        }

        // Apply monthly savings account interest (annual rate / 12)
        const monthlyInterest = prev.savingsAccount.balance * (SAVINGS_INTEREST_RATE / 12);
        const newSavingsBalance = prev.savingsAccount.balance + monthlyInterest;

        // Update FD maturity status
        const updatedFDs = prev.fixedDeposits.map(fd => {
          if (!fd.isMatured && fd.maturityYear === newYear && fd.maturityMonth === newMonth) {
            return { ...fd, isMatured: true };
          }
          return fd;
        });

        return {
          ...prev,
          currentMonth: newMonth,
          currentYear: newYear,
          savingsAccount: { ...prev.savingsAccount, balance: newSavingsBalance },
          fixedDeposits: updatedFDs
        };
      });
    }, MONTH_DURATION_MS);

    return () => clearInterval(interval);
  }, [gameState.mode, gameState.isPaused, isMultiplayer]);

  const openSettings = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      mode: 'settings'
    }));
  }, []);

  const startMultiplayerGame = useCallback((adminSettings: AdminSettings, initialData?: { selectedAssets?: any; assetUnlockSchedule?: any; yearlyQuotes?: string[] }) => {
    // For multiplayer, either use provided initial data (from server/host) or generate locally
    let selectedAssets: SelectedAssets;
    let assetUnlockSchedule: any;
    let shuffledQuotes: string[];

    if (initialData && initialData.selectedAssets) {
      selectedAssets = initialData.selectedAssets;
      assetUnlockSchedule = initialData.assetUnlockSchedule;
      shuffledQuotes = initialData.yearlyQuotes || [...FINANCIAL_QUOTES].sort(() => Math.random() - 0.5);
    } else {
      const selectedStocks = getRandomItems(AVAILABLE_STOCKS, 2, 5);
      const fundType: 'index' | 'mutual' = Math.random() > 0.5 ? 'index' : 'mutual';
      const fundName = fundType === 'index'
        ? getRandomItem(AVAILABLE_INDEX_FUNDS)
        : getRandomItem(AVAILABLE_MUTUAL_FUNDS);
      const selectedCommodity = getRandomItem(AVAILABLE_COMMODITIES);

      selectedAssets = {
        stocks: selectedStocks,
        fundType,
        fundName,
        commodity: selectedCommodity
      };

      assetUnlockSchedule = generateAssetUnlockSchedule(
        adminSettings.selectedCategories,
        adminSettings.gameStartYear
      );

      shuffledQuotes = [...FINANCIAL_QUOTES].sort(() => Math.random() - 0.5);
    }

    setGameState({
      mode: 'solo',
      currentYear: 1,
      currentMonth: 1,
      pocketCash: STARTING_CASH,
      savingsAccount: { balance: 0, interestRate: SAVINGS_INTEREST_RATE },
      fixedDeposits: [],
      holdings: initialHoldings,
      gameStartTime: Date.now(),
      isPaused: false,
      selectedAssets,
      adminSettings,
      assetUnlockSchedule,
      yearlyQuotes: shuffledQuotes,
      completedQuizzes: []
    });
  }, []);

  const startSoloGame = useCallback((adminSettings?: AdminSettings) => {
    // Randomly select assets for this game
    const selectedStocks = getRandomItems(AVAILABLE_STOCKS, 2, 5);

    // When using admin settings, select earliest available fund based on selected categories
    let fundType: 'index' | 'mutual';
    let fundName: string;

    if (adminSettings) {
      const hasFunds = adminSettings.selectedCategories.includes('FUNDS');

      if (hasFunds) {
        // Randomly decide between index or mutual fund
        const useIndexFund = Math.random() > 0.5;
        fundType = useIndexFund ? 'index' : 'mutual';

        if (useIndexFund) {
          fundName = 'NIFTYBEES'; // Earliest index fund (2009)
        } else {
          fundName = 'SBI_Bluechip'; // Earliest mutual fund (2018)
        }
      } else {
        // Fallback to random if FUNDS not selected
        fundType = Math.random() > 0.5 ? 'index' : 'mutual';
        fundName = fundType === 'index'
          ? getRandomItem(AVAILABLE_INDEX_FUNDS)
          : getRandomItem(AVAILABLE_MUTUAL_FUNDS);
      }
    } else {
      // Random selection for quick start
      fundType = Math.random() > 0.5 ? 'index' : 'mutual';
      fundName = fundType === 'index'
        ? getRandomItem(AVAILABLE_INDEX_FUNDS)
        : getRandomItem(AVAILABLE_MUTUAL_FUNDS);
    }

    const selectedCommodity = getRandomItem(AVAILABLE_COMMODITIES);

    const selectedAssets: SelectedAssets = {
      stocks: selectedStocks,
      fundType,
      fundName,
      commodity: selectedCommodity
    };

    // Generate asset unlock schedule if admin settings are provided
    const assetUnlockSchedule = adminSettings
      ? generateAssetUnlockSchedule(adminSettings.selectedCategories, adminSettings.gameStartYear)
      : undefined;

    // Shuffle quotes for this game - one unique quote per year
    const shuffledQuotes = [...FINANCIAL_QUOTES].sort(() => Math.random() - 0.5);

    setGameState({
      mode: 'solo',
      currentYear: 1,
      currentMonth: 1,
      pocketCash: STARTING_CASH,
      savingsAccount: { balance: 0, interestRate: SAVINGS_INTEREST_RATE },
      fixedDeposits: [],
      holdings: initialHoldings,
      gameStartTime: Date.now(),
      isPaused: false,
      selectedAssets,
      adminSettings,
      assetUnlockSchedule,
      yearlyQuotes: shuffledQuotes,
      completedQuizzes: []
    });
  }, []);

  const backToMenu = useCallback(() => {
    setGameState({
      mode: 'menu',
      currentYear: 1,
      currentMonth: 1,
      pocketCash: STARTING_CASH,
      savingsAccount: { balance: 0, interestRate: SAVINGS_INTEREST_RATE },
      fixedDeposits: [],
      holdings: initialHoldings,
      gameStartTime: 0,
      isPaused: false
    });
  }, []);

  const depositToSavings = useCallback((amount: number) => {
    setGameState(prev => {
      if (amount > prev.pocketCash) return prev;
      return {
        ...prev,
        pocketCash: prev.pocketCash - amount,
        savingsAccount: {
          ...prev.savingsAccount,
          balance: prev.savingsAccount.balance + amount
        }
      };
    });
  }, []);

  const withdrawFromSavings = useCallback((amount: number) => {
    setGameState(prev => {
      if (amount > prev.savingsAccount.balance) return prev;
      return {
        ...prev,
        pocketCash: prev.pocketCash + amount,
        savingsAccount: {
          ...prev.savingsAccount,
          balance: prev.savingsAccount.balance - amount
        }
      };
    });
  }, []);

  const createFixedDeposit = useCallback((amount: number, duration: 3 | 12 | 36, interestRate: number) => {
    setGameState(prev => {
      if (amount > prev.pocketCash || prev.fixedDeposits.length >= 3) return prev;

      const maturityMonth = (prev.currentMonth + duration) % 12 || 12;
      const maturityYear = prev.currentYear + Math.floor((prev.currentMonth + duration - 1) / 12);

      const newFD: FixedDeposit = {
        id: `${Date.now()}-${Math.random()}`,
        amount,
        duration,
        interestRate,
        startMonth: prev.currentMonth,
        startYear: prev.currentYear,
        maturityMonth,
        maturityYear,
        isMatured: false
      };

      return {
        ...prev,
        pocketCash: prev.pocketCash - amount,
        fixedDeposits: [...prev.fixedDeposits, newFD]
      };
    });
  }, []);

  const collectFD = useCallback((fdId: string) => {
    setGameState(prev => {
      const fd = prev.fixedDeposits.find(f => f.id === fdId);
      if (!fd || !fd.isMatured) return prev;

      const maturityAmount = fd.amount * (1 + fd.interestRate / 100);

      return {
        ...prev,
        pocketCash: prev.pocketCash + maturityAmount,
        fixedDeposits: prev.fixedDeposits.filter(f => f.id !== fdId)
      };
    });
  }, []);

  const breakFD = useCallback((fdId: string) => {
    setGameState(prev => {
      const fd = prev.fixedDeposits.find(f => f.id === fdId);
      if (!fd) return prev;

      const penalty = 0.01; // 1% penalty
      const returnAmount = fd.amount * (1 - penalty);

      return {
        ...prev,
        pocketCash: prev.pocketCash + returnAmount,
        fixedDeposits: prev.fixedDeposits.filter(f => f.id !== fdId)
      };
    });
  }, []);

  const buyAsset = useCallback((assetType: string, assetName: string, quantity: number, currentPrice: number) => {
    // CRITICAL FIX: Prevent buying at price 0 (invalid transaction!)
    if (currentPrice <= 0) {
      console.error(`❌ Cannot buy ${assetName}: Invalid price ${currentPrice}`);
      alert(`Cannot buy ${assetName}: Price data not available for this period`);
      return;
    }

    setGameState(prev => {
      const totalCost = quantity * currentPrice;
      console.log(`🛒 Buying ${quantity} ${assetName} @ ₹${currentPrice} = ₹${totalCost}`);
      if (totalCost > prev.pocketCash) return prev;

      const newHoldings = { ...prev.holdings };

      if (assetType === 'physicalGold' || assetType === 'digitalGold' || assetType === 'indexFund' ||
          assetType === 'mutualFund' || assetType === 'commodity') {
        const holding = newHoldings[assetType as keyof typeof newHoldings] as AssetHolding;
        const newQuantity = holding.quantity + quantity;
        const newTotalInvested = holding.totalInvested + totalCost;
        (newHoldings[assetType as keyof typeof newHoldings] as AssetHolding) = {
          quantity: newQuantity,
          avgPrice: newTotalInvested / newQuantity,
          totalInvested: newTotalInvested
        };
      } else if (assetType === 'stocks' || assetType === 'crypto' || assetType === 'reits') {
        const assetGroup = newHoldings[assetType as 'stocks' | 'crypto' | 'reits'];
        const holding = assetGroup[assetName] || { quantity: 0, avgPrice: 0, totalInvested: 0 };
        const newQuantity = holding.quantity + quantity;
        const newTotalInvested = holding.totalInvested + totalCost;
        assetGroup[assetName] = {
          quantity: newQuantity,
          avgPrice: newTotalInvested / newQuantity,
          totalInvested: newTotalInvested
        };
      }

      return {
        ...prev,
        pocketCash: prev.pocketCash - totalCost,
        holdings: newHoldings
      };
    });
  }, []);

  const sellAsset = useCallback((assetType: string, assetName: string, quantity: number, currentPrice: number) => {
    // CRITICAL FIX: Prevent selling at price 0 (would cause bankruptcy!)
    if (currentPrice <= 0) {
      console.error(`❌ Cannot sell ${assetName}: Invalid price ${currentPrice}`);
      alert(`Cannot sell ${assetName}: Price data not available for this period`);
      return;
    }

    setGameState(prev => {
      const newHoldings = { ...prev.holdings };
      let holding: AssetHolding | undefined;

      if (assetType === 'physicalGold' || assetType === 'digitalGold' || assetType === 'indexFund' ||
          assetType === 'mutualFund' || assetType === 'commodity') {
        holding = newHoldings[assetType as keyof typeof newHoldings] as AssetHolding;
      } else if (assetType === 'stocks' || assetType === 'crypto' || assetType === 'reits') {
        const assetGroup = newHoldings[assetType as 'stocks' | 'crypto' | 'reits'];
        holding = assetGroup[assetName];
      }

      if (!holding || holding.quantity < quantity) return prev;

      const saleAmount = quantity * currentPrice;
      const previousPocketCash = prev.pocketCash;
      const newPocketCash = previousPocketCash + saleAmount;

      console.log(`💰 SELLING TRANSACTION:`);
      console.log(`   Asset: ${assetName} (${assetType})`);
      console.log(`   Quantity: ${quantity} @ ₹${currentPrice}/unit`);
      console.log(`   Sale Amount: ₹${saleAmount.toFixed(2)}`);
      console.log(`   Previous Pocket Cash: ₹${previousPocketCash.toFixed(2)}`);
      console.log(`   New Pocket Cash: ₹${newPocketCash.toFixed(2)}`);
      console.log(`   Holdings before: ${holding.quantity} units`);

      const newQuantity = holding.quantity - quantity;
      const reducedInvestment = (holding.totalInvested / holding.quantity) * quantity;

      if (assetType === 'physicalGold' || assetType === 'digitalGold' || assetType === 'indexFund' ||
          assetType === 'mutualFund' || assetType === 'commodity') {
        (newHoldings[assetType as keyof typeof newHoldings] as AssetHolding) = {
          quantity: newQuantity,
          avgPrice: newQuantity > 0 ? (holding.totalInvested - reducedInvestment) / newQuantity : 0,
          totalInvested: holding.totalInvested - reducedInvestment
        };
      } else if (assetType === 'stocks' || assetType === 'crypto' || assetType === 'reits') {
        const assetGroup = newHoldings[assetType as 'stocks' | 'crypto' | 'reits'];
        if (newQuantity === 0) {
          delete assetGroup[assetName];
        } else {
          assetGroup[assetName] = {
            quantity: newQuantity,
            avgPrice: (holding.totalInvested - reducedInvestment) / newQuantity,
            totalInvested: holding.totalInvested - reducedInvestment
          };
        }
      }

      const updatedState = {
        ...prev,
        pocketCash: prev.pocketCash + saleAmount,
        holdings: newHoldings
      };

      console.log(`✅ State updated - New pocket cash should be: ₹${updatedState.pocketCash.toFixed(2)}`);

      return updatedState;
    });

    // Log the state AFTER React updates it (in next render)
    console.log(`⏳ Waiting for React to apply state update...`);
  }, []);

  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  }, []);

  const markQuizCompleted = useCallback((category: string) => {
    setGameState(prev => ({
      ...prev,
      completedQuizzes: [...(prev.completedQuizzes || []), category]
    }));
  }, []);

  // Update time from external source (for multiplayer)
  const updateTime = useCallback((year: number, month: number) => {
    console.log(`🔄 Updating local time to Year ${year}, Month ${month}`);
    setGameState(prev => {
      console.log(`  Previous state: Year ${prev.currentYear}, Month ${prev.currentMonth}, Mode: ${prev.mode}`);

      // Apply monthly savings account interest if month changed
      let newSavingsBalance = prev.savingsAccount.balance;
      if (month !== prev.currentMonth) {
        const monthlyInterest = prev.savingsAccount.balance * (SAVINGS_INTEREST_RATE / 12);
        newSavingsBalance = prev.savingsAccount.balance + monthlyInterest;
      }

      // Update FD maturity status
      const updatedFDs = prev.fixedDeposits.map(fd => {
        if (!fd.isMatured && fd.maturityYear === year && fd.maturityMonth === month) {
          return { ...fd, isMatured: true };
        }
        return fd;
      });

      return {
        ...prev,
        currentYear: year,
        currentMonth: month,
        savingsAccount: { ...prev.savingsAccount, balance: newSavingsBalance },
        fixedDeposits: updatedFDs
      };
    });
  }, []);

  // Update pause state from external source (for multiplayer)
  const updatePauseState = useCallback((isPaused: boolean) => {
    setGameState(prev => ({
      ...prev,
      isPaused
    }));
  }, []);

  return {
    gameState,
    openSettings,
    startSoloGame,
    startMultiplayerGame,
    backToMenu,
    depositToSavings,
    withdrawFromSavings,
    createFixedDeposit,
    collectFD,
    breakFD,
    buyAsset,
    sellAsset,
    togglePause,
    markQuizCompleted,
    updateTime,
    updatePauseState
  };
};
