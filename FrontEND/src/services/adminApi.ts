import { AdminSettings } from '../types';
import { getServerUrl } from '../utils/getServerUrl';

// Use runtime override -> build env -> inferred from page hostname
const API_BASE_URL = getServerUrl();

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  networth: number;
  portfolioBreakdown: any;
}

export interface FinalLeaderboardResponse {
  success: boolean;
  leaderboard?: LeaderboardEntry[];
  message?: string;
}

export interface AdminAccount {
  id: number;
  username: string;
  created_at: string;
  last_login: string | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  admin?: AdminAccount;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface SettingsResponse {
  success: boolean;
  settings?: AdminSettings;
  message?: string;
}

/**
 * Admin Authentication API
 */
export const adminAuthApi = {
  /**
   * Authenticate admin user
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  },

  /**
   * Create new admin account
   */
  async createAccount(username: string, password: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      return await response.json();
    } catch (error) {
      console.error('Create account error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  },

  /**
   * Change admin password
   */
  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, oldPassword, newPassword }),
      });

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  },
};

/**
 * Admin Settings API
 */
export const adminSettingsApi = {
  /**
   * Get current admin settings
   */
  async getSettings(): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`);
      return await response.json();
    } catch (error) {
      console.error('Get settings error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  },

  /**
   * Update admin settings
   */
  async updateSettings(settings: AdminSettings): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      return await response.json();
    } catch (error) {
      console.error('Update settings error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  },

  /**
   * Reset admin settings to default
   */
  async resetSettings(): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/reset`, {
        method: 'POST',
      });

      return await response.json();
    } catch (error) {
      console.error('Reset settings error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  },
};

/**
 * Player Logs API
 */
export const playerLogsApi = {
  /**
   * Log a completed game
   */
  async logGame(params: {
    gameMode: 'solo' | 'multiplayer';
    playerName: string;
    playerAge?: number;
    roomId?: string;
    finalNetworth: number;
    finalCAGR?: number;
    profitLoss?: number;
    portfolioBreakdown: any;
    adminSettings: AdminSettings;
    gameDurationMinutes?: number;
  }): Promise<ApiResponse & { logId?: number; uniqueId?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/game/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      return await response.json();
    } catch (error) {
      console.error('Log game error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  },

  /**
   * Get player logs
   */
  async getLogs(filters?: {
    gameMode?: 'solo' | 'multiplayer';
    playerName?: string;
    roomId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; logs?: any[]; count?: number; message?: string }> {
    try {
      const params = new URLSearchParams();

      if (filters?.gameMode) params.append('gameMode', filters.gameMode);
      if (filters?.playerName) params.append('playerName', filters.playerName);
      if (filters?.roomId) params.append('roomId', filters.roomId);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`${API_BASE_URL}/api/admin/logs?${params.toString()}`);
      return await response.json();
    } catch (error) {
      console.error('Get logs error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  },

  /**
   * Get player statistics
   */
  async getStats(playerName?: string): Promise<{ success: boolean; stats?: any; message?: string }> {
    try {
      const params = new URLSearchParams();
      if (playerName) params.append('playerName', playerName);

      const response = await fetch(`${API_BASE_URL}/api/admin/stats?${params.toString()}`);
      return await response.json();
    } catch (error) {
      console.error('Get stats error:', error);
      return { success: false, message: 'Failed to connect to server' };
    }
  },
};

/**
 * Game-related API
 */
export async function fetchFinalLeaderboard(roomId: string): Promise<FinalLeaderboardResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/game/final-leaderboard/${encodeURIComponent(roomId)}`);
    if (!response.ok) {
      console.error('fetchFinalLeaderboard - non-OK response', response.status);
      return { success: false, message: `Failed to fetch final leaderboard: ${response.statusText}` };
    }
    return await response.json();
  } catch (error) {
    console.error('fetchFinalLeaderboard error:', error);
    return { success: false, message: 'Failed to connect to server' };
  }
}

