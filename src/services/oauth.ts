import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import api from './api';
import { consoleTerminal } from '@/utils/consoleTerminal';

export type OAuthProvider = 'google' | 'github';
type Pending = { verifier: string; redirectUri: string; createdAt: number };
const key = 'ashwi.oauth.pending';
const savePending = async (value: Pending) => {
  if (Platform.OS === 'web') window.sessionStorage.setItem(key, JSON.stringify(value));
  else await SecureStore.setItemAsync(key, JSON.stringify(value));
};
const takePending = async (): Promise<Pending | null> => {
  const value = Platform.OS === 'web' ? window.sessionStorage.getItem(key) : await SecureStore.getItemAsync(key);
  if (Platform.OS === 'web') window.sessionStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
  return value ? JSON.parse(value) : null;
};
const failed = (message: string) => ({ ok: false as const, error: message });
export function oauthRedirectUri() {
  return Platform.OS === 'web' ? `${window.location.origin}/oauth/callback` : AuthSession.makeRedirectUri({ scheme:'ashwi', path:'oauth/callback' });
}

const completions = new Map<string, ReturnType<typeof completeOAuth>>();
export function finishOAuth(ticket?: string, providerError?: string) {
  // Native AuthSession and Expo Router may receive the same deep link together.
  if (!ticket) return completeOAuth(ticket, providerError);
  const previous = completions.get(ticket);
  if (previous) return previous;
  const result = completeOAuth(ticket, providerError);
  completions.set(ticket, result);
  setTimeout(() => completions.delete(ticket), 5000);
  if (completions.size > 5) completions.delete(completions.keys().next().value!);
  return result;
}

async function completeOAuth(ticket?: string, providerError?: string) {
  try {
    const pending = await takePending();
    if (providerError) return failed(providerError === 'denied' ? 'Sign-in was cancelled. You can try again.' : 'Provider sign-in could not be completed. Please try again.');
    if (!pending || !ticket || Date.now()-pending.createdAt > 10*60*1000 || pending.redirectUri !== oauthRedirectUri()) return failed('This sign-in session expired. Please start again.');
    const response = await api.post('/auth/oauth/exchange', { ticket, codeVerifier: pending.verifier });
    if (!response.ok) return failed(response.error.message);
    if (typeof response.data?.token !== 'string' || !response.data?.user?.id) return failed('The server returned an invalid sign-in response.');
    return { ok:true as const, data:response.data };
  } catch { consoleTerminal('oauth.complete.failed'); return failed('Unable to finish sign-in. Please start again.'); }
}

export async function startOAuth(provider: OAuthProvider, link = false) {
  try {
    const bytes = await Crypto.getRandomBytesAsync(32);
    const verifier = Array.from(bytes, byte => byte.toString(16).padStart(2,'0')).join('');
    const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {encoding: Crypto.CryptoEncoding.BASE64});
    const codeChallenge = digest.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    const redirectUri = oauthRedirectUri();
    const response = await api.post(`/auth/oauth/${provider}/${link ? 'link' : 'start'}`, { redirectUri, codeChallenge });
    if (!response.ok) return failed(response.error.message);
    const url = new URL(response.data.authorizationUrl);
    if (url.protocol !== 'https:' || url.hostname !== (provider === 'google' ? 'accounts.google.com' : 'github.com')) return failed('The server returned an invalid sign-in URL.');
    await savePending({ verifier, redirectUri, createdAt:Date.now() });
    if (Platform.OS === 'web') { window.location.assign(url.href); return { ok:true as const, redirecting:true as const }; }
    const result = await WebBrowser.openAuthSessionAsync(url.href, redirectUri);
    if (result.type !== 'success') { await takePending(); return failed('Sign-in was cancelled.'); }
    const callback = new URL(result.url);
    return finishOAuth(callback.searchParams.get('ticket') || undefined, callback.searchParams.get('error') || undefined);
  } catch { consoleTerminal('oauth.start.failed', {provider}); return failed('Unable to open sign-in. Check your connection and try again.'); }
}
