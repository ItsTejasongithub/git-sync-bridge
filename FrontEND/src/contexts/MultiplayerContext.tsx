import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { socketService } from '../services/socketService';
import { fetchFinalLeaderboard } from '../services/adminApi';
import { TOTAL_GAME_YEARS } from '../utils/constants';
import { PlayerInfo, RoomInfo, MultiplayerGameState, MultiplayerMode } from '../types/multiplayer';
import { AdminSettings } from '../types';

interface MultiplayerContextType {
  // Connection state
  isConnected: boolean;
  // Current player's socket id
  playerId?: string | null;

  // Room state
  roomInfo: RoomInfo | null;
  multiplayerMode: MultiplayerMode | null;

  // Game state
  gameState: MultiplayerGameState | null;
  leaderboard: PlayerInfo[];

  // Actions
  createRoom: (playerName: string) => Promise<void>;
  joinRoom: (roomId: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  startGame: (adminSettings: AdminSettings) => Promise<void>;
  updatePlayerState: (networth: number, portfolioBreakdown: any) => void;
  notifyQuizStarted: (quizCategory: string) => void;
  notifyQuizCompleted: (quizCategory: string) => void;

  // Error handling
  error: string | null;
  clearError: () => void;
} 

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within MultiplayerProvider');
  }
  return context;
};

interface MultiplayerProviderProps {
  children: ReactNode;
}

