import React, { useEffect, useRef, useState, useMemo } from 'react';
import './GameEndScreen.css';
import { GameState } from '../types';
import { calculateTotalCapital, calculateCAGR, calculateNetworthWithPrices, calculatePortfolioBreakdownWithPrices } from '../utils/networthCalculator';
import { playerLogsApi } from '../services/adminApi';
import { AIReportModal } from './AIReportModal';
import { tradeTracker } from '../utils/tradeTracker';
import { extractHoldingsDataWithPrices } from '../utils/holdingsExtractor';
import { usePrices } from '../hooks/usePrices';

interface GameEndScreenProps {
  gameState: GameState;
  isMultiplayer: boolean;
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
  playerName?: string;
  playerAge?: number;
  roomId?: string;
  onFinalNetworthSync?: (networth: number, portfolioBreakdown: any) => void;
}

const GameEndScreen: React.FC<GameEndScreenProps> = ({
  gameState,
  isMultiplayer,
  calendarYear,
  leaderboardData,
  onReturnToMenu,
  playerName,
  playerAge,
  roomId,
  onFinalNetworthSync,
}) => {
  // Use prices for final calculations
  // CRITICAL: Use the same price source as in-game calculations
  // Server now keeps encrypted prices available until after database logging
  // This ensures consistent calculations between in-game and final leaderboard
  const { getPrice } = usePrices({
    selectedAssets: gameState.selectedAssets,
    calendarYear,
    currentMonth: gameState.currentMonth,
    isMultiplayer: isMultiplayer, // Use actual multiplayer status for consistent prices
  });
  const [isPortfolioExpanded, setIsPortfolioExpanded] = useState(false);
  const [isAIReportOpen, setIsAIReportOpen] = useState(false);
  const [loggedGameId, setLoggedGameId] = useState<number | null>(null);
  const [loggedGameUniqueId, setLoggedGameUniqueId] = useState<string | null>(null);
  const hasLoggedRef = useRef(false); // Prevent double logging

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
  const finalNetworth = useMemo(
    () => calculateNetworthWithPrices(gameState, getPrice),
    [gameState, getPrice]
  );
  const profit = finalNetworth - totalCapital;
  const profitPercentage = ((profit / totalCapital) * 100).toFixed(2);
  const years = gameState.currentYear; // Total years in game
  const cagr = calculateCAGR(totalCapital, finalNetworth, years).toFixed(2);
  const breakdown = useMemo(
    () => {
      const result = calculatePortfolioBreakdownWithPrices(gameState, getPrice);

      // Debug: Check if breakdown appears corrupted
      const totalAssets = Object.values(result).reduce((sum, val) => sum + val, 0);
      const nonCashAssets = Object.entries(result)
        .filter(([key]) => key !== 'cash' && key !== 'savings')
        .reduce((sum, [, val]) => sum + val, 0);

      if (isMultiplayer && gameState.currentYear >= 20 && nonCashAssets === 0 && totalAssets > 0) {
        console.warn('⚠️ Potential state corruption detected in breakdown calculation:', {
          breakdown: result,
          gameYear: gameState.currentYear,
          gameMonth: gameState.currentMonth,
          holdingsSummary: {
            physicalGold: gameState.holdings.physicalGold.quantity,
            digitalGold: gameState.holdings.digitalGold.quantity,
            stocksCount: Object.keys(gameState.holdings.stocks).length,
          }
        });
      }

      return result;
    },
    [gameState, getPrice, isMultiplayer]
  );
  const investedBreakdown = getInvestedBreakdown();

  // Sync final networth to server for multiplayer (only once)
  const hasSyncedRef = useRef(false);
  useEffect(() => {
    if (hasSyncedRef.current) return;
    if (!isMultiplayer || !onFinalNetworthSync) return;

    // CRITICAL: Validate portfolio breakdown before syncing
    const breakdownTotal = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
    const discrepancy = Math.abs(breakdownTotal - finalNetworth);

    if (discrepancy > 1) {
      console.error('❌ Portfolio breakdown mismatch - NOT syncing:', {
        finalNetworth,
        breakdownTotal,
        discrepancy,
        breakdown
      });
      return; // Don't sync corrupted data
    }

    console.log('✅ Syncing final networth to multiplayer server:', {
      finalNetworth,
      breakdown,
      samplePrice: getPrice('Physical_Gold')
    });

    hasSyncedRef.current = true;
    onFinalNetworthSync(finalNetworth, breakdown);
  }, [isMultiplayer, finalNetworth, breakdown, onFinalNetworthSync, getPrice]);

  // Log game results when component mounts (only once)
  useEffect(() => {
    if (hasLoggedRef.current) return;


    // Only log if we have player name and admin settings
    if (playerName && gameState.adminSettings) {
      // CRITICAL FIX: Wait a moment for prices to load before validating
      // This prevents false positives where prices are 0 because they haven't loaded yet
      const hasActualHoldings =
        gameState.holdings.physicalGold.quantity > 0 ||
        gameState.holdings.digitalGold.quantity > 0 ||
        Object.values(gameState.holdings.indexFund).some((h: any) => h.quantity > 0) ||
        Object.values(gameState.holdings.mutualFund).some((h: any) => h.quantity > 0) ||
        Object.values(gameState.holdings.stocks).some((h: any) => h.quantity > 0) ||
        gameState.holdings.commodity.quantity > 0 ||
        Object.values(gameState.holdings.reits).some((h: any) => h.quantity > 0);

      // Validate portfolio breakdown before logging
      const totalAssetsExcludingCash = Object.entries(breakdown)
        .filter(([key]) => key !== 'cash' && key !== 'savings')
        .reduce((sum, [, value]) => sum + value, 0);

      const totalNetworth = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

      // If player has holdings but breakdown shows 0, prices haven't loaded yet - wait and retry
      if (hasActualHoldings && totalAssetsExcludingCash === 0) {
        console.warn('⏳ Prices not loaded yet, waiting before logging...', {
          hasActualHoldings,
          totalAssetsExcludingCash,
          samplePrice: getPrice('Physical_Gold')
        });

        // Wait 2 seconds for prices to load, then try again
        setTimeout(() => {
          if (hasLoggedRef.current) return; // Already logged

          const retryBreakdown = calculatePortfolioBreakdownWithPrices(gameState, getPrice);
          const retryNetworth = calculateNetworthWithPrices(gameState, getPrice);
          const retryAssetsExcludingCash = Object.entries(retryBreakdown)
            .filter(([key]) => key !== 'cash' && key !== 'savings')
            .reduce((sum, [, value]) => sum + value, 0);

          if (retryAssetsExcludingCash === 0) {
            console.error('❌ Prices still not loaded after retry, skipping database log');
            hasLoggedRef.current = true; // Mark as logged to prevent further attempts
            return;
          }

          // Prices loaded successfully - continue with normal logging flow below
          // (The code will fall through to the normal logging after this setTimeout)
        }, 2000);
        return;
      }

      // STRICTER VALIDATION: If we're in multiplayer and game is ending after 20 years,
      // but player has NO holdings at all (not just 0 values), the state is corrupted
      const isEndGame = gameState.currentYear >= 20 && gameState.currentMonth >= 12;
      if (isMultiplayer && isEndGame && !hasActualHoldings && totalNetworth < 100000) {
        console.error('❌ Skipping database log: Invalid end-game state - player has no holdings', {
          finalNetworth,
          breakdown,
          holdings: gameState.holdings,
          note: 'Player truly has no investments - likely just kept cash'
        });
        return; // Don't log invalid data
      }

      // Additional validation: ensure breakdown matches finalNetworth
      const breakdownTotal = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
      const discrepancy = Math.abs(breakdownTotal - finalNetworth);
      if (discrepancy > 1) {
        console.warn('⚠️ Portfolio breakdown mismatch detected:', {
          finalNetworth,
          breakdownTotal,
          discrepancy,
          breakdown
        });
      }

      hasLoggedRef.current = true;

      console.log('✅ Logging game to database:', {
        playerName,
        finalNetworth,
        breakdown,
        hasInvestments: totalAssetsExcludingCash > 0,
        isMultiplayer,
        priceSource: isMultiplayer ? 'encrypted_websocket' : 'api',
        samplePrices: {
          Physical_Gold: getPrice('Physical_Gold'),
          BTC: getPrice('BTC'),
        },
        gameYear: gameState.currentYear,
        gameMonth: gameState.currentMonth,
        calendarYear,
      });

      // Calculate game duration in minutes
      const gameDuration = gameState.gameStartTime
        ? Math.round((Date.now() - gameState.gameStartTime) / 60000)
        : undefined;

      playerLogsApi.logGame({
        gameMode: isMultiplayer ? 'multiplayer' : 'solo',
        playerName: playerName,
        playerAge: playerAge,
        roomId: roomId,
        finalNetworth: finalNetworth,
        finalCAGR: parseFloat(cagr),
        profitLoss: profit,
        portfolioBreakdown: breakdown,
        adminSettings: gameState.adminSettings,
        gameDurationMinutes: gameDuration,
      }).then(async response => {
        if (response.success) {
          setLoggedGameId(response.logId !== undefined ? response.logId : null);
          setLoggedGameUniqueId(response.uniqueId || null);

          // Upload all trades, banking, cash transactions, and holdings to database
          if (response.uniqueId && playerName) {

            // Extract holdings data with current prices for accurate P&L tracking
            const holdingsData = extractHoldingsDataWithPrices(gameState, getPrice);

            await tradeTracker.uploadToDatabase(
              response.uniqueId,
              playerName,
              playerAge,
              gameState.savingsAccount,
              gameState.fixedDeposits,
              gameState.cashTransactions,
              holdingsData
            );
          }
        } else {
          console.error('❌ Failed to log game:', response.message);
        }
      }).catch(error => {
        console.error('❌ Error logging game:', error);
      });
    }
  }, [playerName, gameState.adminSettings, isMultiplayer, roomId, finalNetworth, cagr, profit, breakdown, gameState.gameStartTime]);

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


              <div className="total-received" title="Host-controlled: initial pocket cash + recurring income">
                Total Capital Received: {formatCurrency(gameState.pocketCashReceivedTotal || 0)}
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
          /* MULTIPLAYER MODE - Show leaderboard with personal stats */
          <div className="multiplayer-results">
            {/* Personal Stats Card (same as solo mode) */}
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
              <div className="total-received" title="Host-controlled: initial pocket cash + recurring income">
                Total Capital Received: {formatCurrency(gameState.pocketCashReceivedTotal || 0)}
              </div>
            </div>

            <h2>🏆 Final Leaderboard</h2>
            <div className="leaderboard-table">
              {leaderboardData && leaderboardData.length > 0 ? (
                leaderboardData.map((player, index) => {
                  // Debug: log player data to console
                  if (index === 0) {
                    console.log('🏆 Final Leaderboard Data:', leaderboardData);
                  }

                  return (
                    <div key={player.playerId} className={`leaderboard-row rank-${index + 1}`}>
                      <div className="player-info">
                        <div className="player-name">
                          {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : `#${index + 1} `}
                          {player.playerName}
                        </div>
                        <div className="player-networth">{formatCurrency(player.networth)}</div>
                      </div>
                      {player.portfolioBreakdown && Object.keys(player.portfolioBreakdown).length > 0 ? (
                        <div className="player-breakdown-mini">
                          {Object.entries(player.portfolioBreakdown)
                            .filter(([asset, value]) => value > 0) // Only show non-zero values
                            .map(([asset, value]) => (
                              <div key={asset} className="mini-asset">
                                <span className="mini-asset-name">{asset}:</span>
                                <span className="mini-asset-value">{formatCurrency(value)}</span>
                              </div>
                            ))}
                          {Object.values(player.portfolioBreakdown).every(v => v === 0) && (
                            <div className="mini-asset">
                              <span className="mini-asset-name">No investments recorded</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="player-breakdown-mini">
                          <div className="mini-asset">
                            <span className="mini-asset-name">Portfolio data unavailable</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="no-leaderboard">
                  No leaderboard data available. Waiting for players to sync...
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '20px' }}>
          {!isMultiplayer && loggedGameId !== null && (
            <button
              style={{
                padding: '15px 30px',
                backgroundColor: '#9C27B0',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              onClick={() => setIsAIReportOpen(true)}
            >
              📊 Generate My Trading Report
            </button>
          )}
          <button className="return-menu-button" onClick={onReturnToMenu}>
            Return to Main Menu
          </button>
        </div>
      </div>

      <AIReportModal
        isOpen={isAIReportOpen}
        onClose={() => setIsAIReportOpen(false)}
        logId={loggedGameId}
        logUniqueId={loggedGameUniqueId}
        playerName={playerName}
        playerAge={playerAge}
        finalNetworth={finalNetworth}
        cagr={parseFloat(cagr)}
        profitLoss={profit}
      />
    </div>
  );
};

export default GameEndScreen;
