import { Platform } from 'react-native';

type LogLevel = 'info' | 'warn' | 'error';
const sensitiveKey = /password|token|authorization|cookie|secret|email|message|prompt|body/i;

function normalize(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (value instanceof Error) {
    return { name: value.name, ...(__DEV__ ? { message: value.message, stack: value.stack } : {}) };
  }
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' ? '[Function]' : value;
  }
  if (seen.has(value)) return '[Circular]';
  if (depth > 4) return '[Truncated]';
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => normalize(item, seen, depth + 1));
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
    key, sensitiveKey.test(key) ? '[Redacted]' : normalize(entry, seen, depth + 1),
  ]));
}

/** Diagnostics only: never throws, never sends logs or credentials to a server. */
export function consoleTerminal(scope: string, details?: unknown, level: LogLevel = 'error') {
  if (!__DEV__ && level !== 'error') return;
  try {
    const write = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
    write(`[Ashwi:${Platform.OS}] ${scope}`, normalize(details));
  } catch {
    // Logging must never interfere with recovery or user actions.
  }
}
