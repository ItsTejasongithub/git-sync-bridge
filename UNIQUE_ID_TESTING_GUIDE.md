# Unique ID Testing Guide

## Quick Start

### 1. Start the Servers

**Backend Terminal**:
```bash
cd BackEND
npm start
```

**Frontend Terminal**:
```bash
cd FrontEND
npm run dev
```

### 2. Play a Game

1. Open http://localhost:5173
2. Click "Play Game" in Solo Mode
3. Complete the 20-year game
4. Click "Generate My Trading Report"

### 3. Verify Unique ID

#### Check Backend Console
Look for:
```
🎮 ═══════════════════════════════════════════════════════════════
   Player Game Logged: [Player Name] (SOLO)
   📋 Unique ID: 20260109143045-A7B2C
   Log ID: 1
   💰 Final Networth: ₹[Amount]
   📈 CAGR: [Percentage]%
   💵 Profit/Loss: ₹[Amount]
═══════════════════════════════════════════════════════════════
```

#### Check Frontend Console
Look for:
```
✅ Game logged successfully! Log ID: 1 Unique ID: 20260109143045-A7B2C
```

#### Check Database
```bash
# Open terminal in BackEND directory
node -e "
const initSqlJs = require('sql.js');
const fs = require('fs');

(async () => {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync('./data/game.db');
  const db = new SQL.Database(buffer);
  const result = db.exec('SELECT id, unique_id, player_name, final_networth FROM player_logs LIMIT 5');
  console.log(JSON.stringify(result, null, 2));
})();
"
```

#### Check PDF Report
1. Click "Generate My Trading Report"
2. Click "Download PDF"
3. Open the PDF
4. Look for "Report ID: [UNIQUE_ID]" in the player information section

## Verification Points

### ✅ Unique ID Format
- Should be 20 characters: `YYYYMMDDHHMMSS-XXXXX`
- Example: `20260109143045-A7B2C`
- 14 digits for timestamp, hyphen, 5 alphanumeric characters

### ✅ Uniqueness
- Each game completion generates a different ID
- ID changes with every second (millisecond precision in timestamp)
- Random component ensures uniqueness if games complete in same second

### ✅ Database Integrity
- ID is stored in `unique_id` column
- Column has UNIQUE constraint (no duplicates)
- Index exists for performance: `idx_player_logs_unique_id`

### ✅ Report Integration
- ID appears in PDF header
- ID shown in AI-generated report
- ID visible in browser console logs

## Common Issues & Solutions

### Issue: Unique ID is NULL in database
**Cause**: Database migration didn't run
**Solution**: 
1. Delete `data/game.db`
2. Restart backend server
3. DB will be recreated with unique_id column

### Issue: Duplicate Unique IDs (UNIQUE constraint error)
**Cause**: Data integrity issue (should be impossible)
**Solution**: This should never happen due to timestamp + random component

### Issue: PDF doesn't show Report ID
**Cause**: logUniqueId prop not passed correctly
**Solution**: Check that GameEndScreen passes `logUniqueId` to AIReportModal

## Database Queries

### Check All Unique IDs
```sql
SELECT id, unique_id, player_name, completed_at FROM player_logs;
```

### Check Specific Player's IDs
```sql
SELECT id, unique_id, final_networth, completed_at 
FROM player_logs 
WHERE player_name = 'Alice'
ORDER BY completed_at DESC;
```

### Verify Column Exists
```sql
PRAGMA table_info(player_logs);
```

### Check Index
```sql
.indices player_logs
```

## Performance Notes

- **Generation**: ~1ms per ID (timestamp parsing + random generation)
- **Database Lookup**: <1ms (indexed unique_id column)
- **PDF Generation**: No additional overhead
- **Storage**: ~20 bytes per ID in database

## Testing Multiple Games

To test uniqueness with multiple games:

1. **Game 1**: Complete and note unique ID (e.g., 20260109143045-A7B2C)
2. **Game 2**: Complete and verify different ID (should be different)
3. **Game 3**: Complete within same second (verify random part differs)

Example:
- Game 1: `20260109143045-A7B2C`
- Game 2: `20260109143045-Z9K1M` (same timestamp, different random)
- Game 3: `20260109143046-F3Q7N` (different timestamp)

## Multiplayer Testing

1. Create a multiplayer room
2. Have multiple players join
3. Each player completes the game
4. Verify each player's game log has unique ID

Console output:
```
🎮 Player 1 SOLO
📋 Unique ID: 20260109143045-A7B2C

🎮 Player 2 SOLO  
📋 Unique ID: 20260109143046-X5V8P

🎮 Player 3 SOLO
📋 Unique ID: 20260109143047-L2Y4D
```

## Debugging

### Enable Detailed Logging
Add to GameEndScreen.tsx:
```typescript
console.log('Full response:', response);
console.log('Unique ID type:', typeof response.uniqueId);
console.log('Unique ID value:', response.uniqueId);
```

### Check Network Traffic
1. Open DevTools (F12)
2. Go to Network tab
3. Filter for `/api/game/log`
4. Check Response payload includes `uniqueId`

### Verify Database Connection
Add to backend server.ts:
```typescript
console.log('Database unique_id column exists:', 
  db.exec("PRAGMA table_info(player_logs)")
    .some(row => row.values.some(cell => cell[1] === 'unique_id'))
);
```

---

**Created**: January 9, 2026
**Version**: 1.0
