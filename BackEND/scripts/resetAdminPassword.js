const bcrypt = require('bcrypt');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/game.db');
const DEFAULT_ADMIN_PASSWORD = 'Tejas@6767';

async function resetAdminPassword() {
    try {
        console.log('Loading database...');
        const SQL = await initSqlJs();
        const buffer = fs.readFileSync(DB_PATH);
        const db = new SQL.Database(buffer);

        console.log('Hashing new password...');
        const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

        console.log('Updating admin password...');
        db.run('UPDATE admin_accounts SET password_hash = ? WHERE username = ?', [passwordHash, 'admin']);

        console.log('Saving database...');
        const data = db.export();
        fs.writeFileSync(DB_PATH, data);

        console.log('✅ Admin password reset successfully!');
        console.log('Username: admin');
        console.log('Password: Tejas@6767');

        db.close();
    } catch (error) {
        console.error('❌ Error resetting password:', error);
    }
}

resetAdminPassword();
