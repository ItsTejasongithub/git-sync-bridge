import React, { useState, useEffect } from 'react';
import { AssetEducationContent, QuizQuestion } from '../utils/assetEducation';
import './AssetEducationModal.css';

interface AssetEducationModalProps {
  isOpen: boolean;
  content: AssetEducationContent | null;
  questionIndex?: number; // Optional: specific question to show
  onComplete: () => void;
  showQuiz?: boolean; // If false, just show education content without quiz
}

export const AssetEducationModal: React.FC<AssetEducationModalProps> = ({
  isOpen,
  content,
  questionIndex,
  onComplete,
  showQuiz = true // Default to showing quiz
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);

  // Reset state when modal opens with new content
  useEffect(() => {
    if (!isOpen || !content) return;

    console.log('[AssetEducationModal] Opening with showQuiz =', showQuiz);

    setSelectedOption(null);
    setAttempts(0);
    setIsShaking(false);
    setShowHint(false);
    setIsCorrect(false);

    // Select question index only if quiz is enabled
    if (showQuiz) {
      if (questionIndex !== undefined) {
        setSelectedQuestionIndex(questionIndex);
      } else {
        // Generate random index only once
        setSelectedQuestionIndex(Math.floor(Math.random() * content.questions.length));
      }
    } else {
      // No quiz - just set a default index to prevent null check issues
      setSelectedQuestionIndex(0);
    }
  }, [isOpen, content, questionIndex, showQuiz]);



  if (!isOpen || !content) return null;

  // Get the current question using the memoized index (only needed for quiz mode)
  const currentQuestion: QuizQuestion | null = (showQuiz && selectedQuestionIndex !== null)
    ? content.questions[selectedQuestionIndex]
    : null;

  const handleOptionClick = (index: number) => {
    setSelectedOption(index);
  };

  const handleSubmit = () => {
    if (selectedOption === null || !currentQuestion) return;

    if (selectedOption === currentQuestion.correctAnswer) {
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

        {showQuiz && currentQuestion ? (
          // Show quiz section
          <div className="quiz-section">
            <h3 className="quiz-question">{currentQuestion.question}</h3>

            <div className="quiz-options">
              {currentQuestion.options.map((option, index) => (
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
                <span className="hint-text">{currentQuestion.hint}</span>
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
        ) : (
          // Show simple notification (no quiz)
          <div className="notification-section">
            <div className="notification-icon">🎉</div>
            <p className="notification-text">
              Check your new asset in the game!
            </p>
            <button className="close-btn" onClick={onComplete}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
