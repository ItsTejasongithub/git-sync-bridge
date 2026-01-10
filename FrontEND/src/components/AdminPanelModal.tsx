import React, { useState, useEffect } from 'react';
import { adminAuthApi, adminSettingsApi } from '../services/adminApi';
import { AdminSettings, AssetCategory } from '../types';
import { calculateGameStartYear, getLatestAssetYear } from '../utils/assetUnlockCalculator';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ASSET_CATEGORIES: Array<{ id: AssetCategory; label: string; mandatory?: boolean }> = [
  { id: 'BANKING', label: 'Banking (Mandatory)', mandatory: true },
  { id: 'GOLD', label: 'Gold' },
  { id: 'STOCKS', label: 'Stocks' },
  { id: 'FUNDS', label: 'Index & Mutual Funds' },
  { id: 'CRYPTO', label: 'Cryptocurrency' },
  { id: 'REIT', label: 'REITs' },
  { id: 'COMMODITIES', label: 'Commodities' },
];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Admin Settings State
  const [settings, setSettings] = useState<AdminSettings>({
    selectedCategories: ['BANKING', 'GOLD', 'STOCKS', 'FUNDS', 'CRYPTO', 'REIT', 'COMMODITIES'],
    gameStartYear: 2005,
    hideCurrentYear: false,
    initialPocketCash: 100000,
    recurringIncome: 50000,
    enableQuiz: true,
    // Number of random life events per player (default 3, 1..20)
    eventsCount: 3,
    monthDuration: 5000, // Default: 5 seconds per month
  });

  // Track latest asset year
  const [latestAssetYear, setLatestAssetYear] = useState<number>(2005);

  // Load current settings when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated]);

  // Auto-calculate game start year when categories change
  useEffect(() => {
    if (settings.selectedCategories.length > 0) {
      const latest = getLatestAssetYear(settings.selectedCategories);
      const calculated = calculateGameStartYear(settings.selectedCategories);
      setLatestAssetYear(latest);

      // Auto-update the game start year in settings
      setSettings(prev => ({ ...prev, gameStartYear: calculated }));
    }
  }, [settings.selectedCategories]);

  const loadSettings = async () => {
    setLoading(true);
    const response = await adminSettingsApi.getSettings();
    if (response.success && response.settings) {
      setSettings(response.settings);
      console.log('⚙️ AdminPanelModal: loaded settings.eventsCount =', response.settings.eventsCount);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const response = await adminAuthApi.login(username, password);

    setLoading(false);

    if (response.success) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError(response.message);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveMessage('');

    const response = await adminSettingsApi.updateSettings(settings);

    setLoading(false);

    if (response.success) {
      setSaveMessage('Settings saved successfully!');
      // Notify the app that admin settings were updated so running games can react
      try {
        const evt = new CustomEvent('adminSettingsUpdated', { detail: response.settings });
        window.dispatchEvent(evt);
      } catch (err) {
        // noop
      }
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setError(response.message || 'Failed to save settings');
    }
  };

  const handleResetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to default?')) {
      return;
    }

    setLoading(true);
    const response = await adminSettingsApi.resetSettings();
    setLoading(false);

    if (response.success && response.settings) {
      setSettings(response.settings);
      // Notify the app about reset settings as well
      try {
        const evt = new CustomEvent('adminSettingsUpdated', { detail: response.settings });
        window.dispatchEvent(evt);
      } catch (err) {
        // noop
      }
      setSaveMessage('Settings reset to default!');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setError(response.message || 'Failed to reset settings');
    }
  };

  const handleCategoryToggle = (categoryId: AssetCategory) => {
    if (categoryId === 'BANKING') return; // Cannot toggle mandatory category

    setSettings((prev) => {
      const newCategories = prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter((c) => c !== categoryId)
        : [...prev.selectedCategories, categoryId];

      return { ...prev, selectedCategories: newCategories };
    });
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSaveMessage('');

    const response = await adminAuthApi.changePassword(username, oldPassword, newPassword);

    setLoading(false);

    if (response.success) {
      setSaveMessage('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setError(response.message);
    }
  };

  const handleClose = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setError('');
    setSaveMessage('');
    setShowChangePassword(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
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
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          padding: '30px',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '2px solid #4ecca3',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isAuthenticated ? (
          // Login Form
          <div>
            <h2 style={{ color: '#4ecca3', marginBottom: '20px', textAlign: 'center' }}>
              Admin Login
            </h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #4ecca3',
                    backgroundColor: '#16213e',
                    color: '#fff',
                    fontSize: '16px',
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #4ecca3',
                    backgroundColor: '#16213e',
                    color: '#fff',
                    fontSize: '16px',
                  }}
                  required
                />
              </div>
              {error && (
                <p style={{ color: '#ff6b6b', marginBottom: '15px', textAlign: 'center' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#4ecca3',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  width: '100%',
                  marginTop: '10px',
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
            </form>
          </div>
        ) : (
          // Admin Settings Panel
          <div>
            <h2 style={{ color: '#4ecca3', marginBottom: '20px', textAlign: 'center' }}>
              Admin Settings
            </h2>

            {/* Asset Categories */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#fff', marginBottom: '10px', fontSize: '16px' }}>
                Asset Categories
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {ASSET_CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: '#fff',
                      cursor: cat.mandatory ? 'not-allowed' : 'pointer',
                      opacity: cat.mandatory ? 0.7 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={settings.selectedCategories.includes(cat.id)}
                      onChange={() => handleCategoryToggle(cat.id)}
                      disabled={cat.mandatory}
                      style={{ marginRight: '8px', cursor: cat.mandatory ? 'not-allowed' : 'pointer' }}
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Game Start Year - Auto-calculated */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                Game Start Year (Auto-calculated)
              </label>
              <input
                type="number"
                min="1996"
                max="2025"
                value={settings.gameStartYear}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #4ecca3',
                  backgroundColor: '#0f3460',
                  color: '#4ecca3',
                  fontSize: '14px',
                  cursor: 'not-allowed',
                }}
              />
              <p style={{ color: '#888', fontSize: '12px', marginTop: '5px' }}>
                Automatically calculated based on selected asset categories (Latest asset: {latestAssetYear})
              </p>
              <p style={{ color: '#888', fontSize: '12px' }}>
                Game will run from {settings.gameStartYear} to {settings.gameStartYear + 19}
              </p>
            </div>

            {/* Initial Pocket Cash */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                Initial Pocket Cash (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={settings.initialPocketCash}
                onChange={(e) =>
                  setSettings({ ...settings, initialPocketCash: parseInt(e.target.value) })
                }
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #4ecca3',
                  backgroundColor: '#16213e',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Recurring Income */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                Recurring Income (₹, every 6 months)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={settings.recurringIncome}
                onChange={(e) =>
                  setSettings({ ...settings, recurringIncome: parseInt(e.target.value) })
                }
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #4ecca3',
                  backgroundColor: '#16213e',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Random Life Events (per player) */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                Random Life Events (per player)
              </label>
              <select
                value={settings.eventsCount}
                onChange={(e) => setSettings({ ...settings, eventsCount: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #4ecca3',
                  backgroundColor: '#16213e',
                  color: '#fff',
                  fontSize: '14px',
                }}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n} style={{ color: '#000' }}>
                    {n}
                  </option>
                ))}
              </select>
              <p style={{ color: '#888', fontSize: '12px', marginTop: '5px' }}>
                Number of random life events scheduled per player during a game (1 - 20)
              </p>
            </div>

            {/* Month Duration */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#fff', display: 'block', marginBottom: '5px' }}>
                Month Duration (milliseconds)
              </label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={settings.monthDuration || 5000}
                onChange={(e) => setSettings({ ...settings, monthDuration: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #4ecca3',
                  backgroundColor: '#16213e',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
              <p style={{ color: '#888', fontSize: '12px', marginTop: '5px' }}>
                Duration of each game month in milliseconds (1000ms = 1 second). Default: 5000ms (5 sec). Use 1000ms for fast testing.
              </p>
            </div>

            {/* Toggles */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', color: '#fff', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.hideCurrentYear}
                  onChange={(e) => setSettings({ ...settings, hideCurrentYear: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Hide Calendar Year in Game
              </label>
              <label style={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={settings.enableQuiz}
                  onChange={(e) => setSettings({ ...settings, enableQuiz: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Enable Asset Education Quiz
              </label>
            </div>

            {/* Messages */}
            {saveMessage && (
              <p style={{ color: '#4ecca3', marginBottom: '15px', textAlign: 'center' }}>
                {saveMessage}
              </p>
            )}
            {error && (
              <p style={{ color: '#ff6b6b', marginBottom: '15px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            {/* Change Password Section */}
            {showChangePassword ? (
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#0f3460', borderRadius: '8px', border: '1px solid #4ecca3' }}>
                <h3 style={{ color: '#4ecca3', marginBottom: '15px', fontSize: '16px' }}>Change Password</h3>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ color: '#fff', display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #4ecca3',
                      backgroundColor: '#16213e',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ color: '#fff', display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #4ecca3',
                      backgroundColor: '#16213e',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ color: '#fff', display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '5px',
                      border: '1px solid #4ecca3',
                      backgroundColor: '#16213e',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    style={{
                      padding: '10px',
                      backgroundColor: '#4ecca3',
                      color: '#1a1a2e',
                      border: 'none',
                      borderRadius: '5px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    onClick={() => {
                      setShowChangePassword(false);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setError('');
                    }}
                    style={{
                      padding: '10px',
                      backgroundColor: '#0f3460',
                      color: '#fff',
                      border: '1px solid #4ecca3',
                      borderRadius: '5px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowChangePassword(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '15px',
                  backgroundColor: '#0f3460',
                  color: '#4ecca3',
                  border: '1px solid #4ecca3',
                  borderRadius: '5px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Change Password
              </button>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                style={{
                  padding: '12px',
                  backgroundColor: '#4ecca3',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={handleResetSettings}
                disabled={loading}
                style={{
                  padding: '12px',
                  backgroundColor: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Reset to Default
              </button>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#0f3460',
                color: '#fff',
                border: '1px solid #4ecca3',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
