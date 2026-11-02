// Isolated headless development tests. Uses fake API data and a fresh browser profile.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');

const baseURL = process.env.PREVIEW_URL || 'http://localhost:3000';
const envPath = path.join(__dirname, '..', '.env');
const localEnv = fsSync.existsSync(envPath) ? fsSync.readFileSync(envPath, 'utf8') : '';
const apiPort = process.env.EXPO_PUBLIC_API_PORT || localEnv.match(/^EXPO_PUBLIC_API_PORT=(\d+)$/m)?.[1] || '3000';
const apiOrigin = process.env.TEST_API_ORIGIN || `http://localhost:${apiPort}`;
const output = path.join(__dirname, '..', 'test-artifacts', 'responsive');
const user = { id: 'test-user', name: 'Test User', email: 'test@example.invalid', role: 'admin', isVerified: true };
const now = '2026-11-02T10:00:00Z';
const sessions = Array.from({ length: 20 }, (_, i) => ({ session_id: `session-${i}`, title: `Conversation ${i + 1} with a long title`, message_count: 2, last_message_at: now, first_message_at: now }));
const adminUser = { id: 'test-other', name: 'Test member', email: 'long-account-name-for-responsive-testing@example.invalid', role: 'user', is_active: true, is_verified: true };

async function setup(context, signedIn, state = {}) {
  await context.addInitScript(({ user, signedIn }) => {
    localStorage.setItem('ashwi.theme', 'light');
    if (signedIn) {
      localStorage.setItem('ashwi.user', JSON.stringify(user));
      localStorage.setItem('ashwi.token', 'test-token-only');
    }
  }, { user, signedIn });
  await context.route(`${apiOrigin}/api/**`, async (route) => {
    const url = new URL(route.request().url());
    let payload = { success: true, data: [] };
    let status = 200;
    if (url.pathname === '/api/auth/me') payload = { success: true, user };
    if (url.pathname === '/api/chat/professions') payload.data = [
      { id: '1', keyName: 'assistant', label: 'Assistant' },
      { id: '2', keyName: 'engineer', label: 'Software engineering and architecture' },
    ];
    if (url.pathname === '/api/chat/sessions') payload.data = sessions;
    if (url.pathname === '/api/chat/history') payload.data = [{ id: 'history-1', session_id: 'session-0', persona_role: 'assistant', user_message: 'A long message: ' + 'abcdefghij'.repeat(30), ai_response: 'A useful answer. '.repeat(20), created_at: now }];
    if (url.pathname === '/api/chat/message') {
      if (state.failMessage) { status = 503; payload = { success: false, error: 'Test service unavailable. Try again.' }; }
      else payload.data = { sessionId: 'session-test', aiResponse: 'Test reply received.', createdAt: now };
    }
    if (url.pathname === '/api/auth/login') {
      if (state.offlineLogin) return route.abort('failed');
      status = 401;
      payload = { success: false, error: 'Invalid email or password.' };
    }
    if (url.pathname === '/api/admin/users') payload.data = [adminUser];
    if (route.request().method() === 'DELETE') state.deletions = (state.deletions || 0) + 1;
    if (url.pathname === '/api/admin/chats') payload.data = [{ id: 'chat-1', user_email: adminUser.email, user_message: 'Long prompt '.repeat(20), ai_response: 'Answer '.repeat(30), created_at: now, persona_role: 'assistant', session_id: 'session-0' }];
    if (url.pathname === '/api/admin/logs') payload.data = [{ id: 'log-1', action: 'CHAT_MESSAGE_SENT', created_at: now, user_email: adminUser.email, details: { detail: 'long-value-'.repeat(35) } }];
    if (url.pathname === '/api/admin/dashboard') payload.data = { totalUsers: 1234, activeUsers: 1024, totalChats: 34234, totalLogs: 124500 };
    if (url.pathname === '/api/admin/activity-summary') payload.data = { last24hChats: 20, last24hLogs: 40, topActions: [], recentActivity: [] };
    await route.fulfill({ status: route.request().method() === 'OPTIONS' ? 204 : status,
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' },
      contentType: 'application/json', body: JSON.stringify(payload) });
  });
}

