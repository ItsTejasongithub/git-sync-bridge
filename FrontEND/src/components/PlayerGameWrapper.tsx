import React, { useEffect, useCallback } from 'react';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { useGameState } from '../hooks/useGameState';
import { GameScreen } from './GameScreen';
import { QuizWaitingOverlay } from './QuizWaitingOverlay';
import { socketService } from '../services/socketService';
import './PlayerGameWrapper.css';

export const PlayerGameWrapper: React.FC = () => {
  const {
    roomInfo,
    gameState: multiplayerGameState,
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
  } = useGameState(true); // true = multiplayer mode, disables local timer

  // Initialize game state with multiplayer admin settings when game starts
  useEffect(() => {
    if (roomInfo?.adminSettings && multiplayerGameState?.isStarted && gameState.mode === 'menu') {
      console.log('🎮 Starting multiplayer game with settings:', roomInfo.adminSettings);
      // Use server-provided initial data if available so all players have the same cards/quotes
      startMultiplayerGame(roomInfo.adminSettings, multiplayerGameState as any);
    }
  }, [roomInfo?.adminSettings, multiplayerGameState?.isStarted, gameState.mode, startMultiplayerGame]);

  // Sync local game time with multiplayer time from server
  useEffect(() => {
    if (!multiplayerGameState || gameState.mode !== 'solo') {
      console.log('⏭️ Skipping time sync - multiplayerGameState:', !!multiplayerGameState, 'mode:', gameState.mode);
      return;
    }

    console.log(`📅 Syncing time from server: Year ${multiplayerGameState.currentYear}, Month ${multiplayerGameState.currentMonth}`);
    // Update local game time to match server time
    updateTime(multiplayerGameState.currentYear, multiplayerGameState.currentMonth);
  }, [multiplayerGameState?.currentYear, multiplayerGameState?.currentMonth, gameState.mode, updateTime]);

  // Sync pause state with server
  useEffect(() => {
    if (!multiplayerGameState || gameState.mode !== 'solo') return;

    updatePauseState(multiplayerGameState.isPaused);
  }, [multiplayerGameState?.isPaused, gameState.mode, updatePauseState]);

  // Handle networth updates from GameScreen
  const handleNetworthCalculated = useCallback((networth: number, portfolioBreakdown: any) => {
    // IMPORTANT: If this client is the host, they shouldn't update player state
    // because hosts are spectators and shouldn't appear on the leaderboard
    if (roomInfo?.isHost) {
      console.log('⏭️ Skipping player state update - this client is the host/spectator');
      return;
    }

    console.log(`📊 Updating player state: networth=${networth}`);
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
        gameState={gameState}
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
      />
    </div>
  );
};
