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
}

export interface SelectedAssets {
  stocks: string[];
  fundType: 'index' | 'mutual';
  fundName: string;
  commodity: string;
}

export interface SavingsAccount {
  balance: number;
  interestRate: number; // 2.5% PA = 0.025
  totalDeposited?: number; // Total amount deposited (withdrawals reduce this proportionally)
}

export interface FixedDeposit {
  id: string;
  amount: number;
  duration: 3 | 12 | 36; // in months
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
  indexFund: AssetHolding;
  mutualFund: AssetHolding;
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
  threeMonth: number;
  oneYear: number;
  threeYear: number;
}

export type AssetCategory = 'BANKING' | 'GOLD' | 'STOCKS' | 'FUNDS' | 'CRYPTO' | 'REIT' | 'COMMODITIES';

export interface AdminSettings {
  selectedCategories: AssetCategory[];
  gameStartYear: number;
  hideCurrentYear: boolean;
  initialPocketCash: number; // Starting pocket cash amount
  recurringIncome: number; // Amount added to pocket cash every 6 months
  enableQuiz: boolean; // Enable/disable quiz on asset unlock
  eventsCount?: number; // Number of random life events per player (min 1, max 20). Default: 3
}

export interface AssetUnlockSchedule {
  [gameYear: number]: UnlockEntry[];
}

export interface UnlockEntry {
  category: AssetCategory;
  assetType: string;
  assetNames?: string[];
  calendarYear: number;
}
