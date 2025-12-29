import { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { MainMenu } from './components/MainMenu';
import { GameScreen } from './components/GameScreen';
import { AdminSettingsPanel } from './components/AdminSettingsPanel';
import { MultiplayerProvider } from './contexts/MultiplayerContext';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerGameCoordinator } from './components/MultiplayerGameCoordinator';
import { useMultiplayer } from './contexts/MultiplayerContext';
import './App.css';

function AppContent() {
  const {
    gameState,
    openSettings,
    startSoloGame,
    backToMenu,
    depositToSavings,
    withdrawFromSavings,
    createFixedDeposit,
    collectFD,
    breakFD,
    buyAsset,
    sellAsset,
    togglePause,
    markQuizCompleted
  } = useGameState();

  const { multiplayerMode } = useMultiplayer();
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);

  const handleStartMulti = () => {
    setIsMultiplayerMode(true);
  };

  const handleBackFromMulti = () => {
    setIsMultiplayerMode(false);
  };

  // Multiplayer views
  if (isMultiplayerMode) {
    if (multiplayerMode === 'lobby') {
      return <MultiplayerLobby onBack={handleBackFromMulti} />;
    }
    if (multiplayerMode === 'host-spectator' || multiplayerMode === 'player-game') {
      return <MultiplayerGameCoordinator />;
    }
    // Still in lobby selection
    return <MultiplayerLobby onBack={handleBackFromMulti} />;
  }

  // Solo mode views
  return (
    <div className="app">
      {gameState.mode === 'menu' && (
        <MainMenu
          onStartSolo={openSettings}
          onStartMulti={handleStartMulti}
        />
      )}

      {gameState.mode === 'settings' && (
        <AdminSettingsPanel
          onStartGame={(settings) => startSoloGame(settings)}
          onBack={backToMenu}
        />
      )}

      {gameState.mode === 'solo' && (
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
          onMarkQuizCompleted={markQuizCompleted}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <MultiplayerProvider>
      <AppContent />
    </MultiplayerProvider>
  );
}

export default App;
