# Encryption Fix - Implementation Guide

## Quick Start: Apply Critical Fixes

This guide provides step-by-step instructions to enforce AES-256-GCM encryption in multiplayer mode.

---

## Fix #1: Enforce Encryption in usePrices Hook

**File**: `FrontEND/src/hooks/usePrices.ts`

**Current Code** (Lines 102-108):
```typescript
// Fetch prices when year/month changes (for solo mode or as fallback)
useEffect(() => {
  // In multiplayer, prices come via WebSocket, but fetch as fallback
  // In solo mode, always fetch from API
  if (!isMultiplayer || !priceStore.isEnabled()) {
    fetchPricesFromApi();
  }
}, [calendarYear, currentMonth, fetchPricesFromApi, isMultiplayer]);
```

**New Code**:
```typescript
// Fetch prices when year/month changes
useEffect(() => {
  if (isMultiplayer) {
    // SECURITY: In multiplayer, ONLY use encrypted WebSocket prices
    // Do NOT fall back to API if encryption is not ready
    if (!priceStore.isEnabled()) {
      console.warn('⚠️ Multiplayer mode: Waiting for encrypted price broadcast...');
      // Prices will arrive via WebSocket after key exchange
      return;
    }
    // Encrypted prices are being received via WebSocket - no API fetch needed
  } else {
    // Solo mode: fetch from API
    fetchPricesFromApi();
  }
}, [calendarYear, currentMonth, fetchPricesFromApi, isMultiplayer]);
```

---

## Fix #2: Make Key Exchange Mandatory

**File**: `FrontEND/src/components/GameScreen.tsx`

**Current Code** (Lines 117-130):
```typescript
// Request key exchange when joining a multiplayer game
useEffect(() => {
  if (showLeaderboard && gameState.isStarted && !socketService.isUsingServerPrices()) {
    // Request key exchange to enable encrypted price broadcasts
    socketService.requestKeyExchange().then((result) => {
      if (result.success) {
        console.log('🔐 Key exchange successful - server prices enabled');
      } else {
        console.log('📊 Key exchange not available - using CSV prices');
      }
    }).catch((err) => {
      console.warn('Key exchange failed:', err);
    });
  }
}, [showLeaderboard, gameState.isStarted]);
```

**New Code**:
```typescript
// Request key exchange when joining a multiplayer game
useEffect(() => {
  if (showLeaderboard && gameState.isStarted && !socketService.isUsingServerPrices()) {
    // SECURITY: Key exchange is MANDATORY for multiplayer
    socketService.requestKeyExchange().then((result) => {
      if (result.success) {
        console.log('🔐 Key exchange successful - server prices enabled');
      } else {
        // FAIL SECURELY - encryption is required for multiplayer
        console.error('❌ SECURITY ERROR: Key exchange failed - encrypted prices unavailable');
        console.error('   This usually means PostgreSQL is not running or market data is not initialized');
        
        // Show error to user
        alert(
          'Unable to establish secure connection.\n\n' +
          'Multiplayer mode requires encrypted price data from the server.\n' +
          'Please ensure:\n' +
          '1. PostgreSQL database is running\n' +
          '2. Market data is properly initialized\n' +
          '3. Server has started successfully\n\n' +
          'Contact the game host to resolve this issue.'
        );
        
        // Optionally: Return to lobby
        // if (onReturnToMenu) onReturnToMenu();
      }
    }).catch((err) => {
      console.error('❌ Key exchange error:', err);
      alert('Failed to establish secure connection. Please try again or contact the game host.');
    });
  }
}, [showLeaderboard, gameState.isStarted]);
```

---

## Fix #3: Block Direct API Access in Multiplayer

**File**: `FrontEND/src/services/priceApi.ts`

**Modify `fetchPrices` function** (Lines 125-199):

**Add parameter and validation**:
```typescript
/**
 * Get prices for symbols at a specific date
 * @param isMultiplayer - Set to true to block direct API access (security)
 */
export async function fetchPrices(
  symbols: string[],
  year: number,
  month: number,
  isMultiplayer: boolean = false // NEW PARAMETER
): Promise<{ [symbol: string]: number }> {
  // SECURITY: Block direct API access in multiplayer mode
  if (isMultiplayer) {
    console.error('❌ SECURITY: Direct price API access blocked in multiplayer mode');
    console.error('   Multiplayer clients must use encrypted WebSocket prices only');
    return {};
  }

  // Validate inputs
  if (!symbols || symbols.length === 0) {
    return {};
  }

  // ... rest of existing code unchanged
}
```

