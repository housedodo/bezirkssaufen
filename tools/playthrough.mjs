// Full two-player playthrough of the game (Sarah + Sara at the same time) against the REAL worker code.
//   1. python3 -m http.server 8000          (in the repo root)
//   2. NODE_PATH=$(npm root -g) node tools/playthrough.mjs /tmp/out     (needs Playwright + Chromium, see CLAUDE.md → Testing)
// The worker (worker/worker.js) runs in-process with a fake KV; Playwright routes the phones' requests to it. It checks the
// lobby, the host's Start, both complete routes (challenges, chat, shop, spending, step sync, a host mission via the inbox
// safety net), both finales and the journal, lints story.js for spoilers/leftovers, and writes play.log + ending-*.txt +
// finale screenshots into the output folder. Takes about 4 minutes. Prints "ISSUES: none" when everything works.
import { fileURLToPath } from 'url';
import path from 'path';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
import { createRequire } from 'module';
import worker from '../worker/worker.js';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2] || '/tmp/playthrough';
fs.mkdirSync(OUT, { recursive: true });
const issues = []; const log = []; const T0 = Date.now();
const note = (who, msg) => { const l = `[${((Date.now()-T0)/1000).toFixed(0).padStart(4)}s] ${who.padEnd(5)} ${msg}`; log.push(l); console.log(l); };
const issue = (who, msg) => { issues.push(`${who}: ${msg}`); note(who, '⚠ ISSUE: ' + msg); };

// ── the real worker, in-process
const { privateKey } = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const kv = new Map();
const env = { ADMIN_PIN: '9999', VAPID_PUBLIC: 'x', VAPID_SUBJECT: 'mailto:a@b.c', VAPID_PRIVATE_JWK: JSON.stringify(await crypto.subtle.exportKey('jwk', privateKey)),
  KV: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => void kv.set(k, v), delete: async (k) => void kv.delete(k), list: async ({ prefix }) => ({ keys: [...kv.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) }) } };
globalThis.fetch = async () => new Response(null, { status: 201 }); // push services
const adminCall = async (path, method, body) => { const r = await worker.fetch(new Request('https://w.dev' + path, { method, body: body && JSON.stringify(body), headers: { authorization: 'Bearer 9999' } }), env); return r.json(); };

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
async function phone(who) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.addInitScript((w) => {
    Object.defineProperty(Notification, 'permission', { get: () => 'granted' });
    Object.defineProperty(navigator.serviceWorker, 'ready', { value: Promise.resolve({ pushManager: { getSubscription: async () => ({ endpoint: 'https://push.test/' + w, toJSON: () => ({ endpoint: 'https://push.test/' + w, keys: {} }) }) } }) });
  }, who);
  await ctx.route('https://bezirkssaufen.domi-dominkovic.workers.dev/**', async (r) => {
    const q = r.request();
    const res = await worker.fetch(new Request(q.url(), { method: q.method(), headers: q.headers(), body: ['GET', 'HEAD'].includes(q.method()) ? undefined : q.postData() }), env);
    r.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: await res.text() });
  });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => issue(who, 'JS error: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|fonts/.test(m.text())) issue(who, 'console error: ' + m.text().slice(0, 140)); });
  p.on('dialog', (d) => d.accept());
  return p;
}

// ── static content lint
const vm = await import('vm');
const sandbox = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'story.js'), 'utf8') + ';globalThis.X={ROUTE,DISTRICTS,STORIES,CHALLENGES,SARA_SHOP}', sandbox);
const { ROUTE, DISTRICTS, STORIES, CHALLENGES, SARA_SHOP } = sandbox.X;
const strip = (t) => String(t).replace(/<[^>]+>/g, '');
for (const who of ['sarah', 'sara']) ROUTE.slice(0, -1).forEach((d, i) => {
  const st = STORIES[who].stops[d], next = DISTRICTS[ROUTE[i + 1]].name;
  if (!st.riddle) issue(who, `stop ${d} has no riddle`);
  if (!st.hint) issue(who, `stop ${d} has no hint`);
  for (const f of ['riddle', 'hint']) if (st[f] && new RegExp(next.replace('.', '\\.'), 'i').test(strip(st[f])) && !/hint/.test(f)) issue(who, `riddle of stop ${d} names the next district "${next}": ${strip(st[f]).slice(0, 80)}`);
  if (st.encounter && new RegExp(next.replace('.', '\\.'), 'i').test(strip(st.encounter))) issue(who, `encounter of stop ${d} names the next district "${next}"`);
});
const all = JSON.stringify([STORIES, CHALLENGES, SARA_SHOP]);
for (const bad of [/\bHerb\b/, /\bKafk\b/, /\bfat\b/i, /birthday/i, /Bezirkssaufen/i, /undefined/, /NaN/]) if (bad.test(all)) note('lint', `content mentions ${bad} (${(all.match(bad) || [''])[0]})`);
note('lint', 'static content checks done');

