import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/roomManager';
import { ServerToClientEvents, ClientToServerEvents, PortfolioBreakdown } from '../types';
import {
  getPricesForDate,
  getGameSymbols,
  preloadPricesForGame,
  PriceSnapshot,
} from '../services/marketDataService';
import {
  initializeRoomKeys,
  encryptPriceData,
  cleanupRoomKeys,
  getSessionKeyForExchange,
  getAssetIndexMapping,
  hasRoomKeys,
} from '../services/roomKeyManager';
import { isPostgresPoolInitialized } from '../database/postgresDb';

export class GameSyncManager {
  // Throttle leaderboard updates to reduce CPU usage (update every 2 seconds max)
  private leaderboardThrottleMap: Map<string, NodeJS.Timeout> = new Map();
  private readonly LEADERBOARD_UPDATE_INTERVAL = 2000; // 2 seconds

  // Store current prices per room for networth validation
  private roomPrices: Map<string, PriceSnapshot> = new Map();

  constructor(
    private io: Server<ClientToServerEvents, ServerToClientEvents>,
    private roomManager: RoomManager
  ) { }

  /**
   * Initialize market data for a game session
   * Preloads prices and sets up encryption keys
   */
  async initializeMarketData(
    roomId: string,
    selectedAssets: any,
    startYear: number
  ): Promise<boolean> {
    if (!isPostgresPoolInitialized()) {
      console.warn(`⚠️ PostgreSQL not initialized, skipping market data setup for room ${roomId}`);
      return false;
    }

    try {
      const symbols = getGameSymbols(selectedAssets);
      console.log(`📊 Room ${roomId}: Initializing market data for ${symbols.length} symbols`);

      // Preload prices for the entire game duration
      await preloadPricesForGame(symbols, startYear, 20);

      // Initialize encryption keys
      initializeRoomKeys(roomId, symbols);

      return true;
    } catch (error) {
      console.error(`❌ Room ${roomId}: Failed to initialize market data:`, error);
      return false;
    }
  }

  /**
   * Broadcast encrypted prices for current tick
   * Called during time progression
   */
  async broadcastPriceTick(
    roomId: string,
    gameYear: number,
    gameMonth: number,
    calendarYear: number
  ): Promise<void> {
    if (!isPostgresPoolInitialized() || !hasRoomKeys(roomId)) {
      console.warn(`⚠️ Room ${roomId}: Cannot broadcast prices - PostgreSQL: ${isPostgresPoolInitialized()}, Keys: ${hasRoomKeys(roomId)}`);
      return; // Skip if not set up
    }

    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    try {
      const symbols = getGameSymbols(room.gameState.selectedAssets);
      console.log(`📊 Room ${roomId}: Fetching prices for ${symbols.length} symbols (Year: ${calendarYear}, Month: ${gameMonth})`);

      const prices = await getPricesForDate(symbols, calendarYear, gameMonth);

      // Validate prices before broadcasting
      const validPrices: { [symbol: string]: number } = {};
      let invalidCount = 0;

      for (const [symbol, price] of Object.entries(prices)) {
        if (typeof price === 'number' && isFinite(price) && price > 0) {
          validPrices[symbol] = price;
        } else {
          invalidCount++;
          console.warn(`⚠️ Invalid price for ${symbol}: ${price}`);
        }
      }

      if (invalidCount > 0) {
        console.warn(`⚠️ Room ${roomId}: ${invalidCount} invalid prices filtered out`);
      }

      console.log(`✅ Room ${roomId}: Broadcasting ${Object.keys(validPrices).length} valid prices`);

      // Store prices for validation
      this.roomPrices.set(roomId, validPrices);

      // Encrypt and broadcast
      const encrypted = encryptPriceData(roomId, validPrices);
      if (encrypted) {
        this.io.to(roomId).emit('priceTick', {
          year: gameYear,
          month: gameMonth,
          encrypted,
        });
      } else {
        console.error(`❌ Room ${roomId}: Failed to encrypt price data`);
      }
    } catch (error) {
      console.error(`❌ Room ${roomId}: Failed to broadcast price tick:`, error);
    }
  }

  /**
   * Handle key exchange request from client
   */
  handleKeyExchangeRequest(
    socket: Socket,
    callback: (response: { success: boolean; data?: any; error?: string }) => void
  ): void {
    const roomId = socket.data.roomId;
    if (!roomId) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }

    const sessionKey = getSessionKeyForExchange(roomId);
    const assetMapping = getAssetIndexMapping(roomId);

