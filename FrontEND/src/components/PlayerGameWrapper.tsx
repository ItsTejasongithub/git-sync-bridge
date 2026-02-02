import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { useGameState } from '../hooks/useGameState';
import { GameScreen } from './GameScreen';
import { QuizWaitingOverlay } from './QuizWaitingOverlay';
import { socketService } from '../services/socketService';
import { GameState } from '../types';
import './PlayerGameWrapper.css';

export const PlayerGameWrapper: React.FC = () => {
  const {
    roomInfo,
    gameState: multiplayerGameState,
    leaderboard,
    updatePlayerState,
    notifyQuizStarted,
    notifyQuizCompleted
  } = useMultiplayer();

  // Use the existing solo game hook for player's personal state (with multiplayer mode enabled)
  const {
    gameState,
    startMultiplayerGame,
    depositToSavings,
    withdrawFromSavings,
    createFixedDeposit,
    collectFD,
    breakFD,
    buyAsset,
    sellAsset,
    togglePause,
    markQuizCompleted,
    updateTime,
    updatePauseState,
    markGameAsEnded,
    isTransactionPending,
    lifeEventPopup,
    applyLifeEvent,
    clearLifeEventPopup,
    forceShowLifeEventPopup
  } = useGameState(true); // true = multiplayer mode, disables local timer, includes life event handler

  // CRITICAL FIX: Freeze game state when game ends to prevent corruption
  const [frozenGameState, setFrozenGameState] = useState<GameState | null>(null);
  const hasGameEndedRef = useRef(false);

  // Initialize game state with multiplayer admin settings when game starts
  useEffect(() => {
    // Start local multiplayer session when server indicates game has started.
    // Use admin settings from roomInfo if available, otherwise fall back to server-provided adminSettings (if any).
    if (multiplayerGameState?.isStarted && gameState.mode === 'menu') {
      const adminToUse = roomInfo?.adminSettings ?? (multiplayerGameState as any).adminSettings ?? undefined;

      // Use server-provided initial data (selectedAssets, unlock schedule, quotes) when available
      const initialData = {
        selectedAssets: multiplayerGameState.selectedAssets,
        assetUnlockSchedule: multiplayerGameState.assetUnlockSchedule,
        yearlyQuotes: multiplayerGameState.yearlyQuotes,
        quizQuestionIndices: multiplayerGameState.quizQuestionIndices,
      };

      startMultiplayerGame(adminToUse as any, initialData);
    }
  }, [roomInfo?.adminSettings, multiplayerGameState?.isStarted, multiplayerGameState?.selectedAssets, multiplayerGameState?.assetUnlockSchedule, multiplayerGameState?.yearlyQuotes, multiplayerGameState?.quizQuestionIndices, gameState.mode, startMultiplayerGame]);

  // Sync local game time with multiplayer time from server
  useEffect(() => {
    if (!multiplayerGameState || gameState.mode !== 'solo') {
      return;
    }

    // CRITICAL FIX: Stop processing time updates if game has ended
    // This prevents state corruption after game completion
    if (!multiplayerGameState.isStarted && gameState.currentYear >= 20) {
      return;
    }

    // Update local game time to match server time
    updateTime(multiplayerGameState.currentYear, multiplayerGameState.currentMonth);
  }, [multiplayerGameState?.currentYear, multiplayerGameState?.currentMonth, multiplayerGameState?.isStarted, gameState.mode, gameState.currentYear, updateTime]);

  // Sync pause state with server
  useEffect(() => {
    if (!multiplayerGameState || gameState.mode !== 'solo') return;

    updatePauseState(multiplayerGameState.isPaused);
  }, [multiplayerGameState?.isPaused, gameState.mode, updatePauseState]);

  // Listen for life events emitted by server for this player
  useEffect(() => {
    const handler = (data: any) => {
      try {
        if (data && data.event) {
          // Pass server-calculated postPocketCash (if provided) so client can sync deterministically
          applyLifeEvent({ ...data.event, postPocketCash: data.postPocketCash });

          // Fallback: ensure popup shows even if applyLifeEvent failed to show it
          try {
            if (typeof forceShowLifeEventPopup === 'function') {
              forceShowLifeEventPopup(data.event);
            }
          } catch (err) {
            console.error('Failed to force show life event popup:', err);
          }
        }
      } catch (err) {
        console.error('Failed to apply life event from server:', err);
      }
    };

    socketService.on('lifeEventTriggered', handler);
    return () => {
      socketService.off('lifeEventTriggered', handler);
    };
  }, [applyLifeEvent]);

  // Track current gameState in a ref to avoid recreating event handlers on every state change
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // CRITICAL FIX: When gameEnded event is received:
  // 1. Mark game as ended to lock state updates (sets isStarted = false)
  // 2. Freeze game state to prevent any further changes
  useEffect(() => {
    const handler = () => {
      if (!hasGameEndedRef.current) {
        const currentState = gameStateRef.current;

        if (currentState.mode === 'solo') {
          console.log('🔒 Game ended event received - locking and freezing state:', {
            year: currentState.currentYear,
            month: currentState.currentMonth,
            networth: currentState.pocketCash,
            holdingsSnapshot: {
              gold: currentState.holdings.physicalGold.quantity + currentState.holdings.digitalGold.quantity,
              stocks: Object.keys(currentState.holdings.stocks).length,
            }
          });

          // STEP 1: Mark game as ended to prevent further state updates
          markGameAsEnded();

          // STEP 2: Deep clone the game state to freeze it
          // Use setTimeout to ensure markGameAsEnded state update has applied
          setTimeout(() => {
            const stateToFreeze = gameStateRef.current;
            console.log('🧊 Freezing game state after marking as ended');
            setFrozenGameState(JSON.parse(JSON.stringify(stateToFreeze)));
            hasGameEndedRef.current = true;
          }, 50);
        }
      }
    };

    socketService.on('gameEnded', handler);
    return () => {
      socketService.off('gameEnded', handler);
    };
  }, [markGameAsEnded]); // Only depend on the callback, not gameState

  // DISABLED: Backup freeze mechanism
  // This was triggering when isStarted=false, which happens BEFORE the final price tick
  // This caused players to calculate networth with old prices from Month 11 instead of Month 12
  // The primary freeze mechanism (gameEnded event handler above) is sufficient
  /*
  useEffect(() => {
    const currentState = gameStateRef.current;

    // Check if game has just ended via state (backup mechanism)
    if (!multiplayerGameState?.isStarted && currentState.mode === 'solo' && currentState.currentYear >= 20) {
      if (!hasGameEndedRef.current && !frozenGameState) {
        console.log('🧊 Freezing game state at game end (backup mechanism):', {
          year: currentState.currentYear,
          month: currentState.currentMonth,
          holdings: currentState.holdings
        });

        // Mark as ended and freeze
        markGameAsEnded();

        setTimeout(() => {
          const stateToFreeze = gameStateRef.current;
          setFrozenGameState(JSON.parse(JSON.stringify(stateToFreeze)));
          hasGameEndedRef.current = true;
        }, 50);
      }
    }
  }, [multiplayerGameState?.isStarted, frozenGameState, markGameAsEnded]); // Remove gameState dependency
  */

  // Handle networth updates from GameScreen
  const handleNetworthCalculated = useCallback((networth: number, portfolioBreakdown: any) => {
    // IMPORTANT: If this client is the host, they shouldn't update player state
    // because hosts are spectators and shouldn't appear on the leaderboard
    if (roomInfo?.isHost) {
      return;
    }

    // Don't send updates if game has ended
    if (multiplayerGameState && !multiplayerGameState.isStarted) {
      return;
    }

    updatePlayerState(networth, portfolioBreakdown);
  }, [roomInfo?.isHost, multiplayerGameState, updatePlayerState]);

  // Handle final networth sync from GameEndScreen
  const handleFinalNetworthSync = useCallback((networth: number, portfolioBreakdown: any) => {
    // Skip if host
    if (roomInfo?.isHost) {
      return;
    }

    updatePlayerState(networth, portfolioBreakdown);
  }, [roomInfo?.isHost, updatePlayerState]);

  // Override quiz completion to notify server
  const handleMarkQuizCompleted = (category: string) => {
    markQuizCompleted(category);
    notifyQuizCompleted(category);
  };

  if (!roomInfo || !multiplayerGameState) {
    return <div>Loading multiplayer game...</div>;
  }

  // Get current player info using socket ID
  const mySocketId = socketService.getSocketId();
  const currentPlayer = roomInfo.players.find(p => p.id === mySocketId);

  // Get players who are waiting for quiz
  const waitingPlayers = roomInfo.players.filter(p =>
    multiplayerGameState.playersWaitingForQuiz?.includes(p.id)
  );

  const showWaitingOverlay = multiplayerGameState.isPaused &&
    multiplayerGameState.pauseReason === 'quiz' &&
    waitingPlayers.length > 0 &&
    currentPlayer;

  // Transform leaderboard data to match GameEndScreen's expected format
  const transformedLeaderboard = leaderboard.map(player => ({
    playerId: player.id,
    playerName: player.name,
    networth: player.networth,
    portfolioBreakdown: player.portfolioBreakdown
  }));

  // Get player name and room ID for logging
  const playerName = currentPlayer?.name || 'Unknown Player';
  const roomId = roomInfo?.roomId;


  return (
    <div className="player-game-wrapper">
      {/* Quiz Waiting Overlay */}
      {showWaitingOverlay && currentPlayer && (
        <QuizWaitingOverlay
          waitingForPlayers={waitingPlayers}
          currentPlayer={currentPlayer}
        />
      )}

      {/* Main Game Screen (reuse from solo) */}
      <GameScreen
        gameState={frozenGameState || gameState}
        onDeposit={depositToSavings}
        onWithdraw={withdrawFromSavings}
        onCreateFD={createFixedDeposit}
        onCollectFD={collectFD}
        onBreakFD={breakFD}
        onBuyAsset={buyAsset}
        onSellAsset={sellAsset}
        onTogglePause={togglePause}
        onMarkQuizCompleted={handleMarkQuizCompleted}
        onQuizStarted={notifyQuizStarted}
        onNetworthCalculated={handleNetworthCalculated}
        showLeaderboard={true}
        showPauseButton={false}
        leaderboardData={transformedLeaderboard}
        // Pass transaction state so asset cards can disable while a transaction is pending
        isTransacting={isTransactionPending}
        // Pass player info for logging
        playerName={playerName}
        roomId={roomId}
        // Life event popup hooks
        lifeEventPopup={lifeEventPopup}
        clearLifeEventPopup={clearLifeEventPopup}
        // Final networth sync callback
        onFinalNetworthSync={handleFinalNetworthSync}
      />
    </div>
  );
};