export const MultiplayerProvider: React.FC<MultiplayerProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(socketService.getSocketId() ?? null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [multiplayerMode, setMultiplayerMode] = useState<MultiplayerMode | null>(null);
  const [gameState, setGameState] = useState<MultiplayerGameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<PlayerInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to server on mount

    // Check if already connected before trying to connect
    if (socketService.isConnected()) {
      setIsConnected(true);
    } else {
      socketService.connect();
      // Check initial connection state after a brief delay
      setTimeout(() => {
        const initiallyConnected = socketService.isConnected();
        setIsConnected(initiallyConnected);
      }, 100);
    }

    // Event handlers
    const handleConnect = () => {
      setIsConnected(true);
      setPlayerId(socketService.getSocketId() ?? null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setPlayerId(null);
    }; 

    const handleError = (message: string) => {
      setError(message);
    };

    const handlePlayerJoined = (data: { player: PlayerInfo }) => {
      setRoomInfo(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, data.player],
        };
      });
    };

    const handlePlayerLeft = (data: { playerId: string }) => {
      setRoomInfo(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter(p => p.id !== data.playerId),
        };
      });
    };

    const handleGameStarted = (data: { gameState: MultiplayerGameState; adminSettings: AdminSettings }) => {
      setGameState(data.gameState);
      setRoomInfo(prev => {
        if (!prev) return prev;
        // Determine mode based on if we're host
        setMultiplayerMode(prev.isHost ? 'host-spectator' : 'player-game');
        return {
          ...prev,
          adminSettings: data.adminSettings,
        };
      });
    };

    const handleGameStateUpdate = (data: { gameState: MultiplayerGameState }) => {
      // Avoid overwriting player-local financial state (pocketCash, holdings, fixedDeposits, etc.)
      // Server sends full room game state for convenience, but clients must merge only the global/shared parts.
      setGameState(prev => {
        if (!prev) return data.gameState;

        const server = data.gameState;

        // Debug: detect server attempts to overwrite player-local financials
        try {
          const serverAny = server as any;
          const prevAny = prev as any;

          if (typeof serverAny.pocketCash !== 'undefined' && serverAny.pocketCash !== prevAny.pocketCash) {
            // Make these warnings more visible during debugging so we can detect unexpected overwrites
          }

          if (serverAny.holdings && JSON.stringify(serverAny.holdings) !== JSON.stringify(prevAny.holdings)) {
          }

          if (serverAny.fixedDeposits && JSON.stringify(serverAny.fixedDeposits) !== JSON.stringify(prevAny.fixedDeposits)) {
          }
        } catch (err) {
          // Swallow any stringify errors in debug logging
        }

        return {
          ...prev,
          // Global/shared fields that should be synced from server
          currentYear: server.currentYear,
          currentMonth: server.currentMonth,
          isPaused: server.isPaused,
          pauseReason: server.pauseReason || prev.pauseReason,
          playersWaitingForQuiz: server.playersWaitingForQuiz || prev.playersWaitingForQuiz,
          assetUnlockSchedule: server.assetUnlockSchedule || prev.assetUnlockSchedule,
          yearlyQuotes: server.yearlyQuotes || prev.yearlyQuotes,
          // Do NOT overwrite: pocketCash, holdings, fixedDeposits, savingsAccount, selectedAssets
        } as MultiplayerGameState;
      });
    };

    const handleGamePaused = (data: { reason: 'quiz' | 'manual'; playersWaitingForQuiz?: string[] }) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          isPaused: true,
          pauseReason: data.reason,
          playersWaitingForQuiz: data.playersWaitingForQuiz || [],
        };
      });
    };

    const handleGameResumed = () => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          isPaused: false,
          pauseReason: null,
          playersWaitingForQuiz: [],
        };
      });
    };

    const handleLeaderboardUpdate = (data: { players: PlayerInfo[] }) => {
      setLeaderboard(data.players);
    };

    const handleTimeProgression = (data: { year: number; month: number }) => {
      setGameState(prev => {
        if (!prev) return prev;
        // Prevent time updates if the game is already marked ended
        if (!prev.isStarted && prev.currentYear >= TOTAL_GAME_YEARS) return prev;
        return {
          ...prev,
          currentYear: data.year,
          currentMonth: data.month,
        };
      });
    };

    const handleGameEnded = (data: { finalYear: number; finalMonth: number }) => {
      // Ensure clients set the final year/month and mark game as ended so UI can navigate to end screen
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentYear: data.finalYear,
          currentMonth: data.finalMonth,
          isStarted: false,
        };
      });
    };

    // When server signals, host should fetch the final leaderboard from DB (server waits for players to log)
    const handleFetchFinalLeaderboardFromDB = async (data: { roomId: string }) => {
      try {
        if (!roomInfo?.isHost) {
          // Only the host needs to fetch from DB and show accurate data on the host leaderboard
          return;
        }

        const res = await fetchFinalLeaderboard(data.roomId);

        if (res.success && res.leaderboard) {
          // Map backend leaderboard entries to frontend PlayerInfo shape
          // Try to match DB entries to room players by name so we preserve socket ids and host flags
          const mapped = res.leaderboard.map(pl => {
            // Find in-room player with the same normalized name (trim + lowercase)
            const normalizedName = pl.playerName?.trim().toLowerCase() || '';
            const match = roomInfo?.players.find(p => (p.name || '').trim().toLowerCase() === normalizedName);

            if (!match) {
              // No in-room match: use DB unique id (pl.playerId) as identifier
              return {
                id: pl.playerId ?? pl.playerName,
                name: pl.playerName,
                isHost: false,
                isReady: false,
                networth: pl.networth,
                portfolioBreakdown: pl.portfolioBreakdown || {
                  cash: 0,
                  savings: 0,
                  gold: 0,
                  funds: 0,
                  stocks: 0,
                  crypto: 0,
                  commodities: 0,
                  reits: 0,
                },
                quizStatus: { currentQuiz: null, isCompleted: false },
              };
            }

            // If there are multiple players with the same normalized name, log a warning and pick the first match
            const duplicates = roomInfo?.players.filter(p => (p.name || '').trim().toLowerCase() === normalizedName) || [];
            if (duplicates.length > 1) {
            }

            // Use existing in-room id to ensure UI interactions (toggles, quiz flags) map correctly
            return {
              id: match.id,
              name: pl.playerName,
              isHost: match.isHost || false,
              isReady: match.isReady || false,
              networth: pl.networth,
              portfolioBreakdown: pl.portfolioBreakdown || match.portfolioBreakdown || {
                cash: 0,
                savings: 0,
                gold: 0,
                funds: 0,
                stocks: 0,
                crypto: 0,
                commodities: 0,
                reits: 0,
              },
              quizStatus: match.quizStatus || { currentQuiz: null, isCompleted: false },
            };
          });


          // Update in-memory room players with final DB values where possible so host UI reflects DB
          setRoomInfo(prev => {
            if (!prev) return prev;
            const updatedPlayers = prev.players.map(p => {
              const dbMatch = mapped.find(m => (m.name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase());
              if (!dbMatch) return p;
              return {
                ...p,
                networth: dbMatch.networth,
                portfolioBreakdown: dbMatch.portfolioBreakdown || p.portfolioBreakdown,
              };
            });
            return {
              ...prev,
              players: updatedPlayers,
            };
          });

          setLeaderboard(mapped);
        } else {
          console.error('Host: Failed to fetch final leaderboard from DB:', res.message);
        }
      } catch (err) {
        console.error('Error fetching final leaderboard from DB:', err);
      }
    };

    // Register event handlers
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('error', handleError);
    socketService.on('playerJoined', handlePlayerJoined);
    socketService.on('playerLeft', handlePlayerLeft);
    socketService.on('gameStarted', handleGameStarted);
    socketService.on('gameStateUpdate', handleGameStateUpdate);
    socketService.on('gamePaused', handleGamePaused);
    socketService.on('gameResumed', handleGameResumed);
    socketService.on('timeProgression', handleTimeProgression);
    socketService.on('gameEnded', handleGameEnded);
    socketService.on('leaderboardUpdate', handleLeaderboardUpdate);
    socketService.on('fetchFinalLeaderboardFromDB', handleFetchFinalLeaderboardFromDB);

    // Server or Host may broadcast an authoritative finalLeaderboard event - handle for all clients
    const handleFinalLeaderboard = (data: { leaderboard: { playerId: string; playerName: string; networth: number; portfolioBreakdown?: any }[] }) => {
      try {
        if (!data?.leaderboard || !Array.isArray(data.leaderboard)) return;

        // Map DB entries to frontend PlayerInfo-like shape, attempting to preserve existing socket ids
        const mapped = data.leaderboard.map(pl => {
          const normalizedName = pl.playerName?.trim().toLowerCase() || '';
          const match = roomInfo?.players.find(p => (p.name || '').trim().toLowerCase() === normalizedName);

          if (!match) {
            // No in-room player matched: keep DB id
            return {
              id: pl.playerId ?? pl.playerName,
              name: pl.playerName,
              isHost: false,
              isReady: false,
              networth: pl.networth,
              portfolioBreakdown: pl.portfolioBreakdown || {
                cash: 0,
                savings: 0,
                gold: 0,
                funds: 0,
                stocks: 0,
                crypto: 0,
                commodities: 0,
                reits: 0,
              },
              quizStatus: { currentQuiz: null, isCompleted: false },
            };
          }

          // If duplicate names exist, warn and pick the first match
          const duplicates = roomInfo?.players.filter(p => (p.name || '').trim().toLowerCase() === normalizedName) || [];
          if (duplicates.length > 1) {
          }

          return {
            id: match.id,
            name: pl.playerName,
            isHost: match.isHost || false,
            isReady: match.isReady || false,
            networth: pl.networth,
            portfolioBreakdown: pl.portfolioBreakdown || match.portfolioBreakdown || {
              cash: 0,
              savings: 0,
              gold: 0,
              funds: 0,
              stocks: 0,
              crypto: 0,
              commodities: 0,
              reits: 0,
            },
            quizStatus: match.quizStatus || { currentQuiz: null, isCompleted: false },
          };
        });

        // Update in-memory room players with final DB values where possible
        setRoomInfo(prev => {
          if (!prev) return prev;
          const updatedPlayers = prev.players.map(p => {
            const dbMatch = mapped.find(m => (m.name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase());
            if (!dbMatch) return p;
            return {
              ...p,
              networth: dbMatch.networth,
              portfolioBreakdown: dbMatch.portfolioBreakdown || p.portfolioBreakdown,
            };
          });
          return {
            ...prev,
            players: updatedPlayers,
          };
        });

        setLeaderboard(mapped);
      } catch (err) {
        console.error('Error handling finalLeaderboard event:', err);
      }
    };

    socketService.on('finalLeaderboard', handleFinalLeaderboard);

    // Cleanup - only on unmount
    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('error', handleError);
      socketService.off('playerJoined', handlePlayerJoined);
      socketService.off('playerLeft', handlePlayerLeft);
      socketService.off('gameStarted', handleGameStarted);
      socketService.off('gameStateUpdate', handleGameStateUpdate);
      socketService.off('gamePaused', handleGamePaused);
      socketService.off('gameResumed', handleGameResumed);
      socketService.off('timeProgression', handleTimeProgression);
      socketService.off('gameEnded', handleGameEnded);
      socketService.off('leaderboardUpdate', handleLeaderboardUpdate);
      socketService.off('fetchFinalLeaderboardFromDB', handleFetchFinalLeaderboardFromDB);
      socketService.off('finalLeaderboard', handleFinalLeaderboard);

      // Don't disconnect - keep socket alive for the entire app lifecycle
      // socketService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount/unmount

  const createRoom = async (playerName: string) => {
    try {
      const response = await socketService.createRoom(playerName);

      if (response.success && response.roomId) {
        setRoomInfo({
          roomId: response.roomId,
          players: [{
            id: socketService.getSocketId()!,
            name: playerName,
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
          }],
          adminSettings: null,
          isHost: true,
        });
        setMultiplayerMode('lobby');
      } else {
        setError(response.error || 'Failed to create room');
      }
    } catch (err) {
      setError('Failed to create room');
    }
  };

  const joinRoom = async (roomId: string, playerName: string) => {
    try {
      const response = await socketService.joinRoom(roomId, playerName);

      if (response.success && response.players) {
        setRoomInfo({
          roomId,
          players: response.players,
          adminSettings: response.adminSettings || null,
          isHost: false,
        });
        setMultiplayerMode('lobby');
      } else {
        setError(response.error || 'Failed to join room');
      }
    } catch (err) {
      setError('Failed to join room');
    }
  };

  const leaveRoom = () => {
    socketService.leaveRoom();
    setRoomInfo(null);
    setMultiplayerMode(null);
    setGameState(null);
    setLeaderboard([]);
  };

  const startGame = async (adminSettings: AdminSettings) => {
    try {
      // If we're the host, generate initial game data so all players use the same assets/quotes
      let initialGameState;
      if (roomInfo?.isHost) {
        const { generateInitialGameData } = await import('../utils/gameInit');
        initialGameState = generateInitialGameData(adminSettings);
      }

      const response = await socketService.startGame(adminSettings, initialGameState);

      if (!response.success) {
        setError(response.error || 'Failed to start game');
      }
    } catch (err) {
      setError('Failed to start game');
    }
  };

  const updatePlayerState = (networth: number, portfolioBreakdown: any) => {
    socketService.updatePlayerState(networth, portfolioBreakdown);
  };

  const notifyQuizStarted = (quizCategory: string) => {
    socketService.quizStarted(quizCategory);
  };

  const notifyQuizCompleted = (quizCategory: string) => {
    socketService.quizFinished(quizCategory);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <MultiplayerContext.Provider
      value={{
        isConnected,
        playerId,
        roomInfo,
        multiplayerMode,
        gameState,
        leaderboard,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        updatePlayerState,
        notifyQuizStarted,
        notifyQuizCompleted,
        error,
        clearError,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
};
