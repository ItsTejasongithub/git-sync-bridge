import React from 'react';
import './GameEndScreen.css';
import { GameState, AssetData } from '../types';
import { calculateNetworth, calculatePortfolioBreakdown, calculateTotalCapital, calculateCAGR } from '../utils/networthCalculator';

interface GameEndScreenProps {
  gameState: GameState;
  isMultiplayer: boolean;
  assetDataMap: { [key: string]: AssetData[] };
  calendarYear: number;
  leaderboardData?: Array<{
    playerId: string;
    playerName: string;
    networth: number;
    portfolioBreakdown?: {
      cash: number;
      stocks: number;
      crypto: number;
      gold: number;
      fixedDeposits: number;
      [key: string]: number;
    };
  }>;
  onReturnToMenu: () => void;
}

const GameEndScreen: React.FC<GameEndScreenProps> = ({
  gameState,
  isMultiplayer,
  assetDataMap,
  calendarYear,
  leaderboardData,
  onReturnToMenu,
}) => {
  const [isPortfolioExpanded, setIsPortfolioExpanded] = React.useState(false);

  const getAssetCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      cash: '#4CAF50',
      fixedDeposits: '#2196F3',
      gold: '#FFD700',
      stocks: '#FF5722',
      crypto: '#9C27B0',
      commodity: '#795548',
      commodities: '#795548',
      funds: '#00BCD4',
      indexFund: '#00BCD4',
      mutualFund: '#3F51B5',
      reits: '#FF9800',
      savings: '#4CAF50',
    };
    return colors[category] || '#138808';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Calculate total invested for each category (for P&L calculation)
  const getInvestedBreakdown = () => {
    const holdings = gameState.holdings;
    return {
      cash: gameState.pocketCash,
      savings: gameState.savingsAccount.balance,
      fixedDeposits: gameState.fixedDeposits.reduce((sum, fd) => sum + fd.amount, 0),
      gold: holdings.physicalGold.totalInvested + holdings.digitalGold.totalInvested,
      funds: holdings.indexFund.totalInvested + holdings.mutualFund.totalInvested,
      stocks: Object.values(holdings.stocks).reduce((sum, h) => sum + h.totalInvested, 0),
      crypto: Object.values(holdings.crypto).reduce((sum, h) => sum + h.totalInvested, 0),
      commodities: holdings.commodity.totalInvested,
      reits: Object.values(holdings.reits).reduce((sum, h) => sum + h.totalInvested, 0),
    };
  };

  const totalCapital = calculateTotalCapital(gameState);
  const finalNetworth = calculateNetworth(gameState, assetDataMap, calendarYear);
  const profit = finalNetworth - totalCapital;
  const profitPercentage = ((profit / totalCapital) * 100).toFixed(2);
  const years = gameState.currentYear; // Total years in game
  const cagr = calculateCAGR(totalCapital, finalNetworth, years).toFixed(2);
  const breakdown = calculatePortfolioBreakdown(gameState, assetDataMap, calendarYear);
  const investedBreakdown = getInvestedBreakdown();

  return (
    <div className="game-end-screen">
      <div className="end-screen-content">
        <div className="game-complete-header">
          <h1>🎉 GAME COMPLETE! 🎉</h1>
          <p className="completion-text">20 Years Journey Completed</p>
        </div>

        {!isMultiplayer ? (
          /* SOLO MODE - Show personal results */
          <div className="solo-results">
            <div className="final-networth-card">
              <h2>Your Final Networth</h2>
              <div className="networth-amount" title={`CAGR: ${cagr}%`}>
                {formatCurrency(finalNetworth)}
              </div>
              <div className={`profit-display ${profit >= 0 ? 'positive' : 'negative'}`}>
                <span className="profit-label">Total Profit:</span>
                <span className="profit-amount">
                  {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                </span>
                <span className="profit-percentage">({profitPercentage}%)</span>
              </div>
              <div className="cagr-display">
                <span className="cagr-label">CAGR:</span>
                <span className="cagr-value">{cagr}%</span>
              </div>
              <div className="starting-amount">
                Total Capital Invested: {formatCurrency(totalCapital)}
              </div>
            </div>

            <div className="portfolio-breakdown-card">
              <div
                className="portfolio-header-clickable"
                onClick={() => setIsPortfolioExpanded(!isPortfolioExpanded)}
              >
                <h3>📊 Portfolio Analysis</h3>
                <div className="expand-icon">
                  {isPortfolioExpanded ? '▼' : '▶'}
                </div>
              </div>

              <div className={`breakdown-list ${isPortfolioExpanded ? 'expanded' : 'collapsed'}`}>
                {Object.entries(breakdown).map(([key, value]) => {
                  if (value === 0) return null;
                  const percentage = ((value / finalNetworth) * 100).toFixed(1);
                  const color = getAssetCategoryColor(key);

                  // Calculate P&L: current market value vs invested amount
                  const currentValue = value;
                  const invested = investedBreakdown[key as keyof typeof investedBreakdown] || 0;
                  const pnl = currentValue - invested;
                  const pnlPercentage = invested > 0 ? ((pnl / invested) * 100).toFixed(1) : '0.0';

                  return (
                    <div key={key} className="breakdown-item-enhanced">
                      <div className="breakdown-header">
                        <div
                          className="asset-color-indicator"
                          style={{ backgroundColor: color }}
                        />
                        <span className="asset-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="asset-portfolio-percentage">{percentage}%</span>
                      </div>

                      <div className="asset-value-bar">
                        <div
                          className="asset-value-fill"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>

                      <div className="breakdown-details">
                        <div className="detail-row">
                          <span className="detail-label">Invested:</span>
                          <span className="detail-value">{formatCurrency(invested)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Current:</span>
                          <span className="detail-value current">{formatCurrency(currentValue)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">P&L:</span>
                          <span className={`detail-value ${pnl >= 0 ? 'profit' : 'loss'}`}>
                            {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} ({pnl >= 0 ? '+' : ''}{pnlPercentage}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* MULTIPLAYER MODE - Show leaderboard */
          <div className="multiplayer-results">
            <h2>🏆 Final Leaderboard</h2>
            <div className="leaderboard-table">
              {leaderboardData && leaderboardData.length > 0 ? (
                leaderboardData.map((player, index) => (
                  <div key={player.playerId} className={`leaderboard-row rank-${index + 1}`}>
                    <div className="player-info">
                      <div className="player-name">
                        {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : `#${index + 1} `}
                        {player.playerName}
                      </div>
                      <div className="player-networth">{formatCurrency(player.networth)}</div>
                    </div>
                    {player.portfolioBreakdown && (
                      <div className="player-breakdown-mini">
                        {Object.entries(player.portfolioBreakdown).map(([asset, value]) => {
                          if (value === 0) return null;
                          return (
                            <div key={asset} className="mini-asset">
                              <span className="mini-asset-name">{asset}:</span>
                              <span className="mini-asset-value">{formatCurrency(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-leaderboard">No leaderboard data available</div>
              )}
            </div>
          </div>
        )}

        <button className="return-menu-button" onClick={onReturnToMenu}>
          Return to Main Menu
        </button>
      </div>
    </div>
  );
};

export default GameEndScreen;
