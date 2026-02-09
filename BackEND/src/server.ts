import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/roomManager';
import { GameSyncManager } from './game/gameSync';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './types';
import * as os from 'os';
import { initializeDatabase, closeDatabase } from './database/db';
import { initPostgresPool, closePostgresPool, isPostgresPoolInitialized } from './database/postgresDb';
import { cleanupAllRoomKeys } from './services/roomKeyManager';
import adminRoutes from './routes/adminRoutes';
import gameLogRoutes from './routes/gameLogRoutes';
import aiReportRoutes from './routes/aiReportRoutes';
import tradeRoutes from './routes/tradeRoutes';
import priceRoutes from './routes/priceRoutes';

// Performance: Reduce logging for better performance
const VERBOSE_LOGGING = false; // Set to true only for debugging
const log = () => { };

const app = express();

const httpServer = createServer(app);

// CORS configuration for local network
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Socket.io setup
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: '*', // Allow all origins in local network
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  }
);

// Initialize managers
const roomManager = new RoomManager();
const gameSyncManager = new GameSyncManager(io, roomManager);

// Get local network IP address
function getLocalNetworkIP(): string {
  const interfaces = os.networkInterfaces();
  let fallbackIP = '';

  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name];
    if (!nets) continue;

    for (const net of nets) {
      // Skip internal and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        const ip = net.address;

        // Prefer 192.168.x.x (most common home network)
        if (ip.startsWith('192.168.')) {
          return ip;
        }

        // Fallback to 10.x.x.x
        if (ip.startsWith('10.') && !fallbackIP) {
          fallbackIP = ip;
        }

        // Last resort: any other IP (but avoid 172.x which are often virtual)
        if (!fallbackIP && !ip.startsWith('172.')) {
          fallbackIP = ip;
        }

        // Very last resort: even 172.x
        if (!fallbackIP) {
          fallbackIP = ip;
        }
      }
    }
  }
  return fallbackIP || 'localhost';
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'BullRun Server is running!' });
});

// Admin API routes
app.use('/api/admin', adminRoutes);

// Game logging API routes
app.use('/api/game', gameLogRoutes);

// AI Report API routes
app.use('/api/ai-report', aiReportRoutes);

// Trade logging API routes
app.use('/api/trades', tradeRoutes);

// Price API routes (PostgreSQL market data)
app.use('/api/prices', priceRoutes);

// DEV-ONLY: Trigger game end for all rooms or a specific room
// Only enabled when NODE_ENV is not 'production' to avoid accidental use
if (process.env.NODE_ENV !== 'production') {
  app.post('/debug/endAll', (req, res) => {
    try {
      const rooms = roomManager.getAllRooms();
      rooms.forEach(room => {
        // Set final state (20 years, month 12)
        room.gameState.currentYear = 20;
        room.gameState.currentMonth = 12;
        room.gameState.isStarted = false;
        // Emit gameEnded to all sockets in the room
        io.to(room.id).emit('gameEnded', { finalYear: 20, finalMonth: 12 });
      });
      res.json({ success: true, roomsAffected: rooms.length });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'unknown' });
    }
  });

  app.post('/debug/endRoom', (req, res) => {
    try {
      const roomId = (req.query.roomId as string) || null;
      if (!roomId) return res.status(400).json({ success: false, error: 'roomId query param required' });
      const room = roomManager.getRoom(roomId);
      if (!room) return res.status(404).json({ success: false, error: 'room not found' });

      room.gameState.currentYear = 20;
      room.gameState.currentMonth = 12;
      room.gameState.isStarted = false;

      io.to(roomId).emit('gameEnded', { finalYear: 20, finalMonth: 12 });

      res.json({ success: true, roomId });
    } catch (err) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'unknown' });
    }
  });
}

