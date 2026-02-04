export interface LifeEvent {
  id: string;
  type: 'gain' | 'loss';
  message: string;
  amount: number; // positive for gains, negative for losses
  gameYear: number; // 1..20
  gameMonth: number; // 1..12
  triggered?: boolean;
}

export interface CashTransaction {
  id: string;
  type: 'recurring_income' | 'life_event_gain' | 'life_event_loss';
  amount: number; // positive for gains, negative for losses
  message: string;
  gameYear: number;
  gameMonth: number;
  timestamp: number; // ms since epoch for ordering
}

export interface GameState {
  mode: 'menu' | 'solo' | 'multi' | 'settings';
  currentYear: number;
  currentMonth: number;
  pocketCash: number;
  pocketCashReceivedTotal?: number; // cumulative pocket cash received since game start (includes initial pocket cash)
  cashTransactions?: CashTransaction[]; // Track all cash inflows/outflows for breakdown display
  savingsAccount: SavingsAccount;
  fixedDeposits: FixedDeposit[];
  holdings: Holdings;
  gameStartTime: number;
  isPaused: boolean;
  isStarted?: boolean; // Track if game is running (false when game ends)
  selectedAssets?: SelectedAssets;
  adminSettings?: AdminSettings;
  assetUnlockSchedule?: AssetUnlockSchedule;
  yearlyQuotes?: string[]; // Array of quotes, one per year (shuffled at game start)
  completedQuizzes?: string[]; // Track which asset categories have completed their quiz
  quizQuestionIndices?: { [category: string]: number }; // Random question index per category for this session
  // Solo mode uses an array of life events; multiplayer stores per-player events on server and emits triggers
  lifeEvents?: LifeEvent[];
  // Multiplayer-specific properties
  pauseReason?: 'quiz' | 'manual' | 'intro' | null;
  playersWaitingForIntro?: string[];
  playersWaitingForQuiz?: string[];
}

export interface SelectedAssets {
  stocks: string[];
  fundType: 'index' | 'mutual';
  fundName: string;
  indexFunds: string[]; // Array of index fund names (unlocks progressively at calendar 2009, 2015)
  mutualFunds: string[]; // Array of mutual fund names (unlocks at calendar 2017)
  commodity: string;
  reit: string; // Randomly selected REIT (EMBASSY or MINDSPACE) - unlocks at calendar 2020
}

export interface SavingsAccount {
  balance: number;
  interestRate: number; // 2.5% PA = 0.025
  totalDeposited?: number; // Total amount deposited (withdrawals reduce this proportionally)
}

export interface FixedDeposit {
  id: string;
  amount: number;
  duration: 12 | 24 | 36; // in months (1 year, 2 years, 3 years)
  interestRate: number;
  startMonth: number;
  startYear: number;
  maturityMonth: number;
  maturityYear: number;
  isMatured: boolean;
}

export interface Holdings {
  physicalGold: AssetHolding;
  digitalGold: AssetHolding;
  indexFund: { [key: string]: AssetHolding }; // Changed to dictionary to support multiple index funds
  mutualFund: { [key: string]: AssetHolding }; // Changed to dictionary to support multiple mutual funds
  stocks: { [key: string]: AssetHolding };
  crypto: { [key: string]: AssetHolding };
  commodity: AssetHolding;
  reits: { [key: string]: AssetHolding };
}

export interface AssetHolding {
  quantity: number;
  avgPrice: number;
  totalInvested: number;
}

export interface AssetData {
  date: string;
  price: number;
}

export interface AssetInfo {
  name: string;
  category: string;
  unlockYear: number;
  isUnlocked: boolean;
}

export interface FDRate {
  year: number;
  oneYear: number;
  twoYear: number;
  threeYear: number;
}

export type AssetCategory = 'BANKING' | 'GOLD' | 'STOCKS' | 'FUNDS' | 'CRYPTO' | 'REIT' | 'COMMODITIES' | 'FOREX';

export interface AdminSettings {
  selectedCategories: AssetCategory[];
  gameStartYear: number;
  hideCurrentYear: boolean;
  initialPocketCash: number; // Starting pocket cash amount
  recurringIncome: number; // Amount added to pocket cash every 6 months
  enableQuiz: boolean; // Enable/disable quiz on asset unlock
  eventsCount?: number; // Number of random life events per player (min 1, max 20). Default: 3
  monthDuration?: number; // Duration of each game month in milliseconds. Default: 5000 (5 seconds)
}

export interface AssetUnlockSchedule {
  [gameYear: number]: UnlockEntry[];
}

export interface UnlockEntry {
  category: AssetCategory;
  assetType: string;
  assetNames?: string[];
  calendarYear: number;
  maxCards?: number; // Maximum number of cards for this asset type
}

// Window/Row layout for 3-row display system
export interface WindowLayout {
  row1: UnlockedAsset[]; // Banking + Gold (max 4)
  row2: UnlockedAsset[]; // Stocks + Funds (max 5)
  row3: UnlockedAsset[]; // Overflow + Commodities + REITs (max 5)
}

export interface UnlockedAsset {
  category: AssetCategory;
  assetType: string;
  assetName: string;
  displayName?: string;
}
