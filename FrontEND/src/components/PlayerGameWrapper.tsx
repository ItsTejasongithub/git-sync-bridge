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
    isTransactionPending,
  } = useGameState(true); // true = multiplayer mode, disables local timer

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
      return;
    }

    // Don't send updates if game has ended
    if (multiplayerGameState && !multiplayerGameState.isStarted) {
      return;
    }

    updatePlayerState(networth, portfolioBreakdown);
  }, [roomInfo?.isHost, multiplayerGameState, updatePlayerState]);

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
        leaderboardData={transformedLeaderboard}
        // Pass transaction state so asset cards can disable while a transaction is pending
        isTransacting={isTransactionPending}
        // Pass player info for logging
        playerName={playerName}
        roomId={roomId}
      />
    </div>
  );
};
