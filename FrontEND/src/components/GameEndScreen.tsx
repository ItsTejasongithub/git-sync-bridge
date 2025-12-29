import React from 'react';
import './GameEndScreen.css';
import { GameState } from '../types';

interface GameEndScreenProps {
  gameState: GameState;
  isMultiplayer: boolean;
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
  leaderboardData,
  onReturnToMenu,
}) => {
  const [isPortfolioExpanded, setIsPortfolioExpanded] = React.useState(false);

  const calculateNetworth = () => {
    let total = gameState.pocketCash + gameState.savingsAccount.balance;

    // Add FD values (using amount since maturedAmount doesn't exist)
    gameState.fixedDeposits.forEach(fd => {
      const monthsElapsed = (fd.maturityYear - fd.startYear) * 12 + (fd.maturityMonth - fd.startMonth);
      const maturedValue = fd.amount * Math.pow(1 + fd.interestRate, monthsElapsed / 12);
      total += maturedValue;
    });

    // Add holdings values
    const holdings = gameState.holdings;

    // Physical and digital gold
    total += holdings.physicalGold.totalInvested;
    total += holdings.digitalGold.totalInvested;

    // Index and mutual funds
    total += holdings.indexFund.totalInvested;
    total += holdings.mutualFund.totalInvested;

    // Stocks
    Object.values(holdings.stocks).forEach(holding => {
      total += holding.totalInvested;
    });

    // Crypto
    Object.values(holdings.crypto).forEach(holding => {
      total += holding.totalInvested;
    });

    // Commodity
    total += holdings.commodity.totalInvested;

    // REITs
    Object.values(holdings.reits).forEach(holding => {
      total += holding.totalInvested;
    });

    return total;
  };

  const getAssetCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      cash: '#4CAF50',
      fixedDeposits: '#2196F3',
      gold: '#FFD700',
      stocks: '#FF5722',
      crypto: '#9C27B0',
      commodity: '#795548',
      indexFund: '#00BCD4',
      mutualFund: '#3F51B5',
      reits: '#FF9800',
    };
    return colors[category] || '#138808';
  };

  const getPortfolioBreakdown = () => {
    const holdings = gameState.holdings;

    return {
      cash: gameState.pocketCash + gameState.savingsAccount.balance,
      fixedDeposits: gameState.fixedDeposits.reduce((sum, fd) => {
        const monthsElapsed = (fd.maturityYear - fd.startYear) * 12 + (fd.maturityMonth - fd.startMonth);
        const maturedValue = fd.amount * Math.pow(1 + fd.interestRate, monthsElapsed / 12);
        return sum + maturedValue;
      }, 0),
      gold: holdings.physicalGold.totalInvested + holdings.digitalGold.totalInvested,
      stocks: Object.values(holdings.stocks).reduce((sum, h) => sum + h.totalInvested, 0),
      crypto: Object.values(holdings.crypto).reduce((sum, h) => sum + h.totalInvested, 0),
      commodity: holdings.commodity.totalInvested,
      indexFund: holdings.indexFund.totalInvested,
      mutualFund: holdings.mutualFund.totalInvested,
      reits: Object.values(holdings.reits).reduce((sum, h) => sum + h.totalInvested, 0),
    };
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const startingCash = 100000; // Starting amount
  const finalNetworth = calculateNetworth();
  const profit = finalNetworth - startingCash;
  const profitPercentage = ((profit / startingCash) * 100).toFixed(2);
  const breakdown = getPortfolioBreakdown();

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
              <div className="networth-amount">{formatCurrency(finalNetworth)}</div>
              <div className={`profit-display ${profit >= 0 ? 'positive' : 'negative'}`}>
                <span className="profit-label">Total Profit:</span>
                <span className="profit-amount">
                  {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                </span>
                <span className="profit-percentage">({profitPercentage}%)</span>
              </div>
              <div className="starting-amount">
                Starting Cash: {formatCurrency(startingCash)}
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

                  // For P&L calculation - invested is same as current for now (totalInvested)
                  const invested = value;
                  const currentValue = value;
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
                    <div className="rank-badge">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="player-info">
                      <div className="player-name">{player.playerName}</div>
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
