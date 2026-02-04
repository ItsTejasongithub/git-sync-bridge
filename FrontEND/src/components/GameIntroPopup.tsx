import React, { useState, useRef, useEffect } from 'react';
import './GameIntroPopup.css';

interface GameIntroPopupProps {
  isOpen: boolean;
  onComplete: () => void;
  // For multiplayer: show waiting state
  isWaitingForOthers?: boolean;
  waitingForPlayers?: { id: string; name: string }[];
  completedPlayers?: { id: string; name: string }[];
  hasCompletedIntro?: boolean; // Track if current player has completed intro
  isMultiplayer?: boolean; // Whether this is a multiplayer game
}

interface IntroSlide {
  id: number;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  // Support for multiple images displayed side by side
  images?: Array<{
    src: string;
    alt: string;
    label?: string;
    orientation?: 'horizontal' | 'vertical'; // horizontal = landscape, vertical = portrait
  }>;
}

const introSlides: IntroSlide[] = [
  {
    id: 1,
    title: 'Welcome to Bull Run!',
    description: 'Your journey to financial mastery begins. Invest wisely across multiple asset classes and build the highest net worth in 20 game years.',
    images: [
      {
        src: '/intro/Main_Game_Screen.png',
        alt: 'Bull Run Game Overview',
        orientation: 'horizontal'
      }
    ]
  },
  {
    id: 2,
    title: 'Track Your Income',
    description: 'Monitor your cash flow with detailed breakdowns. You receive recurring income every 6 months - watch your wealth grow over time!',
    images: [
      {
        src: '/intro/Income_Track.png',
        alt: 'Income Tracking Feature',
        orientation: 'vertical'
      }
    ]
  },
  {
    id: 3,
    title: 'Learn About Assets',
    description: 'Hover over any asset to learn about the company, its sector, and what it does. Knowledge is power in investing!',
    images: [
      {
        src: '/intro/AssetInformation.png',
        alt: 'Asset Information Tooltip',
        orientation: 'vertical'
      }
    ]
  },
  {
    id: 4,
    title: 'Track Your Investments',
    description: 'See your invested amount, average purchase price, and profit/loss for each asset. Make informed decisions!',
    images: [
      {
        src: '/intro/AVGandP&L.png',
        alt: 'Investment Tracking',
        orientation: 'vertical'
      }
    ]
  },
  {
    id: 5,
    title: 'Portfolio Breakdown',
    description: 'View your complete portfolio composition and CAGR (Compound Annual Growth Rate). Diversification is key to success!',
    images: [
      {
        src: '/intro/PortfolioBreakdown.png',
        alt: 'Portfolio Breakdown',
        orientation: 'vertical'
      }
    ]
  },
  {
    id: 6,
    title: 'Test Your Knowledge',
    description: 'When new asset classes unlock, a quiz will appear. Answer correctly to continue in game! Learning pays off in Bull Run.',
    images: [
      {
        src: '/intro/Quiz.png',
        alt: 'Quiz Feature',
        orientation: 'vertical'
      }
    ]
  },
  {
    id: 7,
    title: 'Life Events',
    description: 'Life events are randomly generated for all players. Each player, in every session, will experience unique life events at different in-game years. Life is not linear—you will face both ups and downs, just like in real life!',
    images: [
      {
        src: '/intro/Positive_Event.png',
        alt: 'Positive Life Event',
        label: 'Positive Life Event',
        orientation: 'vertical'
      },
      {
        src: '/intro/NegetiveEvent.png',
        alt: 'Negative Life Event',
        label: 'Negative Life Event',
        orientation: 'vertical'
      }
    ]
  },
  {
    id: 8,
    title: 'Debt & Purchase Restrictions',
    description: 'If you don\'t have enough pocket cash to handle a life event, you fall into debt. While in debt, buying and investing actions are locked. Your top priority becomes clearing the debt before any further purchases are allowed!',
    images: [
      {
        src: '/intro/Debt.png',
        alt: 'Debt State',
        orientation: 'vertical'
      },
      {
        src: '/intro/Can\'tBuyInDebt.png',
        alt: 'Buying Disabled Due to Debt',
        orientation: 'horizontal'
      }
    ]
  },
  {
    id: 9,
    title: 'Compete & Win!',
    description: 'Track your ranking on the leaderboard. Compete with other players and prove you are the best investor!',
    images: [
      {
        src: '/intro/LeaderBoard.png',
        alt: 'Multiplayer Leaderboard',
        orientation: 'vertical'
      }
    ]
  }
];

