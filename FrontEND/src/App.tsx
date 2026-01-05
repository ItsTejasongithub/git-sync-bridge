import { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { MainMenu } from './components/MainMenu';
import { GameScreen } from './components/GameScreen';
import { PlayerNameModal } from './components/PlayerNameModal';
import { MultiplayerProvider } from './contexts/MultiplayerContext';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerGameCoordinator } from './components/MultiplayerGameCoordinator';
import { useMultiplayer } from './contexts/MultiplayerContext';
import { adminSettingsApi } from './services/adminApi';
import { AdminSettings } from './types';
import './App.css';

function AppContent() {
  const {
    gameState,
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
    markQuizCompleted,
    lifeEventPopup,
    clearLifeEventPopup
  } = useGameState();

  const { multiplayerMode } = useMultiplayer();
  const [isMultiplayerMode, setIsMultiplayerMode] = useState(false);
  const [showPlayerNameModal, setShowPlayerNameModal] = useState(false);
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Load admin settings on mount
  useEffect(() => {
    loadAdminSettings();
  }, []);

  const loadAdminSettings = async () => {
    setLoadingSettings(true);
    const response = await adminSettingsApi.getSettings();
    if (response.success && response.settings) {
      setAdminSettings(response.settings);
    } else {
      // Use default settings if server is unavailable
      setAdminSettings({
        selectedCategories: ['BANKING', 'GOLD', 'STOCKS', 'FUNDS', 'CRYPTO', 'REIT', 'COMMODITIES'],
        gameStartYear: 2005,
        hideCurrentYear: false,
        initialPocketCash: 100000,
        recurringIncome: 50000,
        enableQuiz: true,
      });
    }
    setLoadingSettings(false);
  };

  const handleStartSolo = () => {
    setShowPlayerNameModal(true);
  };

  const handlePlayerNameSubmit = (name: string) => {
    setCurrentPlayerName(name);
    setShowPlayerNameModal(false);

    // Start solo game with admin settings
    if (adminSettings) {
      startSoloGame(adminSettings);
    }
  };

  const handlePlayerNameCancel = () => {
    setShowPlayerNameModal(false);
  };

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
          onStartSolo={handleStartSolo}
          onStartMulti={handleStartMulti}
        />
      )}

      {/* Player Name Modal for Solo Mode */}
      <PlayerNameModal
        isOpen={showPlayerNameModal}
        onSubmit={handlePlayerNameSubmit}
        onCancel={handlePlayerNameCancel}
      />

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
          onReturnToMenu={backToMenu}
          playerName={currentPlayerName}
          lifeEventPopup={lifeEventPopup}
          clearLifeEventPopup={clearLifeEventPopup}
        />
      )}

      {loadingSettings && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div style={{ color: '#4ecca3', fontSize: '24px' }}>Loading game settings...</div>
        </div>
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
