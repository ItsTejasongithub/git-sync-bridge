import React from 'react';
import { PlayerInfo } from '../types/multiplayer';
import './QuizWaitingOverlay.css';

interface QuizWaitingOverlayProps {
  waitingForPlayers: PlayerInfo[];
  currentPlayer: PlayerInfo;
}

export const QuizWaitingOverlay: React.FC<QuizWaitingOverlayProps> = ({
  waitingForPlayers,
  currentPlayer,
}) => {
  const isCurrentPlayerDone = !waitingForPlayers.some(p => p.id === currentPlayer.id);

  if (!isCurrentPlayerDone) {
    // Current player is still in quiz, don't show overlay
    return null;
  }

  return (
    <div className="quiz-waiting-overlay">
      <div className="waiting-card">
        <div className="waiting-icon">
          <div className="spinner"></div>
        </div>

        <h2>✓ Quiz Completed!</h2>
        <p className="waiting-message">
          Waiting for other players to finish their quiz...
        </p>

        <div className="waiting-players-list">
          <h3>Players still in quiz:</h3>
          <ul>
            {waitingForPlayers.map(player => (
              <li key={player.id}>
                <span className="player-name">{player.name}</span>
                {player.quizStatus.currentQuiz && (
                  <span className="quiz-category">
                    ({player.quizStatus.currentQuiz})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <p className="game-resume-hint">
          Game will resume automatically when everyone is done
        </p>
      </div>
    </div>
  );
};
