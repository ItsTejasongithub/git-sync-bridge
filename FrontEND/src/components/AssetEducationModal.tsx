import React, { useState, useEffect } from 'react';
import { AssetEducationContent } from '../utils/assetEducation';
import './AssetEducationModal.css';

interface AssetEducationModalProps {
  isOpen: boolean;
  content: AssetEducationContent | null;
  onComplete: () => void;
}

export const AssetEducationModal: React.FC<AssetEducationModalProps> = ({
  isOpen,
  content,
  onComplete
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset state when modal opens with new content
  useEffect(() => {
    if (isOpen && content) {
      setSelectedOption(null);
      setAttempts(0);
      setIsShaking(false);
      setShowHint(false);
      setIsCorrect(false);
    }
  }, [isOpen, content]);

  if (!isOpen || !content) return null;

  const handleOptionClick = (index: number) => {
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;

    if (selectedOption === content.correctAnswer) {
      // Correct answer!
      setIsCorrect(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } else {
      // Wrong answer
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      // Trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      // Show hint after 3 attempts
      if (newAttempts >= 3) {
        setShowHint(true);
      }

      setSelectedOption(null);
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="education-modal-overlay">
      <div className={`education-modal ${isShaking ? 'shake' : ''} ${isCorrect ? 'correct' : ''}`}>
        <div className="education-header">
          <h2 className="education-title">{content.title}</h2>
          <div className="unlock-badge">UNLOCKED</div>
        </div>

        <div className="education-content">
          <p className="education-description">{content.description}</p>
        </div>

        <div className="quiz-section">
          <h3 className="quiz-question">{content.question}</h3>

          <div className="quiz-options">
            {content.options.map((option, index) => (
              <button
                key={index}
                className={`quiz-option ${selectedOption === index ? 'selected' : ''}`}
                onClick={() => handleOptionClick(index)}
              >
                <span className="option-label">{optionLabels[index]}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>

          {showHint && (
            <div className="hint-box">
              <span className="hint-icon">💡</span>
              <span className="hint-text">{content.hint}</span>
            </div>
          )}

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={selectedOption === null}
          >
            {isCorrect ? '✓ CORRECT!' : 'SUBMIT ANSWER'}
          </button>

          {attempts > 0 && !isCorrect && (
            <div className="attempts-counter">
              Attempts: {attempts}/3
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