    if (sessionKey && assetMapping) {
      const keyData = {
        sessionKey,
        assetIndexMap: assetMapping,
      };

      // Send callback acknowledgment
      callback({
        success: true,
        data: keyData,
      });

      // Emit the keyExchangeResponse event that the client is waiting for
      socket.emit('keyExchangeResponse', keyData);
      console.log(`🔑 Room ${roomId}: Key exchange completed for ${socket.id}`);

      // Send initial price tick immediately so client has data
      const room = this.roomManager.getRoom(roomId);
      if (room) {
        console.log(`📊 Room ${roomId} state: Year ${room.gameState.currentYear}, Month ${room.gameState.currentMonth}, Started: ${room.gameState.isStarted}`);

        if (room.gameState.isStarted) {
          const calendarYear = room.adminSettings
            ? room.adminSettings.gameStartYear + room.gameState.currentYear - 1
            : 2000 + room.gameState.currentYear - 1;

          console.log(`📅 Sending initial price tick: Game Year ${room.gameState.currentYear}, Calendar Year ${calendarYear}, Month ${room.gameState.currentMonth}`);

          // Broadcast current prices immediately
          this.broadcastPriceTick(
            roomId,
            room.gameState.currentYear,
            room.gameState.currentMonth,
            calendarYear
          ).catch((err) => {
            console.error(`❌ Error sending initial price tick:`, err);
          });
        } else {
          console.warn(`⚠️ Room ${roomId}: Game not started yet, skipping initial price tick`);
        }
      } else {
        console.error(`❌ Room ${roomId} not found after key exchange`);
      }
    } else {
      callback({ success: false, error: 'Room encryption not initialized' });
    }
  }

  /**
   * Get current prices for a room (for server-side validation)
   */
  getRoomPrices(roomId: string): PriceSnapshot | undefined {
    return this.roomPrices.get(roomId);
  }

  /**
   * Cleanup room data when game ends
   */
  cleanupRoom(roomId: string): void {
    this.roomPrices.delete(roomId);
    cleanupRoomKeys(roomId);
  }

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

        // Cleanup room encryption and price data
        this.cleanupRoom(roomId);

        console.log(`🏁 Game ended in room ${roomId}. Waiting for players to log to DB...`);

        // Emit game ended event FIRST so players can log to database
        this.io.to(roomId).emit('gameEnded', {
          finalYear: newYear - 1,
          finalMonth: 12,
        });

        // Wait 3 seconds for all players to log their final networth to database
        setTimeout(() => {
          console.log(`📊 Emitting signal for host to fetch final leaderboard from DB for room ${roomId}`);
          // Emit special event telling host to fetch final leaderboard from DB
          this.io.to(roomId).emit('fetchFinalLeaderboardFromDB', {
            roomId: roomId,
          });

          // Additionally, fetch the final leaderboard from DB on the server and broadcast
          try {
            const { getPlayerLogs } = require('../database/playerLogs');
            const logs = getPlayerLogs({ roomId, gameMode: 'multiplayer' });

            // Deduplicate by normalized player name (first occurrence is latest since logs are ordered by completed_at DESC)
            const latestByPlayer: Map<string, any> = new Map();
            for (const log of logs) {
              const key = (log.playerName || '').trim().toLowerCase();
              if (!latestByPlayer.has(key)) latestByPlayer.set(key, log);
            }

            const leaderboard = Array.from(latestByPlayer.values()).map(l => ({
              playerId: l.uniqueId,
              playerName: l.playerName,
              networth: l.finalNetworth,
              portfolioBreakdown: l.portfolioBreakdown,
            })).sort((a, b) => b.networth - a.networth);

            console.log(`📢 Broadcasting final leaderboard from DB (${leaderboard.length} players) for room ${roomId}`);
            this.io.to(roomId).emit('finalLeaderboard', { leaderboard });
          } catch (err) {
            console.error('Error fetching/broadcasting final leaderboard from DB:', err);
          }
        }, 3000);

        return;
      }

      // Update room state
      room.gameState.currentYear = newYear;
      room.gameState.currentMonth = newMonth;

      // Calculate calendar year for price lookup
      const calendarYear = room.adminSettings
        ? room.adminSettings.gameStartYear + newYear - 1
        : 2000 + newYear - 1;

      // Broadcast encrypted prices BEFORE time progression
      // This ensures clients have prices ready when they receive the time update
      this.broadcastPriceTick(roomId, newYear, newMonth, calendarYear).catch((err) => {
        console.error(`Error broadcasting price tick for room ${roomId}:`, err);
      });

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
