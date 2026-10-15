const { chromium } = require('playwright'); const S = '/tmp';
const route = [1,6,7,8,9,2,10,3,11,12,13,14,15,16,17,5,4];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const problems = []; let n = 0;
  for (const width of [320, 360, 390, 430]) {
    const c = await b.newContext({ viewport: { width, height: 760 }, serviceWorkers: 'block' });
    const p = await c.newPage();
    p.on('pageerror', (e) => problems.push(`[${width}] JS error: ${e.message}`));
    p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|fonts/.test(m.text())) problems.push(`[${width}] console: ${m.text().slice(0, 100)}`); });
    await p.route('https://bezirkssaufen.domi-dominkovic.workers.dev/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: r.request().url().endsWith('/game') ? '{"started":true}' : r.request().url().endsWith('/solved') ? '{"both":true}' : '{}' }));
    await p.goto('http://localhost:8000/');
    const states = [{ label: 'picker', st: null }];
    for (const who of ['sarah', 'sara']) {
      states.push({ label: who + ' intro', st: { char: who, phase: 'intro' } });
      states.push({ label: who + ' lobby', st: { char: who, phase: 'lobby' } });
      for (let i = 0; i < 17; i++) {
        states.push({ label: `${who} clue ${i}`, st: { char: who, phase: 'clue', step: i, hearts: 5 } });
        if (i < 16) states.push({ label: `${who} travel ${i}`, st: { char: who, phase: "travel", step: i } });
      }
      states.push({ label: who + ' done', st: { char: who, phase: 'done', step: 16, earned: 12, haul: ['x', 'y'], words: ['a', 'b', 'c'], simResult: 'Tomasz: 💀 Very bad date' } });
      states.push({ label: who + ' mission', st: { char: who, phase: 'clue', step: 4, bonus: { key: 'd_race', id: 'm1', paused: false } } });
    }
    for (const { label, st } of states) {
      await p.evaluate((s) => { if (s) localStorage.setItem('bezirkssaufen.v1', JSON.stringify(s)); else localStorage.removeItem('bezirkssaufen.v1'); }, st);
      await p.reload(); await p.waitForTimeout(450);
      n++;
      const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, len: document.querySelector('#app').innerText.trim().length, over: [...document.querySelectorAll('#app *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > window.innerWidth + 1 || b.left < -1); }).slice(0, 2).map((e) => e.className || e.tagName) }));
      if (r.sw > r.iw + 1) problems.push(`[${width}] ${label}: page scrolls sideways (${r.sw} > ${r.iw}) ${JSON.stringify(r.over)}`);
      else if (r.over.length && !/^(modal|match)/.test(r.over[0])) problems.push(`[${width}] ${label}: element sticks out: ${JSON.stringify(r.over)}`);
      if (r.len < 20) problems.push(`[${width}] ${label}: screen is empty`);
    }
    await c.close();
  }
  console.log('screens checked:', n, '\nproblems:', problems.length); problems.slice(0, 40).forEach((x) => console.log(' -', x));
  await b.close();
})();
