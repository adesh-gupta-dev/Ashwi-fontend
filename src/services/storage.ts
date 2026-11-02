import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { ColorSchemeName } from '@/types/theme';
import { consoleTerminal } from '@/utils/consoleTerminal';

const STORAGE_KEYS = {
  theme: 'ashwi.theme',
  user: 'ashwi.user',
  token: 'ashwi.token',
} as const;

let inMemoryToken: string | null = null;

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified?: boolean;
};

export async function hydrateThemePreference() {
  const current = await AsyncStorage.getItem(STORAGE_KEYS.theme);
  const stored = current ?? (Platform.OS === 'web' ? await AsyncStorage.getItem('theme') : null);
  if (stored === 'dark' || stored === 'light') {
    if (!current) await AsyncStorage.setItem(STORAGE_KEYS.theme, stored);
    return stored;
  }
  return null;
}

/** Adopt the former web app's session on the same origin, then retire its keys. */
export async function migrateLegacyWebSession() {
  if (Platform.OS !== 'web') return;
  try {
    const entries = new Map(await AsyncStorage.multiGet([STORAGE_KEYS.user, STORAGE_KEYS.token, 'user', 'token']));
    if (entries.get(STORAGE_KEYS.user) || entries.get(STORAGE_KEYS.token)) return;
    const raw = entries.get('user');
    const token = entries.get('token');
    if (!raw || !token) return;
    const user = JSON.parse(raw) as StoredUser;
    if (!user || typeof user.id !== 'string' || typeof user.email !== 'string' || !['admin', 'user'].includes(user.role)) return;
    await AsyncStorage.multiSet([[STORAGE_KEYS.user, raw], [STORAGE_KEYS.token, token]]);
    await AsyncStorage.multiRemove(['user', 'token']);
  } catch (error) {
    consoleTerminal('auth.legacy-session-migration', error, 'warn');
  }
}

export async function persistThemePreference(theme: ColorSchemeName) {
  await AsyncStorage.setItem(STORAGE_KEYS.theme, theme);
}

export async function hydrateStoredUser() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function persistStoredUser(user: StoredUser | null) {
  if (!user) {
    await AsyncStorage.removeItem(STORAGE_KEYS.user);
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export async function hydrateStoredToken() {
  let token: string | null = null;

  if (Platform.OS !== 'web') {
    try {
      token = await SecureStore.getItemAsync(STORAGE_KEYS.token);
    } catch {
      token = null;
    }
  }

  if (!token) {
    token = await AsyncStorage.getItem(STORAGE_KEYS.token);
  }

  inMemoryToken = token;
  return token;
}

export async function persistStoredToken(token: string | null) {
  inMemoryToken = token;

  if (!token) {
    const tasks = [AsyncStorage.removeItem(STORAGE_KEYS.token)];
    if (Platform.OS !== 'web') {
      tasks.push(SecureStore.deleteItemAsync(STORAGE_KEYS.token));
    }
    await Promise.all(tasks);
    return;
  }

  const tasks = [AsyncStorage.setItem(STORAGE_KEYS.token, token)];
  if (Platform.OS !== 'web') {
    tasks.push(SecureStore.setItemAsync(STORAGE_KEYS.token, token));
  }
  await Promise.all(tasks);
}

export function getStoredToken() {
  return inMemoryToken;
}

export async function clearStoredSession() {
  inMemoryToken = null;

  const tasks = [AsyncStorage.multiRemove([
    STORAGE_KEYS.token, STORAGE_KEYS.user,
    ...(Platform.OS === 'web' ? ['token', 'user'] : []),
  ])];
  if (Platform.OS !== 'web') {
    tasks.push(SecureStore.deleteItemAsync(STORAGE_KEYS.token));
  }
  await Promise.all(tasks);
}
