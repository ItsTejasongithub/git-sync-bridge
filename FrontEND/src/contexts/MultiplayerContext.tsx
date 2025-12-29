import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { socketService } from '../services/socketService';
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
    console.log('🎮 MultiplayerContext: Initializing connection...');

    // Check if already connected before trying to connect
    if (socketService.isConnected()) {
      console.log('🎮 Already connected, skipping connection attempt');
      setIsConnected(true);
    } else {
      socketService.connect();
      // Check initial connection state after a brief delay
      setTimeout(() => {
        const initiallyConnected = socketService.isConnected();
        console.log('🎮 Initial connection state:', initiallyConnected);
        setIsConnected(initiallyConnected);
      }, 100);
    }

    // Event handlers
    const handleConnect = () => {
      console.log('🎮 MultiplayerContext: Connected event received');
      setIsConnected(true);
      setPlayerId(socketService.getSocketId() ?? null);
    };

    const handleDisconnect = () => {
      console.log('🎮 MultiplayerContext: Disconnected event received');
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
      setGameState(data.gameState);
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
      console.log('⏰ Time progression received:', data);
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentYear: data.year,
          currentMonth: data.month,
        };
      });
    };

    const handleGameEnded = (data: { finalYear: number; finalMonth: number }) => {
      console.log(`🎮 Game ended - Year ${data.finalYear}, Month ${data.finalMonth}`);
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          isStarted: false,
        };
      });
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
