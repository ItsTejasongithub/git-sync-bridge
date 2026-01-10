import React, { useState, useEffect } from 'react';
import { AssetCategory, AdminSettings } from '../types';
import { calculateGameStartYear, getLatestAssetYear } from '../utils/assetUnlockCalculator';
import './AdminSettingsPanel.css';

interface AdminSettingsPanelProps {
  onStartGame?: (settings: AdminSettings) => void;
  onBack?: () => void;
  onApply?: (settings: AdminSettings) => void;
  onClose?: () => void;
  initialSettings?: AdminSettings;
}

const ASSET_CATEGORIES: { value: AssetCategory; label: string; description: string }[] = [
  { value: 'BANKING', label: 'Banking', description: 'Savings Account & Fixed Deposits' },
  { value: 'GOLD', label: 'Gold', description: 'Physical & Digital Gold' },
  { value: 'STOCKS', label: 'Stocks', description: 'Indian Stock Market' },
  { value: 'FUNDS', label: 'Index / Mutual Funds', description: 'Nifty Index & Managed Equity Funds' },
  { value: 'CRYPTO', label: 'Crypto', description: 'Bitcoin & Ethereum' },
  { value: 'REIT', label: 'REITs', description: 'Real Estate Investment Trusts' },
  { value: 'COMMODITIES', label: 'Commodities', description: 'Silver, Oil, Copper, etc.' },
];

export const AdminSettingsPanel: React.FC<AdminSettingsPanelProps> = ({
  onStartGame,
  onBack,
  onApply,
  onClose,
  initialSettings
}) => {
  const [selectedCategories, setSelectedCategories] = useState<AssetCategory[]>(
    initialSettings?.selectedCategories || ['BANKING']
  );
  const [hideCurrentYear, setHideCurrentYear] = useState(initialSettings?.hideCurrentYear || false);
  const [enableQuiz, setEnableQuiz] = useState(initialSettings?.enableQuiz !== undefined ? initialSettings.enableQuiz : true);
  const [initialPocketCash, setInitialPocketCash] = useState(initialSettings?.initialPocketCash || 100000);
  const [recurringIncome, setRecurringIncome] = useState(initialSettings?.recurringIncome || 50000);
  const [eventsCount, setEventsCount] = useState(initialSettings?.eventsCount || 3);
  const [monthDuration, setMonthDuration] = useState(initialSettings?.monthDuration || 5000);
  const [calculatedStartYear, setCalculatedStartYear] = useState<number>(2005);
  const [latestAssetYear, setLatestAssetYear] = useState<number>(2005);

  // Refs for easier debugging / focusing
  const eventsSelectRef = React.useRef<HTMLSelectElement | null>(null);

  // Diagnostic log to help confirm running build has eventsCount control
  useEffect(() => {
    console.log('⚙️ AdminSettingsPanel mounted - eventsCount (UI):', eventsCount, 'initialSettings.eventsCount:', initialSettings?.eventsCount);
  }, []);

  const isMultiplayerMode = !!onApply;

  useEffect(() => {
    if (selectedCategories.length > 0) {
      const latest = getLatestAssetYear(selectedCategories);
      const startYear = calculateGameStartYear(selectedCategories);
      setLatestAssetYear(latest);
      setCalculatedStartYear(startYear);
    }
  }, [selectedCategories]);

  const toggleCategory = (category: AssetCategory) => {
    if (category === 'BANKING') return; // Banking is mandatory

    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleStartGame = () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one asset category!');
      return;
    }

    const settings: AdminSettings = {
      selectedCategories,
      gameStartYear: calculatedStartYear,
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
          <h3>Select Asset Categories</h3>
          <p className="section-description">
            Choose which investment types you want to unlock during the game.
            Assets will progressively unlock over 20 years based on real historical timelines.
          </p>

          <div className="category-grid">
            {ASSET_CATEGORIES.map(category => (
              <div
                key={category.value}
                className={`category-card ${
                  selectedCategories.includes(category.value) ? 'selected' : ''
                } ${category.value === 'BANKING' ? 'mandatory' : ''}`}
                onClick={() => toggleCategory(category.value)}
              >
                <div className="category-header">
                  <h4>{category.label}</h4>
                  {category.value === 'BANKING' && (
                    <span className="mandatory-badge">Mandatory</span>
                  )}
                </div>
                <p className="category-description">{category.description}</p>
                <div className="category-checkbox">
                  {selectedCategories.includes(category.value) ? '✓' : ''}
                </div>
              </div>
            ))}
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
              <span className="info-label">Selected Categories:</span>
              <span className="info-value">{selectedCategories.length}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Latest Asset Year:</span>
              <span className="info-value">{latestAssetYear}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Game Start Year:</span>
              <span className="info-value">{calculatedStartYear}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Game End Year:</span>
              <span className="info-value">{calculatedStartYear + 19}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Duration:</span>
              <span className="info-value">20 Years</span>
            </div>
            <div className="info-item">
              <span className="info-label">No New Unlocks:</span>
              <span className="info-value">Last 5 Years</span>
            </div>
          </div>
          <div className="info-note">
            <strong>Note:</strong> The game will automatically calculate the start year to ensure:
            <ul>
              <li>All selected assets can be unlocked based on historical data</li>
              <li>No new assets unlock in the final 5 years</li>
              <li>Progressive unlocking throughout the game (max 1 asset type per year)</li>
            </ul>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn-secondary" onClick={handleBack}>
            {isMultiplayerMode ? 'Cancel' : 'Back to Menu'}
          </button>
          <button
            className="btn-primary"
            onClick={handleStartGame}
            disabled={selectedCategories.length === 0}
          >
            {isMultiplayerMode ? 'Apply Settings' : 'Start Game'}
          </button>
        </div>
      </div>
    </div>
  );
};