async function assertFits(page, label) {
  const failures = await page.evaluate(() => {
    const width = innerWidth;
    const problems = [];
    if (document.documentElement.scrollWidth > width + 1) problems.push(`document width ${document.documentElement.scrollWidth} > ${width}`);
    for (const element of document.querySelectorAll('input, textarea, [data-testid], [role="button"]')) {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      // Profession tabs intentionally scroll inside a viewport-bounded container.
      let clippedByScroller = false;
      for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
        const bounds = ancestor.getBoundingClientRect();
        if (['auto', 'scroll'].includes(getComputedStyle(ancestor).overflowX) && bounds.left >= -1 && bounds.right <= width + 1) {
          clippedByScroller = true; break;
        }
      }
      if (clippedByScroller) continue;
      if (rect.left < -1 || rect.right > width + 1) problems.push(`${element.getAttribute('data-testid') || element.getAttribute('aria-label') || element.tagName} ${Math.round(rect.left)}..${Math.round(rect.right)}`);
    }
    return problems;
  });
  if (failures.length) await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
  assert.deepEqual(failures, [], `${label}: horizontal overflow`);
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = [];
  try {
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 844, height: 390 }]) {
      const context = await browser.newContext({ viewport });
      await setup(context, false);
      const page = await context.newPage();
      const crashes = [];
      page.on('pageerror', (error) => crashes.push(error.message));
      for (const route of ['/login', '/signup', '/forgot-password', '/reset-password', '/about']) {
        await page.goto(baseURL + route);
        if (route === '/about') await page.getByText('The Future of Orchestrated Intelligence', { exact: true }).waitFor();
        if (route !== '/about') await page.getByTestId('auth-form').waitFor();
        await assertFits(page, `${route} ${viewport.width}x${viewport.height}`);
        if (route === '/login' || route === '/about') await page.screenshot({ path: path.join(output, `${route.slice(1)}-${viewport.width}.png`), fullPage: true });
      }
      await page.getByRole('button', { name: 'Toggle theme', exact: true }).click();
      await page.waitForFunction(() => localStorage.getItem('ashwi.theme') === 'dark');
      await assertFits(page, `dark about ${viewport.width}`);
      await page.screenshot({ path: path.join(output, `about-dark-${viewport.width}.png`), fullPage: true });
      await context.close();

      const authenticated = await browser.newContext({ viewport });
      const state = {};
      await setup(authenticated, true, state);
      const app = await authenticated.newPage();
      app.on('pageerror', (error) => crashes.push(error.message));
      for (const route of ['/chat', '/chat/history', '/admin/users', '/admin/chats', '/admin/logs']) {
        await app.goto(baseURL + route);
        if (route.startsWith('/chat/') || route === '/chat') await app.getByTestId('chat-composer').waitFor();
        else await app.getByText(route === '/admin/users' ? 'User Management' : route === '/admin/chats' ? 'Chat Monitoring' : 'System Logs', { exact: true }).last().waitFor();
        await assertFits(app, `${route} ${viewport.width}x${viewport.height}`);
        if (route === '/chat' || route === '/chat/history') {
          const box = await app.getByTestId('chat-composer').boundingBox();
          if (!(box.y >= 0 && box.y + box.height <= viewport.height + 1)) await app.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
          assert.ok(box.y >= 0 && box.y + box.height <= viewport.height + 1, `Composer must stay visible on ${route} at ${viewport.width}x${viewport.height}: bottom ${box.y + box.height}`);
        }
        if (route === '/chat/history' && viewport.width < 960) {
          await app.getByText('Choose a conversation', { exact: true }).click();
          await app.getByText('Conversation 20 with a long title', { exact: true }).scrollIntoViewIfNeeded();
          await assertFits(app, `history session picker ${viewport.width}`);
        }
        if (route === '/chat' || route === '/admin/users') await app.screenshot({ path: path.join(output, `${route.slice(1)}-${viewport.width}.png`), fullPage: true });
      }
      await app.goto(baseURL + '/chat');
      await app.getByRole('button', { name: 'Open settings', exact: true }).click();
      await app.getByText('Update password', { exact: true }).scrollIntoViewIfNeeded();
      await assertFits(app, `settings ${viewport.width}x${viewport.height}`);
      await app.screenshot({ path: path.join(output, `settings-${viewport.width}.png`) });
      await app.getByText('Close', { exact: true }).click();
      if (viewport.width < 600) {
        await app.getByRole('button', { name: 'Open navigation', exact: true }).click();
        await app.getByRole('button', { name: 'Dashboard', exact: true }).click();
      } else await app.getByText('Admin', { exact: true }).click();
      await app.getByText('Admin Overview', { exact: true }).waitFor();
      await assertFits(app, `admin overview ${viewport.width}`);
      assert.deepEqual(crashes, [], `No uncaught errors at ${viewport.width}x${viewport.height}`);
      await authenticated.close();
      report.push({ ...viewport, routes: 12, status: 'passed' });
      console.log(`PASS ${viewport.width}x${viewport.height}: public, chat, history, settings and admin`);
    }

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const state = { failMessage: true };
    await setup(context, true, state);
    const page = await context.newPage();
    await page.goto(baseURL + '/chat');
    await page.getByLabel('Message Ashwi', { exact: true }).fill('Preserve this draft when sending fails');
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await page.getByText('Test service unavailable. Try again.', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('Message Ashwi', { exact: true }).inputValue(), 'Preserve this draft when sending fails');
    state.failMessage = false;
    await page.getByRole('button', { name: 'Send message', exact: true }).click();
    await page.getByText('Test reply received.', { exact: true }).waitFor();
    await page.goto(baseURL + '/admin/users');
    await page.getByText('Delete', { exact: true }).click();
    await page.getByRole('heading', { name: 'Delete user?', exact: true }).waitFor();
    await page.getByText('Cancel', { exact: true }).click();
    assert.equal(state.deletions || 0, 0, 'Cancel must not delete a user');
    await context.close();

    const guest = await browser.newContext();
    const guestState = { offlineLogin: true };
    await setup(guest, false, guestState);
    const login = await guest.newPage();
    await login.goto(baseURL + '/login');
    await login.getByLabel('Work email', { exact: true }).fill('test@example.invalid');
    await login.getByLabel('Password', { exact: true }).fill('test-password');
    await login.getByRole('button', { name: 'Sign in', exact: true }).click();
    await login.getByText('Unable to reach Ashwi. Check your connection and try again.', { exact: true }).waitFor();
    guestState.offlineLogin = false;
    await login.getByRole('button', { name: 'Sign in', exact: true }).click();
    await login.getByText('Invalid email or password.', { exact: true }).waitFor();
    await guest.close();
    report.push({ test: 'failed chat preserves draft and retry works; offline login and invalid credentials show feedback', status: 'passed' });
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    console.log('PASS recovery checks. Screenshots and report:', output);
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
