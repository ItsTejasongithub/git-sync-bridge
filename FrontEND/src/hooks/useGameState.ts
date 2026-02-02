import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, FixedDeposit, AssetHolding, SelectedAssets, AdminSettings, CashTransaction } from '../types';
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
import { generateLifeEvents } from '../utils/lifeEvents';
import { generateAssetUnlockSchedule, extractSelectedAssetsFromSchedule } from '../utils/assetUnlockCalculator';
import { generateQuestionIndices } from '../utils/assetEducation';
import { tradeTracker } from '../utils/tradeTracker';
import { bankingTracker } from '../utils/bankingTracker';

// Performance optimization: Disable debug logging in production
// const DEBUG_MODE = false; // Set to true only when debugging

const initialHoldings = {
  physicalGold: { quantity: 0, avgPrice: 0, totalInvested: 0 },
  digitalGold: { quantity: 0, avgPrice: 0, totalInvested: 0 },
  indexFund: {}, // Changed to dictionary to support multiple index funds
  mutualFund: {}, // Changed to dictionary to support multiple mutual funds
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
  const pendingTimeUpdate = useRef<{ year: number; month: number } | null>(null);
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

  // Life event popup state (holds the most recent event to display in UI)
  const [lifeEventPopup, setLifeEventPopup] = useState<any | null>(null);

  // Keep a short-lived cache of recent transactions to avoid duplicates caused by
  // accidental double-clicks or race conditions in multiplayer. Keyed by
  // assetType|assetName|quantity|price (rounded) and expires after a few seconds.
  const recentTransactions = useRef<Map<string, number>>(new Map());

  // Reservation system: track amounts reserved for in-flight buys so two overlapping
  // buy attempts cannot both succeed due to reading the same pocketCash value.
  const reservedAmountRef = useRef<number>(0);
  const pocketCashRef = useRef<number>(gameState.pocketCash);
  // Timer ref for auto-closing life event popups
  const lifeEventAutoCloseTimerRef = useRef<number | null>(null);

  // Keep pocketCashRef in sync with state
  useEffect(() => {
    pocketCashRef.current = gameState.pocketCash;
  }, [gameState.pocketCash]);


  const prevPocketCashRef = useRef<number>(gameState.pocketCash);
  useEffect(() => {
    prevPocketCashRef.current = gameState.pocketCash;
  }, [gameState.pocketCash]);

  // Start game timer (disabled in multiplayer mode - server controls time)
  useEffect(() => {
    if (gameState.mode !== 'solo' || gameState.isPaused || isMultiplayer) return;

    // Use admin setting for month duration, or default to 5000ms (5 seconds)
    const monthDuration = gameState.adminSettings?.monthDuration || MONTH_DURATION_MS;

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
        let newCashTransactions = [...(prev.cashTransactions || [])];

        if ((newMonth === 6 || newMonth === 12) && prev.adminSettings?.recurringIncome) {
          newPocketCash += prev.adminSettings.recurringIncome;
          newPocketCashReceivedTotal += prev.adminSettings.recurringIncome;

          // Track recurring income transaction
          const transaction: CashTransaction = {
            id: `recurring_${newYear}_${newMonth}_${Date.now()}`,
            type: 'recurring_income',
            amount: prev.adminSettings.recurringIncome,
            message: 'Recurring Income Received',
            gameYear: newYear,
            gameMonth: newMonth,
            timestamp: Date.now()
          };
          newCashTransactions.push(transaction);
        }

        // Process any scheduled life events (solo mode)
        let updatedLifeEvents = prev.lifeEvents ? [...prev.lifeEvents] : undefined;
        const triggeredEvents: any[] = [];
        if (updatedLifeEvents) {
          updatedLifeEvents = updatedLifeEvents.map(ev => {
            if (!ev.triggered && ev.gameYear === newYear && ev.gameMonth === newMonth) {
              // Apply effect immediately
              newPocketCash += ev.amount;
              if (ev.amount > 0) newPocketCashReceivedTotal += ev.amount;

              // Track life event transaction
              const transaction: CashTransaction = {
                id: `life_event_${ev.id}_${Date.now()}`,
                type: ev.type === 'gain' ? 'life_event_gain' : 'life_event_loss',
                amount: ev.amount,
                message: ev.message,
                gameYear: newYear,
                gameMonth: newMonth,
                timestamp: Date.now()
              };
              newCashTransactions.push(transaction);

              triggeredEvents.push(ev);
              return { ...ev, triggered: true };
            }
            return ev;
          });
        }

        // After state is set, push a popup for the first triggered event (if any)
        if (triggeredEvents.length > 0) {
          setTimeout(() => {
            try {
              const event = triggeredEvents[0];
              const isInDebt = newPocketCash < 0;
              const remainingDebt = isInDebt ? Math.abs(newPocketCash) : 0;

              // Cancel any previous auto-close timer
              if (lifeEventAutoCloseTimerRef.current) {
                clearTimeout(lifeEventAutoCloseTimerRef.current as any);
                lifeEventAutoCloseTimerRef.current = null;
              }


              setLifeEventPopup({ ...event, locked: isInDebt, remainingDebt });

              // Schedule auto-close only if sufficient funds
              if (!isInDebt) {
                lifeEventAutoCloseTimerRef.current = window.setTimeout(() => {
                  setLifeEventPopup(null);
                  lifeEventAutoCloseTimerRef.current = null;
                }, 10000);
              }
            } catch (err) {
              // noop
            }
          }, 0);
        }

        return {
          ...prev,
          currentMonth: newMonth,
          currentYear: newYear,
          pocketCash: newPocketCash,
          pocketCashReceivedTotal: newPocketCashReceivedTotal,
          cashTransactions: newCashTransactions,
          savingsAccount: { ...prev.savingsAccount, balance: newSavingsBalance },
          fixedDeposits: updatedFDs,
          lifeEvents: updatedLifeEvents
        };
      });
    }, monthDuration);

    return () => clearInterval(interval);
  }, [gameState.mode, gameState.isPaused, isMultiplayer, gameState.adminSettings?.monthDuration]);

  const openSettings = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      mode: 'settings'
    }));
  }, []);

  // Allow external code (App) to apply updated admin settings into running gameState
  const applyAdminSettings = useCallback((settings?: AdminSettings) => {
    if (!settings) return;
    setGameState(prev => ({ ...prev, adminSettings: settings }));
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
      // Generate unlock schedule first
      assetUnlockSchedule = generateAssetUnlockSchedule(
        adminSettings.selectedCategories,
        adminSettings.gameStartYear
      );

      // Extract selected assets from schedule (ensures 2 fixed + 0-3 random stocks)
      const extractedAssets = extractSelectedAssetsFromSchedule(assetUnlockSchedule);

      const fundType: 'index' | 'mutual' = extractedAssets.fundName ?
        (AVAILABLE_INDEX_FUNDS.includes(extractedAssets.fundName) ? 'index' : 'mutual') :
        (Math.random() > 0.5 ? 'index' : 'mutual');

      selectedAssets = {
        stocks: extractedAssets.stocks,
        fundType,
        fundName: extractedAssets.fundName || (fundType === 'index' ? getRandomItem(AVAILABLE_INDEX_FUNDS) : getRandomItem(AVAILABLE_MUTUAL_FUNDS)),
        indexFunds: extractedAssets.indexFunds,
        mutualFunds: extractedAssets.mutualFunds,
        commodity: extractedAssets.commodity || getRandomItem(AVAILABLE_COMMODITIES),
        reit: extractedAssets.reit || 'EMBASSY' // Fallback to EMBASSY if not in schedule
      };

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
    // Generate asset unlock schedule if admin settings are provided
    const assetUnlockSchedule = adminSettings
      ? generateAssetUnlockSchedule(adminSettings.selectedCategories, adminSettings.gameStartYear)
      : undefined;

    let selectedStocks: string[];
    let fundType: 'index' | 'mutual';
    let fundName: string;
    let selectedCommodity: string;

    if (assetUnlockSchedule) {
      // Extract assets from schedule (ensures 2 fixed + 0-3 random stocks)
      const extractedAssets = extractSelectedAssetsFromSchedule(assetUnlockSchedule);

      selectedStocks = extractedAssets.stocks;
      fundType = extractedAssets.fundName ?
        (AVAILABLE_INDEX_FUNDS.includes(extractedAssets.fundName) ? 'index' : 'mutual') :
        (Math.random() > 0.5 ? 'index' : 'mutual');
      fundName = extractedAssets.fundName || (fundType === 'index' ? getRandomItem(AVAILABLE_INDEX_FUNDS) : getRandomItem(AVAILABLE_MUTUAL_FUNDS));
      selectedCommodity = extractedAssets.commodity || getRandomItem(AVAILABLE_COMMODITIES);
    } else {
      // Fallback: Random selection for quick start (no admin settings)
      // Select exactly 3 stocks: 2 unlock immediately + 1 unlocks progressively
      selectedStocks = getRandomItems(AVAILABLE_STOCKS, 3, 3);
      fundType = Math.random() > 0.5 ? 'index' : 'mutual';
      fundName = fundType === 'index'
        ? getRandomItem(AVAILABLE_INDEX_FUNDS)
        : getRandomItem(AVAILABLE_MUTUAL_FUNDS);
      selectedCommodity = getRandomItem(AVAILABLE_COMMODITIES);
    }

    const selectedAssets: SelectedAssets = {
      stocks: selectedStocks,
      fundType,
      fundName,
      indexFunds: assetUnlockSchedule ? extractSelectedAssetsFromSchedule(assetUnlockSchedule).indexFunds : [],
      mutualFunds: assetUnlockSchedule ? extractSelectedAssetsFromSchedule(assetUnlockSchedule).mutualFunds : [],
      commodity: selectedCommodity,
      reit: assetUnlockSchedule ? extractSelectedAssetsFromSchedule(assetUnlockSchedule).reit : 'EMBASSY'
    };

    // Shuffle quotes for this game - one unique quote per year
    const shuffledQuotes = [...FINANCIAL_QUOTES].sort(() => Math.random() - 0.5);

    // Generate random question indices for quiz (one per category, consistent for this game session)
    const quizQuestionIndices = generateQuestionIndices();

    const eventsCountToUse = adminSettings?.eventsCount || 3;
    const soloLifeEvents = generateLifeEvents(eventsCountToUse, assetUnlockSchedule);

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
      quizQuestionIndices,
      lifeEvents: soloLifeEvents
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

      const newBalance = prev.savingsAccount.balance + amount;
      // Log banking transaction
      bankingTracker.logDeposit(amount, newBalance, prev.currentYear, prev.currentMonth, 'manual_deposit');

      return {
        ...prev,
        pocketCash: prev.pocketCash - amount,
        savingsAccount: {
          ...prev.savingsAccount,
          balance: newBalance,
          totalDeposited: (prev.savingsAccount.totalDeposited || 0) + amount
        }
      };
    });
  }, []);

  const withdrawFromSavings = useCallback((amount: number) => {
    setGameState(prev => {
      if (gameHasEnded(prev)) return prev;
      if (amount > prev.savingsAccount.balance) return prev;

      // Reduce totalDeposited proportionally when withdrawing
      const currentBalance = prev.savingsAccount.balance;
      const currentDeposited = prev.savingsAccount.totalDeposited || currentBalance;
      const withdrawalRatio = amount / currentBalance;
      const newTotalDeposited = Math.max(0, currentDeposited - (currentDeposited * withdrawalRatio));
      const newBalance = currentBalance - amount;

      // Log banking transaction
      bankingTracker.logWithdrawal(amount, newBalance, prev.currentYear, prev.currentMonth, 'manual_withdrawal');

      return {
        ...prev,
        pocketCash: prev.pocketCash + amount,
        savingsAccount: {
          ...prev.savingsAccount,
          balance: newBalance,
          totalDeposited: newTotalDeposited
        }
      };
    });
  }, []);

  const createFixedDeposit = useCallback((amount: number, duration: 12 | 24 | 36, interestRate: number) => {
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

      const newBalance = prev.savingsAccount.balance;
      // Log FD investment transaction
      bankingTracker.logFDInvestment(newFD.id, amount, duration, interestRate, newBalance, prev.currentYear, prev.currentMonth);

      return {
        ...prev,
        pocketCash: prev.pocketCash - amount,
        fixedDeposits: [...prev.fixedDeposits, newFD]
      };
    });
  }, []);

  const collectFD = useCallback((fdId: string) => {
    setGameState(prev => {
      if (gameHasEnded(prev)) return prev; const fd = prev.fixedDeposits.find(f => f.id === fdId);
      if (!fd || !fd.isMatured) return prev;

      // FD rates are annual (PA - Per Annum)
      // Calculate actual return based on duration:
      // - 3 months: rate * (3/12) = rate * 0.25
      // - 12 months: rate * (12/12) = rate * 1
      // - 36 months: rate * (36/12) = rate * 3
      const durationInYears = fd.duration / 12;
      const totalReturn = (fd.interestRate / 100) * durationInYears;
      const maturityAmount = fd.amount * (1 + totalReturn);

      // Log FD maturity transaction
      bankingTracker.logFDMaturity(fdId, fd.amount, maturityAmount, prev.pocketCash + maturityAmount, prev.currentYear, prev.currentMonth);

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
      const penaltyAmount = fd.amount * penalty;
      const returnAmount = fd.amount * (1 - penalty);

      // Log FD break transaction with penalty
      bankingTracker.logFDBreak(fdId, fd.amount, returnAmount, penaltyAmount, prev.pocketCash + returnAmount, prev.currentYear, prev.currentMonth);

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

    // Prevent buying while player is in debt
    if (pocketCashRef.current < 0) {
      alert('Cannot buy while you are in debt. Sell assets or wait for incoming payments to recover your balance.');
      return;
    }

    // Signature to detect duplicate rapid transactions
    const txSignature = `${assetType}|${assetName}|${quantity}|${currentPrice.toFixed(6)}`;
    const now = Date.now();
    const prevTs = recentTransactions.current.get(txSignature);


    if (prevTs && now - prevTs < 1000) {
      return;
    }

    // Prevent duplicate transactions via a ref lock
    if (transactionInProgress.current) {
      return;
    }

    // Check available funds accounting for reserved amounts from in-flight buys
    const totalCost = quantity * currentPrice;
    const available = pocketCashRef.current - reservedAmountRef.current;
    if (totalCost > available) {
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
      // Additional safety: if reserved funds were altered (race), re-check inside update
      if (totalCost > prev.pocketCash) {
        // rollback reservation since we failed to apply transaction
        reservedAmountRef.current = Math.max(0, reservedAmountRef.current - totalCost);
        return prev;
      }

      // Get holding quantity before buy
      let holdingQuantityBefore = 0;
      if (assetType === 'physicalGold' || assetType === 'digitalGold' || assetType === 'commodity') {
        holdingQuantityBefore = (prev.holdings[assetType as keyof typeof prev.holdings] as AssetHolding).quantity;
      } else if (assetType === 'stocks' || assetType === 'crypto' || assetType === 'reits' || assetType === 'indexFund' || assetType === 'mutualFund') {
        const assetGroup = prev.holdings[assetType as 'stocks' | 'crypto' | 'reits' | 'indexFund' | 'mutualFund'];
        holdingQuantityBefore = assetGroup[assetName]?.quantity || 0;
      }

      // Always clone the nested holdings objects immutably to avoid accidental in-place mutations
      // which can cause duplicate-applied changes when multiple transactions are processed rapidly.
      const newHoldings = { ...prev.holdings } as typeof prev.holdings;

      if (assetType === 'physicalGold' || assetType === 'digitalGold' || assetType === 'commodity') {
        // Clone the specific holding object
        const holding = { ...(newHoldings[assetType as keyof typeof newHoldings] as AssetHolding) };
        const newQuantity = holding.quantity + quantity;
        const newTotalInvested = holding.totalInvested + totalCost;
        (newHoldings[assetType as keyof typeof newHoldings] as AssetHolding) = {
          quantity: newQuantity,
          avgPrice: newTotalInvested / newQuantity,
          totalInvested: newTotalInvested
        };
      } else if (assetType === 'stocks' || assetType === 'crypto' || assetType === 'reits' || assetType === 'indexFund' || assetType === 'mutualFund') {
        // Clone the asset group (stocks/crypto/reits/indexFund/mutualFund) before mutating
        const assetGroup = { ...(newHoldings[assetType as 'stocks' | 'crypto' | 'reits' | 'indexFund' | 'mutualFund']) };
        const holding = assetGroup[assetName] ? { ...assetGroup[assetName] } : { quantity: 0, avgPrice: 0, totalInvested: 0 };
        const newQuantity = holding.quantity + quantity;
        const newTotalInvested = holding.totalInvested + totalCost;
        assetGroup[assetName] = {
          quantity: newQuantity,
          avgPrice: newTotalInvested / newQuantity,
          totalInvested: newTotalInvested
        };
        // Assign the cloned group back to newHoldings to keep immutability
        (newHoldings[assetType as 'stocks' | 'crypto' | 'reits' | 'indexFund' | 'mutualFund']) = assetGroup;
      }

      const updatedState = {
        ...prev,
        pocketCash: prev.pocketCash - totalCost,
        holdings: newHoldings
      };

      // Log trade for AI analysis
      const holdingQuantityAfter = holdingQuantityBefore + quantity;
      tradeTracker.logTrade({
        transactionType: 'buy',
        assetType,
        assetName,
        quantity,
        price: currentPrice,
        totalValue: totalCost,
        positionSize: holdingQuantityAfter * currentPrice,
        gameYear: prev.currentYear,
        gameMonth: prev.currentMonth,
        timestamp: Date.now(),
        pocketCashBefore: prev.pocketCash,
        pocketCashAfter: updatedState.pocketCash,
        holdingQuantityBefore,
        holdingQuantityAfter,
      });

      // Release the reserved funds for this transaction after the state update settles
      setTimeout(() => {
        reservedAmountRef.current = Math.max(0, reservedAmountRef.current - totalCost);
      }, 0);

      // Finish transaction (longer debounce to avoid duplicate buys) and process pending time updates
      finishTransaction();

      return updatedState;
    });
  }, []);

  const sellAsset = useCallback((assetType: string, assetName: string, quantity: number, currentPrice: number) => {
    const txSignature = `${assetType}|${assetName}|${quantity}|${currentPrice.toFixed(6)}`;

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

      if (assetType === 'physicalGold' || assetType === 'digitalGold' || assetType === 'commodity') {
        // Clone the specific holding object
        holding = { ...((newHoldings[assetType as keyof typeof newHoldings] as AssetHolding)) };
      } else if (assetType === 'stocks' || assetType === 'crypto' || assetType === 'reits' || assetType === 'indexFund' || assetType === 'mutualFund') {
        // Clone the asset group before reading/modifying
        const assetGroup = { ...(newHoldings[assetType as 'stocks' | 'crypto' | 'reits' | 'indexFund' | 'mutualFund']) };
        holding = assetGroup[assetName];
      }

      if (!holding || holding.quantity < quantity) {
        return prev;
      }

      const saleAmount = quantity * currentPrice;
      const newQuantity = holding.quantity - quantity;
      const reducedInvestment = (holding.totalInvested / holding.quantity) * quantity;

      if (assetType === 'physicalGold' || assetType === 'digitalGold' || assetType === 'commodity') {
        (newHoldings[assetType as keyof typeof newHoldings] as AssetHolding) = {
          quantity: newQuantity,
          avgPrice: newQuantity > 0 ? (holding.totalInvested - reducedInvestment) / newQuantity : 0,
          totalInvested: holding.totalInvested - reducedInvestment
        };
      } else if (assetType === 'stocks' || assetType === 'crypto' || assetType === 'reits' || assetType === 'indexFund' || assetType === 'mutualFund') {
        // Operate on cloned asset group and assign back immutably
        const assetGroup = { ...(newHoldings[assetType as 'stocks' | 'crypto' | 'reits' | 'indexFund' | 'mutualFund']) };
        if (newQuantity === 0) {
          delete assetGroup[assetName];
        } else {
          assetGroup[assetName] = {
            quantity: newQuantity,
            avgPrice: (holding.totalInvested - reducedInvestment) / newQuantity,
            totalInvested: holding.totalInvested - reducedInvestment
          };
        }
        (newHoldings[assetType as 'stocks' | 'crypto' | 'reits' | 'indexFund' | 'mutualFund']) = assetGroup;
      }
      const updatedState = {
        ...prev,
        pocketCash: prev.pocketCash + saleAmount,
        holdings: newHoldings
      };

      // Log trade for AI analysis
      tradeTracker.logTrade({
        transactionType: 'sell',
        assetType,
        assetName,
        quantity,
        price: currentPrice,
        totalValue: saleAmount,
        positionSize: newQuantity * currentPrice,
        gameYear: prev.currentYear,
        gameMonth: prev.currentMonth,
        timestamp: Date.now(),
        pocketCashBefore: prev.pocketCash,
        pocketCashAfter: updatedState.pocketCash,
        holdingQuantityBefore: holding.quantity,
        holdingQuantityAfter: newQuantity,
      });

      return updatedState;
    });

    // Finish transaction (longer debounce) and apply any pending time update
    finishTransaction();
  }, []);

  const applyLifeEvent = useCallback((event: any) => {
    // Use the current pocket cash as baseline (client side). If server provided a postPocketCash, prefer that for consistency in multiplayer.
    const prevPocket = pocketCashRef.current;
    const newPocket = typeof event.postPocketCash === 'number' ? event.postPocketCash : (prevPocket + event.amount);

    // Compute received delta for logging/total updates (positive only)
    const receivedDelta = event.amount > 0 ? event.amount : Math.max(0, newPocket - prevPocket);


    // Apply to local state
    setGameState(prev => {
      if (gameHasEnded(prev)) return prev;

      const updatedLifeEvents = prev.lifeEvents ? prev.lifeEvents.map(ev => ev.id === event.id ? { ...ev, triggered: true } : ev) : prev.lifeEvents;

      // Track life event transaction (multiplayer)
      const newCashTransactions = [...(prev.cashTransactions || [])];
      const transaction: CashTransaction = {
        id: `life_event_${event.id}_${Date.now()}`,
        type: event.type === 'gain' ? 'life_event_gain' : 'life_event_loss',
        amount: event.amount,
        message: event.message,
        gameYear: event.gameYear || prev.currentYear,
        gameMonth: event.gameMonth || prev.currentMonth,
        timestamp: Date.now()
      };
      newCashTransactions.push(transaction);

      return {
        ...prev,
        pocketCash: newPocket,
        pocketCashReceivedTotal: (prev.pocketCashReceivedTotal || 0) + receivedDelta,
        cashTransactions: newCashTransactions,
        lifeEvents: updatedLifeEvents
      };
    });

    // Set popup data (includes locked/remainingDebt when negative)
    const remainingDebt = newPocket < 0 ? Math.abs(newPocket) : 0;

    // Cancel any previous auto-close timer
    if (lifeEventAutoCloseTimerRef.current) {
      clearTimeout(lifeEventAutoCloseTimerRef.current as any);
      lifeEventAutoCloseTimerRef.current = null;
    }

    setLifeEventPopup({ ...event, locked: newPocket < 0, remainingDebt });

    // Schedule auto-close only if sufficient funds (10 seconds for positive events or loss events with sufficient balance)
    if (newPocket >= 0) {
      lifeEventAutoCloseTimerRef.current = window.setTimeout(() => {
        setLifeEventPopup(null);
        lifeEventAutoCloseTimerRef.current = null;
      }, 10000);
    }

  }, []);

  // Developer helper: allow triggering a test life event from the browser console in development mode
  useEffect(() => {
    try {
      if ((import.meta as any).env && (import.meta as any).env.MODE === 'development') {
        (window as any).triggerLifeEvent = (amount: number, message?: string) => {
          try {
            const ev = { id: `dev-${Date.now()}`, message: message || `Dev Life Event ${amount}`, amount } as any;
            applyLifeEvent(ev);
          } catch (err) {
            // noop
          }
        };
      }
    } catch (err) {
      // noop
    }

    return () => {
      try { delete (window as any).triggerLifeEvent; } catch (err) { }
    };
  }, [applyLifeEvent]);

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
        let newCashTransactions = [...(prev.cashTransactions || [])];

        if ((month === 6 || month === 12) && month !== prev.currentMonth && prev.adminSettings?.recurringIncome) {
          newPocketCash += prev.adminSettings.recurringIncome;
          newPocketCashReceivedTotal += prev.adminSettings.recurringIncome;

          // Track recurring income transaction (multiplayer - final month)
          const transaction: CashTransaction = {
            id: `recurring_${year}_${month}_${Date.now()}`,
            type: 'recurring_income',
            amount: prev.adminSettings.recurringIncome,
            message: 'Recurring Income Received',
            gameYear: year,
            gameMonth: month,
            timestamp: Date.now()
          };
          newCashTransactions.push(transaction);
        }


        return {
          ...prev,
          currentYear: TOTAL_GAME_YEARS,
          currentMonth: 12,
          pocketCash: newPocketCash,
          pocketCashReceivedTotal: newPocketCashReceivedTotal,
          cashTransactions: newCashTransactions,
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
      let newCashTransactions = [...(prev.cashTransactions || [])];

      if ((month === 6 || month === 12) && month !== prev.currentMonth && prev.adminSettings?.recurringIncome) {
        newPocketCash += prev.adminSettings.recurringIncome;
        newPocketCashReceivedTotal += prev.adminSettings.recurringIncome;

        // Track recurring income transaction (multiplayer)
        const transaction: CashTransaction = {
          id: `recurring_${year}_${month}_${Date.now()}`,
          type: 'recurring_income',
          amount: prev.adminSettings.recurringIncome,
          message: 'Recurring Income Received',
          gameYear: year,
          gameMonth: month,
          timestamp: Date.now()
        };
        newCashTransactions.push(transaction);
      }

      return {
        ...prev,
        currentYear: year,
        currentMonth: month,
        pocketCash: newPocketCash,
        pocketCashReceivedTotal: newPocketCashReceivedTotal,
        cashTransactions: newCashTransactions,
        savingsAccount: { ...prev.savingsAccount, balance: newSavingsBalance },
        fixedDeposits: updatedFDs
      };
    });
  }, []);

  // Watch for pocketCash changes to resolve locked life event popups automatically
  useEffect(() => {
    if (!lifeEventPopup) return;

    if (lifeEventPopup.locked && pocketCashRef.current >= 0) {
      // Debt resolved — close popup and clear timers
      if (lifeEventAutoCloseTimerRef.current) {
        clearTimeout(lifeEventAutoCloseTimerRef.current as any);
        lifeEventAutoCloseTimerRef.current = null;
      }
      setLifeEventPopup(null);
    }
  }, [gameState.pocketCash, lifeEventPopup]);

  // Update pause state from external source (for multiplayer)
  const updatePauseState = useCallback((isPaused: boolean) => {
    setGameState(prev => ({
      ...prev,
      isPaused
    }));
  }, []);

  // CRITICAL: Mark game as ended (for multiplayer when gameEnded event received)
  // This ensures gameHasEnded() returns true and prevents further state updates
  const markGameAsEnded = useCallback(() => {
    setGameState(prev => {
      // Only mark as ended if we're at or past the final year
      if (prev.currentYear >= TOTAL_GAME_YEARS) {
        console.log('🔒 Marking game as ended - locking state updates');
        return {
          ...prev,
          isStarted: false
        };
      }
      return prev;
    });
  }, []);

  return {
    gameState,
    openSettings,
    startSoloGame,
    startMultiplayerGame,
    applyAdminSettings,
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
    markGameAsEnded,
    // Reactive flag for UI components to know whether a transaction is pending
    isTransactionPending,
    // Life event popup & handler
    lifeEventPopup,
    applyLifeEvent,
    clearLifeEventPopup: () => {
      if (lifeEventAutoCloseTimerRef.current) {
        clearTimeout(lifeEventAutoCloseTimerRef.current as any);
        lifeEventAutoCloseTimerRef.current = null;
      }
      setLifeEventPopup(null);
    },

    // Force show a popup (fallback); does NOT apply event amounts to pocketCash — purely visual.
    forceShowLifeEventPopup: (event: any) => {
      // Cancel any existing auto-close
      if (lifeEventAutoCloseTimerRef.current) {
        clearTimeout(lifeEventAutoCloseTimerRef.current as any);
        lifeEventAutoCloseTimerRef.current = null;
      }

      const prevPocket = pocketCashRef.current;
      const newPocket = typeof event.postPocketCash === 'number' ? event.postPocketCash : (prevPocket + event.amount);
      const remainingDebt = newPocket < 0 ? Math.abs(newPocket) : 0;
      const locked = newPocket < 0;

      setLifeEventPopup({ ...event, locked, remainingDebt });

      // Schedule auto-close only if sufficient funds (10 seconds)
      if (!locked) {
        lifeEventAutoCloseTimerRef.current = window.setTimeout(() => {
          setLifeEventPopup(null);
          lifeEventAutoCloseTimerRef.current = null;
        }, 10000);
      }
    }
  };
};

