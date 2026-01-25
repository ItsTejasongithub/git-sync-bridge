/**
 * Returns the server URL using this priority:
 * 1) runtime override: window.__SERVER_URL (set by hosting server or tests)
 * 2) build-time env: import.meta.env.VITE_SERVER_URL
 * 3) inferred from current page hostname, matching protocol: https://<hostname>:3001 or http://
 */
export function getServerUrl(): string {
  try {
    const runtime = (window as any).__SERVER_URL;
    const env = import.meta.env.VITE_SERVER_URL;

    if (env && String(env).trim().length > 0) return String(env);
    if (runtime && String(runtime).trim().length > 0) return String(runtime);

    // Fallback: infer server on same host with default backend port 3001
    // Match the protocol (https if frontend is https, http otherwise)
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const hostname = window.location.hostname;
      return `${protocol}//${hostname}:3001`;
    }

    return 'http://localhost:3001';
  } catch (err) {
    return 'http://localhost:3001';
  }
}