**Update `usePrices.ts` to pass the flag** (Line 60):
```typescript
// OLD
const newPrices = await fetchPrices(symbols, calendarYear, currentMonth);

// NEW
const newPrices = await fetchPrices(symbols, calendarYear, currentMonth, isMultiplayer);
```

---

## Fix #4: Add Encryption Status Indicator (UI)

**File**: `FrontEND/src/components/GameScreen.tsx`

**Add after line 796** (inside the left sidebar, after leaderboard):
```typescript
{/* Multiplayer Leaderboard */}
{showLeaderboard && <MultiplayerLeaderboardSidebar />}

{/* NEW: Encryption Status Indicator */}
{showLeaderboard && (
  <div className="encryption-status" style={{
    padding: '10px',
    margin: '10px 0',
    borderRadius: '8px',
    backgroundColor: socketService.isUsingServerPrices() 
      ? 'rgba(72, 255, 0, 0.1)' 
      : 'rgba(255, 165, 0, 0.1)',
    border: socketService.isUsingServerPrices()
      ? '1px solid rgba(72, 255, 0, 0.3)'
      : '1px solid rgba(255, 165, 0, 0.3)',
    textAlign: 'center',
    fontSize: '12px',
  }}>
    {socketService.isUsingServerPrices() ? (
      <span style={{ color: '#48ff00' }}>
        🔐 Secure Connection Active
      </span>
    ) : (
      <span style={{ color: '#ffa500' }}>
        ⚠️ Waiting for encryption...
      </span>
    )}
  </div>
)}
```

---

## Fix #5: Server-Side API Blocking (Optional but Recommended)

**File**: `BackEND/src/routes/priceRoutes.ts`

**Modify `/current` endpoint** (Lines 26-72):

**Add header check at the beginning**:
```typescript
router.get('/current', async (req: Request, res: Response) => {
  try {
    // SECURITY: Check if request is from multiplayer client
    const multiplayerMode = req.headers['x-multiplayer-mode'];
    
    if (multiplayerMode === 'true') {
      console.warn('⚠️ SECURITY: Blocked direct API access from multiplayer client');
      return res.status(403).json({
        success: false,
        error: 'Direct API access forbidden in multiplayer mode. Use encrypted WebSocket.',
      });
    }

    if (!isPostgresPoolInitialized()) {
      return res.status(503).json({
        success: false,
        error: 'Database not available',
      });
    }

    // ... rest of existing code unchanged
  } catch (error) {
    // ... existing error handling
  }
});
```

**Update client to send header** in `FrontEND/src/services/priceApi.ts` (Line 156):
```typescript
// OLD
const url = `${SERVER_URL}/api/prices/current?symbols=${encodeURIComponent(symbolsParam)}&year=${year}&month=${month}`;
const response = await fetchWithTimeout(url);

// NEW
const url = `${SERVER_URL}/api/prices/current?symbols=${encodeURIComponent(symbolsParam)}&year=${year}&month=${month}`;
const response = await fetchWithTimeout(url, {
  headers: {
    'x-multiplayer-mode': isMultiplayer ? 'true' : 'false'
  }
});
```

---

## Fix #6: Improve Initialization Timing

**File**: `FrontEND/src/components/GameScreen.tsx`

**Change dependency array** (Line 130):
```typescript
// OLD
}, [showLeaderboard, gameState.isStarted]);

// NEW - Request key exchange as soon as we're in multiplayer, not just when started
}, [showLeaderboard]);
```

**Update condition** (Line 118):
```typescript
// OLD
if (showLeaderboard && gameState.isStarted && !socketService.isUsingServerPrices()) {

// NEW - Request earlier, before game starts
if (showLeaderboard && !socketService.isUsingServerPrices()) {
```

---

## Testing Checklist

After applying fixes, test the following:

