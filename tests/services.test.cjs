const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadTs(file, mocks = {}, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: (name) => {
      assert.ok(name in mocks, `Missing mock: ${name}`);
      return mocks[name];
    },
    __DEV__: true, Error, WeakSet, AbortController, setTimeout, clearTimeout, console,
    process: { env: {} }, ...globals,
  }, { filename: file });
  return module.exports;
}

function loadApi(fetch, os = 'android', env = {}) {
  const logs = [];
  const platform = { OS: os, select: (values) => values[os] ?? values.default };
  const exports = loadTs('src/services/api.ts', {
    'react-native': { Platform: platform },
    './storage': { getStoredToken: () => 'private-test-token' },
    '@/utils/consoleTerminal': { consoleTerminal: (...args) => logs.push(args) },
  }, { fetch, process: { env } });
  return { ...exports, logs };
}

const jsonResponse = (status, data) => ({ ok: status < 400, status, text: async () => JSON.stringify(data) });

test('API preserves successful data and selects each platform host', async () => {
  for (const os of ['android', 'ios', 'web']) {
    let called;
    const { default: api } = loadApi(async (url, config) => {
      called = { url, config };
      return jsonResponse(200, { success: true, data: ['assistant'] });
    }, os);
    const result = await api.get('/chat/professions');
    assert.equal(result.ok, true);
    assert.equal(result.data.data[0], 'assistant');
    assert.equal(called.url, `http://${os === 'android' ? '10.0.2.2' : 'localhost'}:3000/api/chat/professions`);
    assert.equal(called.config.headers.Authorization, 'Bearer private-test-token');
  }
});

test('relative API configuration works only in browsers', async () => {
  for (const os of ['android', 'web']) {
    let called;
    const { default: api } = loadApi(async (url) => { called = url; return jsonResponse(200, {}); }, os,
      { EXPO_PUBLIC_API_BASE_URL: '/gateway/' });
    await api.get('/auth/me');
    assert.equal(called, os === 'web' ? '/gateway/api/auth/me' : 'http://10.0.2.2:3000/api/auth/me');
  }
});

test('configured backend port applies to both web and Android emulator hosts', async () => {
  for (const os of ['android', 'web']) {
    let called;
    const { default: api } = loadApi(async (url) => { called = url; return jsonResponse(200, {}); }, os,
      { EXPO_PUBLIC_API_PORT: '5000' });
    await api.get('/auth/me');
    assert.equal(called, os === 'web' ? 'http://localhost:5000/api/auth/me' : 'http://10.0.2.2:5000/api/auth/me');
  }
});

test('HTTP failures return an error result and log no request payload or token', async () => {
  const { default: api, logs } = loadApi(async () => jsonResponse(400, { errors: ['Invalid email'] }));
  const result = await api.post('/auth/login?token=secret-query', { password: 'secret-password' });
  assert.equal(result.ok, false);
  assert.equal(result.error.message, 'Invalid email');
  assert.equal(result.error.kind, 'http');
  assert.doesNotMatch(JSON.stringify(logs), /secret-query|secret-password|private-test-token/);
});

test('401 clears authentication even if the auth handler fails', async () => {
  let called = 0;
  const { default: api, registerAuthHandlers } = loadApi(async () => jsonResponse(401, { error: 'Expired session' }));
  registerAuthHandlers({ onUnauthorized: () => { called++; throw new Error('Storage unavailable'); } });
  const result = await api.get('/auth/me');
  assert.equal(called, 1);
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
});

test('offline and timed-out requests settle as recoverable failures', async () => {
  const offline = loadApi(async () => { throw new Error('Network failed'); }).default;
  assert.equal((await offline.get('/chat/sessions')).error.kind, 'network');
  const stalled = loadApi((_url, config) => new Promise((_resolve, reject) => {
    config.signal.addEventListener('abort', () => reject(new Error('Aborted')));
  })).default;
  const result = await stalled.get('/chat/sessions', { timeoutMs: 5 });
  assert.equal(result.ok, false);
  assert.equal(result.error.kind, 'timeout');
});

test('HTML and unsuccessful response envelopes cannot become successful actions', async () => {
  const html = loadApi(async () => ({ ok: true, status: 200, text: async () => '<html>Proxy error</html>' })).default;
  assert.equal((await html.get('/chat/sessions')).error.kind, 'invalid-response');
  const invalid = loadApi(async () => jsonResponse(200, { success: false })).default;
  assert.equal((await invalid.post('/auth/signup', {})).ok, false);
});

