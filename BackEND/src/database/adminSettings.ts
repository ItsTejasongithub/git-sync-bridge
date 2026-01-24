import { getDatabase, saveDatabase } from './db';
import { AdminSettings } from '../types';

/**
 * Get current admin settings
 */
export function getAdminSettings(): AdminSettings | null {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM admin_settings WHERE id = 1');

    if (!stmt.step()) {
      stmt.free();
      // Return default settings if none exist
      return getDefaultAdminSettings();
    }

    const row = stmt.getAsObject();
    stmt.free();

    const settings: AdminSettings = {
      selectedCategories: JSON.parse(row.selected_categories as string),
      gameStartYear: row.game_start_year as number,
      hideCurrentYear: (row.hide_current_year as number) === 1,
      initialPocketCash: row.initial_pocket_cash as number,
      recurringIncome: row.recurring_income as number,
      enableQuiz: (row.enable_quiz as number) === 1,
      eventsCount: (row.events_count as number) || 3,
      monthDuration: (row.month_duration as number) || 5000,
    };

    return settings;
  } catch (error) {
    console.error('Get admin settings error:', error);
    return getDefaultAdminSettings();
  }
}

/**
 * Update admin settings
 */
export function updateAdminSettings(settings: AdminSettings): { success: boolean; message: string } {
  try {
    const db = getDatabase();

    const categoriesJson = JSON.stringify(settings.selectedCategories);

    const performUpdate = () => {
      // Check if settings exist
      const checkStmt = db.prepare('SELECT id FROM admin_settings WHERE id = 1');
      const exists = checkStmt.step();
      checkStmt.free();

      if (exists) {
        // Update existing settings
        db.run(
          `UPDATE admin_settings SET
            selected_categories = ?,
            game_start_year = ?,
            hide_current_year = ?,
            initial_pocket_cash = ?,
            recurring_income = ?,
            enable_quiz = ?,
            events_count = ?,
            month_duration = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = 1`,
          [
            categoriesJson,
            settings.gameStartYear,
            settings.hideCurrentYear ? 1 : 0,
            settings.initialPocketCash,
            settings.recurringIncome,
            settings.enableQuiz ? 1 : 0,
            settings.eventsCount || 3,
            settings.monthDuration || 5000,
          ]
        );
      } else {
        // Insert new settings
        db.run(
          `INSERT INTO admin_settings (id, selected_categories, game_start_year, hide_current_year, initial_pocket_cash, recurring_income, enable_quiz, events_count, month_duration)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            categoriesJson,
            settings.gameStartYear,
            settings.hideCurrentYear ? 1 : 0,
            settings.initialPocketCash,
            settings.recurringIncome,
            settings.enableQuiz ? 1 : 0,
            settings.eventsCount || 3,
            settings.monthDuration || 5000,
          ]
        );
      }
    };

    try {
      performUpdate();
    } catch (err: any) {
      // If the column doesn't exist (older DB), add it and retry once
      if (err && typeof err.message === 'string') {
        if (err.message.includes('no such column: events_count')) {
          db.run('ALTER TABLE admin_settings ADD COLUMN events_count INTEGER NOT NULL DEFAULT 3');
          performUpdate();
        } else if (err.message.includes('no such column: month_duration')) {
          db.run('ALTER TABLE admin_settings ADD COLUMN month_duration INTEGER NOT NULL DEFAULT 5000');
          performUpdate();
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    saveDatabase();
    return { success: true, message: 'Admin settings updated successfully' };
  } catch (error) {
    console.error('Update admin settings error:', error);
    return { success: false, message: 'Failed to update admin settings' };
  }
}

/**
 * Get default admin settings
 */
export function getDefaultAdminSettings(): AdminSettings {
  return {
    selectedCategories: ['BANKING', 'GOLD', 'STOCKS', 'FUNDS', 'CRYPTO', 'REIT', 'COMMODITIES'],
    gameStartYear: 2005,
    hideCurrentYear: false,
    initialPocketCash: 100000,
    recurringIncome: 50000,
    enableQuiz: true,
    eventsCount: 3,
    monthDuration: 5000,
  };
}

/**
 * Reset admin settings to default
 */
export function resetAdminSettings(): { success: boolean; message: string } {
  const defaultSettings = getDefaultAdminSettings();
  return updateAdminSettings(defaultSettings);
}
