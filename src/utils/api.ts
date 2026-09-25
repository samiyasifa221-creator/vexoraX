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
    return '';
  }

  return '';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Universal safe JSON parser that never throws "Unexpected token '<', '<!doctype '... is not valid JSON"
 */
export async function safeParseResponse(res: Response): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const text = await res.text();
    if (!text || text.trim().length === 0) {
      return { ok: res.ok, status: res.status, data: {} };
    }
    const trimmed = text.trim();
    if (trimmed.startsWith('<')) {
      return {
        ok: false,
        status: res.status,
        data: {
          error: 'HTML_RESPONSE',
          message: 'Server returned HTML instead of JSON. The service is starting or route was not found.',
        },
      };
    }
    const parsed = JSON.parse(trimmed);
    return { ok: res.ok, status: res.status, data: parsed };
  } catch (err: any) {
    return {
      ok: false,
      status: res.status,
      data: {
        error: 'PARSE_ERROR',
        message: err?.message || 'Failed to parse JSON response',
      },
    };
  }
}

/**
 * Helper to fetch with API_BASE_URL applied for Android or web.
 * Does not mutate window.fetch to avoid "Cannot set property fetch of #<Window> which has only a getter" errors.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  if (API_BASE_URL && url.startsWith('/api/')) {
    url = `${API_BASE_URL}${url}`;
  }
  return fetch(url, init);
}

/**
 * Safe interceptor initialization that never mutates window.fetch directly
 * preventing "Cannot set property fetch of #<Window> which has only a getter" errors.
 */
export function initApiInterceptor() {
  // Native fetch handles relative /api/* URLs directly in full-stack Vite & Express.
  // Overwriting window.fetch throws errors in iframe sandbox environments.
}

