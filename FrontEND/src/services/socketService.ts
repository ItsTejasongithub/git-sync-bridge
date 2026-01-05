import { io, Socket } from 'socket.io-client';
import { PlayerInfo, MultiplayerGameState, PortfolioBreakdown } from '../types/multiplayer';
import { AdminSettings } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
console.log('\n🔧 ===== SOCKET SERVICE INITIALIZATION =====');
console.log('🔧 Server URL:', SERVER_URL);
console.log('🔧 Environment Mode:', import.meta.env.MODE);
console.log('🔧 VITE_SERVER_URL:', import.meta.env.VITE_SERVER_URL || 'NOT SET (using default)');
console.log('🔧 ==========================================\n');

interface ServerToClientEvents {
  roomCreated: (data: { roomId: string; hostId: string }) => void;
  roomJoined: (data: { roomId: string; players: PlayerInfo[]; adminSettings: any }) => void;
  playerJoined: (data: { player: PlayerInfo }) => void;
  playerLeft: (data: { playerId: string }) => void;
  gameStarted: (data: { gameState: MultiplayerGameState; adminSettings: AdminSettings }) => void;
  gameStateUpdate: (data: { gameState: MultiplayerGameState }) => void;
  gamePaused: (data: { reason: 'quiz' | 'manual'; playersWaitingForQuiz?: string[] }) => void;
  gameResumed: () => void;
  gameEnded: (data: { finalYear: number; finalMonth: number }) => void;
  timeProgression: (data: { year: number; month: number }) => void;
  leaderboardUpdate: (data: { players: PlayerInfo[] }) => void;
  quizTriggered: (data: { playerId: string; quizCategory: string }) => void;
  quizCompleted: (data: { playerId: string; quizCategory: string }) => void;
  lifeEventTriggered: (data: { event: any; postPocketCash?: number }) => void;
  adminSettingsUpdated: (data: { adminSettings: AdminSettings }) => void;
  error: (data: { message: string }) => void;
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
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private isConnecting: boolean = false;

  connect(): void {
    if (this.socket?.connected) {
      console.log('🔄 Already connected to server');
      return;
    }

    if (this.isConnecting) {
      console.log('🔄 Connection already in progress');
      return;
    }

    if (this.socket) {
      console.log('🔄 Socket instance exists, reconnecting');
      this.socket.connect();
      return;
    }

    this.isConnecting = true;
    console.log('🔌 Attempting to connect to:', SERVER_URL);

    this.socket = io(SERVER_URL, {
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
      autoConnect: true,
      forceNew: false,
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      console.log('✅ Connected to server - Socket ID:', this.socket?.id);
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server - Reason:', reason);
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
    this.socket.on('quizTriggered', (data) => this.emit('quizTriggered', data));
    this.socket.on('quizCompleted', (data) => this.emit('quizCompleted', data));
    // Diagnostic: log when lifeEventTriggered arrives from server
    this.socket.on('lifeEventTriggered', (data) => {
      try {
        console.log(`🔔 lifeEventTriggered (socket): ${data?.event?.message} (${data?.event?.amount}), postPocketCash=${typeof data?.postPocketCash === 'number' ? `₹${data.postPocketCash}` : 'n/a'}`);
      } catch (err) {
        // noop
      }
      this.emit('lifeEventTriggered', data);
    });
    this.socket.on('adminSettingsUpdated', (data) => this.emit('adminSettingsUpdated', data));
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

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
export const socketService = new SocketService();
