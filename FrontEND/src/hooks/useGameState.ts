import { useState, useEffect, useCallback, useRef } from 'react';
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
import { generateQuestionIndices } from '../utils/assetEducation';

// Performance optimization: Disable debug logging in production
const DEBUG_MODE = false; // Set to true only when debugging

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

// Helper that returns true when the game is definitively over. When true,
// we must avoid applying any further financial updates (interest, recurring
// income, buys/sells, FD changes, etc.).
const gameHasEnded = (s: GameState) => s.isStarted === false && s.currentYear >= TOTAL_GAME_YEARS;

export const useGameState = (isMultiplayer: boolean = false) => {
  const [gameState, setGameState] = useState<GameState>({
    mode: 'menu',
    currentYear: 1,
    currentMonth: 1,
    pocketCash: STARTING_CASH,
    // NOTE: `pocketCashReceivedTotal` is controlled solely by Host settings.
    // It is initialized from `adminSettings.initialPocketCash` and only increased
    // when Host-defined recurring income is applied (e.g., every 6 months).
    pocketCashReceivedTotal: STARTING_CASH,
    savingsAccount: { balance: 0, interestRate: SAVINGS_INTEREST_RATE },
    fixedDeposits: [],
    holdings: initialHoldings,
    gameStartTime: 0,
    isPaused: false,
    completedQuizzes: []
  });

  // Track if a transaction is in progress to prevent race conditions
  const transactionInProgress = useRef(false);
  const pendingTimeUpdate = useRef<{year: number; month: number} | null>(null);
  // Forward declare updateTime so it can be referenced earlier (see finishTransaction)
  let updateTime: ((year: number, month: number) => void) | undefined;

  // Track a reactive flag for UI to disable controls while a transaction is pending
  const [isTransactionPending, setIsTransactionPending] = useState(false);

  // Helper to finish a transaction: unlock the transaction and apply any pending time updates
  // Uses a short delay to let React state update settle and to debounce rapid duplicate clicks
  const finishTransaction = (delay = 250) => {
    setTimeout(() => {
      transactionInProgress.current = false;
      setIsTransactionPending(false);

      // If a time update arrived while transaction was in progress, apply it now
      if (pendingTimeUpdate.current) {
        const { year, month } = pendingTimeUpdate.current;
        pendingTimeUpdate.current = null;
        if (typeof updateTime === 'function') {
          updateTime(year, month);
        } else {
          // If updateTime is not available yet, schedule another microtask
          setTimeout(() => {
            if (typeof updateTime === 'function') updateTime(year, month);
          }, 0);
        }
      }
    }, delay);
  };

  // Keep a short-lived cache of recent transactions to avoid duplicates caused by
  // accidental double-clicks or race conditions in multiplayer. Keyed by
  // assetType|assetName|quantity|price (rounded) and expires after a few seconds.
  const recentTransactions = useRef<Map<string, number>>(new Map());

  // Reservation system: track amounts reserved for in-flight buys so two overlapping
  // buy attempts cannot both succeed due to reading the same pocketCash value.
  const reservedAmountRef = useRef<number>(0);
  const pocketCashRef = useRef<number>(gameState.pocketCash);

  // Keep pocketCashRef in sync with state
  useEffect(() => {
    pocketCashRef.current = gameState.pocketCash;
  }, [gameState.pocketCash]);


  // Debug: Monitor pocket cash changes with stack trace (temporary, verbose)
  const prevPocketCashRef = useRef<number>(gameState.pocketCash);
  useEffect(() => {
    const prev = prevPocketCashRef.current;
    const curr = gameState.pocketCash;
    if (prev !== curr) {
      console.warn(`🔍 pocketCash changed: ₹${prev.toFixed(2)} -> ₹${curr.toFixed(2)}`);
      console.trace('pocketCash change stack');
    }
    prevPocketCashRef.current = curr;
  }, [gameState.pocketCash]);

  // Note: Remove the above verbose logging once root cause is found.

  // Start game timer (disabled in multiplayer mode - server controls time)
  useEffect(() => {
    if (gameState.mode !== 'solo' || gameState.isPaused || isMultiplayer) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        // CRITICAL FIX: Stop timer if game has ended (year 20, month 12) and mark as ended
        if (prev.currentYear >= TOTAL_GAME_YEARS && prev.currentMonth === 12) {
          clearInterval(interval);
          return {
            ...prev,
            isStarted: false // Mark game as ended to trigger transition to End Game screen
          };
        }

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

        // Add recurring income every 6 months (months 6 and 12)
        let newPocketCash = prev.pocketCash;
        let newPocketCashReceivedTotal = prev.pocketCashReceivedTotal || 0;
        if ((newMonth === 6 || newMonth === 12) && prev.adminSettings?.recurringIncome) {
          newPocketCash += prev.adminSettings.recurringIncome;
          newPocketCashReceivedTotal += prev.adminSettings.recurringIncome;
        }

        return {
          ...prev,
          currentMonth: newMonth,
          currentYear: newYear,
          pocketCash: newPocketCash,
          pocketCashReceivedTotal: newPocketCashReceivedTotal,
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

  const startMultiplayerGame = useCallback((adminSettings: AdminSettings, initialData?: { selectedAssets?: any; assetUnlockSchedule?: any; yearlyQuotes?: string[]; quizQuestionIndices?: { [category: string]: number } }) => {
    // For multiplayer, either use provided initial data (from server/host) or generate locally
    let selectedAssets: SelectedAssets;
    let assetUnlockSchedule: any;
    let shuffledQuotes: string[];
    let quizQuestionIndices: { [category: string]: number };

    if (initialData && initialData.selectedAssets) {
      selectedAssets = initialData.selectedAssets;
      assetUnlockSchedule = initialData.assetUnlockSchedule;
      shuffledQuotes = initialData.yearlyQuotes || [...FINANCIAL_QUOTES].sort(() => Math.random() - 0.5);
      quizQuestionIndices = initialData.quizQuestionIndices || generateQuestionIndices();
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

      quizQuestionIndices = generateQuestionIndices();
    }

    setGameState({
      mode: 'solo',
      isStarted: true,
      currentYear: 1,
      currentMonth: 1,
      pocketCash: adminSettings.initialPocketCash || STARTING_CASH,
      pocketCashReceivedTotal: adminSettings.initialPocketCash || STARTING_CASH,
      savingsAccount: { balance: 0, interestRate: SAVINGS_INTEREST_RATE },
      fixedDeposits: [],
      holdings: initialHoldings,
      gameStartTime: Date.now(),
      isPaused: false,
      selectedAssets,
      adminSettings,
      assetUnlockSchedule,
      yearlyQuotes: shuffledQuotes,
      completedQuizzes: [],
      quizQuestionIndices
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

    // Generate random question indices for quiz (one per category, consistent for this game session)
    const quizQuestionIndices = generateQuestionIndices();

    setGameState({
      mode: 'solo',
      isStarted: true,
      currentYear: 1,
      currentMonth: 1,
      pocketCash: adminSettings?.initialPocketCash || STARTING_CASH,
      pocketCashReceivedTotal: adminSettings?.initialPocketCash || STARTING_CASH,
      savingsAccount: { balance: 0, interestRate: SAVINGS_INTEREST_RATE },
      fixedDeposits: [],
      holdings: initialHoldings,
      gameStartTime: Date.now(),
      isPaused: false,
      selectedAssets,
      adminSettings,
      assetUnlockSchedule,
      yearlyQuotes: shuffledQuotes,
      completedQuizzes: [],
      quizQuestionIndices
    });
  }, []);

  const backToMenu = useCallback(() => {
    setGameState({
      mode: 'menu',
      currentYear: 1,
      currentMonth: 1,
      pocketCash: STARTING_CASH,
      pocketCashReceivedTotal: STARTING_CASH,
      savingsAccount: { balance: 0, interestRate: SAVINGS_INTEREST_RATE },
      fixedDeposits: [],
      holdings: initialHoldings,
      gameStartTime: 0,
      isPaused: false
    });
  }, []);

  const depositToSavings = useCallback((amount: number) => {
    setGameState(prev => {
      if (gameHasEnded(prev)) return prev; // no updates after game end
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
      if (gameHasEnded(prev)) return prev;
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
      if (gameHasEnded(prev)) return prev;
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
    setGameState(prev => {      if (gameHasEnded(prev)) return prev;      const fd = prev.fixedDeposits.find(f => f.id === fdId);
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
      if (gameHasEnded(prev)) return prev;
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

      // Signature to detect duplicate rapid transactions
    const txSignature = `${assetType}|${assetName}|${quantity}|${currentPrice.toFixed(6)}`;
    const now = Date.now();
    const prevTs = recentTransactions.current.get(txSignature);

    console.debug(`[buyAsset] Attempting ${txSignature} now=${now} transactionInProgress=${transactionInProgress.current} reserved=${reservedAmountRef.current} pocket=${pocketCashRef.current}`);

    if (prevTs && now - prevTs < 1000) {
      console.warn(`⚠️ Duplicate buy detected (${txSignature}) — ignoring`);
      console.trace('Duplicate buy call stack');
      return;
    }

    // Prevent duplicate transactions via a ref lock
    if (transactionInProgress.current) {
      console.warn(`⚠️ Transaction already in progress, ignoring duplicate buy request`);
      return;
    }

    // Check available funds accounting for reserved amounts from in-flight buys
    const totalCost = quantity * currentPrice;
    const available = pocketCashRef.current - reservedAmountRef.current;
    if (totalCost > available) {
      console.warn(`❌ Insufficient available funds: required=${totalCost}, available=${available}`);
      alert(`Cannot buy ${assetName}: Not enough pocket cash`);
      return;
    }

    // Reserve funds immediately to block overlapping buys
    reservedAmountRef.current += totalCost;

    transactionInProgress.current = true;
    setIsTransactionPending(true);

    // Record this initiated transaction so quick repeated calls are ignored
    recentTransactions.current.set(txSignature, now);
    // Schedule automatic cleanup of this signature after 5s
    setTimeout(() => {
      recentTransactions.current.delete(txSignature);
    }, 5000);

    setGameState(prev => {
      if (gameHasEnded(prev)) return prev; // Prevent transactions after game end
      const totalCost = quantity * currentPrice;
      console.log(`🛒 Buying ${quantity} ${assetName} @ ₹${currentPrice} = ₹${totalCost} (${txSignature})`);
      // Additional safety: if reserved funds were altered (race), re-check inside update
      if (totalCost > prev.pocketCash) {
        // rollback reservation since we failed to apply transaction
        reservedAmountRef.current = Math.max(0, reservedAmountRef.current - totalCost);
        return prev;
      }

      // Always clone the nested holdings objects immutably to avoid accidental in-place mutations
      // which can cause duplicate-applied changes when multiple transactions are processed rapidly.
      const newHoldings = { ...prev.holdings } as typeof prev.holdings;

      if (assetType === 'physicalGold' || assetType === 'digitalGold' || assetType === 'indexFund' ||
          assetType === 'mutualFund' || assetType === 'commodity') {
        // Clone the specific holding object
        const holding = { ...(newHoldings[assetType as keyof typeof newHoldings] as AssetHolding) };
        const newQuantity = holding.quantity + quantity;
        const newTotalInvested = holding.totalInvested + totalCost;
        (newHoldings[assetType as keyof typeof newHoldings] as AssetHolding) = {
          quantity: newQuantity,
          avgPrice: newTotalInvested / newQuantity,
          totalInvested: newTotalInvested
        };
      } else if (assetType === 'stocks' || assetType === 'crypto' || assetType === 'reits') {
        // Clone the asset group (stocks/crypto/reits) before mutating
        const assetGroup = { ...(newHoldings[assetType as 'stocks' | 'crypto' | 'reits']) };
        const holding = assetGroup[assetName] ? { ...assetGroup[assetName] } : { quantity: 0, avgPrice: 0, totalInvested: 0 };
        const newQuantity = holding.quantity + quantity;
        const newTotalInvested = holding.totalInvested + totalCost;
        assetGroup[assetName] = {
          quantity: newQuantity,
          avgPrice: newTotalInvested / newQuantity,
          totalInvested: newTotalInvested
        };
        // Assign the cloned group back to newHoldings to keep immutability
        (newHoldings[assetType as 'stocks' | 'crypto' | 'reits']) = assetGroup;
      }

      const updatedState = {
        ...prev,
        pocketCash: prev.pocketCash - totalCost,
        holdings: newHoldings
      };

      // Release the reserved funds for this transaction after the state update settles
      setTimeout(() => {
        reservedAmountRef.current = Math.max(0, reservedAmountRef.current - totalCost);
        console.debug(`[buyAsset] Reservation released: -${totalCost}, reservedNow=${reservedAmountRef.current}`);
      }, 0);

      // Finish transaction (longer debounce to avoid duplicate buys) and process pending time updates
      finishTransaction();

      return updatedState;
    });
  }, []);

  const sellAsset = useCallback((assetType: string, assetName: string, quantity: number, currentPrice: number) => {
    // CRITICAL DEBUG: Always log sell transactions to catch pricing issues
    const txSignature = `${assetType}|${assetName}|${quantity}|${currentPrice.toFixed(6)}`;
    console.log(`\n🔍 ===== SELL TRANSACTION START ===== (${txSignature})`);
    console.log(`📌 Asset: ${assetName} (${assetType})`);
    console.log(`📌 Quantity to Sell: ${quantity}`);
    console.log(`📌 Current Price per unit: ₹${currentPrice}`);
    console.log(`📌 Expected Sale Amount: ₹${(quantity * currentPrice).toFixed(2)}`);
    console.debug(`📌 pocketCash=${pocketCashRef.current} reserved=${reservedAmountRef.current}`);

    // CRITICAL FIX: Prevent selling at price 0 (would cause bankruptcy!)
    if (currentPrice <= 0) {
      console.error(`❌ Cannot sell ${assetName}: Invalid price ${currentPrice}`);
      alert(`Cannot sell ${assetName}: Price data not available for this period`);
      return;
    }

    // Signature to detect duplicate rapid sell transactions
    const now = Date.now();
    const prevTs = recentTransactions.current.get(txSignature);
    if (prevTs && now - prevTs < 1000) {
      console.warn(`⚠️ Duplicate sell detected (${txSignature}) — ignoring`);
      console.trace('Duplicate sell call stack');
      return;
    }

    // Mark transaction as in progress
    transactionInProgress.current = true;
    setIsTransactionPending(true);
    recentTransactions.current.set(txSignature, now);
    setTimeout(() => {
      recentTransactions.current.delete(txSignature);
    }, 5000);

    setGameState(prev => {
      if (gameHasEnded(prev)) return prev; // Prevent transactions after game end
      // Clone top-level holdings and nested groups to avoid in-place mutations that cause UI mismatch
      const newHoldings = { ...prev.holdings } as typeof prev.holdings;
      let holding: AssetHolding | undefined;

      if (assetType === 'physicalGold' || assetType === 'digitalGold' || assetType === 'indexFund' ||
          assetType === 'mutualFund' || assetType === 'commodity') {
        // Clone the specific holding object
        holding = { ...((newHoldings[assetType as keyof typeof newHoldings] as AssetHolding)) };
      } else if (assetType === 'stocks' || assetType === 'crypto' || assetType === 'reits') {
        // Clone the asset group before reading/modifying
        const assetGroup = { ...(newHoldings[assetType as 'stocks' | 'crypto' | 'reits']) };
        holding = assetGroup[assetName];
      }

      if (!holding || holding.quantity < quantity) {
        if (DEBUG_MODE) {
          console.error(`❌ TRANSACTION BLOCKED: Insufficient holdings!`);
          console.error(`   Available: ${holding?.quantity || 0}, Requested: ${quantity}`);
        }
        return prev;
      }

      const saleAmount = quantity * currentPrice;
      const newQuantity = holding.quantity - quantity;
      const reducedInvestment = (holding.totalInvested / holding.quantity) * quantity;

      console.log(`💰 Sale Calculation:`);
      console.log(`   Holding Quantity: ${holding.quantity}`);
      console.log(`   Sale Amount: ₹${saleAmount.toFixed(2)}`);
      console.log(`   Reduced Investment: ₹${reducedInvestment.toFixed(2)}`);
      console.log(`   New Quantity: ${newQuantity}`);

      if (assetType === 'physicalGold' || assetType === 'digitalGold' || assetType === 'indexFund' ||
          assetType === 'mutualFund' || assetType === 'commodity') {
        (newHoldings[assetType as keyof typeof newHoldings] as AssetHolding) = {
          quantity: newQuantity,
          avgPrice: newQuantity > 0 ? (holding.totalInvested - reducedInvestment) / newQuantity : 0,
          totalInvested: holding.totalInvested - reducedInvestment
        };
      } else if (assetType === 'stocks' || assetType === 'crypto' || assetType === 'reits') {
        // Operate on cloned asset group and assign back immutably
        const assetGroup = { ...(newHoldings[assetType as 'stocks' | 'crypto' | 'reits']) };
        if (newQuantity === 0) {
          delete assetGroup[assetName];
        } else {
          assetGroup[assetName] = {
            quantity: newQuantity,
            avgPrice: (holding.totalInvested - reducedInvestment) / newQuantity,
            totalInvested: holding.totalInvested - reducedInvestment
          };
        }
        (newHoldings[assetType as 'stocks' | 'crypto' | 'reits']) = assetGroup;
      }
      const updatedState = {
        ...prev,
        pocketCash: prev.pocketCash + saleAmount,
        holdings: newHoldings
      };

      console.log(`✅ Updated Pocket Cash: ₹${prev.pocketCash.toFixed(2)} + ₹${saleAmount.toFixed(2)} = ₹${updatedState.pocketCash.toFixed(2)}`);
      console.log(`🔍 ===== SELL TRANSACTION END =====\n`);

      return updatedState;
    });

    // Finish transaction (longer debounce) and apply any pending time update
    finishTransaction();
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
  updateTime = useCallback((year: number, month: number) => {
    // If a transaction is in progress, defer the time update
    if (transactionInProgress.current) {
      pendingTimeUpdate.current = { year, month };
      return;
    }

    setGameState(prev => {
      // Do not apply any time updates once the game has ended
      if (gameHasEnded(prev)) return prev;

      // If server sent a year beyond the allowed game years, clamp to final and mark game ended
      if (year > TOTAL_GAME_YEARS) {
        return {
          ...prev,
          currentYear: TOTAL_GAME_YEARS,
          currentMonth: 12,
          isStarted: false
        };
      }

      // If server sent the final year and final month, mark game ended
      if (year === TOTAL_GAME_YEARS && month >= 12) {
        // Apply any month change interest & FD maturity semantics first (so final state's pocket/savings are updated)
        let newSavingsBalance = prev.savingsAccount.balance;
        if (month !== prev.currentMonth) {
          const monthlyInterest = prev.savingsAccount.balance * (SAVINGS_INTEREST_RATE / 12);
          newSavingsBalance = prev.savingsAccount.balance + monthlyInterest;
        }

        const updatedFDs = prev.fixedDeposits.map(fd => {
          if (!fd.isMatured && fd.maturityYear === year && fd.maturityMonth === month) {
            return { ...fd, isMatured: true };
          }
          return fd;
        });

        let newPocketCash = prev.pocketCash;
        let newPocketCashReceivedTotal = prev.pocketCashReceivedTotal || 0;
        if ((month === 6 || month === 12) && month !== prev.currentMonth && prev.adminSettings?.recurringIncome) {
          newPocketCash += prev.adminSettings.recurringIncome;
          newPocketCashReceivedTotal += prev.adminSettings.recurringIncome;
        }

        console.log('🎯 updateTime: final year/month received, marking game as ended locally');

        return {
          ...prev,
          currentYear: TOTAL_GAME_YEARS,
          currentMonth: 12,
          pocketCash: newPocketCash,
          pocketCashReceivedTotal: newPocketCashReceivedTotal,
          savingsAccount: { ...prev.savingsAccount, balance: newSavingsBalance },
          fixedDeposits: updatedFDs,
          isStarted: false,
        };
      }

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

      // Add recurring income every 6 months (months 6 and 12)
      let newPocketCash = prev.pocketCash;
      let newPocketCashReceivedTotal = prev.pocketCashReceivedTotal || 0;
      if ((month === 6 || month === 12) && month !== prev.currentMonth && prev.adminSettings?.recurringIncome) {
        newPocketCash += prev.adminSettings.recurringIncome;
        newPocketCashReceivedTotal += prev.adminSettings.recurringIncome;
      }

      return {
        ...prev,
        currentYear: year,
        currentMonth: month,
        pocketCash: newPocketCash,
        pocketCashReceivedTotal: newPocketCashReceivedTotal,
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
    updatePauseState,
    // Reactive flag for UI components to know whether a transaction is pending
    isTransactionPending
  };
};
