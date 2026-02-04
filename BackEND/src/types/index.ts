// Shared types between server and client

// Encrypted payload structure for secure price broadcasts
export interface EncryptedPayload {
  iv: string; // base64 encoded initialization vector
  data: string; // base64 encoded ciphertext
  tag: string; // base64 encoded authentication tag
  ts: number; // timestamp for replay protection
}

// Key exchange response for client decryption setup
export interface KeyExchangeData {
  sessionKey: string; // base64 encoded AES-256 key
  assetIndexMap: { [symbol: string]: number }; // symbol to array index mapping
}

// Networth validation result from server
export interface NetworthValidationResult {
  valid: boolean;
  serverNetworth: number;
  clientNetworth: number;
  deviation: number; // percentage difference
}

export interface AdminSettings {
  selectedCategories: string[];
  gameStartYear: number;
  hideCurrentYear: boolean;
  initialPocketCash: number; // Starting pocket cash amount
  recurringIncome: number; // Amount added to pocket cash every 6 months
  enableQuiz: boolean; // Enable/disable quiz on asset unlock
  eventsCount?: number; // Number of random life events per player (min 1, max 20). Default: 3
  monthDuration?: number; // Duration of each game month in milliseconds. Default: 5000 (5 seconds)
}

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
  currentQuiz: string | null; // Quiz category name
  isCompleted: boolean;
}

export interface Room {
  id: string; // 6-digit alphanumeric code
  hostId: string;
  players: Map<string, PlayerInfo>;
  adminSettings: AdminSettings | null;
  gameState: GameState;
  createdAt: number;
  timeProgressionInterval?: NodeJS.Timeout; // Server-side timer
}

export interface LifeEvent {
  id: string;
  type: 'gain' | 'loss';
  message: string;
  amount: number; // positive for gain, negative for loss
  gameYear: number; // 1..20
  gameMonth: number; // 1..12
  triggered?: boolean; // whether this event has been triggered
}

export interface GameState {
  isStarted: boolean;
  isPaused: boolean;
  pauseReason: 'quiz' | 'manual' | 'intro' | null;
  currentYear: number;
  currentMonth: number;
  playersWaitingForQuiz: string[]; // Player IDs who haven't completed quiz
  playersWaitingForIntro?: string[]; // Player IDs who haven't completed intro

  // Optional multiplayer initialization data (sync cards/quotes across clients)
  selectedAssets?: any;
  assetUnlockSchedule?: any;
  yearlyQuotes?: string[];
  quizQuestionIndices?: { [category: string]: number }; // Random question index per category

  // Optional per-player life events schedule (used in multiplayer)
  lifeEvents?: { [playerId: string]: LifeEvent[] };
}

// Socket event types
export interface ServerToClientEvents {
  // Room events
  roomCreated: (data: { roomId: string; hostId: string }) => void;
  roomJoined: (data: { roomId: string; players: PlayerInfo[]; adminSettings: AdminSettings | null }) => void;
  playerJoined: (data: { player: PlayerInfo }) => void;
  playerLeft: (data: { playerId: string }) => void;

  // Game events
  gameStarted: (data: { gameState: GameState; adminSettings: AdminSettings }) => void;
  gameStateUpdate: (data: { gameState: GameState }) => void;
  gamePaused: (data: { reason: 'quiz' | 'manual' | 'intro'; playersWaitingForQuiz?: string[]; playersWaitingForIntro?: string[] }) => void;
  gameResumed: () => void;
  gameEnded: (data: { finalYear: number; finalMonth: number }) => void;
  timeProgression: (data: { year: number; month: number }) => void;

  // Leaderboard events
  leaderboardUpdate: (data: { players: PlayerInfo[] }) => void;

  // Quiz events
  quizTriggered: (data: { playerId: string; quizCategory: string }) => void;
  quizCompleted: (data: { playerId: string; quizCategory: string }) => void;

  // Intro events
  introCompletedByPlayer: (data: { playerId: string }) => void;

  // Life events
  lifeEventTriggered: (data: { event: LifeEvent; postPocketCash?: number }) => void;

  // Admin settings
  adminSettingsUpdated: (data: { adminSettings: AdminSettings }) => void;

  // Final leaderboard from DB
  fetchFinalLeaderboardFromDB: (data: { roomId: string }) => void;

  // Broadcast final leaderboard (from DB) - simplified entry structure
  finalLeaderboard: (data: { leaderboard: Array<{ playerId: string; playerName: string; networth: number; portfolioBreakdown?: any }> }) => void;

  // Errors
  error: (data: { message: string }) => void;

  // === Secure Price Broadcast Events ===

  // Encrypted price tick broadcast (sent every game month)
  priceTick: (data: {
    year: number;
    month: number;
    encrypted: EncryptedPayload;
  }) => void;

  // Key exchange response (sent once when client requests)
  keyExchangeResponse: (data: KeyExchangeData) => void;

  // Networth validation result (sent when server detects mismatch)
  networthValidation: (data: NetworthValidationResult) => void;
}

export interface ClientToServerEvents {
  // Room events
  createRoom: (data: { playerName: string }, callback: (response: { success: boolean; roomId?: string; error?: string }) => void) => void;
  joinRoom: (data: { roomId: string; playerName: string }, callback: (response: { success: boolean; players?: PlayerInfo[]; adminSettings?: AdminSettings | null; error?: string }) => void) => void;
  leaveRoom: () => void;

  // Game events
  startGame: (data: { adminSettings: AdminSettings; initialGameState?: Partial<GameState> }, callback: (response: { success: boolean; error?: string }) => void) => void;
  togglePause: () => void;

  // Player state updates
  updatePlayerState: (data: { networth: number; portfolioBreakdown: PortfolioBreakdown }) => void;

  // Quiz events
  quizStarted: (data: { quizCategory: string }) => void;
  quizFinished: (data: { quizCategory: string }) => void;

  // Intro events
  introCompleted: () => void;

  // === Secure Price Broadcast Events ===

  // Request key exchange (client asks for session key on game start)
  requestKeyExchange: (
    callback: (response: { success: boolean; data?: KeyExchangeData; error?: string }) => void
  ) => void;

  // Submit networth for server validation
  submitNetworth: (
    data: {
      networth: number;
      portfolioBreakdown: PortfolioBreakdown;
      holdings: any; // Serialized holdings for validation
    },
    callback: (response: { valid: boolean; serverNetworth?: number; error?: string }) => void
  ) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  roomId?: string;
  playerId?: string;
  playerName?: string;
}
