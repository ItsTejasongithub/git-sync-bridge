import React from 'react';
import { useMultiplayer } from '../contexts/MultiplayerContext';
import { HostSpectatorView } from './HostSpectatorView';
import { PlayerGameWrapper } from './PlayerGameWrapper';

export const MultiplayerGameCoordinator: React.FC = () => {
  const { multiplayerMode, roomInfo } = useMultiplayer();

  if (!roomInfo) {
    return <div>Loading...</div>;
  }

  // Host sees spectator view
  if (multiplayerMode === 'host-spectator') {
    return <HostSpectatorView />;
  }

  // Players see the game
  if (multiplayerMode === 'player-game') {
    return <PlayerGameWrapper />;
  }

  return <div>Invalid multiplayer mode</div>;
};
