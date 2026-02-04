import { io, Socket } from 'socket.io-client';
import { PlayerInfo, MultiplayerGameState, PortfolioBreakdown } from '../types/multiplayer';
import { AdminSettings } from '../types';
import { getServerUrl } from '../utils/getServerUrl';
import {
  initializeDecryption,
  decryptPriceData,
  clearDecryptionState,
  isDecryptionInitialized,
  EncryptedPayload,
} from './cryptoService';
import { priceStore } from '../stores/priceStore';

const SERVER_URL = getServerUrl();

// Key exchange data structure
interface KeyExchangeData {
  sessionKey: string;
  assetIndexMap: { [symbol: string]: number };
}

interface ServerToClientEvents {
  roomCreated: (data: { roomId: string; hostId: string }) => void;
  roomJoined: (data: { roomId: string; players: PlayerInfo[]; adminSettings: any }) => void;
  playerJoined: (data: { player: PlayerInfo }) => void;
  playerLeft: (data: { playerId: string }) => void;
  gameStarted: (data: { gameState: MultiplayerGameState; adminSettings: AdminSettings }) => void;
  gameStateUpdate: (data: { gameState: MultiplayerGameState }) => void;
  gamePaused: (data: { reason: 'quiz' | 'manual' | 'intro'; playersWaitingForQuiz?: string[]; playersWaitingForIntro?: string[] }) => void;
  gameResumed: () => void;
  gameEnded: (data: { finalYear: number; finalMonth: number }) => void;
  timeProgression: (data: { year: number; month: number }) => void;
  // Server can send authoritative final leaderboard (broadcast from server DB) or host can send it.
  finalLeaderboard: (data: { leaderboard: { playerId: string; playerName: string; networth: number; portfolioBreakdown?: any }[] }) => void;
  leaderboardUpdate: (data: { players: PlayerInfo[] }) => void;
  quizTriggered: (data: { playerId: string; quizCategory: string }) => void;
  quizCompleted: (data: { playerId: string; quizCategory: string }) => void;
  // Game intro sync events
  introStatusUpdate: (data: { playersWaitingForIntro: string[]; playersCompletedIntro: string[] }) => void;
  allPlayersIntroComplete: () => void;
  lifeEventTriggered: (data: { event: any; postPocketCash?: number }) => void;
  adminSettingsUpdated: (data: { adminSettings: AdminSettings }) => void;
  error: (data: { message: string }) => void;
  // Secure price broadcast events
  priceTick: (data: { year: number; month: number; encrypted: EncryptedPayload }) => void;
  keyExchangeResponse: (data: KeyExchangeData) => void;
  networthValidation: (data: { valid: boolean; serverNetworth: number; clientNetworth: number; deviation: number }) => void;
  fetchFinalLeaderboardFromDB: (data: { roomId: string }) => void;
}

interface ClientToServerEvents {
  createRoom: (data: { playerName: string }, callback: (response: { success: boolean; roomId?: string; error?: string }) => void) => void;
  joinRoom: (data: { roomId: string; playerName: string }, callback: (response: { success: boolean; players?: PlayerInfo[]; adminSettings?: any; error?: string }) => void) => void;
  leaveRoom: () => void;
  startGame: (data: { adminSettings: AdminSettings; initialGameState?: any }, callback: (response: { success: boolean; error?: string }) => void) => void;
  togglePause: () => void;
  updatePlayerState: (data: { networth: number; portfolioBreakdown: PortfolioBreakdown }) => void;
  quizStarted: (data: { quizCategory: string }) => void;
  quizFinished: (data: { quizCategory: string }) => void;
  // Game intro sync
  introCompleted: () => void;
  // Secure price broadcast events
  requestKeyExchange: (callback: (response: { success: boolean; data?: KeyExchangeData; error?: string }) => void) => void;
  submitNetworth: (data: { networth: number; portfolioBreakdown: PortfolioBreakdown; holdings: any }, callback: (response: { valid: boolean; serverNetworth?: number; error?: string }) => void) => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private isConnecting: boolean = false;

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    if (this.isConnecting) {
      return;
    }

    if (this.socket) {
      this.socket.connect();
      return;
    }

