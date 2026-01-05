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


  // Debug: Monitor pocket cash changes (concise)
  const prevPocketCashRef = useRef<number>(gameState.pocketCash);
  useEffect(() => {
    const prev = prevPocketCashRef.current;
    const curr = gameState.pocketCash;
    if (prev !== curr) {
      console.log(`🔍 pocketCash changed: ₹${prev.toFixed(2)} -> ₹${curr.toFixed(2)}`);
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
        let newCashTransactions = [...(prev.cashTransactions || [])];

        if ((newMonth === 6 || newMonth === 12) && prev.adminSettings?.recurringIncome) {
          newPocketCash += prev.adminSettings.recurringIncome;
          newPocketCashReceivedTotal += prev.adminSettings.recurringIncome;

          // Track recurring income transaction
          const transaction: CashTransaction = {
            id: `recurring_${newYear}_${newMonth}_${Date.now()}`,
            type: 'recurring_income',
            amount: prev.adminSettings.recurringIncome,
            message: 'Monthly Salary',
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

              console.log('🪟 Life Event Popup: shown (solo mode)');
              if (!isInDebt) {
                console.log('🪟 Life Event Popup: will auto-close in 10s (sufficient funds)');
              } else {
                console.log('🪟 Life Event Popup: locked (insufficient funds) - will stay open until debt cleared');
              }

              setLifeEventPopup({ ...event, locked: isInDebt, remainingDebt });

              // Schedule auto-close only if sufficient funds
              if (!isInDebt) {
                lifeEventAutoCloseTimerRef.current = window.setTimeout(() => {
                  setLifeEventPopup(null);
                  lifeEventAutoCloseTimerRef.current = null;
                  console.log('🪟 Life Event Popup: auto-closed after 10s (solo mode, sufficient funds)');
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
        commodity: extractedAssets.commodity || getRandomItem(AVAILABLE_COMMODITIES)
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
      selectedStocks = getRandomItems(AVAILABLE_STOCKS, 2, 5);
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
      commodity: selectedCommodity
    };

    // Shuffle quotes for this game - one unique quote per year
    const shuffledQuotes = [...FINANCIAL_QUOTES].sort(() => Math.random() - 0.5);

    // Generate random question indices for quiz (one per category, consistent for this game session)
    const quizQuestionIndices = generateQuestionIndices();

    const soloLifeEvents = generateLifeEvents(adminSettings?.eventsCount || 3, assetUnlockSchedule);

    // Debug: print generated life events so testers can verify schedule and timing
    try {
      console.log('✨ Solo life events generated:', soloLifeEvents.map((e: any) => ({ id: e.id, msg: e.message, year: e.gameYear, month: e.gameMonth, amount: e.amount })));
    } catch (err) {
      // noop
    }

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
      return {
        ...prev,
        pocketCash: prev.pocketCash - amount,
        savingsAccount: {
          ...prev.savingsAccount,
          balance: prev.savingsAccount.balance + amount,
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

      return {
        ...prev,
        pocketCash: prev.pocketCash + amount,
        savingsAccount: {
          ...prev.savingsAccount,
          balance: prev.savingsAccount.balance - amount,
          totalDeposited: newTotalDeposited
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

    // Prevent buying while player is in debt
    if (pocketCashRef.current < 0) {
      alert('Cannot buy while you are in debt. Sell assets or wait for incoming payments to recover your balance.');
      return;
    }

      // Signature to detect duplicate rapid transactions
    const txSignature = `${assetType}|${assetName}|${quantity}|${currentPrice.toFixed(6)}`;
    const now = Date.now();
    const prevTs = recentTransactions.current.get(txSignature);

    console.debug(`[buyAsset] Attempting ${txSignature} now=${now} transactionInProgress=${transactionInProgress.current} reserved=${reservedAmountRef.current} pocket=${pocketCashRef.current}`);

    if (prevTs && now - prevTs < 1000) {
      console.warn(`⚠️ Duplicate buy detected (${txSignature}) — ignoring`);
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
    // Concise log for debugging: keep minimal to reduce noise
    console.log(`🔍 Sell transaction started: ${assetName} x${quantity} @ ₹${currentPrice.toFixed(2)} (estimated ₹${(quantity * currentPrice).toFixed(2)})`);

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

  const applyLifeEvent = useCallback((event: any) => {
    // Use the current pocket cash as baseline (client side). If server provided a postPocketCash, prefer that for consistency in multiplayer.
    const prevPocket = pocketCashRef.current;
    const newPocket = typeof event.postPocketCash === 'number' ? event.postPocketCash : (prevPocket + event.amount);

    // Compute received delta for logging/total updates (positive only)
    const receivedDelta = event.amount > 0 ? event.amount : Math.max(0, newPocket - prevPocket);

    // Life event evaluation log
    const required = event.amount < 0 ? Math.abs(event.amount) : 0;
    const status = newPocket >= 0 ? 'ENOUGH' : 'INSUFFICIENT';
    console.log(`🧮 Life Event Check: required=₹${required}, available=₹${prevPocket}, status=${status}`);

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

    // Log popup lifecycle and set popup data (includes locked/remainingDebt when negative)
    const remainingDebt = newPocket < 0 ? Math.abs(newPocket) : 0;
    console.log('🪟 Life Event Popup: shown');
    if (newPocket >= 0) {
      console.log('🪟 Life Event Popup: will auto-close in 10s (sufficient funds)');
    } else {
      console.log('🪟 Life Event Popup: locked (insufficient funds) - will stay open until debt cleared');
    }

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
        console.log('🪟 Life Event Popup: auto-closed after 10s (sufficient funds)');
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
            console.log('🧪 triggerLifeEvent called:', ev);
            applyLifeEvent(ev);
          } catch (err) {
            // noop
          }
        };
        console.log('🧪 Developer helper attached: window.triggerLifeEvent(amount, message)');
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
            message: 'Monthly Salary',
            gameYear: year,
            gameMonth: month,
            timestamp: Date.now()
          };
          newCashTransactions.push(transaction);
        }

        console.log('🎯 updateTime: final year/month received, marking game as ended locally');

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
          message: 'Monthly Salary',
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
      console.log('🪟 Life Event Popup: auto-closed (sufficient funds after sell/income)');
    }
  }, [gameState.pocketCash, lifeEventPopup]);

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
    isTransactionPending,
    // Life event popup & handler
    lifeEventPopup,
    applyLifeEvent,
    clearLifeEventPopup: () => {
      if (lifeEventAutoCloseTimerRef.current) {
        clearTimeout(lifeEventAutoCloseTimerRef.current as any);
        lifeEventAutoCloseTimerRef.current = null;
      }
      console.log('🪟 Life Event Popup: manually closed');
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

      console.log('🪟 Life Event Popup: forced show (fallback)', { id: event.id, message: event.message, locked, remainingDebt });

      setLifeEventPopup({ ...event, locked, remainingDebt });

      // Schedule auto-close only if sufficient funds (10 seconds)
      if (!locked) {
        lifeEventAutoCloseTimerRef.current = window.setTimeout(() => {
          setLifeEventPopup(null);
          lifeEventAutoCloseTimerRef.current = null;
          console.log('🪟 Life Event Popup: auto-closed after 10s (forced show, sufficient funds)');
        }, 10000);
      }
    }
  };
};