### ✅ Test 1: Normal Multiplayer Flow
1. Start PostgreSQL
2. Start backend server
3. Create multiplayer room
4. Join as player
5. Start game
6. **Expected**: Console shows "🔐 Key exchange successful"
7. **Expected**: Prices update via encrypted WebSocket
8. **Expected**: No CSV or API fallback messages

### ✅ Test 2: Encryption Failure Handling
1. Stop PostgreSQL
2. Start backend server (will warn about PostgreSQL)
3. Create multiplayer room
4. Join as player
5. Start game
6. **Expected**: Alert shows "Unable to establish secure connection"
7. **Expected**: Game does NOT continue with CSV prices
8. **Expected**: Console shows security error

### ✅ Test 3: Solo Mode Still Works
1. Start solo game
2. **Expected**: Prices load from API (not WebSocket)
3. **Expected**: No encryption errors
4. **Expected**: Game works normally

### ✅ Test 4: API Blocking
1. Start multiplayer game
2. Open browser console
3. Try: `fetch('http://localhost:3001/api/prices/current?symbols=BTC&year=2020&month=1', {headers: {'x-multiplayer-mode': 'true'}})`
4. **Expected**: Response is 403 Forbidden

---

## Rollback Plan

If issues occur, you can quickly rollback by:

1. **Revert `usePrices.ts`**: Remove the `return` statement, restore API fallback
2. **Revert `GameScreen.tsx`**: Remove the alert, restore the console.log
3. **Revert `priceApi.ts`**: Remove the `isMultiplayer` check

---

## Environment-Based Configuration (Advanced)

For more control, add environment variables:

**File**: `FrontEND/.env`
```env
# Development - allow fallback for easier testing
VITE_ENFORCE_ENCRYPTION=false

# Production - strict enforcement
# VITE_ENFORCE_ENCRYPTION=true
```

**File**: `FrontEND/src/hooks/usePrices.ts`
```typescript
const ENFORCE_ENCRYPTION = import.meta.env.VITE_ENFORCE_ENCRYPTION === 'true';

useEffect(() => {
  if (isMultiplayer) {
    if (!priceStore.isEnabled()) {
      if (ENFORCE_ENCRYPTION) {
        console.error('❌ Encryption required but not available');
        return; // Strict mode
      } else {
        console.warn('⚠️ Encryption not available, using fallback (dev mode)');
        fetchPricesFromApi(); // Fallback for development
        return;
      }
    }
  } else {
    fetchPricesFromApi();
  }
}, [calendarYear, currentMonth, fetchPricesFromApi, isMultiplayer]);
```

---

## Summary of Changes

| File | Lines | Change | Impact |
|------|-------|--------|--------|
| `usePrices.ts` | 102-108 | Block API fallback in multiplayer | 🔴 Critical |
| `GameScreen.tsx` | 117-130 | Make key exchange mandatory | 🔴 Critical |
| `priceApi.ts` | 125-199 | Add multiplayer blocking | 🔴 Critical |
| `GameScreen.tsx` | 796+ | Add encryption status UI | 🟡 High |
| `priceRoutes.ts` | 26-72 | Server-side API blocking | 🟡 High |
| `GameScreen.tsx` | 118, 130 | Earlier key exchange | 🟢 Medium |

---

## Expected Console Output After Fixes

### Successful Multiplayer Game:
```
🔌 Attempting to connect to: http://localhost:3001
✅ Connected to server - Socket ID: abc123
👥 Player1 joined room ROOM123
🔑 Room ROOM123: Key exchange completed for abc123
🔐 Key exchange successful - server prices enabled
📊 Price store enabled (using server prices)
🚀 Game started in room ROOM123
```

### Failed Encryption (Expected Behavior):
```
🔌 Attempting to connect to: http://localhost:3001
✅ Connected to server - Socket ID: abc123
👥 Player1 joined room ROOM123
❌ SECURITY ERROR: Key exchange failed - encrypted prices unavailable
   This usually means PostgreSQL is not running or market data is not initialized
⚠️ Multiplayer mode: Waiting for encrypted price broadcast...
[Alert shown to user]
```

---

**Ready to implement?** Start with Fixes #1, #2, and #3 (the critical ones). Test thoroughly before deploying.
