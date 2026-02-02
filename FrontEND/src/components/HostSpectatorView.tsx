import React, { useState } from 'react';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { PlayerInfo } from '../types/multiplayer';
import './HostSpectatorView.css';

export const HostSpectatorView: React.FC = () => {
  const { roomInfo, leaderboard, gameState } = useMultiplayer();
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());

  if (!roomInfo || !gameState) return null;

  const formatCurrency = (amount: number): string => {
    const [integerPart, decimalPart] = amount.toFixed(2).split('.');
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);

    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }

    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return `₹${formatted}.${decimalPart}`;
  };

  const getPortfolioPercentage = (player: PlayerInfo, category: keyof PlayerInfo['portfolioBreakdown']): number => {
    if (player.networth === 0) return 0;
    return (player.portfolioBreakdown[category] / player.networth) * 100;
  };

  const togglePortfolio = (playerId: string) => {
    setExpandedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const calendarYear = (roomInfo.adminSettings?.gameStartYear || 2005) + gameState.currentYear - 1;

  return (
    <div className="host-spectator-view">
      {/* Header */}
      <div className="spectator-header">
        <div className="game-info">
          <h1>BULL RUN  HOST VIEW</h1>
        </div>

        {/* Logo in the center */}
        <div className="logo-container">
          <img src="/BullRun_Icon.png" alt="Bull Run Logo" className="game-logo" />
        </div>

        <div className="game-timer">
          <div className="timer-item">
            <span className="timer-label">Game Year</span>
            <span className="timer-value">{gameState.currentYear} / 20</span>
          </div>
          <div className="timer-item">
            <span className="timer-label">Calendar Year</span>
            <span className="timer-value">{calendarYear}</span>
          </div>
          <div className="timer-item">
            <span className="timer-label">Month</span>
            <span className="timer-value">{gameState.currentMonth}</span>
          </div>
        </div>
      </div>

      {/* Progress Timeline Bar */}
      <div className="progress-timeline">
        <div className="timeline-header">
          <span className="timeline-label">Game Progress</span>
          <span className="timeline-percentage">
            {(((gameState.currentYear - 1) * 12 + gameState.currentMonth) / 240 * 100).toFixed(1)}%
          </span>
        </div>
        <div className="timeline-bar">
          <div
            className="timeline-fill"
            style={{ width: `${((gameState.currentYear - 1) * 12 + gameState.currentMonth) / 240 * 100}%` }}
          >
            <div className="timeline-wave"></div>
            <div className="timeline-glow"></div>
          </div>
          <div className="timeline-markers">
            {[5, 10, 15, 20].map(year => (
              <div
                key={year}
                className={`timeline-marker ${gameState.currentYear >= year ? 'passed' : ''}`}
                style={{ left: `${(year / 20) * 100}%` }}
              >
                <div className="marker-dot"></div>
                <span className="marker-label">Y{year}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pause Controls */}
      <div className="pause-controls">
        {/* Host-only pause/resume button (only for the room host) */}
        {roomInfo.isHost && (
          <button
            className={`pause-button host-pause ${(gameState.currentYear === 20 && gameState.currentMonth === 12) || gameState.currentYear > 20 ? 'game-ended' : ''}`}
            onClick={() => {
              // Host toggles pause globally via socket
              if (gameState.currentYear < 20 || (gameState.currentYear === 20 && gameState.currentMonth < 12)) {
                import('../services/socketService').then(({ socketService }) => socketService.togglePause());
              }
            }}
            disabled={gameState.pauseReason === 'quiz' || (gameState.currentYear === 20 && gameState.currentMonth === 12) || gameState.currentYear > 20}
          >
            {(gameState.currentYear === 20 && gameState.currentMonth === 12) || gameState.currentYear > 20
              ? '🏁 GAME ENDED'
              : gameState.isPaused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
        )}
      </div>

      {/* Leaderboard */}
      <div className="leaderboard-main">
        <h2>🏆 LEADERBOARD</h2>
        <div className="leaderboard-grid">
          {leaderboard.map((player, index) => {
            const isExpanded = expandedPlayers.has(player.id);

            return (
              <div key={player.id} className={`leaderboard-card rank-${index + 1}`}>
                <div className="rank-badge">#{index + 1}</div>
                <div className="player-info-section">
                  <h3 className="player-name-large">{player.name}</h3>
                  <div className="networth-display">
                    {formatCurrency(player.networth)}
                  </div>

                  {/* Quiz Status - Always visible during game */}
                  <div className="quiz-status">
                    {gameState.pauseReason === 'quiz' && gameState.playersWaitingForQuiz.includes(player.id) ? (
                      <span className="quiz-pending">📝 In Quiz: {player.quizStatus.currentQuiz || 'Unknown'}</span>
                    ) : gameState.pauseReason === 'quiz' ? (
                      <span className="quiz-done">✅ Quiz Completed - Waiting</span>
                    ) : player.quizStatus.currentQuiz ? (
                      <span className="quiz-active">📝 Active Quiz</span>
                    ) : (
                      <span className="quiz-ready">In Game</span>
                    )}
                  </div>

                  {/* Portfolio Breakdown - Expandable */}
                  <div className="portfolio-breakdown">
                    <div
                      className="portfolio-header"
                      onClick={() => togglePortfolio(player.id)}
                    >
                      <h4>
                        📊 Portfolio Distribution
                      </h4>
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                        ▼
                      </span>
                    </div>
                    <div className={`portfolio-content ${isExpanded ? 'expanded' : ''}`}>
                      <div className="breakdown-grid">
                        {player.portfolioBreakdown.cash > 0 && (
                          <div className="breakdown-item">
                            <span className="category">Cash</span>
                            <span className="percentage">{getPortfolioPercentage(player, 'cash').toFixed(1)}%</span>
                            <span className="amount">{formatCurrency(player.portfolioBreakdown.cash)}</span>
                          </div>
                        )}
                        {player.portfolioBreakdown.savings > 0 && (
                          <div className="breakdown-item">
                            <span className="category">Savings</span>
                            <span className="percentage">{getPortfolioPercentage(player, 'savings').toFixed(1)}%</span>
                            <span className="amount">{formatCurrency(player.portfolioBreakdown.savings)}</span>
                          </div>
                        )}
                        {player.portfolioBreakdown.fixedDeposits > 0 && (
                          <div className="breakdown-item">
                            <span className="category">Fixed Deposits</span>
                            <span className="percentage">{getPortfolioPercentage(player, 'fixedDeposits').toFixed(1)}%</span>
                            <span className="amount">{formatCurrency(player.portfolioBreakdown.fixedDeposits)}</span>
                          </div>
                        )}
                        {player.portfolioBreakdown.gold > 0 && (
                          <div className="breakdown-item">
                            <span className="category">Gold</span>
                            <span className="percentage">{getPortfolioPercentage(player, 'gold').toFixed(1)}%</span>
                            <span className="amount">{formatCurrency(player.portfolioBreakdown.gold)}</span>
                          </div>
                        )}
                        {player.portfolioBreakdown.indexFunds > 0 && (
                          <div className="breakdown-item">
                            <span className="category">Index Funds</span>
                            <span className="percentage">{getPortfolioPercentage(player, 'indexFunds').toFixed(1)}%</span>
                            <span className="amount">{formatCurrency(player.portfolioBreakdown.indexFunds)}</span>
                          </div>
                        )}
                        {player.portfolioBreakdown.mutualFunds > 0 && (
                          <div className="breakdown-item">
                            <span className="category">Mutual Funds</span>
                            <span className="percentage">{getPortfolioPercentage(player, 'mutualFunds').toFixed(1)}%</span>
                            <span className="amount">{formatCurrency(player.portfolioBreakdown.mutualFunds)}</span>
                          </div>
                        )}
                        {player.portfolioBreakdown.stocks > 0 && (
                          <div className="breakdown-item">
                            <span className="category">Stocks</span>
                            <span className="percentage">{getPortfolioPercentage(player, 'stocks').toFixed(1)}%</span>
                            <span className="amount">{formatCurrency(player.portfolioBreakdown.stocks)}</span>
                          </div>
                        )}
                        {player.portfolioBreakdown.crypto > 0 && (
                          <div className="breakdown-item">
                            <span className="category">Crypto</span>
                            <span className="percentage">{getPortfolioPercentage(player, 'crypto').toFixed(1)}%</span>
                            <span className="amount">{formatCurrency(player.portfolioBreakdown.crypto)}</span>
                          </div>
                        )}
                        {player.portfolioBreakdown.commodities > 0 && (
                          <div className="breakdown-item">
                            <span className="category">Commodities</span>
                            <span className="percentage">{getPortfolioPercentage(player, 'commodities').toFixed(1)}%</span>
                            <span className="amount">{formatCurrency(player.portfolioBreakdown.commodities)}</span>
                          </div>
                        )}
                        {player.portfolioBreakdown.reits > 0 && (
                          <div className="breakdown-item">
                            <span className="category">REITs</span>
                            <span className="percentage">{getPortfolioPercentage(player, 'reits').toFixed(1)}%</span>
                            <span className="amount">{formatCurrency(player.portfolioBreakdown.reits)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {leaderboard.length === 0 && (
          <div className="no-players">
            <p>Waiting for players to join...</p>
          </div>
        )}
      </div>
    </div>
  );
};