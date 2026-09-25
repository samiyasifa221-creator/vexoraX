import { Capacitor } from '@capacitor/core';

// Determine the API base URL for network requests
export const getApiBaseUrl = (): string => {
  // If explicitly configured in Vite environment:
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If running in Capacitor Android Native and no remote URL configured,
  // we warn or allow dev host (10.0.2.2 is Android Emulator localhost loopback)
  if (Capacitor.isNativePlatform()) {
    // Return empty or developer local loopback fallback
    return '';
  }

  return '';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Automatically proxies relative /api/* requests to remote endpoint when in native Android.
 */
export function initApiInterceptor() {
  if (API_BASE_URL) {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      if (typeof input === 'string' && input.startsWith('/api/')) {
        const fullUrl = `${API_BASE_URL}${input}`;
        return originalFetch(fullUrl, init);
      }
      return originalFetch(input, init);
    };
  }
}