// ── shared bits
const flashWait = async (p) => { if (await p.$('.match-overlay')) await p.waitForTimeout(1900); };
async function doChallenge(p, who, tag) {
  for (let k = 0; k < 60; k++) {
    if (!await p.$('.ch-title')) return;
    const title = await p.innerText('.ch-title');
    if (k === 0) note(who, `${tag}: "${title}"`);
    if (await p.$('.q-opt')) { await p.locator('.q-opt:not([disabled])').first().click(); await p.waitForTimeout(650); await flashWait(p); }
    else if (await p.$('#bio')) { await p.fill('#bio', who + ' was here, lovely evening'); await p.click('#startclock').catch(() => {}); await p.click('#confirm'); await p.waitForTimeout(1900); }
    else if (await p.$('[data-note]')) { for (const t of await p.$$('[data-note]')) await t.fill('absolutely great'); await p.click('#confirm'); await p.waitForTimeout(1900); }
    else if (await p.$('#startclock')) { await p.click('#startclock'); await p.waitForTimeout(1600); await p.click('#confirm'); await p.waitForTimeout(1900); }
    else if (await p.$('#countdown')) { await p.click('#countdown'); await p.waitForTimeout(5800); }
    else if (await p.$('#delegdone')) { await p.click('#delegdone'); await p.waitForTimeout(600); }
    else if (await p.$('#confirm')) { await p.click('#confirm'); await p.waitForTimeout(1900); }
    else await p.waitForTimeout(300);
  }
  issue(who, `challenge "${tag}" never finished`);
}
const stateOf = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('bezirkssaufen.v1')));
let missionSent = false;

