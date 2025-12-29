import React, { useState } from 'react';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { AdminSettingsPanel } from './AdminSettingsPanel';
import { AdminSettings } from '../types';
import './MultiplayerLobby.css';

interface MultiplayerLobbyProps {
  onBack: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onBack }) => {
  const {
    roomInfo,
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    error,
    clearError,
  } = useMultiplayer();

  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return;
    await createRoom(playerName);
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    await joinRoom(roomCode.toUpperCase(), playerName);
  };

  const handleStartGame = async () => {
    if (!adminSettings) {
      alert('Please configure game settings first');
      return;
    }
    await startGame(adminSettings);
  };

  const handleLeave = () => {
    leaveRoom();
    setMode('menu');
    setPlayerName('');
    setRoomCode('');
    setAdminSettings(null);
    setShowSettings(false);
  };

  // Not in a room - show menu
  if (!roomInfo) {
    return (
      <div className="multiplayer-lobby">
        <div className="lobby-container">
          <button className="back-button" onClick={onBack}>
            ← BACK
          </button>

          <img src="/Indian_Game_LOGO.jpeg" alt="BullRun Logo" className="lobby-logo" />
          <h1 className="lobby-title">MULTIPLAYER MODE</h1>

          {!isConnected && (
            <div className="connection-status error">
              ❌ Not connected to server
              <p className="connection-hint">Make sure the server is running</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
              <button onClick={clearError}>✕</button>
            </div>
          )}

          {mode === 'menu' && (
            <div className="lobby-menu">
              <button
                className="lobby-button primary"
                onClick={() => setMode('create')}
                disabled={!isConnected}
              >
                CREATE ROOM
              </button>
              <button
                className="lobby-button secondary"
                onClick={() => setMode('join')}
                disabled={!isConnected}
              >
                JOIN ROOM
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="lobby-form">
              <h2>Create Room</h2>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
              <div className="form-buttons">
                <button onClick={handleCreateRoom} disabled={!playerName.trim()}>
                  CREATE
                </button>
                <button onClick={() => setMode('menu')}>CANCEL</button>
              </div>
            </div>
          )}

          {mode === 'join' && (
            <div className="lobby-form">
              <h2>Join Room</h2>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
              />
              <input
                type="text"
                placeholder="Enter room code (6 digits)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <div className="form-buttons">
                <button
                  onClick={handleJoinRoom}
                  disabled={!playerName.trim() || roomCode.length !== 6}
                >
                  JOIN
                </button>
                <button onClick={() => setMode('menu')}>CANCEL</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // In a room - show lobby
  const isHost = roomInfo.isHost;
  const playerCount = roomInfo.players.length;
  const canStart = playerCount >= 2 && isHost && adminSettings !== null;

  return (
    <div className="multiplayer-lobby">
      <div className="lobby-container">
        <button className="back-button" onClick={handleLeave}>
          ← LEAVE ROOM
        </button>

        <div className="room-header">
          <h1>Room Code</h1>
          <div className="room-code">{roomInfo.roomId}</div>
          <p className="room-hint">Share this code with other players</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={clearError}>✕</button>
          </div>
        )}

        <div className="lobby-content">
          {/* Players List */}
          <div className="players-section">
            <h2>
              Players ({playerCount})
              {playerCount < 2 && <span className="min-players-warning"> - Need 2 minimum</span>}
            </h2>
            <div className="players-list">
              {roomInfo.players.map((player) => (
                <div key={player.id} className="player-item">
                  <span className="player-name">
                    {player.name}
                    {player.isHost && <span className="host-badge">HOST</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Settings (Host Only) */}
          {isHost && (
            <div className="settings-section">
              <h2>Game Settings</h2>
              {!showSettings ? (
                <button
                  className="configure-button"
                  onClick={() => setShowSettings(true)}
                >
                  {adminSettings ? 'EDIT SETTINGS' : 'CONFIGURE SETTINGS'}
                </button>
              ) : (
                <div className="settings-panel">
                  <AdminSettingsPanel
                    onClose={() => setShowSettings(false)}
                    onApply={(settings) => {
                      setAdminSettings(settings);
                      setShowSettings(false);
                    }}
                    initialSettings={adminSettings || undefined}
                  />
                </div>
              )}

              {adminSettings && !showSettings && (
                <div className="settings-summary">
                  <p>✓ Settings configured</p>
                  <p className="settings-detail">
                    {adminSettings.selectedCategories.length} asset categories
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Non-host waiting message */}
          {!isHost && (
            <div className="waiting-message">
              <p>Waiting for host to start the game...</p>
              {playerCount < 2 && <p className="warning">Need at least 2 players</p>}
            </div>
          )}
        </div>

        {/* Start Game Button (Host Only) */}
        {isHost && (
          <button
            className="start-game-button"
            onClick={handleStartGame}
            disabled={!canStart}
          >
            {!adminSettings
              ? 'CONFIGURE SETTINGS FIRST'
              : playerCount < 2
              ? 'WAITING FOR PLAYERS...'
              : 'START GAME'}
          </button>
        )}
      </div>
    </div>
  );
};
