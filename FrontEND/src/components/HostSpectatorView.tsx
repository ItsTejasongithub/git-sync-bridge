import React, { useState } from 'react';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { PlayerInfo } from '../types/multiplayer';
import './HostSpectatorView.css';

export const HostSpectatorView: React.FC = () => {
  const { roomInfo, leaderboard, gameState } = useMultiplayer();
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());

  if (!roomInfo || !gameState) return null;

  const formatCurrency = (amount: number): string => {
    const rounded = Math.round(amount).toString();
    let lastThree = rounded.substring(rounded.length - 3);
    const otherNumbers = rounded.substring(0, rounded.length - 3);

    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }

    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return `₹${formatted}`;
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
      <div className="spectator-header">
        <div className="header-left">
          <h1>BULL RUN HOST VIEW</h1>
          {roomInfo.isHost && (
            <button
              className={`pause-button ${(gameState.currentYear === 20 && gameState.currentMonth === 12) || gameState.currentYear > 20 ? 'game-ended' : ''}`}
              onClick={() => {
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

        <div className="header-center">
          <div className="logo-container">
            <img src="/BullRun_Icon.png" alt="Bull Run Logo" className="game-logo" />
          </div>
          <h2 className="leaderboard-title">🏆 LEADERBOARD</h2>
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

          <div className="progress-timeline-inline">
            <div className="timeline-inline-header">
              <span className="timeline-inline-label">YEAR {gameState.currentYear} OF 20</span>
            </div>
            <div className="timeline-inline-bar">
              <div
                className="timeline-inline-fill"
                style={{
                  width: `${100 - (gameState.currentMonth / 12) * 100}%`,
                  transition: gameState.currentMonth === 1 ? 'none' : 'width 2.5s cubic-bezier(0.25, 0.1, 0.25, 1)'
                }}
              >
                <div className="timeline-inline-wave"></div>
                <div className="timeline-inline-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="leaderboard-main">
        <div className="leaderboard-grid">
          {leaderboard.map((player, index) => {
            const isExpanded = expandedPlayers.has(player.id);

            return (
              <div key={player.id} className={`leaderboard-card rank-${index + 1}`}>
                <div className="player-row">
                  <div className="player-name">{player.name}</div>
                  <div className="player-networth">{formatCurrency(player.networth)}</div>
                  <div className="player-status">
                    {gameState.pauseReason === 'quiz' && gameState.playersWaitingForQuiz.includes(player.id) ? (
                      <span className="status-badge quiz-pending">📝 In Quiz</span>
                    ) : gameState.pauseReason === 'quiz' ? (
                      <span className="status-badge quiz-done">✅ Done</span>
                    ) : player.quizStatus.currentQuiz ? (
                      <span className="status-badge quiz-active">📝 Quiz</span>
                    ) : (
                      <span className="status-badge quiz-ready">In Game</span>
                    )}
                  </div>
                  <div
                    className="player-expand"
                    onClick={() => togglePortfolio(player.id)}
                  >
                    <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                  </div>
                  <div className="player-rank">#{index + 1}</div>
                </div>

                <div className={`portfolio-details ${isExpanded ? 'expanded' : ''}`}>
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