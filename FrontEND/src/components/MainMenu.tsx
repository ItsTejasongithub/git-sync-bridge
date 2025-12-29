import React from 'react';
import './MainMenu.css';

interface MainMenuProps {
  onStartSolo: () => void;
  onStartMulti: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartSolo, onStartMulti }) => {
  return (
    <div className="main-menu">
      <div className="menu-content">
        <img src="/Indian_Game_LOGO.jpeg" alt="BullRun Logo" className="game-logo-img" />
        <h1 className="game-title">BULL RUN</h1>
        <p className="game-subtitle">A Financial Investment Journey</p>

        <div className="menu-buttons">
          <button className="menu-button settings-button" onClick={onStartSolo}>
            SOLO GAME
          </button>
          <button className="menu-button multi-button" onClick={onStartMulti}>
            MULTI MODE
          </button>
        </div>

        <div className="menu-info">
          <h3>Game Rules:</h3>
          <ul>
            <li>Play through 20 years of investing (3 seconds = 1 month)</li>
            <li>Start with ₹1,00,000 in pocket cash</li>
            <li>Unlock new investment options progressively</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
