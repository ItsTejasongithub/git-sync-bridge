/**
 * Client-side Cryptographic Service
 * Decrypts price data received from server using Web Crypto API
 */

export interface EncryptedPayload {
  iv: string; // base64 encoded
  data: string; // base64 encoded
  tag: string; // base64 encoded
  ts: number; // timestamp
}

// Session state (in memory only)
let sessionKey: CryptoKey | null = null;
let assetIndexMap: { [symbol: string]: number } = {};
let indexAssetMap: { [index: number]: string } = {};
let initialized = false;

/**
 * Initialize decryption with session key from server
 * Called after key exchange
 */
export async function initializeDecryption(
  sessionKeyBase64: string,
  assetMapping: { [symbol: string]: number }
): Promise<void> {
  try {
    // Decode the session key from base64
    const keyData = base64ToArrayBuffer(sessionKeyBase64);

    // Import the key for AES-GCM decryption
    sessionKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false, // not extractable
      ['decrypt']
    );

    // Store the asset mappings (bidirectional)
    assetIndexMap = { ...assetMapping };
    indexAssetMap = {};
    Object.entries(assetMapping).forEach(([symbol, index]) => {
      indexAssetMap[index] = symbol;
    });

    initialized = true;
    console.log(
      `🔐 Decryption initialized with ${Object.keys(assetMapping).length} symbols`
    );
  } catch (error) {
    console.error('Failed to initialize decryption:', error);
    throw error;
  }
}

/**
 * Decrypt price data from server
 * Returns symbol -> price map
 */
export async function decryptPriceData(
  payload: EncryptedPayload
): Promise<{ [symbol: string]: number } | null> {
  if (!sessionKey || !initialized) {
    console.warn('Decryption not initialized');
    return null;
  }

  try {
    // Decode from base64
    const iv = base64ToArrayBuffer(payload.iv);
    const encryptedData = base64ToArrayBuffer(payload.data);
    const authTag = base64ToArrayBuffer(payload.tag);

    // Combine encrypted data and auth tag (Web Crypto API expects them together)
    const combined = new Uint8Array(encryptedData.byteLength + authTag.byteLength);
    combined.set(new Uint8Array(encryptedData), 0);
    combined.set(new Uint8Array(authTag), encryptedData.byteLength);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      sessionKey,
      combined
    );

    // Parse the decrypted data (array of prices)
    const priceArray: number[] = JSON.parse(new TextDecoder().decode(decrypted));

    // Convert indexed array back to symbol map
    const prices: { [symbol: string]: number } = {};
    priceArray.forEach((price, index) => {
      const symbol = indexAssetMap[index];
      if (symbol && price > 0) {
        prices[symbol] = price;
      }
    });

    return prices;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

/**
 * Check if decryption is initialized
 */
export function isDecryptionInitialized(): boolean {
  return initialized && sessionKey !== null;
}

/**
 * Clear decryption state
 * Called when leaving a game
 */
export function clearDecryptionState(): void {
  sessionKey = null;
  assetIndexMap = {};
  indexAssetMap = {};
  initialized = false;
  console.log('🔓 Decryption state cleared');
}

/**
 * Get the list of symbols we have mappings for
 */
export function getMappedSymbols(): string[] {
  return Object.keys(assetIndexMap);
}

/**
 * Get symbol index (useful for debugging)
 */
export function getSymbolIndex(symbol: string): number | undefined {
  return assetIndexMap[symbol];
}

// Helper: Convert base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
