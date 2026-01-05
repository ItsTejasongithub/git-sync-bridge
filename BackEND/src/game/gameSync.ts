import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/roomManager';
import { ServerToClientEvents, ClientToServerEvents } from '../types';

export class GameSyncManager {
  // Throttle leaderboard updates to reduce CPU usage (update every 2 seconds max)
  private leaderboardThrottleMap: Map<string, NodeJS.Timeout> = new Map();
  private readonly LEADERBOARD_UPDATE_INTERVAL = 2000; // 2 seconds

  constructor(
    private io: Server<ClientToServerEvents, ServerToClientEvents>,
    private roomManager: RoomManager
  ) {}

  // Broadcast game state update to all players in room
  broadcastGameState(roomId: string): void {
    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    this.io.to(roomId).emit('gameStateUpdate', {
      gameState: room.gameState,
    });
  }

  // Broadcast leaderboard update to all in room (throttled)
  broadcastLeaderboard(roomId: string): void {
    // Check if there's already a pending update for this room
    if (this.leaderboardThrottleMap.has(roomId)) {
      // Already scheduled, skip this update
      return;
    }

    // Schedule the update
    const timeout = setTimeout(() => {
      const leaderboard = this.roomManager.getLeaderboard(roomId);

      this.io.to(roomId).emit('leaderboardUpdate', {
        players: leaderboard,
      });

      // Clear the throttle for this room
      this.leaderboardThrottleMap.delete(roomId);
    }, this.LEADERBOARD_UPDATE_INTERVAL);

    // Store the timeout
    this.leaderboardThrottleMap.set(roomId, timeout);
  }

  // Handle player state update (networth, portfolio changes)
  handlePlayerStateUpdate(
    socket: Socket,
    playerId: string,
    networth: number,
    portfolioBreakdown: any
  ): void {
    const room = this.roomManager.getRoomByPlayerId(playerId);
    if (!room) return;

    // Don't accept updates if game has ended
    if (!room.gameState.isStarted) {
      return;
    }

    // Update player state
    this.roomManager.updatePlayerState(playerId, networth, portfolioBreakdown);

    // Broadcast updated leaderboard to everyone
    this.broadcastLeaderboard(room.id);
  }

  // Handle quiz started by a player
  handleQuizStarted(socket: Socket, playerId: string, quizCategory: string): void {
    const room = this.roomManager.getRoomByPlayerId(playerId);
    if (!room) return;

    // Mark quiz as started and pause game for all
    this.roomManager.markQuizStarted(playerId, quizCategory);

    // Notify all players that someone started a quiz (game is now paused)
    this.io.to(room.id).emit('quizTriggered', {
      playerId,
      quizCategory,
    });

    // Broadcast pause state
    this.io.to(room.id).emit('gamePaused', {
      reason: 'quiz',
      playersWaitingForQuiz: room.gameState.playersWaitingForQuiz,
    });

    // Disabled for performance: console.log(`⏸️ Game paused in room ${room.id} - ${playerId} started quiz: ${quizCategory}`);
  }

  // Handle quiz completed by a player
  handleQuizCompleted(socket: Socket, playerId: string, quizCategory: string): void {
    const room = this.roomManager.getRoomByPlayerId(playerId);
    if (!room) return;

    // Mark quiz as completed
    const shouldResume = this.roomManager.markQuizCompleted(playerId, quizCategory);

    // Notify all players that quiz was completed
    this.io.to(room.id).emit('quizCompleted', {
      playerId,
      quizCategory,
    });

    // If all quizzes done, resume game
    if (shouldResume) {
      this.io.to(room.id).emit('gameResumed');
      // Disabled for performance: console.log(`▶️ Game resumed in room ${room.id}`);
    } else {
      // Still waiting for others
      this.io.to(room.id).emit('gamePaused', {
        reason: 'quiz',
        playersWaitingForQuiz: room.gameState.playersWaitingForQuiz,
      });
    }
  }