// Socket.io connection handling
io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  log(`🔌 Client connected: ${socket.id}`);

  // Create room
  socket.on('createRoom', (data, callback) => {
    try {
      const roomId = roomManager.createRoom(socket.id, data.playerName);

      // Store socket data
      socket.data.roomId = roomId;
      socket.data.playerId = socket.id;
      socket.data.playerName = data.playerName;

      // Join socket room
      socket.join(roomId);

      callback({ success: true, roomId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      callback({ success: false, error: errorMessage });
    }
  });

  // Join room
  socket.on('joinRoom', (data, callback) => {
    try {
      const result = roomManager.joinRoom(data.roomId, socket.id, data.playerName);

      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      // Store socket data
      socket.data.roomId = data.roomId;
      socket.data.playerId = socket.id;
      socket.data.playerName = data.playerName;

      // Join socket room
      socket.join(data.roomId);

      const room = result.room!;
      const players = Array.from(room.players.values());

      // Send success to joining player
      callback({
        success: true,
        players,
        adminSettings: room.adminSettings,
      });

      // Notify others in the room
      socket.to(data.roomId).emit('playerJoined', {
        player: room.players.get(socket.id)!,
      });

      // Broadcast updated leaderboard to everyone in room
      gameSyncManager.broadcastLeaderboard(data.roomId);

      // If the game has already started, send the current gameState to the joining socket so they sync (cards, quotes, etc.)
      if (room.gameState.isStarted) {
        socket.emit('gameStateUpdate', { gameState: room.gameState });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      callback({ success: false, error: errorMessage });
    }
  });

  // Leave room
  socket.on('leaveRoom', () => {
    handlePlayerLeave(socket);
  });

  // Start game (host only)
  socket.on('startGame', async (data, callback) => {
    try {
      const roomId = socket.data.roomId;
      if (!roomId) {
        callback({ success: false, error: 'Not in a room' });
        return;
      }

      const room = roomManager.getRoom(roomId);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      if (room.hostId !== socket.id) {
        callback({ success: false, error: 'Only host can start the game' });
        return;
      }

      const result = roomManager.startGame(roomId, data.adminSettings);

      if (!result.success) {
        callback({ success: false, error: result.error });
        return;
      }

      // If host provided initial game state (selected assets / quotes / questions), store it on the room
      if (data.initialGameState) {
        if (data.initialGameState.selectedAssets) {
          room.gameState.selectedAssets = data.initialGameState.selectedAssets;
        }
        if (data.initialGameState.assetUnlockSchedule) {
          room.gameState.assetUnlockSchedule = data.initialGameState.assetUnlockSchedule;
        }
        if (data.initialGameState.yearlyQuotes) {
          room.gameState.yearlyQuotes = data.initialGameState.yearlyQuotes;
        }
        if (data.initialGameState.quizQuestionIndices) {
          room.gameState.quizQuestionIndices = data.initialGameState.quizQuestionIndices;
        }

        // After applying initial game state (asset unlock schedule etc.), generate life events for each player
        try {
          const count = (data.adminSettings && typeof data.adminSettings.eventsCount === 'number') ? data.adminSettings.eventsCount : 3;
          roomManager.generateLifeEventsForRoom(roomId, count);
        } catch (err) {
        }
      }

      // Initialize market data from PostgreSQL (MANDATORY for multiplayer)
      if (room.gameState.selectedAssets && data.adminSettings.gameStartYear) {
        try {
          const success = await gameSyncManager.initializeMarketData(
            roomId,
            room.gameState.selectedAssets,
            data.adminSettings.gameStartYear
          );

          if (!success) {
            console.error(`❌ Room ${roomId}: Market data initialization failed - PostgreSQL unavailable`);
            callback({
              success: false,
              error: 'Database connection error. Please check the database or contact your administrator for assistance.'
            });
            return;
          }

        } catch (err) {
          console.error(`❌ Room ${roomId}: Market data init error:`, err);
          callback({
            success: false,
            error: 'Database error occurred. Please contact your administrator for more information.'
          });
          return;
        }
      } else {
        console.error(`❌ Room ${roomId}: Missing selectedAssets or gameStartYear`);
        callback({
          success: false,
          error: 'Invalid game configuration - missing asset selection or start year'
        });
        return;
      }

      callback({ success: true });

      // Broadcast game started to all players
      io.to(roomId).emit('gameStarted', {
        gameState: room.gameState,
        adminSettings: data.adminSettings,
      });

      // Broadcast initial leaderboard so UI shows up immediately
      gameSyncManager.broadcastLeaderboard(roomId);

      // Start server-side time progression - use admin setting or default 5000ms (5 seconds)
      const MONTH_DURATION_MS = data.adminSettings.monthDuration || 5000;
      const interval = gameSyncManager.startTimeProgression(roomId, MONTH_DURATION_MS);
      if (interval) {
        room.timeProgressionInterval = interval;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
      callback({ success: false, error: errorMessage });
    }
  });

  // Toggle pause (host only)
  socket.on('togglePause', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;

    gameSyncManager.handleTogglePause(socket, roomId);
  });

  // Player state update (networth, portfolio)
  socket.on('updatePlayerState', (data) => {
    const playerId = socket.data.playerId;
    if (!playerId) return;

    gameSyncManager.handlePlayerStateUpdate(
      socket,
      playerId,
      data.networth,
      data.portfolioBreakdown
    );
  });

  // Quiz started
  socket.on('quizStarted', (data) => {
    const playerId = socket.data.playerId;
    if (!playerId) return;

    gameSyncManager.handleQuizStarted(socket, playerId, data.quizCategory);
  });

  // Quiz finished
  socket.on('quizFinished', (data) => {
    const playerId = socket.data.playerId;
    if (!playerId) return;

    gameSyncManager.handleQuizCompleted(socket, playerId, data.quizCategory);
  });

  // Intro completed
  socket.on('introCompleted', () => {
    const playerId = socket.data.playerId;
    if (!playerId) return;

    gameSyncManager.handleIntroCompleted(socket, playerId);
  });

  // === Secure Price Broadcast Handlers ===

  // Key exchange request
  socket.on('requestKeyExchange', (callback) => {
    gameSyncManager.handleKeyExchangeRequest(socket, callback);
  });

  // Networth submission for validation
  socket.on('submitNetworth', (data, callback) => {
    const playerId = socket.data.playerId;
    if (!playerId) {
      callback({ valid: false, error: 'Not in a game' });
      return;
    }

    const roomId = socket.data.roomId;
    if (!roomId) {
      callback({ valid: false, error: 'Not in a room' });
      return;
    }

    // Get server prices for validation
    const prices = gameSyncManager.getRoomPrices(roomId);
    if (!prices) {
      // If no server prices, accept client value (fallback for solo mode or early game)
      roomManager.updatePlayerState(playerId, data.networth, data.portfolioBreakdown);
      gameSyncManager.broadcastLeaderboard(roomId);
      callback({ valid: true, serverNetworth: data.networth });
      return;
    }

    // For now, accept client networth but log for monitoring
    // Full server-side validation will be implemented in Phase 5
    roomManager.updatePlayerState(playerId, data.networth, data.portfolioBreakdown);
    gameSyncManager.broadcastLeaderboard(roomId);
    callback({ valid: true, serverNetworth: data.networth });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    handlePlayerLeave(socket);
  });
});

// Helper function to handle player leaving
function handlePlayerLeave(socket: Socket) {
  const playerId = socket.data.playerId;
  if (!playerId) return;

  const result = roomManager.leaveRoom(playerId);

  if (result.roomId) {
    // Notify other players
    socket.to(result.roomId).emit('playerLeft', {
      playerId,
    });

    // Broadcast updated leaderboard
    gameSyncManager.broadcastLeaderboard(result.roomId);

    // If host left, notify and close room
    if (result.wasHost) {
      io.to(result.roomId).emit('error', {
        message: 'Host left the game. Room closed.',
      });
    }

  }
}

// Cleanup old rooms every hour
setInterval(() => {
  roomManager.cleanupOldRooms();
}, 60 * 60 * 1000);

// Initialize database and start server
async function startServer() {
  try {
    console.log('📊 Initializing databases...');

    // Initialize SQLite database (game data)
    await initializeDatabase();
    console.log('✓ SQLite database initialized');

    // Initialize PostgreSQL database (market data) - MANDATORY
    try {
      await initPostgresPool();
      console.log('✓ PostgreSQL database connected');
    } catch (pgError) {
      console.error('\n❌ CRITICAL ERROR: PostgreSQL connection failed!');
      console.error('📋 Details:', pgError instanceof Error ? pgError.message : pgError);
      console.error('\n🔧 Troubleshooting:');
      console.error('   1. Make sure Docker container is running: docker ps');
      console.error('   2. Start the database: docker compose up -d');
      console.error('   3. Verify connection settings in .env file');
      console.error('   4. Check database logs: docker logs bullrun_game_postgres');
      console.error('\n⚠️  PostgreSQL is REQUIRED for the game to function.');
      console.error('   Please check the database or contact your administrator.\n');
      process.exit(1);
    }

    const PORT = process.env.PORT || 3001;
    const localIP = getLocalNetworkIP();

    httpServer.listen(PORT as number, '0.0.0.0', () => {
      console.log('\n🚀 Server started successfully!');
      console.log(`   Network: http://${localIP}:${PORT}`);
      console.log(`   Local: http://localhost:${PORT}`);
      console.log(`   PostgreSQL: Connected on port ${process.env.POSTGRES_PORT || 5432}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
async function gracefulShutdown() {


  // Cleanup room encryption keys
  cleanupAllRoomKeys();

  // Close databases
  closeDatabase();
  await closePostgresPool();

  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

startServer();
