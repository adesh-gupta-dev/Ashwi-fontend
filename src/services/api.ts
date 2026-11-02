import { Platform } from 'react-native';
import { getStoredToken } from './storage';
import { consoleTerminal } from '@/utils/consoleTerminal';

type UnauthorizedHandler = () => void;

type ApiErrorResponse = {
  success?: false;
  error?: string;
  errors?: string[];
};

export type ApiFailure = {
  kind: 'http' | 'network' | 'timeout' | 'invalid-response';
  message: string;
  status: number;
};

type RequestConfig = {
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export type ApiResult<T = any> =
  | { ok: true; data: T; status: number }
  | { ok: false; data: null; status: number; error: ApiFailure };

function normalizeBaseUrl(value: string | undefined, fallback: string) {
  const raw = value?.trim();

  if (!raw) {
    return fallback;
  }

  const withoutTrailingSlash = raw.replace(/\/+$/, '');

  if (/^https?:\/\//i.test(withoutTrailingSlash) || (Platform.OS === 'web' && withoutTrailingSlash.startsWith('/'))) {
    return withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
  }

  return fallback;
}

const apiPort = process.env.EXPO_PUBLIC_API_PORT || '5000';
const localWebBaseURL = process.env.NODE_ENV === 'production'
  ? ''
  : `http://localhost:${apiPort}/api`;
const defaultBaseURL = Platform.select({
  android: `http://10.0.2.2:${apiPort}/api`,
  ios: `http://localhost:${apiPort}/api`,
  web: localWebBaseURL,
  default: `http://localhost:${apiPort}/api`,
}) || '';

const baseURL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL, defaultBaseURL);

const authHandlers: {
  onUnauthorized: UnauthorizedHandler | null;
} = {
  onUnauthorized: null,
};

export function registerAuthHandlers(handlers: { onUnauthorized?: UnauthorizedHandler | null }) {
  authHandlers.onUnauthorized = handlers.onUnauthorized ?? null;
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T = any>(method: string, path: string, config: RequestConfig = {}): Promise<ApiResult<T>> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(config.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 60000);
  const fail = (kind: ApiFailure['kind'], message: string, status = 0): ApiResult<T> => {
    // Exclude query strings, request bodies, authorization and server responses.
    consoleTerminal('api.request', { method, endpoint: path.split('?')[0], kind, status });
    return { ok: false, data: null, status, error: { kind, message, status } };
  };

  if (!baseURL) {
    return fail('network', 'The Ashwi API URL is not configured for this deployment.');
  }

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers,
      signal: controller.signal,
      body: config.body === undefined ? undefined : JSON.stringify(config.body),
    });
    const data = await parseResponse(response);

    if (!response.ok) {
      if (response.status === 401) {
        try {
          authHandlers.onUnauthorized?.();
        } catch (error) {
          consoleTerminal('auth.unauthorized-handler', error);
        }
      }
      const payload = data as ApiErrorResponse | null;
      const message = typeof payload?.error === 'string' ? payload.error :
        Array.isArray(payload?.errors) ? payload.errors.join(' ') :
        `Request failed (${response.status}). Please try again.`;
      return fail('http', message, response.status);
    }

    if ((data && typeof data === 'object' && data.success === false) || typeof data === 'string' || (data === null && response.status !== 204)) {
      return fail('invalid-response', 'The server returned an unexpected response. Please try again.', response.status);
    }
    return { ok: true, data: data as T, status: response.status };
  } catch {
    return controller.signal.aborted
      ? fail('timeout', 'The request timed out. Please try again.')
      : fail('network', 'Unable to reach Ashwi. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

const api = {
  get: <T = any>(path: string, config?: RequestConfig) => request<T>('GET', path, config),
  post: <T = any>(path: string, body?: unknown, config?: Omit<RequestConfig, 'body'>) =>
    request<T>('POST', path, { ...(config || {}), body }),
  put: <T = any>(path: string, body?: unknown, config?: Omit<RequestConfig, 'body'>) =>
    request<T>('PUT', path, { ...(config || {}), body }),
  patch: <T = any>(path: string, body?: unknown, config?: Omit<RequestConfig, 'body'>) =>
    request<T>('PATCH', path, { ...(config || {}), body }),
  delete: <T = any>(path: string, body?: unknown, config?: Omit<RequestConfig, 'body'>) =>
    request<T>('DELETE', path, { ...(config || {}), body }),
};

export default api;
