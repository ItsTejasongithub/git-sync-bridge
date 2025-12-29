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
  const [calculatedStartYear, setCalculatedStartYear] = useState<number>(2005);
  const [latestAssetYear, setLatestAssetYear] = useState<number>(2005);

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
      hideCurrentYear
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
