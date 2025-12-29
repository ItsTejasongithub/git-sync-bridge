// Multiplayer-specific types for frontend

export interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  networth: number;
  portfolioBreakdown: PortfolioBreakdown;
  quizStatus: QuizStatus;
}

export interface PortfolioBreakdown {
  cash: number;
  savings: number;
  gold: number;
  funds: number;
  stocks: number;
  crypto: number;
  commodities: number;
  reits: number;
}

export interface QuizStatus {
  currentQuiz: string | null;
  isCompleted: boolean;
}

export interface MultiplayerGameState {
  isStarted: boolean;
  isPaused: boolean;
  pauseReason: 'quiz' | 'manual' | null;
  currentYear: number;
  currentMonth: number;
  playersWaitingForQuiz: string[];

  // Optional fields for syncing initial game content
  selectedAssets?: any;
  assetUnlockSchedule?: any;
  yearlyQuotes?: string[];
}

export interface RoomInfo {
  roomId: string;
  players: PlayerInfo[];
  adminSettings: any | null;
  isHost: boolean;
}

export type MultiplayerMode = 'lobby' | 'host-spectator' | 'player-game';