export const GameIntroPopup: React.FC<GameIntroPopupProps> = ({
  isOpen,
  onComplete,
  isWaitingForOthers = false,
  waitingForPlayers = [],
  completedPlayers = [],
  hasCompletedIntro = false,
  isMultiplayer = false
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // CRITICAL FIX: Use refs to persist state across re-renders
  // This prevents the issue where multiplayer state updates cause the component
  // to "forget" important state
  const hasCompletedRef = useRef(false);
  const hasEnteredWaitingModeRef = useRef(false);

  // Once we complete (either via prop or via calling onComplete), remember it
  useEffect(() => {
    if (hasCompletedIntro) {
      hasCompletedRef.current = true;
    }
  }, [hasCompletedIntro]);

  // Track if we've ever entered waiting mode
  // In multiplayer, once we complete, we enter waiting mode and stay there
  // until the popup is closed by parent
  useEffect(() => {
    if (hasCompletedRef.current && isMultiplayer) {
      hasEnteredWaitingModeRef.current = true;
    }
  }, [isMultiplayer]);

  // Use the ref value OR the prop - once completed, always completed
  const effectivelyCompleted = hasCompletedRef.current || hasCompletedIntro;

  if (!isOpen) return null;

  const slide = introSlides[currentSlide];
  const isLastSlide = currentSlide === introSlides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      // CRITICAL FIX: Mark as completed immediately via ref before calling onComplete
      // This ensures we persist the completed state even if re-renders occur
      // before the parent component updates the hasCompletedIntro prop
      hasCompletedRef.current = true;

      // CRITICAL FIX: In multiplayer mode, ALWAYS enter waiting mode
      // We can't rely on waitingForPlayers or isWaitingForOthers because
      // the server may have already cleared them by the time this runs
      if (isMultiplayer) {
        hasEnteredWaitingModeRef.current = true;
      }

      onComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  // CRITICAL FIX: Handle completed state properly
  // When player has completed intro:
  // 1. In multiplayer mode, ALWAYS show waiting screen until parent closes us
  //    (This prevents server updates from incorrectly closing the waiting screen)
  // 2. The parent (GameScreen) will close us via isOpen=false when game actually resumes
  if (effectivelyCompleted) {
    // Check if we should show waiting screen
    // IMPORTANT: In multiplayer, always show waiting. In solo, close immediately.
    const shouldShowWaiting = isMultiplayer || hasEnteredWaitingModeRef.current;

    if (!shouldShowWaiting) {
      // Solo mode - close the popup
      return null;
    }

    // Show waiting screen (stay here until parent closes us via isOpen=false)
    return (
      <div className="game-intro-overlay">
        <div className="game-intro-modal waiting-mode">
          <div className="intro-waiting-content">
            <div className="waiting-spinner"></div>
            <h2>You're Ready!</h2>
            <p className="waiting-message">Waiting for other players to finish the tutorial...</p>

            {waitingForPlayers.length > 0 && (
              <div className="players-status-section">
                <h4>Still Reading:</h4>
                <ul className="players-waiting-list">
                  {waitingForPlayers.map(player => (
                    <li key={player.id} className="player-waiting">
                      <span className="waiting-icon">⏳</span>
                      <span>{player.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="auto-start-hint">Game will start automatically when everyone is ready</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-intro-overlay">
      <div className="game-intro-modal with-image">
        {/* Image Section - Single or Multiple */}
        {slide.image && (
          <div className="intro-image-container">
            <img
              src={slide.image}
              alt={slide.imageAlt || slide.title}
              className="intro-slide-image"
            />
          </div>
        )}

        {/* Multiple Images Side by Side */}
        {slide.images && slide.images.length > 0 && (
          <div className="intro-images-container">
            {slide.images.map((img, index) => (
              <div key={index} className={`intro-image-item ${img.orientation || 'vertical'}-image`}>
                <div className="intro-image-container">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="intro-slide-image"
                  />
                </div>
                {img.label && (
                  <p className="image-label">{img.label}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text Content */}
        <div className="intro-text-content">
          <p className="slide-description">{slide.description}</p>
        </div>

        {/* Progress dots */}
        <div className="intro-progress-dots">
          {introSlides.map((_, index) => (
            <button
              key={index}
              className={`progress-dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="intro-navigation">
          <button
            className="intro-nav-btn next-btn"
            onClick={handleNext}
          >
            {isLastSlide ? "Let's Play!" : 'next'}
          </button>
        </div>
      </div>
    </div>
  );
};
