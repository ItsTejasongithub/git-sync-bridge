const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/game.db');

async function inspectDatabase() {
  try {
    const SQL = await initSqlJs();

    if (!fs.existsSync(DB_PATH)) {
      console.log('❌ Database file does not exist at:', DB_PATH);
      return;
    }

    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);

    console.log('✅ Database loaded successfully\n');

    // List all tables
    console.log('=== TABLES ===');
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (tables.length > 0 && tables[0].values) {
      tables[0].values.forEach(row => console.log(`- ${row[0]}`));
    }
    console.log('');

    // Check admin_accounts
    console.log('=== ADMIN ACCOUNTS ===');
    const adminAccounts = db.exec('SELECT id, username, created_at, last_login FROM admin_accounts');
    if (adminAccounts.length > 0 && adminAccounts[0].values) {
      console.log('Columns:', adminAccounts[0].columns);
      adminAccounts[0].values.forEach(row => {
        console.log(`ID: ${row[0]}, Username: ${row[1]}, Created: ${row[2]}, Last Login: ${row[3]}`);
      });
    } else {
      console.log('No admin accounts found');
    }
    console.log('');

    // Check admin_settings
    console.log('=== ADMIN SETTINGS ===');
    const adminSettings = db.exec('SELECT * FROM admin_settings');
    if (adminSettings.length > 0 && adminSettings[0].values) {
      console.log('Columns:', adminSettings[0].columns);
      adminSettings[0].values.forEach(row => {
        console.log('Settings:', row);
      });
    } else {
      console.log('No admin settings found');
    }
    console.log('');

    // Check player_logs
    console.log('=== PLAYER LOGS ===');
    const playerLogs = db.exec('SELECT COUNT(*) as count FROM player_logs');
    if (playerLogs.length > 0 && playerLogs[0].values) {
      const count = playerLogs[0].values[0][0];
      console.log(`Total logs: ${count}`);

      if (count > 0) {
        const recentLogs = db.exec('SELECT id, game_mode, player_name, final_networth, completed_at FROM player_logs ORDER BY completed_at DESC LIMIT 10');
        if (recentLogs.length > 0 && recentLogs[0].values) {
          console.log('\nRecent logs:');
          console.log('Columns:', recentLogs[0].columns);
          recentLogs[0].values.forEach(row => {
            console.log(`  ID: ${row[0]}, Mode: ${row[1]}, Player: ${row[2]}, Networth: ₹${row[3]}, Time: ${row[4]}`);
          });
        }
      }
    } else {
      console.log('No player logs table or no data');
    }

    db.close();
  } catch (error) {
    console.error('Error inspecting database:', error);
  }
}

inspectDatabase();