test('logger redacts sensitive keys and survives circular values', () => {
  const records = [];
  const { consoleTerminal } = loadTs('src/utils/consoleTerminal.ts', { 'react-native': { Platform: { OS: 'web' } } }, {
    console: { error: (...args) => records.push(args) },
  });
  const payload = { token: 'secret', nested: { password: 'secret', count: 2 } };
  payload.self = payload;
  consoleTerminal('test', payload);
  assert.doesNotMatch(JSON.stringify(records), /secret/);
  assert.match(JSON.stringify(records), /Circular/);
  assert.match(JSON.stringify(records), /Redacted/);
});

test('responsive breakpoints account for enlarged text and short windows', () => {
  const { getResponsiveLayout } = loadTs('src/hooks/useResponsiveLayout.ts', { 'react-native': {} });
  assert.equal(getResponsiveLayout(320, 568).isCompact, true);
  assert.equal(getResponsiveLayout(768, 1024).isCompact, false);
  assert.equal(getResponsiveLayout(1024, 768).isWide, true);
  assert.equal(getResponsiveLayout(1024, 768, 1.5).isWide, false);
  assert.equal(getResponsiveLayout(844, 390).isShort, true);
});

test('keyboard avoidance is active only on iOS, with native Android resize', () => {
  for (const os of ['android', 'ios', 'web']) {
    const { getKeyboardAvoidingProps } = loadTs('src/utils/platform.ts', { 'react-native': { Platform: { OS: os } } });
    assert.equal(getKeyboardAvoidingProps().enabled, os === 'ios');
    assert.equal(getKeyboardAvoidingProps().behavior, os === 'ios' ? 'padding' : undefined);
  }
});

test('native keyboard visibility uses platform events and removes subscriptions', () => {
  for (const os of ['android', 'ios', 'web']) {
    const listeners = {};
    let cleanup;
    let visible = false;
    let removed = 0;
    const { useKeyboardVisible } = loadTs('src/hooks/useKeyboardVisible.ts', {
      react: { useState: () => [false, (value) => { visible = value; }], useEffect: (fn) => { cleanup = fn(); } },
      'react-native': { Platform: { OS: os }, Keyboard: { addListener: (event, fn) => {
        listeners[event] = fn;
        return { remove: () => { removed++; } };
      } } },
    });
    useKeyboardVisible();
    if (os === 'web') { assert.equal(Object.keys(listeners).length, 0); continue; }
    listeners[os === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow']();
    assert.equal(visible, true);
    listeners[os === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide']();
    assert.equal(visible, false);
    cleanup();
    assert.equal(removed, 2);
  }
});

function loadStorage(entries = {}, os = 'web') {
  const values = new Map(Object.entries(entries));
  const storage = {
    getItem: async key => values.get(key) ?? null,
    setItem: async (key,value) => { values.set(key,value); },
    removeItem: async key => { values.delete(key); },
    multiGet: async keys => keys.map(key => [key, values.get(key) ?? null]),
    multiSet: async pairs => { for (const [key,value] of pairs) values.set(key,value); },
    multiRemove: async keys => { for (const key of keys) values.delete(key); },
  };
  const exports = loadTs('src/services/storage.ts', {
    '@react-native-async-storage/async-storage': { default: storage },
    'expo-secure-store': {}, 'react-native': { Platform: { OS: os } },
    '@/utils/consoleTerminal': { consoleTerminal: () => {} },
  });
  return { ...exports, values };
}

test('unified frontend migrates former web sessions and logout clears both key sets', async () => {
  const legacyUser = JSON.stringify({id:'member-1',email:'member@example.invalid',name:'Member',role:'user'});
  const store = loadStorage({user:legacyUser,token:'legacy-token',theme:'light'});
  await store.migrateLegacyWebSession();
  assert.equal((await store.hydrateStoredUser()).id, 'member-1');
  assert.equal(await store.hydrateStoredToken(), 'legacy-token');
  assert.equal(await store.hydrateThemePreference(), 'light');
  assert.equal(store.values.has('token'), false);
  await store.clearStoredSession();
  await store.migrateLegacyWebSession();
  assert.equal(await store.hydrateStoredUser(), null);
  assert.equal(await store.hydrateStoredToken(), null);
});

test('legacy migration preserves a newer session and ignores native platform storage', async () => {
  const existing = loadStorage({'ashwi.token':'current-token',token:'older-token'});
  await existing.migrateLegacyWebSession();
  assert.equal(existing.values.get('ashwi.token'), 'current-token');
  const native = loadStorage({token:'old-web-token'}, 'android');
  await native.migrateLegacyWebSession();
  assert.equal(native.values.has('ashwi.token'), false);
});
