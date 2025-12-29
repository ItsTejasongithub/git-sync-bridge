import React, { useState } from 'react';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import './MultiplayerLeaderboardSidebar.css';

export const MultiplayerLeaderboardSidebar: React.FC = () => {
  const { leaderboard, playerId } = useMultiplayer();
  const [isExpanded, setIsExpanded] = useState(true);

  const formatCurrency = (amount: number): string => {
    const [integerPart, decimalPart] = amount.toFixed(2).split('.');
    let lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);

    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }

    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return `${formatted}.${decimalPart}`;
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="multiplayer-leaderboard-sidebar">
      <div className="sidebar-header" onClick={toggleExpand}>
        <div className="sidebar-header-content">
          <h2>
            <span className="header-icon">🏆</span>
            LEADERBOARD
            {leaderboard.length > 0 && (
              <span className="leaderboard-count">({leaderboard.length})</span>
            )}
          </h2>
          <span className={`expand-indicator ${isExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>
      </div>

      <div className={`leaderboard-list-container ${isExpanded ? 'expanded' : ''}`}>
        <div className="leaderboard-list">
          {leaderboard.map((player, index) => {
            const isCurrentPlayer = player.id === playerId;
            
            return (
              <div 
                key={player.id} 
                className={`leaderboard-item rank-${index + 1} ${isCurrentPlayer ? 'current-player' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="rank-number">
                  {index + 1}
                </div>
                <div className="player-details">
                  <div className="player-name">{player.name}</div>
                  <div className="player-networth">
                    <span className="networth-icon">₹</span>
                    {formatCurrency(player.networth)}
                  </div>
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="no-data">
              <p>No players yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};