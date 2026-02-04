import React from 'react';
import { AdminSettingsButton } from './AdminSettingsButton';
import './MainMenu.css';

interface MainMenuProps {
  onStartSolo: () => void;
  onStartMulti: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartSolo, onStartMulti }) => {
  return (
    <div className="main-menu">
      <AdminSettingsButton />

      <div className="menu-content">

        <img src="/BullRunNewLogo.png" alt="BullRun Logo" className="game-logo-img" />
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


      </div>
    </div>
  );
};
