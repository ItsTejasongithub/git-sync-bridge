const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/game.db');

async function viewLogs() {
  try {
    const SQL = await initSqlJs();

    if (!fs.existsSync(DB_PATH)) {
      console.log('❌ Database file does not exist');
      return;
    }

    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);

    console.log('\n📊 ═══════════════════════════════════════════════════════════════');
    console.log('                    GAME LOGS VIEWER');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Get all logs
    const result = db.exec(`
      SELECT
        id,
        game_mode,
        player_name,
        room_id,
        final_networth,
        final_cagr,
        profit_loss,
        portfolio_breakdown,
        admin_settings,
        game_duration_minutes,
        completed_at
      FROM player_logs
      ORDER BY completed_at DESC
    `);

    if (result.length === 0 || !result[0].values || result[0].values.length === 0) {
      console.log('❌ No game logs found in database\n');
      db.close();
      return;
    }

    const logs = result[0].values;

    logs.forEach((log, index) => {
      const [id, mode, name, roomId, networth, cagr, profitLoss, portfolioJson, settingsJson, duration, timestamp] = log;

      console.log(`\n🎮 LOG #${id} ─────────────────────────────────────────────────────────`);
      console.log(`   Player Name:      ${name}`);
      console.log(`   Game Mode:        ${mode.toUpperCase()}`);
      if (roomId) console.log(`   Room ID:          ${roomId}`);
      console.log(`   Completed At:     ${timestamp}`);
      if (duration) console.log(`   Duration:         ${duration} minutes`);
      console.log('');
      console.log(`   💰 Final Networth:  ₹${Number(networth).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
      if (cagr) console.log(`   📈 CAGR:            ${Number(cagr).toFixed(2)}%`);
      if (profitLoss) {
        const profitSign = profitLoss >= 0 ? '+' : '';
        console.log(`   💵 Profit/Loss:     ${profitSign}₹${Number(profitLoss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
      }

      // Parse and display portfolio breakdown
      try {
        const portfolio = JSON.parse(portfolioJson);
        console.log('\n   📊 Portfolio Breakdown:');
        Object.entries(portfolio).forEach(([asset, value]) => {
          if (value > 0) {
            const percentage = ((value / networth) * 100).toFixed(1);
            console.log(`      • ${asset.padEnd(20)} ₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${percentage}%)`);
          }
        });
      } catch (e) {
        console.log('   ⚠️  Portfolio data could not be parsed');
      }

      // Parse and display admin settings
      try {
        const settings = JSON.parse(settingsJson);
        console.log('\n   ⚙️  Game Settings:');
        console.log(`      • Start Year:         ${settings.gameStartYear}`);
        console.log(`      • Initial Cash:       ₹${Number(settings.initialPocketCash).toLocaleString('en-IN')}`);
        console.log(`      • Recurring Income:   ₹${Number(settings.recurringIncome).toLocaleString('en-IN')}`);
        console.log(`      • Asset Categories:   ${settings.selectedCategories.join(', ')}`);
        console.log(`      • Quiz Enabled:       ${settings.enableQuiz ? 'Yes' : 'No'}`);
        console.log(`      • Hide Year:          ${settings.hideCurrentYear ? 'Yes' : 'No'}`);
      } catch (e) {
        console.log('   ⚠️  Settings data could not be parsed');
      }

      if (index < logs.length - 1) {
        console.log('\n─────────────────────────────────────────────────────────────');
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`   Total Games Logged: ${logs.length}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    db.close();
  } catch (error) {
    console.error('❌ Error viewing logs:', error);
  }
}

viewLogs();