async function play(who, p) {
  const sara = who === 'sara';
  const used = { pass: new Set(), wrongBuy: new Set(), hint: false, cancel: false, delegate: false, reveal: false, wrongGuess: new Set() };
  await p.goto('http://localhost:8000');
  await p.evaluate(() => { for (const k of Object.keys(CHALLENGES)) if (CHALLENGES[k].type === 'timer' || CHALLENGES[k].type === 'write') CHALLENGES[k].seconds = 1; });
  note(who, 'opened the app'); await p.click(`[data-pick=${who}]`); await p.waitForTimeout(1200);
  if (!await p.isVisible('.lobby')) issue(who, 'no lobby after choosing a name'); else note(who, 'lobby: "Under construction" ✓');
  // wait for the host to start the game
  for (let k = 0; k < 120 && !await p.$('#start'); k++) await p.waitForTimeout(500);
  if (!await p.$('#start')) { issue(who, 'lobby never unlocked'); return; }
  note(who, 'game started → intro'); const introWords = (await p.innerText('.story')).split(/\s+/).length; note(who, `intro story = ${introWords} words`);
  await p.click('#introhint'); await p.click('#start'); await p.waitForTimeout(600);

  for (let i = 0; i < ROUTE.length - 1; i++) {
    const d = ROUTE[i], next = ROUTE[i + 1];
    const t0 = Date.now();
    if (i === 8) { // the host sends a surprise mission to both phones
      if (!missionSent) { missionSent = true; const r = await adminCall('/send', 'POST', { to: 'both', title: '🥂 Surprise mission: Adventure clink', body: 'Tap to open.', ch: 'd_toast' }); note('host', 'sent surprise mission to both: ' + JSON.stringify(Object.fromEntries(Object.entries(r.result || {}).map(([k, v]) => [k, v.sent + '/' + v.devices])))); }
      await p.waitForTimeout(600);
      await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      for (let k = 0; k < 20 && !await p.$('.ch-banner.sur'); k++) await p.waitForTimeout(300);
      if (await p.$('.ch-banner.sur')) { note(who, 'surprise mission arrived by itself (inbox) ✓'); await doChallenge(p, who, 'surprise mission'); } else issue(who, 'surprise mission did not arrive');
    }
    for (let it = 0; it < 120; it++) {
      await p.waitForTimeout(150);
      if (await p.$('.modal-overlay')) { await p.waitForTimeout(500); await p.click('#modal-ok'); await p.waitForTimeout(500); continue; }
      if (await p.$('.ch-title')) {
        const st = await stateOf(p);
        if (!used.delegate && st.hearts >= 3 && await p.$('#delegate') && i >= 5) { used.delegate = true; await p.click('#delegate'); await p.waitForTimeout(500); note(who, 'spent 3 to make someone else do it ✓'); continue; }
        await doChallenge(p, who, `stop ${i + 1} challenge`); continue; }
      if (!sara) {
        if (await p.$('.timeout')) { note(who, 'timeout: ' + (await p.innerText('.timeout-line')).slice(0, 60)); await p.waitForTimeout(10600); continue; }
        if (await p.$('#like')) {
          if ((i === 0 || i === 4) && !used.pass.has(i)) { used.pass.add(i); await p.click('#pass'); await p.waitForTimeout(800); continue; }
          await p.click('#like'); await p.waitForTimeout(2300); continue; }
        if (await p.$('#msg')) { await p.fill('#msg', 'hello, it is me ' + i); await p.press('#msg', 'Enter'); await p.waitForTimeout(800); continue; }
        if (await p.$('.chatpage') && !await p.$('[data-guess]')) continue; // his typing
      } else if (await p.$('.alt-card') && !await p.$('[data-guess]')) { // Sara's replacement game instead of the shop
        if (await p.$('.match-overlay')) { await p.waitForTimeout(700); continue; }
        if (await p.$('[data-piece]:not([disabled])')) { // torn pages: tap in the right order (one wrong attempt at the first one)
          if (!used.altWrong) { used.altWrong = true; const ps = await p.evaluate(() => [...document.querySelectorAll('[data-piece]')].map((b) => Number(b.dataset.piece))); const bad = [...ps].sort((a, b) => b - a); for (const v of bad) await p.click(`[data-piece="${v}"]`); await p.waitForTimeout(500); note(who, 'torn pages: wrong order, penalty'); continue; }
          const next = await p.evaluate(() => Math.min(...[...document.querySelectorAll('[data-piece]:not([disabled])')].map((b) => Number(b.dataset.piece))));
          await p.click(`[data-piece="${next}"]`); await p.waitForTimeout(450);
          continue; }
        if (await p.$('[data-alt-opt]')) {
          if (!used.altOpt) { used.altOpt = true; const bad = await p.$('[data-alt-opt][data-ok="0"]'); await bad.click(); await p.waitForTimeout(500); note(who, 'alt game: wrong answer, penalty'); continue; }
          await p.click('[data-alt-opt][data-ok="1"]'); await p.waitForTimeout(2000); continue; }
        if (await p.$('[data-pick]')) {
          if (await p.$('.cover-mock')) { await p.waitForTimeout(600); await p.click('#alt-done'); await p.waitForTimeout(2500); continue; }
          for (const g of ['t', 'a', 'g']) { if (!(await p.$(`[data-pick^="${g}:"].picked`))) { await p.click(`[data-pick="${g}:1"]`); await p.waitForTimeout(500); break; } }
          continue; }
        if (await p.$('[data-word]')) { const ws = await p.$$('[data-word]'); for (const [k, w] of ws.entries()) await w.fill('word' + k); await p.click('#alt-done'); await p.waitForTimeout(2000); continue; }
        if (await p.$('#alt-done')) { await p.click('#alt-done'); await p.waitForTimeout(2000); continue; }
      } else if (await p.$('[data-buy]') && !await p.$('[data-guess]')) {
        if (await p.$('[data-read]')) { await p.locator('[data-read]').first().click(); await p.waitForTimeout(450); continue; } // blurbs must be read out loud first
        const st = await stateOf(p);
        if (i === 6 && !used.reveal && st.hearts >= 2 && await p.$('#reveal:not([disabled])')) { used.reveal = true; await p.click('#reveal'); await p.waitForTimeout(500); note(who, 'revealed the real listing (2 🔖) ✓'); continue; }
        if (i % 3 === 0 && !used.wrongBuy.has(i)) { used.wrongBuy.add(i); const id = await p.evaluate(() => [...document.querySelectorAll('[data-buy]:not([disabled])')].map((b) => b.dataset.buy).find((x) => x !== 'real')); await p.click(`[data-buy=${id}]`); await p.waitForTimeout(700); note(who, `wrong order (${id}): ` + (await p.innerText('.modal-kicker')).trim()); continue; }
        if (!used.cancel && st.sipsStep > 0 && st.hearts >= 2 && await p.$('#cancelsips:not([disabled])')) { used.cancel = true; await p.click('#cancelsips'); await p.waitForTimeout(500); note(who, 'cancelled the sips (2 🔖) ✓'); continue; }
        await p.click('[data-buy=real]'); await p.waitForTimeout(2000); continue; }
      if (await p.$('[data-guess]')) {
        const st = await stateOf(p);
        if (i % 4 === 1 && !used.wrongGuess.has(i)) { used.wrongGuess.add(i); const wrong = await p.evaluate((n) => [...document.querySelectorAll('[data-guess]:not([disabled])')].map((b) => b.dataset.guess).find((x) => Number(x) !== n), next); await p.click(`[data-guess='${wrong}']`); await p.waitForTimeout(900); continue; }
        if (i === 2 && !used.hint && st.hearts >= 1 && await p.$('#buyhint:not([disabled])')) { used.hint = true; await p.click('#buyhint'); await p.waitForTimeout(500); note(who, 'bought a hint ✓'); continue; }
        break; }
    }
    if (!await p.$('[data-guess]')) { issue(who, `stuck before the guess at stop ${i + 1} (${DISTRICTS[d].name})`); return; }
    await p.click(`[data-guess='${next}']`); await p.waitForTimeout(500);
    const w0 = Date.now();
    for (let k = 0; k < 160 && !await p.$('#arrive'); k++) await p.waitForTimeout(250);
    if (!await p.$('#arrive')) { issue(who, `never got the next-stop screen after stop ${i + 1}`); return; }
    const waited = ((Date.now() - w0) / 1000).toFixed(1);
    const dest = await p.innerText('.dest-name');
    if (dest.trim().toLowerCase() !== DISTRICTS[next].name.toLowerCase()) issue(who, `next-stop screen says "${dest}" but the route says "${DISTRICTS[next].name}"`);
    note(who, `stop ${String(i + 1).padStart(2)} ${DISTRICTS[d].name.padEnd(13)} solved → ${DISTRICTS[next].name} (waited ${waited}s for the other, stop took ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    await p.click('#arrive'); await p.waitForTimeout(500);
  }
  // finale
  await p.waitForTimeout(1500);
  if (!await p.$('.stats')) { issue(who, 'no finale'); return; }
  const endText = strip(await p.evaluate(() => document.querySelector('.finale').innerHTML)).replace(/\s+/g, ' ').trim();
  const stats = (await p.innerText('.stats')).replace(/\n+/g, ' ');
  note(who, 'FINALE reached · ' + stats);
  fs.writeFileSync(`${OUT}/ending-${who}.txt`, endText + '\n\nSTATS: ' + stats + '\n');
  await p.screenshot({ path: `${OUT}/play-finale-${who}.png` });
  await p.click('#journal-btn'); await p.waitForTimeout(500);
  const rows = await p.locator('.journal li').count(); note(who, `journal lists ${rows} stops`);
  if (rows !== 17) issue(who, `journal has ${rows} rows, expected 17`);
}

const A = await phone('sarah'), B = await phone('sara');
const run = Promise.all([play('sarah', A), play('sara', B)]);
// host: wait until both are in the lobby, then press Start
await new Promise((r) => setTimeout(r, 9000));
const st0 = await adminCall('/status', 'GET'); note('host', `registered phones: Sarah ${st0.devices.sarah}, Sara ${st0.devices.sara}; game started: ${st0.started}`);
const g = await adminCall('/start', 'POST'); note('host', 'pressed START → ' + JSON.stringify(Object.fromEntries(Object.entries(g.result).map(([k, v]) => [k, v.sent + '/' + v.devices + ' notified']))));
await run;
const prog = await adminCall('/progress', 'GET'); note('host', `sync log: ${Object.keys(prog.steps).length} stops solved by both: ${Object.values(prog.steps).every((s) => s.sarah && s.sara)}`);
fs.writeFileSync(`${OUT}/play.log`, log.join('\n') + '\n\nISSUES:\n' + (issues.join('\n') || 'none') + '\n');
console.log('\n===== ISSUES =====\n' + (issues.join('\n') || 'none'));
await browser.close();
