import React, { useState } from 'react';
import { AssetCategory, AdminSettings } from '../types';
import { VALID_START_YEAR_MIN, VALID_START_YEAR_MAX } from '../utils/constants';
import './AdminSettingsPanel.css';

interface AdminSettingsPanelProps {
  onStartGame?: (settings: AdminSettings) => void;
  onBack?: () => void;
  onApply?: (settings: AdminSettings) => void;
  onClose?: () => void;
  initialSettings?: AdminSettings;
}

// HARD-CODED Asset Categories (Single Source of Truth - Admin CANNOT change this)
// These reflect the assets that will be unlocked during the game
const ASSET_CATEGORIES: { value: AssetCategory; label: string; description: string; enabled: boolean; disabledReason?: string }[] = [
  { value: 'BANKING', label: 'Banking', description: 'Savings Account & Fixed Deposits', enabled: true },
  { value: 'GOLD', label: 'Gold', description: 'Physical Gold & Gold ETF', enabled: true },
  { value: 'STOCKS', label: 'Stocks', description: 'Indian Stock Market (3 cards)', enabled: true },
  { value: 'FUNDS', label: 'Index / Mutual Funds', description: 'Index (2) & Mutual Funds (2)', enabled: true },
  { value: 'COMMODITIES', label: 'Commodities', description: 'Silver, Oil, Cotton, etc. (1 random)', enabled: true },
  { value: 'REIT', label: 'REITs', description: 'Real Estate Investment Trusts (1 card)', enabled: true },
  { value: 'CRYPTO', label: 'Crypto', description: 'Bitcoin & Ethereum', enabled: false, disabledReason: 'Disabled' },
  { value: 'FOREX', label: 'Forex', description: 'Currency Exchange', enabled: false, disabledReason: 'Disabled' },
];

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  onStartGame,
  onBack,
  onApply,
  onClose,
  initialSettings
}) => {
  // HARD-CODED: Asset categories are fixed and cannot be changed by admin
  // This is a read-only display of what assets are enabled
  const HARDCODED_ENABLED_CATEGORIES: AssetCategory[] = ['BANKING', 'GOLD', 'STOCKS', 'FUNDS', 'COMMODITIES', 'REIT'];

  const [hideCurrentYear, setHideCurrentYear] = useState(initialSettings?.hideCurrentYear || false);
  const [enableQuiz, setEnableQuiz] = useState(initialSettings?.enableQuiz !== undefined ? initialSettings.enableQuiz : true);
  const [initialPocketCash, setInitialPocketCash] = useState(initialSettings?.initialPocketCash || 100000);
  const [recurringIncome, setRecurringIncome] = useState(initialSettings?.recurringIncome || 50000);
  const [eventsCount, setEventsCount] = useState(initialSettings?.eventsCount || 3);
  const [monthDuration, setMonthDuration] = useState(initialSettings?.monthDuration || 5000);

  // Game start year is now user-selectable (2000-2005)
  // Note: Must be at least 2004 to allow REITs to unlock before year 17
  const [gameStartYear, setGameStartYear] = useState<number>(
    initialSettings?.gameStartYear || VALID_START_YEAR_MIN
  );

  // Refs for easier debugging / focusing
  const eventsSelectRef = React.useRef<HTMLSelectElement | null>(null);

  const isMultiplayerMode = !!onApply;

  const handleStartGame = () => {
    // Use hard-coded categories (admin selection is ignored)
    const settings: AdminSettings = {
      selectedCategories: HARDCODED_ENABLED_CATEGORIES,
      gameStartYear, // User-selected year (2000-2005)
      hideCurrentYear,
      initialPocketCash,
      recurringIncome,
      enableQuiz,
      eventsCount,
      monthDuration
    };

    if (isMultiplayerMode && onApply) {
      onApply(settings);
    } else if (onStartGame) {
      onStartGame(settings);
    }
  };

  const handleBack = () => {
    if (isMultiplayerMode && onClose) {
      onClose();
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="admin-settings-panel">
      <div className="settings-content">
        <h1 className="settings-title">Game Settings</h1>
        <p className="settings-subtitle">Customize Your Investment Journey</p>

        <div className="settings-section">
          <h3>Asset Categories (Read-Only)</h3>
          <p className="section-description">
            The following asset categories are hard-coded and will unlock during the game.
            This cannot be changed by admin settings.
          </p>

          <div className="category-grid">
            {ASSET_CATEGORIES.map(category => (
              <div
                key={category.value}
                className={`category-card ${category.enabled ? 'selected' : 'disabled'}`}
                style={{ cursor: 'default', pointerEvents: 'none' }}
              >
                <div className="category-header">
                  <h4>{category.label}</h4>
                  {category.enabled && (
                    <span className="mandatory-badge" style={{
                      backgroundColor: '#2e7d32',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      marginLeft: '8px'
                    }}>Enabled</span>
                  )}
                  {!category.enabled && category.disabledReason && (
                    <span className="disabled-badge" style={{
                      backgroundColor: '#666',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      marginLeft: '8px'
                    }}>{category.disabledReason}</span>
                  )}
                </div>
                <p className="category-description">{category.description}</p>
                <div className="category-checkbox">
                  {category.enabled ? '✓' : '✗'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>Game Timeline</h3>
          <p className="section-description">
            Choose when your investment journey begins. The game spans 20 years.
          </p>

          <div className="financial-inputs">
            <div className="input-group">
              <label htmlFor="gameStartYear">Game Start Year</label>
              <select
                id="gameStartYear"
                value={gameStartYear}
                onChange={(e) => setGameStartYear(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', fontSize: '1rem' }}
              >
                {Array.from(
                  { length: VALID_START_YEAR_MAX - VALID_START_YEAR_MIN + 1 },
                  (_, i) => VALID_START_YEAR_MIN + i
                ).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <small>Select the calendar year when the game begins (2000-2005)</small>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Financial Settings</h3>
          <p className="section-description">
            Configure starting cash and recurring income for all players.
          </p>

          <div className="financial-inputs">
            <div className="info-row" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <strong>Random Life Events:</strong>
              <span style={{ fontWeight: 700 }}>{eventsCount}</span>
              <button type="button" className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.9rem' }} onClick={() => eventsSelectRef.current?.focus()}>Change</button>
            </div>

            <div className="input-group">
              <label htmlFor="initialPocketCash">Initial Pocket Cash</label>
              <div className="input-with-prefix">
                <span className="currency-prefix">₹</span>
                <input
                  id="initialPocketCash"
                  type="number"
                  min="10000"
                  max="10000000"
                  step="10000"
                  value={initialPocketCash}
                  onChange={(e) => setInitialPocketCash(Number(e.target.value))}
                />
              </div>
              <small>Starting cash amount for each player</small>
            </div>

            <div className="input-group">
              <label htmlFor="recurringIncome">Income Every 6 Months</label>
              <div className="input-with-prefix">
                <span className="currency-prefix">₹</span>
                <input
                  id="recurringIncome"
                  type="number"
                  min="0"
                  max="1000000"
                  step="5000"
                  value={recurringIncome}
                  onChange={(e) => setRecurringIncome(Number(e.target.value))}
                />
              </div>
              <small>Amount added to pocket cash every 6 months</small>
            </div>

            <div className="input-group">
              <label htmlFor="eventsCount">Random Life Events</label>
              <select
                id="eventsCount"
                ref={eventsSelectRef}
                value={eventsCount}
                onChange={(e) => setEventsCount(Number(e.target.value))}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <small>Number of random life events per player (1 - 20)</small>
            </div>

            <div className="input-group">
              <label htmlFor="monthDuration">Month Duration (seconds)</label>
              <input
                id="monthDuration"
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={monthDuration}
                onChange={(e) => setMonthDuration(Number(e.target.value))}
              />
              <small>Duration of each game month in milliseconds (1000ms = 1 second). Default: 5000ms (5 seconds)</small>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Display Options</h3>
          <div className="option-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hideCurrentYear}
                onChange={(e) => setHideCurrentYear(e.target.checked)}
              />
              <span>Hide current calendar year (show only game years)</span>
            </label>
          </div>
          <div className="option-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={enableQuiz}
                onChange={(e) => setEnableQuiz(e.target.checked)}
              />
              <span>Enable quiz on new asset unlock</span>
            </label>
            <small style={{ marginLeft: '28px', display: 'block', color: 'rgba(255, 255, 255, 0.6)' }}>
              When disabled, a simple notification will show for 5 seconds instead of quiz
            </small>
          </div>
        </div>

        <div className="settings-section info-section">
          <h3>Game Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Enabled Categories:</span>
              <span className="info-value">6</span>
            </div>
            <div className="info-item">
              <span className="info-label">Game Start Year:</span>
              <span className="info-value">{gameStartYear}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Game End Year:</span>
              <span className="info-value">{gameStartYear + 19}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Duration:</span>
              <span className="info-value">20 Years</span>
            </div>
          </div>
          <div className="info-note">
            <strong>Asset Unlock Schedule (Hard-Coded):</strong>
            <ul>
              <li><strong>Year 1:</strong> Savings Account (1) + Fixed Deposits (1)</li>
              <li><strong>Year 2:</strong> Physical Gold (1 card)</li>
              <li><strong>Year 3:</strong> Commodities (1 random card)</li>
              <li><strong>Year 4:</strong> Stocks (3 cards - 2 random + 1 additional)</li>
              <li><strong>Calendar 2009+:</strong> Index Funds (2 cards)</li>
              <li><strong>Calendar 2012+:</strong> Gold ETF (1 card)</li>
              <li><strong>Calendar 2017+:</strong> Mutual Funds (2 cards)</li>
              <li><strong>Calendar 2020+:</strong> REITs (1 card)</li>
            </ul>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px' }}>
              Note: No new assets unlock in the last 3 game years (Years 18-20). CRYPTO and FOREX are disabled.
            </p>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn-secondary" onClick={handleBack}>
            {isMultiplayerMode ? 'Cancel' : 'Back to Menu'}
          </button>
          <button
            className="btn-primary"
            onClick={handleStartGame}
          >
            {isMultiplayerMode ? 'Apply Settings' : 'Start Game'}
          </button>
        </div>
      </div>
    </div>
  );
};
