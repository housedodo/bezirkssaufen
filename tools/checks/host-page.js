const { chromium } = require('playwright');
const bad = (m) => console.log('✗ ' + m); const ok = (m) => console.log('✓ ' + m);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  async function mk(mode, width = 390) {
    const c = await b.newContext({ viewport: { width, height: 844 }, serviceWorkers: 'block' });
    const p = await c.newPage(); const dialogs = []; p.setDefaultTimeout(6000);
    p.on('pageerror', (e) => bad('JS error: ' + e.message)); p.on('dialog', (d) => { dialogs.push(d.message().slice(0, 70)); d.accept(); });
    const sent = [];
    await p.route('https://bezirkssaufen.domi-dominkovic.workers.dev/**', (r) => {
      const u = r.request().url();
      if (mode.down) return r.abort();
      if (mode.wrongPin && !u.endsWith('/version')) return r.fulfill({ status: 401, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"error":"wrong pin"}' });
      if (u.endsWith('/send')) { sent.push(r.request().postData()); return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ result: { sara: { sent: mode.zero ? 0 : 1, devices: mode.zero ? 0 : 1 }, sarah: { sent: 1, devices: 1 } } }) }); }
      const body = u.endsWith('/status') ? { devices: { sarah: 1, sara: 1 }, started: !!mode.started, startedAt: Date.now() - 3e6 } : u.endsWith('/progress') ? { steps: mode.steps || {} } : u.endsWith('/version') ? { version: mode.ver ?? 5 } : {};
      r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    });
    await p.goto('http://localhost:8000/admin.html'); p.sent = sent; p.dialogs = dialogs; return p;
  }
  const login = async (p) => { await p.fill('#pin', '9999'); await p.dispatchEvent('#pin', 'change'); await p.waitForTimeout(700); };
  const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  { const p = await mk({ wrongPin: true }); await login(p); const t = await p.innerText('#conntext'); (/PIN/i.test(t) ? ok : bad)('wrong PIN says so: "' + t + '"'); if (!await p.isVisible('#pin')) bad('PIN box hidden after a wrong PIN'); await p.context().close(); }
  { const p = await mk({ down: true }); await login(p); const t = await p.innerText('#conntext'); (/connection/i.test(t) ? ok : bad)('worker unreachable says so: "' + t + '"'); await p.context().close(); }
  { const p = await mk({ ver: 3 }); await login(p); (await p.isVisible('#workerwarn') ? ok : bad)('old worker version → yellow warning'); await p.context().close(); }
  { const p = await mk({ ver: 5 }); await login(p); (!await p.isVisible('#workerwarn') ? ok : bad)('current worker → no warning'); await p.context().close(); }
  for (const w of [320, 360, 430]) {
    const p = await mk({ started: true, steps: { 0: { sarah: 1, sara: 1 }, 1: { sarah: 1, sara: 1 }, 2: { sara: 1 } } }, w); await login(p);
    for (const to of ['sarah', 'sara', 'both']) { await p.click(`[data-to=${to}]`); await p.waitForTimeout(250); const o = await overflow(p); if (o > 1) bad(`admin ${w}px, ${to}: page scrolls sideways by ${o}px`); }
    await p.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true))); await p.waitForTimeout(200);
    const o = await overflow(p); (o > 1 ? bad : ok)(`admin at ${w}px: no sideways scroll (all sections open)`); await p.context().close(); }
  { const p = await mk({ started: true }); await login(p);
    // own message without a recipient
    await p.evaluate(() => { document.querySelectorAll('.fold').forEach((d) => (d.open = true)); }); await p.fill('#title', 'hello'); await p.click('#send'); await p.waitForTimeout(300);
    (p.dialogs.some((d) => /Pick Sarah/.test(d)) ? ok : bad)('own message without a recipient is refused with a hint');
    await p.click('[data-to=sara]'); await p.click('#send'); await p.waitForTimeout(500); (p.sent.length === 1 ? ok : bad)('own message goes out once a recipient is picked'); (await p.inputValue('#title') === '' ? ok : bad)('message field is cleared after sending');
    // send one mission, resend asks
    const first = p.locator('.mission').first(); const key = await first.getAttribute('data-key'); await first.click(); await p.waitForTimeout(600);
    (await p.$(`.mission.sent[data-key="${key}"]`) ? ok : bad)('sent mission is marked done');
    p.dialogs.length = 0; await p.evaluate(() => { document.querySelector('.done-box').open = true; }); await p.locator(`.mission.sent[data-key="${key}"]`).click(); await p.waitForTimeout(500);
    (p.dialogs.some((d) => /ALREADY SENT/.test(d)) ? ok : bad)('resending asks "ALREADY SENT"');
    // empty mission list wording
    const left = await p.locator('.mission:not(.sent)').count(); console.log('  (unsent for Sara: ' + left + ')');
    // 0-phone warning
    await p.context().close(); }
  { const p = await mk({ started: true, zero: true }); await login(p); await p.click('[data-to=sara]'); await p.locator('.mission').first().click(); await p.waitForTimeout(700);
    (p.dialogs.some((d) => /No notification reached Sara/.test(d)) ? ok : bad)('0 phones reached → loud warning'); const log = await p.innerText('#log'); (/No notification reached/.test(log) ? ok : bad)('…and it is written to the log'); await p.context().close(); }
  { const p = await mk({ started: false }); await login(p); const clock = await p.innerText('#clock'); (/^\d\d:\d\d$/.test(clock.trim()) ? ok : bad)('clock shows 24 h time: ' + clock); (await p.isVisible('#startgame') ? ok : bad)('Start button visible before the game');
    await p.click('#startgame'); await p.waitForTimeout(500); (p.dialogs.some((d) => /Start the game now/.test(d)) ? ok : bad)('Start asks for confirmation'); await p.context().close(); }
  await b.close();
})();
