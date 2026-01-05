import { Room, PlayerInfo, AdminSettings, GameState } from '../types';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map(); // playerId -> roomId

  // Generate 6-digit alphanumeric room code
  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0, O, 1, I
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Ensure uniqueness
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }

    return code;
  }

  createRoom(hostId: string, hostName: string): string {
    const roomId = this.generateRoomCode();

    const hostPlayer: PlayerInfo = {
      id: hostId,
      name: hostName,
      isHost: true,
      isReady: false,
      networth: 0,
      portfolioBreakdown: {
        cash: 0,
        savings: 0,
        gold: 0,
        funds: 0,
        stocks: 0,
        crypto: 0,
        commodities: 0,
        reits: 0,
      },
      quizStatus: {
        currentQuiz: null,
        isCompleted: false,
      },
    };

    const gameState: GameState = {
      isStarted: false,
      isPaused: false,
      pauseReason: null,
      currentYear: 1,
      currentMonth: 1,
      playersWaitingForQuiz: [],
    };

    const room: Room = {
      id: roomId,
      hostId,
      players: new Map([[hostId, hostPlayer]]),
      adminSettings: null,
      gameState,
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    this.playerToRoom.set(hostId, roomId);

    console.log(`✅ Room created: ${roomId} by ${hostName}`);
    return roomId;
  }

  joinRoom(roomId: string, playerId: string, playerName: string): { success: boolean; error?: string; room?: Room } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.gameState.isStarted) {
      return { success: false, error: 'Game already in progress' };
    }

    if (room.players.has(playerId)) {
      return { success: false, error: 'Player already in room' };
    }

    const newPlayer: PlayerInfo = {
      id: playerId,
      name: playerName,
      isHost: false,
      isReady: false,
      networth: 100000, // Starting cash
      portfolioBreakdown: {
        cash: 100000,
        savings: 0,
        gold: 0,
        funds: 0,
        stocks: 0,
        crypto: 0,
        commodities: 0,
        reits: 0,
      },
      quizStatus: {
        currentQuiz: null,
        isCompleted: false,
      },
    };

    room.players.set(playerId, newPlayer);
    this.playerToRoom.set(playerId, roomId);

    console.log(`✅ Player ${playerName} joined room ${roomId}`);
    return { success: true, room };
  }

  leaveRoom(playerId: string): { roomId?: string; wasHost: boolean } {
    const roomId = this.playerToRoom.get(playerId);

    if (!roomId) {
      return { wasHost: false };
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return { wasHost: false };
    }

    const player = room.players.get(playerId);
    const wasHost = player?.isHost || false;

    room.players.delete(playerId);
    this.playerToRoom.delete(playerId);

    console.log(`👋 Player ${player?.name} left room ${roomId}`);

    // If host left or room is empty, delete room
    if (wasHost || room.players.size === 0) {
      this.deleteRoom(roomId);
      console.log(`🗑️ Room ${roomId} deleted`);
    }

    return { roomId, wasHost };
  }

  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      // Clear time progression timer if it exists
      if (room.timeProgressionInterval) {
        clearInterval(room.timeProgressionInterval);
      }
      // Remove all player mappings
      room.players.forEach((_, playerId) => {
        this.playerToRoom.delete(playerId);
      });
      this.rooms.delete(roomId);
    }
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  // Developer helper: return all rooms (used by debug endpoints/tests)
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    const roomId = this.playerToRoom.get(playerId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  updateAdminSettings(roomId: string, settings: AdminSettings): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.adminSettings = settings;
    console.log(`⚙️ Admin settings updated for room ${roomId}`);
    return true;
  }

  startGame(roomId: string, adminSettings: AdminSettings): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.gameState.isStarted) {
      return { success: false, error: 'Game already started' };
    }

    if (room.players.size < 2) {
      return { success: false, error: 'Need at least 2 players to start' };
    }

    room.adminSettings = adminSettings;
    room.gameState.isStarted = true;
    room.gameState.currentYear = 1;
    room.gameState.currentMonth = 1;

    console.log(`🎮 Game started in room ${roomId} with ${room.players.size} players`);
    return { success: true };
  }

  // Generate per-player life events and store in room.gameState.lifeEvents
  generateLifeEventsForRoom(roomId: string, eventsCount: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const { gameState } = room;
    const mapping: { [playerId: string]: any[] } = {};
    const { generateLifeEvents } = require('../game/lifeEvents');

    room.players.forEach((_, playerId) => {
      try {
        const events = generateLifeEvents(eventsCount, gameState.assetUnlockSchedule);
        mapping[playerId] = events;
        console.log(`✨ Generated ${events.length} life events for player ${playerId} in room ${roomId}`);
      } catch (err) {
        console.error('Failed to generate life events for player', playerId, err);
        mapping[playerId] = [];
      }
    });

    room.gameState.lifeEvents = mapping as any;
    return true;
  }

  updatePlayerState(playerId: string, networth: number, portfolioBreakdown: any): boolean {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    player.networth = networth;
    player.portfolioBreakdown = portfolioBreakdown;

    return true;
  }

  getLeaderboard(roomId: string): PlayerInfo[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    // Sort by networth descending, exclude host
    // Use comparison operators instead of subtraction to avoid precision issues with large numbers
    const leaderboard = Array.from(room.players.values())
      .filter(player => !player.isHost)
      .sort((a, b) => {
        if (b.networth > a.networth) return 1;
        if (b.networth < a.networth) return -1;
        return 0;
      });

    // Debug logging
    console.log(`📊 Leaderboard for room ${roomId}:`);
    console.log(`   Total players: ${room.players.size}`);
    console.log(`   Leaderboard entries: ${leaderboard.length}`);
    room.players.forEach(p => {
      console.log(`   - ${p.name} (${p.id.substring(0, 6)}...): isHost=${p.isHost}, networth=${p.networth}`);
    });

    return leaderboard;
  }

  // Quiz management
  markQuizStarted(playerId: string, quizCategory: string): boolean {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    player.quizStatus.currentQuiz = quizCategory;
    player.quizStatus.isCompleted = false;

    // Pause game for all players
    room.gameState.isPaused = true;
    room.gameState.pauseReason = 'quiz';

    // Add player to waiting list if not already there
    if (!room.gameState.playersWaitingForQuiz.includes(playerId)) {
      room.gameState.playersWaitingForQuiz.push(playerId);
    }

    console.log(`📝 Quiz started for player ${player.name}: ${quizCategory}`);
    return true;
  }

  markQuizCompleted(playerId: string, quizCategory: string): boolean {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return false;

    const player = room.players.get(playerId);
    if (!player) return false;

    player.quizStatus.currentQuiz = null;
    player.quizStatus.isCompleted = true;

    // Remove player from waiting list
    room.gameState.playersWaitingForQuiz = room.gameState.playersWaitingForQuiz.filter(
      id => id !== playerId
    );

    // If no more players waiting for quiz, resume game
    const shouldResume = room.gameState.playersWaitingForQuiz.length === 0;

    if (shouldResume) {
      room.gameState.isPaused = false;
      room.gameState.pauseReason = null;
      console.log(`▶️ All quizzes completed. Game resumed in room ${room.id}`);
    }

    console.log(`✅ Quiz completed for player ${player.name}: ${quizCategory}`);
    return shouldResume;
  }

  togglePause(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState.isStarted) return false;

    // Don't allow manual pause if quiz is in progress
    if (room.gameState.pauseReason === 'quiz') {
      return false;
    }

    room.gameState.isPaused = !room.gameState.isPaused;
    room.gameState.pauseReason = room.gameState.isPaused ? 'manual' : null;

    console.log(`⏸️ Game ${room.gameState.isPaused ? 'paused' : 'resumed'} in room ${roomId}`);
    return true;
  }

  // Clean up old rooms (optional - run periodically)
  cleanupOldRooms(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const roomsToDelete: string[] = [];

    this.rooms.forEach((room, roomId) => {
      if (now - room.createdAt > maxAgeMs && !room.gameState.isStarted) {
        roomsToDelete.push(roomId);
      }
    });

    roomsToDelete.forEach(roomId => {
      this.deleteRoom(roomId);
      console.log(`🧹 Cleaned up old room: ${roomId}`);
    });
  }
}
