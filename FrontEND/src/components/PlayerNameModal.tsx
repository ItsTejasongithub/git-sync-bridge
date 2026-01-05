import React, { useState } from 'react';

interface PlayerNameModalProps {
  isOpen: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export const PlayerNameModal: React.FC<PlayerNameModalProps> = ({ isOpen, onSubmit, onCancel }) => {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (playerName.trim().length > 20) {
      setError('Name must be less than 20 characters');
      return;
    }

    onSubmit(playerName.trim());
    setPlayerName('');
    setError('');
  };

  const handleCancel = () => {
    setPlayerName('');
    setError('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
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
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          padding: '40px',
          borderRadius: '12px',
          maxWidth: '400px',
          width: '90%',
          border: '2px solid #4ecca3',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#4ecca3', marginBottom: '10px', textAlign: 'center' }}>
          Solo Mode
        </h2>
        <p style={{ color: '#fff', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
          Enter your name to start the game
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#fff', display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Player Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: error ? '2px solid #ff6b6b' : '1px solid #4ecca3',
                backgroundColor: '#16213e',
                color: '#fff',
                fontSize: '16px',
              }}
            />
            {error && (
              <p style={{ color: '#ff6b6b', marginTop: '8px', fontSize: '12px' }}>
                {error}
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '12px',
                backgroundColor: '#0f3460',
                color: '#fff',
                border: '1px solid #4ecca3',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px',
                backgroundColor: '#4ecca3',
                color: '#1a1a2e',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Start Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
