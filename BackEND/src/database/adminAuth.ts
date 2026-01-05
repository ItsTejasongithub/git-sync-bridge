import * as bcrypt from 'bcrypt';
import { getDatabase, saveDatabase, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD } from './db';

export interface AdminAccount {
  id: number;
  username: string;
  created_at: string;
  last_login: string | null;
}

/**
 * Authenticate admin user with fallback to default password
 */
export async function authenticateAdmin(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; admin?: AdminAccount }> {
  try {
    const db = getDatabase();

    const stmt = db.prepare('SELECT * FROM admin_accounts WHERE username = ?');
    stmt.bind([username]);

    if (!stmt.step()) {
      stmt.free();
      return { success: false, message: 'Invalid credentials' };
    }

    const row = stmt.getAsObject();
    stmt.free();

    const passwordHash = row.password_hash as string;
    let isValid = await bcrypt.compare(password, passwordHash);

    // If DB password doesn't match, try the default password from code
    if (!isValid && username === DEFAULT_ADMIN_USERNAME && password === DEFAULT_ADMIN_PASSWORD) {
      // User is logging in with the default password - update DB to match
      const newPasswordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      db.run('UPDATE admin_accounts SET password_hash = ? WHERE id = ?', [newPasswordHash, row.id]);
      saveDatabase();
      console.log('✅ Admin password synchronized with code default');
      isValid = true;
    }

    if (!isValid) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Update last login
    db.run('UPDATE admin_accounts SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [row.id]);
    saveDatabase();

    const admin: AdminAccount = {
      id: row.id as number,
      username: row.username as string,
      created_at: row.created_at as string,
      last_login: row.last_login as string | null,
    };

    return { success: true, message: 'Authentication successful', admin };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, message: 'Authentication failed' };
  }
}

/**
 * Create new admin account
 */
export async function createAdminAccount(
  username: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  try {
    const db = getDatabase();

    // Check if username already exists
    const checkStmt = db.prepare('SELECT id FROM admin_accounts WHERE username = ?');
    checkStmt.bind([username]);
    const exists = checkStmt.step();
    checkStmt.free();

    if (exists) {
      return { success: false, message: 'Username already exists' };
    }

    // Hash password and create account
    const passwordHash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO admin_accounts (username, password_hash) VALUES (?, ?)', [
      username,
      passwordHash,
    ]);
    saveDatabase();

    return { success: true, message: 'Admin account created successfully' };
  } catch (error) {
    console.error('Create admin account error:', error);
    return { success: false, message: 'Failed to create admin account' };
  }
}

/**
 * Change admin password
 */
export async function changeAdminPassword(
  username: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    // First authenticate with old password
    const authResult = await authenticateAdmin(username, oldPassword);
    if (!authResult.success) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Update to new password
    const db = getDatabase();
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE admin_accounts SET password_hash = ? WHERE username = ?', [
      newPasswordHash,
      username,
    ]);
    saveDatabase();

    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, message: 'Failed to change password' };
  }
}

/**
 * List all admin accounts (without sensitive data)
 */
export function listAdminAccounts(): AdminAccount[] {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT id, username, created_at, last_login FROM admin_accounts');
    const accounts: AdminAccount[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      accounts.push({
        id: row.id as number,
        username: row.username as string,
        created_at: row.created_at as string,
        last_login: row.last_login as string | null,
      });
    }

    stmt.free();
    return accounts;
  } catch (error) {
    console.error('List admin accounts error:', error);
    return [];
  }
}