    this.isConnecting = true;

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'], // Try websocket first, then fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
      autoConnect: true,
      forceNew: false,
      // Allow self-signed certificates (for local network HTTPS)
      rejectUnauthorized: false,
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.emit('connect');
    });

    this.socket.on('disconnect', (_reason) => {
      this.emit('disconnect');
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      console.error('\n❌ ==== CONNECTION ERROR ====');
      console.error('Error:', error.message);
      console.error('Server URL:', SERVER_URL);
      console.error('Transports:', this.socket?.io?.opts?.transports);
      console.error('Make sure backend server is running!');
      console.error('============================\n');
    });

    this.socket.on('error', (data) => {
      console.error('Socket error:', data.message);
      this.emit('error', data.message);
    });

    // Forward all server events to registered handlers
    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    if (!this.socket) return;

    this.socket.on('roomCreated', (data) => this.emit('roomCreated', data));
    this.socket.on('roomJoined', (data) => this.emit('roomJoined', data));
    this.socket.on('playerJoined', (data) => this.emit('playerJoined', data));
    this.socket.on('playerLeft', (data) => this.emit('playerLeft', data));
    this.socket.on('gameStarted', (data) => this.emit('gameStarted', data));
    this.socket.on('gameStateUpdate', (data) => this.emit('gameStateUpdate', data));
    this.socket.on('gamePaused', (data) => this.emit('gamePaused', data));
    this.socket.on('gameResumed', () => this.emit('gameResumed'));
    this.socket.on('timeProgression', (data) => this.emit('timeProgression', data));
    this.socket.on('gameEnded', (data) => this.emit('gameEnded', data));
    this.socket.on('leaderboardUpdate', (data) => this.emit('leaderboardUpdate', data));
    // Server tells host to fetch the final leaderboard from DB (emitted after it waits for players to log)
    this.socket.on('fetchFinalLeaderboardFromDB', (data) => this.emit('fetchFinalLeaderboardFromDB', data));
    // Server-side authoritative broadcast of final leaderboard (optional, emitted after it reads DB)
    this.socket.on('finalLeaderboard', (data) => this.emit('finalLeaderboard', data));
    this.socket.on('quizTriggered', (data) => this.emit('quizTriggered', data));
    this.socket.on('quizCompleted', (data) => this.emit('quizCompleted', data));
    // Game intro sync events
    this.socket.on('introStatusUpdate', (data) => this.emit('introStatusUpdate', data));
    this.socket.on('allPlayersIntroComplete', () => this.emit('allPlayersIntroComplete'));
    this.socket.on('lifeEventTriggered', (data) => {
      this.emit('lifeEventTriggered', data);
    });
    this.socket.on('adminSettingsUpdated', (data) => this.emit('adminSettingsUpdated', data));

    // === Secure Price Broadcast Event Handlers ===

    // Handle encrypted price ticks from server
    this.socket.on('priceTick', async (data) => {
      if (!isDecryptionInitialized()) {
        return;
      }

      try {
        const prices = await decryptPriceData(data.encrypted);
        if (prices) {
          priceStore.updatePrices(prices);
          this.emit('pricesUpdated', { year: data.year, month: data.month, prices });
        } else {
          console.error('❌ Decryption returned null prices');
        }
      } catch (error) {
        console.error('❌ Failed to decrypt price tick:', error);
      }
    });

    // Handle key exchange response
    this.socket.on('keyExchangeResponse', async (data) => {
      try {
        await initializeDecryption(data.sessionKey, data.assetIndexMap);
        priceStore.enable();
        this.emit('keyExchangeComplete', data);
      } catch (error) {
        console.error('Failed to initialize decryption:', error);
        this.emit('keyExchangeError', error);
      }
    });

    // Handle networth validation results
    this.socket.on('networthValidation', (data) => {
      this.emit('networthValidation', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event handler registration
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  // API methods
  async createRoom(playerName: string): Promise<{ success: boolean; roomId?: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit('createRoom', { playerName }, (response) => {
        resolve(response);
      });
    });
  }

  async joinRoom(roomId: string, playerName: string): Promise<{ success: boolean; players?: PlayerInfo[]; adminSettings?: any; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit('joinRoom', { roomId, playerName }, (response) => {
        resolve(response);
      });
    });
  }

  leaveRoom(): void {
    if (this.socket) {
      this.socket.emit('leaveRoom');
    }
    // Clear encryption state when leaving
    this.clearEncryptionState();
  }

  async startGame(adminSettings: AdminSettings, initialGameState?: any): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit('startGame', { adminSettings, initialGameState }, (response) => {
        resolve(response);
      });
    });
  }

  togglePause(): void {
    if (this.socket) {
      this.socket.emit('togglePause');
    }
  }

  updatePlayerState(networth: number, portfolioBreakdown: PortfolioBreakdown): void {
    if (this.socket) {
      this.socket.emit('updatePlayerState', { networth, portfolioBreakdown });
    }
  }

  quizStarted(quizCategory: string): void {
    if (this.socket) {
      this.socket.emit('quizStarted', { quizCategory });
    }
  }

  quizFinished(quizCategory: string): void {
    if (this.socket) {
      this.socket.emit('quizFinished', { quizCategory });
    }
  }

  introCompleted(): void {
    if (this.socket) {
      this.socket.emit('introCompleted');
    }
  }

  // === Secure Price Broadcast Methods ===

  /**
   * Request key exchange from server
   * Call this after joining a game to enable encrypted price broadcasts
   */
  async requestKeyExchange(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        console.error('❌ Key exchange failed: No socket connection');
        resolve({ success: false, error: 'Not connected to server' });
        return;
      }


      // Set up one-time listeners for the result
      const onComplete = () => {
        cleanup();
        resolve({ success: true });
      };

      const onError = (error: any) => {
        cleanup();
        resolve({ success: false, error: error?.message || 'Key exchange failed' });
      };

      const cleanup = () => {
        this.off('keyExchangeComplete', onComplete);
        this.off('keyExchangeError', onError);
      };

      // Listen for the actual completion events
      this.on('keyExchangeComplete', onComplete);
      this.on('keyExchangeError', onError);

      // Request the key exchange
      this.socket.emit('requestKeyExchange', (response) => {
        if (!response.success) {
          cleanup();
          resolve({ success: false, error: response.error || 'Key exchange failed' });
        }
        // If success, wait for keyExchangeComplete event
      });
    });
  }

  /**
   * Submit networth for server validation
   */
  async submitNetworth(
    networth: number,
    portfolioBreakdown: PortfolioBreakdown,
    holdings: any
  ): Promise<{ valid: boolean; serverNetworth?: number; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ valid: false, error: 'Not connected to server' });
        return;
      }

      this.socket.emit(
        'submitNetworth',
        { networth, portfolioBreakdown, holdings },
        (response) => {
          resolve(response);
        }
      );
    });
  }

  /**
   * Check if server prices are being used
   */
  isUsingServerPrices(): boolean {
    return isDecryptionInitialized() && priceStore.isEnabled();
  }

  /**
   * Clear encryption state (call when leaving a game)
   */
  clearEncryptionState(): void {
    clearDecryptionState();
    priceStore.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
export const socketService = new SocketService();