  // Handle manual pause/resume toggle
  handleTogglePause(socket: Socket, roomId: string): void {
    const success = this.roomManager.togglePause(roomId);

    if (success) {
      const room = this.roomManager.getRoom(roomId);
      if (!room) return;

      if (room.gameState.isPaused) {
        this.io.to(roomId).emit('gamePaused', {
          reason: 'manual',
        });
      } else {
        this.io.to(roomId).emit('gameResumed');
      }
    }
  }

  // Sync time progression (called by frontend host periodically)
  syncTimeProgression(roomId: string, year: number, month: number): void {
    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    room.gameState.currentYear = year;
    room.gameState.currentMonth = month;

    this.broadcastGameState(roomId);
  }

  // Start server-side time progression for a room
  startTimeProgression(roomId: string, monthDurationMs: number): NodeJS.Timeout | null {
    const room = this.roomManager.getRoom(roomId);
    if (!room || !room.gameState.isStarted) return null;

    const interval = setInterval(() => {
      const room = this.roomManager.getRoom(roomId);
      if (!room || !room.gameState.isStarted) {
        clearInterval(interval);
        return;
      }

      // Don't progress time if game is paused
      if (room.gameState.isPaused) {
        return;
      }

      let newMonth = room.gameState.currentMonth + 1;
      let newYear = room.gameState.currentYear;

      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }

      // End game after 20 years
      if (newYear > 20) {
        clearInterval(interval);

        // Mark game as ended (stops all further updates)
        room.gameState.isStarted = false;

        // Send final leaderboard one last time
        const finalLeaderboard = this.roomManager.getLeaderboard(roomId);
        this.io.to(roomId).emit('leaderboardUpdate', {
          players: finalLeaderboard,
        });

        // Emit game ended event
        this.io.to(roomId).emit('gameEnded', {
          finalYear: newYear - 1,
          finalMonth: 12,
        });
        return;
      }

      // Update room state
      room.gameState.currentYear = newYear;
      room.gameState.currentMonth = newMonth;

      // Broadcast time update to all players
      this.io.to(roomId).emit('timeProgression', {
        year: newYear,
        month: newMonth,
      });

      // Check per-player life events and emit targeted events
      try {
        const lifeMap = room.gameState.lifeEvents || {};
        Object.keys(lifeMap).forEach(playerId => {
          const events = lifeMap[playerId] || [];
          events.forEach(ev => {
            if (!ev.triggered && ev.gameYear === newYear && ev.gameMonth === newMonth) {
              // Mark as triggered server-side to avoid duplicate triggers
              ev.triggered = true;

              // Apply event to the player's cash & networth on the server so broadcasts remain consistent
              try {
                const player = room.players.get(playerId);
                if (player) {
                  const available = player.portfolioBreakdown?.cash || 0;
                  const required = ev.amount < 0 ? Math.abs(ev.amount) : 0;
                  const status = available >= required ? 'ENOUGH' : 'INSUFFICIENT';

                  // Log concise life event check (keeps server logs focused)
                  console.log(`🧮 Life Event Check for ${playerId}: required=₹${required}, available=₹${available}, status=${status}`);

                  // Apply amount
                  player.portfolioBreakdown.cash = (player.portfolioBreakdown.cash || 0) + ev.amount;
                  player.networth = (player.networth || 0) + ev.amount;
                }
              } catch (err) {
                console.error('Error applying life event to player state:', err);
              }

              // Emit only to the target player (socket id == playerId) and include post-event cash for client sync
              try {
                const postPocketCash = room.players.get(playerId)?.portfolioBreakdown?.cash ?? undefined;
                this.io.to(playerId).emit('lifeEventTriggered', { event: ev, postPocketCash });
                console.log(`🔔 Life event emitted for player ${playerId} in room ${roomId}: ${ev.message} (${ev.amount})`);
              } catch (err) {
                console.warn('Failed to emit lifeEventTriggered to', playerId, err);
              }
            }
          });
        });
      } catch (err) {
        console.error('Error while processing life events:', err);
      }

      // Also broadcast full game state so clients can react to any state changes (asset unlocks, quotes, etc.)
      this.broadcastGameState(roomId);

      // Disabled for performance (spams terminal): console.log(`⏰ Room ${roomId} - Year ${newYear}, Month ${newMonth}`);
    }, monthDurationMs);

    return interval;
  }
}
