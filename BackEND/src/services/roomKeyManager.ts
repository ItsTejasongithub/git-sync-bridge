/**
 * Room Key Manager
 * Manages per-room encryption keys and asset index mappings
 * Keys are stored in memory only and destroyed when room closes
 */

import {
  SessionKey,
  EncryptedPayload,
  generateSessionKey,
  encrypt,
} from './cryptoService';

interface RoomKeys {
  sessionKey: SessionKey;
  assetIndexMap: Map<string, number>; // symbol -> index
  indexAssetMap: Map<number, string>; // index -> symbol
  symbols: string[];
}

// Per-room key storage (in-memory only)
const roomKeys: Map<string, RoomKeys> = new Map();

/**
 * Initialize encryption keys and asset mapping for a room
 * Called when a multiplayer game starts
 */
export function initializeRoomKeys(roomId: string, symbols: string[]): RoomKeys {
  // Generate session key
  const sessionKey = generateSessionKey(roomId);

  // Create bidirectional index mapping
  // This allows us to send price arrays without symbol names
  const assetIndexMap = new Map<string, number>();
  const indexAssetMap = new Map<number, string>();

  // Sort symbols for consistent ordering across all clients
  const sortedSymbols = [...symbols].sort();

  sortedSymbols.forEach((symbol, index) => {
    assetIndexMap.set(symbol, index);
    indexAssetMap.set(index, symbol);
  });

  const keys: RoomKeys = {
    sessionKey,
    assetIndexMap,
    indexAssetMap,
    symbols: sortedSymbols,
  };

  roomKeys.set(roomId, keys);

  console.log(
    `🔐 Room ${roomId}: Initialized encryption with ${sortedSymbols.length} symbols`
  );

  return keys;
}

/**
 * Get room keys (returns undefined if room not initialized)
 */
export function getRoomKeys(roomId: string): RoomKeys | undefined {
  return roomKeys.get(roomId);
}

/**
 * Encrypt price data for broadcast to room
 * Converts symbol map to indexed array before encryption
 */
export function encryptPriceData(
  roomId: string,
  priceSnapshot: { [symbol: string]: number }
): EncryptedPayload | null {
  const keys = roomKeys.get(roomId);
  if (!keys) {
    console.warn(`⚠️ No keys found for room ${roomId}`);
    return null;
  }

  // Convert symbol map to indexed array
  // Array positions correspond to symbol indices
  const priceArray: number[] = new Array(keys.indexAssetMap.size).fill(0);

  for (let i = 0; i < keys.indexAssetMap.size; i++) {
    const symbol = keys.indexAssetMap.get(i);
    if (symbol && symbol in priceSnapshot) {
      priceArray[i] = priceSnapshot[symbol];
    }
  }

  // Encrypt the array (no symbols in payload)
  return encrypt(priceArray, keys.sessionKey.key);
}

/**
 * Get session key for key exchange with client
 * Returns base64-encoded key
 */
export function getSessionKeyForExchange(roomId: string): string | null {
  const keys = roomKeys.get(roomId);
  if (!keys) return null;
  return keys.sessionKey.key.toString('base64');
}

/**
 * Get asset index mapping for client initialization
 * Client needs this to decode the indexed price arrays
 */
export function getAssetIndexMapping(
  roomId: string
): { [symbol: string]: number } | null {
  const keys = roomKeys.get(roomId);
  if (!keys) return null;

  const mapping: { [symbol: string]: number } = {};
  keys.assetIndexMap.forEach((index, symbol) => {
    mapping[symbol] = index;
  });
  return mapping;
}

/**
 * Get the list of symbols for a room
 */
export function getRoomSymbols(roomId: string): string[] | null {
  const keys = roomKeys.get(roomId);
  if (!keys) return null;
  return [...keys.symbols];
}

/**
 * Cleanup room keys when room is destroyed
 * Important for security: keys should not persist after room closes
 */
export function cleanupRoomKeys(roomId: string): boolean {
  const existed = roomKeys.has(roomId);
  roomKeys.delete(roomId);

  if (existed) {
    console.log(`🔓 Room ${roomId}: Encryption keys destroyed`);
  }

  return existed;
}

/**
 * Check if room has encryption initialized
 */
export function hasRoomKeys(roomId: string): boolean {
  return roomKeys.has(roomId);
}

/**
 * Get statistics about active room keys (for debugging)
 */
export function getRoomKeyStats(): {
  activeRooms: number;
  roomIds: string[];
} {
  return {
    activeRooms: roomKeys.size,
    roomIds: Array.from(roomKeys.keys()),
  };
}

/**
 * Cleanup all room keys (for server shutdown)
 */
export function cleanupAllRoomKeys(): void {
  const count = roomKeys.size;
  roomKeys.clear();
  console.log(`🔓 Cleaned up encryption keys for ${count} rooms`);
}
