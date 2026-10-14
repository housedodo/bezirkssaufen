// Full two-player playthrough of the game (Sarah + Sara at the same time) against the REAL worker code, driven by the REAL
// host panel (admin.html).
//   1. python3 -m http.server 8000          (in the repo root)
//   2. NODE_PATH=$(npm root -g) node tools/playthrough.mjs /tmp/out     (needs Playwright + Chromium, see CLAUDE.md → Testing)
// The worker (worker/worker.js) runs in-process with a fake KV; Playwright routes the phones' and the host page's requests to
// it. Covered:
//   · static checks: story content (riddles/spoilers/leftovers), every challenge reachable from the admin page, no challenge
//     left on a stop, every Sara stop has a shop or a replacement game, every Sarah chat is complete, every file the two
//     service workers cache exists, worker auth;
//   · host panel: PIN, registered phones, Start, EVERY mission sent from the preset list (Sarah's 10, Sara's 15, the 9 shared
//     ones to both), "✓ Done" marks (also after a reload), a second mission while one is paused (queue), sync panel, Reset;
//   · phones: lobby, intro, all 17 stops (Sarah: pass + 10 s timeout, like, chat order hi → red flag → ask → reveal → tip;
//     Sara: 3-listing shop with read-aloud, wrong orders, the six replacement games incl. wrong answers), step sync, every
//     mission type (quiz, confirm, countdown, timer, write, notes, tap race incl. a lost race), "Not now" + pill, delegate,
//     all spending options, a reload in the middle of a chat and of a replacement game, finales and journal.
// Writes play.log, ending-*.txt and screenshots into the output folder. Takes about 10 minutes. Ends with "ISSUES: none".
import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';
import fs from 'fs';
import worker from '../worker/worker.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = process.argv[2] || '/tmp/playthrough';
fs.mkdirSync(OUT, { recursive: true });
const issues = []; const log = []; const T0 = Date.now();
const note = (who, msg) => { const l = `[${((Date.now() - T0) / 1000).toFixed(0).padStart(4)}s] ${who.padEnd(5)} ${msg}`; log.push(l); console.log(l); };
const issue = (who, msg) => { issues.push(`${who}: ${msg}`); note(who, '⚠ ISSUE: ' + msg); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── the real worker, in-process ────────────────────────────────────────────
const { privateKey } = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const kv = new Map();
const env = { ADMIN_PIN: '9999', VAPID_PUBLIC: 'x', VAPID_SUBJECT: 'mailto:a@b.c', VAPID_PRIVATE_JWK: JSON.stringify(await crypto.subtle.exportKey('jwk', privateKey)),
  KV: { get: async (k) => kv.get(k) ?? null, put: async (k, v) => void kv.set(k, v), delete: async (k) => void kv.delete(k), list: async ({ prefix }) => ({ keys: [...kv.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })) }) } };
globalThis.fetch = async () => new Response(null, { status: 201 }); // push services
const workerCall = async (p, method, body, pin = '9999') => { const r = await worker.fetch(new Request('https://w.dev' + p, { method, body: body && JSON.stringify(body), headers: { authorization: 'Bearer ' + pin } }), env); return { status: r.status, json: await r.json() }; };
const adminCall = async (p, method, body) => (await workerCall(p, method, body)).json;

// ── static checks ──────────────────────────────────────────────────────────
const vm = await import('vm');
const sandbox = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'story.js'), 'utf8') + ';globalThis.X={ROUTE,DISTRICTS,STORIES,CHALLENGES,SARA_SHOP,SARA_ALT}', sandbox);
const { ROUTE, DISTRICTS, STORIES, CHALLENGES, SARA_SHOP, SARA_ALT } = sandbox.X;
const strip = (t) => String(t).replace(/<[^>]+>/g, '');
const noEmoji = (t) => strip(t).replace(/[\p{Extended_Pictographic}️‍]/gu, '').replace(/ {2,}/g, ' ').replace(/\s+([?.!,])/g, '$1').replace(/\s+/g, ' ').trim();
for (const who of ['sarah', 'sara']) ROUTE.slice(0, -1).forEach((d, i) => {
  const st = STORIES[who].stops[d], next = DISTRICTS[ROUTE[i + 1]].name;
  if (!st.riddle) issue('lint', `${who} stop ${d} has no riddle`);
  if (!st.hint) issue('lint', `${who} stop ${d} has no hint`);
  if (!st.encounter) issue('lint', `${who} stop ${d} has no encounter`);
  if (st.riddle && new RegExp(next.replace('.', '\\.'), 'i').test(strip(st.riddle))) issue('lint', `${who} riddle of stop ${d} names the next district "${next}"`);
  if (st.encounter && new RegExp(next.replace('.', '\\.'), 'i').test(strip(st.encounter))) issue('lint', `${who} encounter of stop ${d} names the next district "${next}"`);
  if (st.event || st.intermission) issue('lint', `${who} stop ${d} still has a challenge attached (should be host-only)`);
});
const shared = Object.keys(CHALLENGES).filter((k) => CHALLENGES[k].shared);
const own = { sarah: [...STORIES.sarah.missions.intermissions, ...STORIES.sarah.missions.events], sara: [...STORIES.sara.missions.intermissions, ...STORIES.sara.missions.events] };
const reachable = new Set([...shared, ...own.sarah, ...own.sara]);
for (const k of Object.keys(CHALLENGES)) if (!reachable.has(k)) issue('lint', `challenge "${k}" cannot be sent from the admin page`);
for (const k of reachable) if (!CHALLENGES[k]) issue('lint', `admin lists unknown challenge "${k}"`);
for (const [k, c] of Object.entries(CHALLENGES)) for (const f of ['type', 'icon', 'reward', 'title', 'story']) if (c[f] == null) issue('lint', `challenge ${k} has no ${f}`);
note('lint', `missions: Sarah ${own.sarah.length}, Sara ${own.sara.length}, shared ${shared.length}`);
ROUTE.slice(0, -1).forEach((d) => {
  if (!SARA_SHOP.real[d] && !SARA_ALT[d]) issue('lint', `Sara stop ${d} has neither a shop nor a replacement game`);
  const p = STORIES.sarah.stops[d].profile;
  if (p) { const c = p.chat || {}; if (!(c.his || []).length || (c.flags || []).length !== 2 || !c.ask || !c.reveal || !p.bio) issue('lint', `Sarah's chat at ${d} (${p.name}) is incomplete`); }
});
const all = JSON.stringify([STORIES, CHALLENGES, SARA_SHOP, SARA_ALT]);
for (const bad of [/\bHerb\b/, /\bKafk\b/, /\bfat\b/i, /birthday/i, /Bezirkssaufen/i, /undefined/, /NaN/, /TODO/]) if (bad.test(all)) issue('lint', `content mentions ${bad} (${(all.match(bad) || [''])[0]})`);
for (const [f, name] of [['sw.js', 'CORE'], ['admin-sw.js', 'ADMIN_CORE']]) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const list = src.slice(src.indexOf(`const ${name} = [`), src.indexOf('];', src.indexOf(`const ${name} = [`)));
  const files = [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]).filter((x) => x !== './');
  const missing = files.filter((x) => !fs.existsSync(path.join(ROOT, x.split('?')[0])));
  if (missing.length) issue('lint', `${f} caches missing files: ${missing.join(', ')}`); else note('lint', `${f}: all ${files.length} cached files exist`);
}
for (const m of ['manifest.webmanifest', 'admin.webmanifest']) for (const ic of JSON.parse(fs.readFileSync(path.join(ROOT, m), 'utf8')).icons) if (!fs.existsSync(path.join(ROOT, ic.src))) issue('lint', `${m}: icon ${ic.src} missing`);
if ((await workerCall('/send', 'POST', { to: 'both', title: 'x' }, '0000')).status !== 401) issue('worker', '/send accepts a wrong PIN');
if ((await workerCall('/status', 'GET', null, '0000')).status !== 401) issue('worker', '/status accepts a wrong PIN');
const simOutcome = (tones) => { const n = (t) => tones.filter((x) => x === t).length; if (n('good') === 3) return 'perfect'; if (n('savage') && n('savage') + n('bad') >= 2) return 'verybad'; for (const [t, o] of [['good', 'good'], ['funny', 'funny'], ['bad', 'bad'], ['chaos', 'chaotic']]) if (n(t) >= 2) return o; return 'chaotic'; };
const SIM_D = ROUTE.find((d) => STORIES.sarah.stops[d].profile && STORIES.sarah.stops[d].profile.sim);
if (SIM_D) {
  const sim = STORIES.sarah.stops[SIM_D].profile.sim, count = {};
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 3; c++) { const o = simOutcome([sim.q1.replies[a].tone, sim.q2[a].replies[b].tone, sim.q3.replies[c].tone]); count[o] = (count[o] || 0) + 1; }
  note('lint', `dating sim (${STORIES.sarah.stops[SIM_D].profile.name}, stop ${ROUTE.indexOf(SIM_D) + 1}): 27 paths → ${JSON.stringify(count)}`);
  for (const o of ['perfect', 'good', 'funny', 'bad', 'verybad', 'chaotic']) { if (!count[o]) issue('lint', `dating sim outcome "${o}" is unreachable`); if (!sim.endings[o]) issue('lint', `dating sim has no ending "${o}"`); }
} else issue('lint', 'no dating-sim chat found');
note('lint', 'static checks done');

// ── browsers ───────────────────────────────────────────────────────────────
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
async function routeWorker(ctx) {
  await ctx.route('https://bezirkssaufen.domi-dominkovic.workers.dev/**', async (r) => {
    const q = r.request();
    const res = await worker.fetch(new Request(q.url(), { method: q.method(), headers: q.headers(), body: ['GET', 'HEAD'].includes(q.method()) ? undefined : q.postData() }), env);
    r.fulfill({ status: res.status, headers: Object.fromEntries(res.headers), body: await res.text() });
  });
}
async function phone(who) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await ctx.addInitScript((w) => {
    Object.defineProperty(Notification, 'permission', { get: () => 'granted' });
    Object.defineProperty(navigator.serviceWorker, 'ready', { value: Promise.resolve({ pushManager: { getSubscription: async () => ({ endpoint: 'https://push.test/' + w, toJSON: () => ({ endpoint: 'https://push.test/' + w, keys: {} }) }) } }) });
  }, who);
  await routeWorker(ctx);
  const p = await ctx.newPage();
  p.setDefaultTimeout(6000);
  p.on('pageerror', (e) => issue(who, 'JS error: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|fonts/.test(m.text())) issue(who, 'console error: ' + m.text().slice(0, 140)); });
  p.on('dialog', (d) => d.accept());
  return p;
}
const stateOf = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('bezirkssaufen.v1') || '{}'));
const shortTimers = (p) => p.evaluate(() => { for (const k of Object.keys(CHALLENGES)) if (['timer', 'write'].includes(CHALLENGES[k].type)) CHALLENGES[k].seconds = 1; });

// ── the host: real admin.html ──────────────────────────────────────────────
const hctx = await browser.newContext({ viewport: { width: 420, height: 900 }, serviceWorkers: 'block' });
await routeWorker(hctx);
const H = await hctx.newPage();
H.on('pageerror', (e) => issue('host', 'JS error: ' + e.message));
H.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|fonts/.test(m.text())) issue('host', 'console error: ' + m.text().slice(0, 140)); });
H.on('dialog', (d) => d.accept());
async function hostOpen() {
  await H.goto('http://localhost:8000/admin.html');
  if (await H.isVisible('#pin')) { await H.fill('#pin', '9999'); await H.dispatchEvent('#pin', 'change'); }
  await H.waitForTimeout(800);
}
let hostChain = Promise.resolve();
const hostDo = (fn) => (hostChain = hostChain.then(fn, fn));
const sentLog = [];
async function hostSend(to, key) {
  await H.click(`[data-to=${to}]`); await H.waitForTimeout(150);
  const btn = H.locator(`.mission[data-key="${key}"]`);
  if (!await btn.count()) { issue('host', `mission ${key} is not in the list for ${to}`); return false; }
  await btn.click();
  for (let k = 0; k < 30 && !await H.$(`.mission.sent[data-key="${key}"]`); k++) await H.waitForTimeout(150);
  if (!await H.$(`.mission.sent[data-key="${key}"]`)) { issue('host', `mission ${key} → ${to} was not marked as done`); return false; }
  sentLog.push([to, key]);
  note('host', `sent ${CHALLENGES[key].icon} ${CHALLENGES[key].title} → ${to} (marked ✓ Done)`);
  return true;
}

// ── shared phone helpers ───────────────────────────────────────────────────
const P = {}; // who → page
const st8 = {}; // who → { step, finished }
const flashWait = async (p) => { if (await p.$('.match-overlay')) await p.waitForTimeout(1900); };
const pump = (p) => p.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); // asks the worker's inbox
const flags = { lostRace: new Set(), delegated: false, paused: false };
const done = { sarah: [], sara: [] }; // mission keys finished on each phone

async function doMission(p, who) {
  const st = await stateOf(p);
  const key = st.bonus && st.bonus.key;
  const c = CHALLENGES[key];
  if (!c) { issue(who, 'mission screen without a known key'); return; }
  // "Not now" once (Sara): pause, check the pill, a second mission is queued meanwhile (host side), then resume
  if (who === 'sara' && !flags.paused && own.sara.includes(key)) {
    flags.paused = true;
    await p.click('#later'); await p.waitForTimeout(400);
    if (!await p.isVisible('#mission-pill')) issue(who, 'no 🎯 pill after "Not now"'); else note(who, `paused "${c.title}" with Not now → 🎯 pill ✓`);
    pauseHold.resolve(); await pauseHold.queued; // host sends the next one now
    await pump(p); await p.waitForTimeout(800);
    const s2 = await stateOf(p);
    if (!(s2.mq || []).length) issue(who, 'second mission was not queued while the first was paused'); else note(who, `second mission queued while paused (${s2.mq[0].key}) ✓`);
    await p.click('#mission-pill'); await p.waitForTimeout(400);
    if (!await p.$('.ch-banner.sur')) issue(who, 'pill did not reopen the mission');
  }
  // delegate once (Sarah), if she can afford it
  if (who === 'sarah' && !flags.delegated && st.hearts >= 3 && !['write', 'notes'].includes(c.type) && await p.$('#delegate:not([disabled])')) {
    flags.delegated = true;
    await p.click('#delegate'); await p.waitForTimeout(400); await p.click('#delegdone'); await p.waitForTimeout(700);
    const s2 = await stateOf(p);
    if (s2.hearts !== st.hearts - 3 || !(s2.missions || []).includes(st.bonus.id)) issue(who, 'delegating a mission did not cost 3 / finish it');
    else note(who, `🎭 paid 3 ❤️ to make someone else do "${c.title}" ✓`);
    done[who].push(key); return;
  }
  note(who, `mission "${c.title}" (${c.type})`);
  for (let k = 0; k < 80; k++) {
    if (!await p.$('.ch-banner.sur')) break;
    if ((await stateOf(p)).bonus?.key !== key) break; // finished, the next queued mission is showing
    if (await p.$('.match-overlay')) { await p.waitForTimeout(400); continue; }
    if (await p.$('.q-opt:not([disabled])')) { await p.locator('.q-opt:not([disabled])').first().click(); await p.waitForTimeout(650); await flashWait(p); }
    else if (await p.$('#bio')) { await p.fill('#bio', who + ' was here, lovely evening'); await p.click('#startclock').catch(() => {}); await p.click('#confirm'); await p.waitForTimeout(1900); }
    else if (await p.$('[data-note]')) { for (const t of await p.$$('[data-note]')) await t.fill('absolutely great'); await p.click('#confirm'); await p.waitForTimeout(1900); }
    else if (await p.$('#tapstart')) { await p.click('#tapstart'); await p.waitForTimeout(300); }
    else if (await p.$('#tapbtn')) {
      const lose = !flags.lostRace.has(who); flags.lostRace.add(who);
      for (let t = 0; t < (lose ? 6 : CHALLENGES[key].goal); t++) await p.click('#tapbtn', { delay: 1 });
      if (lose) { await p.waitForTimeout(10600); if (!await p.$('#tapretry')) issue(who, 'lost race shows no "try again"'); else note(who, 'race lost on purpose → try again ✓'); }
      else await p.waitForTimeout(400);
    }
    else if (await p.$('#tapretry')) { await p.click('#tapretry'); await p.waitForTimeout(300); }
    else if (await p.$('#startclock')) { await p.click('#startclock'); await p.waitForTimeout(1600); await p.click('#confirm'); await p.waitForTimeout(1900); }
    else if (await p.$('#countdown')) { await p.click('#countdown'); await p.waitForTimeout(5800); }
    else if (await p.$('#confirm')) { await p.click('#confirm'); await p.waitForTimeout(1900); }
    else await p.waitForTimeout(300);
  }
  if ((await stateOf(p)).bonus?.key === key) issue(who, `mission "${c.title}" never finished`);
  else done[who].push(key);
}
// everything that can interrupt a phone at any moment: modals and host missions
async function service(p, who) {
  if (await p.$('.modal-overlay')) { await p.waitForTimeout(400); await p.click('#modal-ok').catch(() => {}); await p.waitForTimeout(400); return true; }
  if (await p.$('.ch-title')) {
    if (!await p.$('.ch-banner.sur')) issue(who, 'a challenge appeared on a stop by itself (should be host-only)');
    await doMission(p, who); return true;
  }
  return false;
}

// ── a phone's whole game ───────────────────────────────────────────────────
async function play(who, p) {
  const sara = who === 'sara';
  const used = { pass: false, wrongBuy: 0, hint: false, cancel: false, reveal: false, wrongGuess: 0, altWrong: new Set(), reloaded: false };
  st8[who] = { step: -1 };
  await p.goto('http://localhost:8000'); await shortTimers(p);
  note(who, 'opened the app'); await p.click(`[data-pick=${who}]`); await p.waitForTimeout(1200);
  if (!await p.isVisible('.lobby')) issue(who, 'no lobby after choosing a name'); else note(who, 'lobby: "Under construction" ✓');
  for (let k = 0; k < 120 && !await p.$('#start'); k++) await p.waitForTimeout(500);
  if (!await p.$('#start')) { issue(who, 'lobby never unlocked'); return; }
  const introWords = (await p.innerText('.story')).split(/\s+/).length; note(who, `intro unlocked, story = ${introWords} words`);
  await p.click('#introhint'); await p.click('#start'); await p.waitForTimeout(600);

  for (let i = 0; i < ROUTE.length - 1; i++) {
    const d = ROUTE[i], next = ROUTE[i + 1];
    st8[who].step = i;
    const t0 = Date.now();
    let checkedScreen = false, chatChecked = false;
    for (let it = 0; it < 400; it++) {
      try {
        await p.waitForTimeout(150);
        if (it % 4 === 0) await pump(p);
        if (await service(p, who)) continue;
        const st = await stateOf(p);
        if (!sara) {
          if (await p.$('.timeout')) { note(who, 'pass → 10 s timeout: ' + (await p.innerText('.timeout-line')).slice(0, 60)); await p.waitForTimeout(10600); continue; }
          if (await p.$('#like')) {
            if (i === 0 && !used.pass) { used.pass = true; await p.click('#pass'); await p.waitForTimeout(800); continue; }
            await p.click('#like'); await p.waitForTimeout(2300); continue; }
          if (await p.$('[data-sim]')) { const n = await p.locator('.msg.her').count(); const pick = [2, 1, 1][n]; await p.click(`[data-sim="${pick}"]`); await p.waitForTimeout(500); continue; }
          if (await p.$('#msg')) {
            // reload in the middle of a chat once: it must continue where it was
            if (i === 3 && !used.reloaded) { used.reloaded = true; const before = await p.locator('.msg').count(); await p.reload(); await shortTimers(p); await p.waitForTimeout(900); const after = await p.locator('.msg').count(); if (after < before - 1) issue(who, `reload lost chat messages (${before} → ${after})`); else note(who, `reloaded mid-chat, ${after} messages kept ✓`); continue; }
            await p.fill('#msg', 'hello, it is me ' + i); await p.press('#msg', 'Enter'); await p.waitForTimeout(700); continue; }
          if (await p.$('.chatpage') && !await p.$('[data-guess]')) continue; // he is typing
          if (await p.$('.chatpage') && !chatChecked && STORIES.sarah.stops[d].profile?.sim) {
            chatChecked = true;
            const his = await p.locator('.msg.him:not(.typing)').count(), hers = await p.locator('.msg.her').count();
            const badge = (await p.innerText('.sim-out').catch(() => '')).trim();
            const s2 = await stateOf(p);
            if (his !== 9 || hers !== 3 || !/Very bad date/.test(badge) || s2.simResult !== STORIES.sarah.stops[d].profile.name + ': 💀 Very bad date') issue(who, `dating sim: ${his} his / ${hers} hers, badge "${badge}", result "${s2.simResult}"`);
            else note(who, `dating sim with ${STORIES.sarah.stops[d].profile.name}: 3 questions answered (savage, savage, bad) → "${badge}" ✓`);
          }
          if (await p.$('.chatpage') && !chatChecked && STORIES.sarah.stops[d].profile) { // chat complete: check the order of his messages
            chatChecked = true;
            const prof = STORIES.sarah.stops[d].profile, c = prof.chat;
            const his = (await p.$$eval('.msg.him:not(.typing) span', (els) => els.map((e) => e.innerText))).map((t) => t.replace(/\s+/g, ' ').trim());
            const hers = await p.locator('.msg.her').count();
            const exp = [c.his.map(noEmoji), c.flags.map(noEmoji), [noEmoji(c.ask)], [noEmoji(c.reveal)], [noEmoji(prof.bio)]];
            const ok = his.length === 5 && hers === 3 && his.every((t, k) => exp[k].includes(t));
            if (!ok) issue(who, `chat with ${prof.name}: unexpected messages (${his.length} his, ${hers} hers): ${JSON.stringify(his).slice(0, 200)}`);
            else note(who, `chat with ${prof.name}: hi → red flag → hockey question → reveal → tip ✓ (“${his[0].slice(0, 40)}” / “${his[1].slice(0, 50)}”)`);
            if (his.some((t) => /\p{Extended_Pictographic}/u.test(t))) issue(who, `chat with ${prof.name} contains emoji`);
          }
        } else {
          if (!checkedScreen && (await p.$('.alt-card') || await p.$('.offer'))) {
            checkedScreen = true;
            if (SARA_ALT[d] && !await p.$('.alt-card')) issue(who, `stop ${i + 1}: expected the ${SARA_ALT[d].title} game, got the shop`);
            if (!SARA_ALT[d] && await p.$('.alt-card')) issue(who, `stop ${i + 1}: unexpected replacement game`);
            if (!SARA_ALT[d]) { const n = await p.locator('.offer').count(); if (n !== 3) issue(who, `shop at stop ${i + 1} shows ${n} listings, expected 3`); if (!await p.$('[data-buy=real][disabled]')) issue(who, `shop at stop ${i + 1}: buy is not locked before reading`); }
            note(who, `stop ${i + 1}: ${SARA_ALT[d] ? 'game ' + SARA_ALT[d].icon + ' ' + SARA_ALT[d].title : 'Bookbazaar, 3 listings, buying locked until read'} ✓`);
          }
          if (await p.$('.alt-card') && !await p.$('[data-guess]')) {
            if (await p.$('.match-overlay')) { await p.waitForTimeout(700); continue; }
            if (!used.cancel && st.sipsStep > 0 && st.hearts >= 2 && await p.$('#cancelsips:not([disabled])')) { used.cancel = true; await p.click('#cancelsips'); await p.waitForTimeout(500); note(who, 'cancelled the sips (2 🔖) ✓'); continue; }
            if (await p.$('[data-alt-opt]')) {
              if (!used.altWrong.has(d)) {
                used.altWrong.add(d);
                await p.click('[data-alt-opt][data-ok="0"]'); await p.waitForTimeout(600);
                const msg = await p.$('.modal-overlay') ? (await p.innerText('.soldout-msg')).slice(0, 70) : '';
                note(who, `${SARA_ALT[d].title}: wrong answer → “${msg}”`);
                if (d === 12) { await p.click('#modal-ok'); await p.waitForTimeout(400); await p.reload(); await shortTimers(p); await p.waitForTimeout(900); if (!await p.$('.alt-card') && !await p.$('.ch-banner.sur')) issue(who, 'reload lost the replacement game'); else note(who, 'reloaded mid-game, still at the postcards ✓'); }
                continue; }
              await p.click('[data-alt-opt][data-ok="1"]'); await p.waitForTimeout(900); continue; }
            if (await p.$('[data-pick]')) {
              if (await p.$('.cover-mock')) { await p.waitForTimeout(500); await p.click('#alt-done'); await p.waitForTimeout(800); continue; }
              for (const g of ['t', 'a', 'g']) if (!await p.$(`[data-pick^="${g}:"].picked`)) { await p.click(`[data-pick="${g}:1"]`); await p.waitForTimeout(400); break; }
              continue; }
            if (await p.$('[data-word]')) {
              await p.click('#alt-done'); await p.waitForTimeout(400); // empty: must refuse
              if (!await p.$('[data-word]')) issue(who, 'ask a stranger accepted empty words');
              const ws = await p.$$('[data-word]'); for (const [k, w] of ws.entries()) await w.fill('word' + k); await p.click('#alt-done'); await p.waitForTimeout(900); continue; }
            if (await p.$('#alt-done')) { await p.click('#alt-done'); await p.waitForTimeout(900); continue; }
          }
          if (await p.$('[data-buy]') && !await p.$('[data-guess]')) {
            if (await p.$('[data-read]')) { await p.locator('[data-read]').first().click(); await p.waitForTimeout(450); continue; }
            if (!used.reveal && st.hearts >= 2 && await p.$('#reveal:not([disabled])')) { used.reveal = true; await p.click('#reveal'); await p.waitForTimeout(500); if (!await p.$('.offer.revealed')) issue(who, 'reveal did not mark a listing'); else note(who, 'revealed the real listing (2 🔖) ✓'); continue; }
            if (i % 3 === 0 && used.wrongBuy < 4 && !st.shopWrong.length) { used.wrongBuy++; const id = await p.evaluate(() => [...document.querySelectorAll('[data-buy]:not([disabled])')].map((b) => b.dataset.buy).find((x) => x !== 'real')); await p.click(`[data-buy=${id}]`); await p.waitForTimeout(700); note(who, `wrong order (${id}): ` + (await p.innerText('.modal-kicker')).trim()); continue; }
            if (!used.cancel && st.sipsStep > 0 && st.hearts >= 2 && await p.$('#cancelsips:not([disabled])')) { used.cancel = true; await p.click('#cancelsips'); await p.waitForTimeout(500); note(who, 'cancelled the sips (2 🔖) ✓'); continue; }
            await p.click('[data-buy=real]'); await p.waitForTimeout(2000); continue; }
        }
        if (await p.$('[data-guess]')) {
          if (i % 4 === 1 && used.wrongGuess < 4 && !st.wrong.length) { used.wrongGuess++; const wrong = await p.evaluate((n) => [...document.querySelectorAll('[data-guess]:not([disabled])')].map((b) => b.dataset.guess).find((x) => Number(x) !== n), next); await p.click(`[data-guess='${wrong}']`); await p.waitForTimeout(900); continue; }
          if (!used.hint && i >= 2 && st.hearts >= 1 && await p.$('#buyhint:not([disabled])')) { used.hint = true; await p.click('#buyhint'); await p.waitForTimeout(500); note(who, 'bought a hint ✓'); continue; }
          break; }
      } catch (e) { if (e.name !== 'TimeoutError') throw e; note(who, 'a click lost its target (something popped up), retrying'); continue; }
    }
    if (!await p.$('[data-guess]')) { issue(who, `stuck before the guess at stop ${i + 1} (${DISTRICTS[d].name})`); await p.screenshot({ path: `${OUT}/stuck-${who}.png` }); return; }
    await p.click(`[data-guess='${next}']`); await p.waitForTimeout(500);
    const w0 = Date.now();
    for (let k = 0; k < 400 && !await p.$('#arrive'); k++) { await p.waitForTimeout(250); if (k % 4 === 0) await pump(p); await service(p, who); }
    if (!await p.$('#arrive')) { issue(who, `never got the next-stop screen after stop ${i + 1}`); return; }
    const dest = await p.innerText('.dest-name');
    if (dest.trim().toLowerCase() !== DISTRICTS[next].name.toLowerCase()) issue(who, `next-stop screen says "${dest}" but the route says "${DISTRICTS[next].name}"`);
    note(who, `stop ${String(i + 1).padStart(2)} ${DISTRICTS[d].name.padEnd(13)} solved → ${DISTRICTS[next].name} (waited ${((Date.now() - w0) / 1000).toFixed(1)}s, stop took ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    await p.click('#arrive'); await p.waitForTimeout(500);
  }
  st8[who].step = ROUTE.length - 1;
  // missions can still arrive at the finale: keep serving until the host is done
  while (!hostFinished) { await pump(p); await service(p, who); await p.waitForTimeout(400); }
  for (let k = 0; k < 10; k++) { await pump(p); if (!await service(p, who)) break; }
  await p.waitForTimeout(1500);
  if (!await p.$('.stats')) { issue(who, 'no finale'); return; }
  const endText = strip(await p.evaluate(() => document.querySelector('.screen.done').innerHTML)).replace(/\s+/g, ' ').trim();
  const stats = (await p.innerText('.stats')).replace(/\n+/g, ' ');
  note(who, 'FINALE · ' + stats);
  if (sara && !/word0 · word1 · word2/.test(endText)) issue(who, 'finale does not show the stranger words');
  if (!sara && !/was here, lovely evening/.test(endText)) issue(who, 'finale does not show the crew-written bio');
  if (!sara && !/Very bad date/.test(endText)) issue(who, 'finale does not show the dating-sim result');
  fs.writeFileSync(`${OUT}/ending-${who}.txt`, endText + '\n\nSTATS: ' + stats + '\n');
  await p.screenshot({ path: `${OUT}/finale-${who}.png`, fullPage: true });
  const s = await stateOf(p);
  if (!used.hint) issue(who, 'never managed to buy a hint');
  if (sara && !used.reveal) issue(who, 'never managed to reveal a listing');
  if (sara && !used.cancel) issue(who, 'never managed to cancel sips');
  if (!sara && !flags.delegated) issue(who, 'never managed to delegate a mission');
  note(who, `wallet: earned ${s.earned}, left ${s.hearts}, sips ${s.sips}, missions done ${s.missions.length}${sara ? `, haul ${s.haul.length}, words ${s.words.join('/')}` : ''}`);
  await p.click('#journal-btn'); await p.waitForTimeout(500);
  const rows = await p.locator('.journal li').count(); note(who, `journal lists ${rows} stops`);
  if (rows !== 17) issue(who, `journal has ${rows} rows, expected 17`);
}

// ── the host's plan: every mission once, spread over the evening ──────────
let hostFinished = false;
let pauseHold = {}; pauseHold.wait = new Promise((r) => (pauseHold.resolve = r)); pauseHold.queued = new Promise((r) => (pauseHold.release = r));
const plan = [];
own.sarah.forEach((k, j) => plan.push({ to: 'sarah', key: k, at: 1 + j }));
own.sara.forEach((k, j) => plan.push({ to: 'sara', key: k, at: Math.min(1 + j, 15) }));
shared.forEach((k, j) => plan.push({ to: 'both', key: k, at: 2 + Math.floor(j * 1.6) }));
plan.sort((a, b) => a.at - b.at || (a.to === 'both') - (b.to === 'both'));
const targets = (to) => (to === 'both' ? ['sarah', 'sara'] : [to]);
const free = async (w) => { const s = await stateOf(P[w]); return !s.bonus && !(s.mq || []).length; };
async function host() {
  await hostOpen();
  // wait until both phones are registered and in the lobby
  for (let k = 0; k < 60; k++) { const s = await adminCall('/status', 'GET'); if (s.devices.sarah && s.devices.sara) break; await sleep(500); }
  const statusText = await H.innerText('#status'); note('host', 'admin page: ' + statusText.trim());
  await sleep(5500);
  const st2 = (await H.innerText('#status')).replace(/\s+/g, ' ');
  if (!/Sarah 1/.test(st2) || !/Sara 1/.test(st2)) issue('host', 'admin page does not refresh the registered phones by itself'); else note('host', 'admin page refreshed by itself: ' + st2.trim() + ' ✓');
  await H.click('#startgame'); await H.waitForTimeout(800);
  note('host', 'pressed 🚀 Start → ' + (await H.innerText('#gamestatus')).trim() + ' · ' + (await H.innerText('#log')).split('\n')[0]);
  const sendItem = async (item) => { if (item.sent) return; item.sent = true; await hostDo(() => hostSend(item.to, item.key)); };
  (async () => { await pauseHold.wait; await sleep(500); const item = plan.find((x) => x.to === 'sara' && !x.sent); note('host', 'Sara paused a mission → sending her next one now'); await sendItem(item); pauseHold.release(); })();
  for (const item of plan) {
    // wait for the phones to reach the stop and to be free (one mission at a time, the inbox only keeps the latest)
    for (let k = 0; ; k++) {
      const ok = (await Promise.all(targets(item.to).map(async (w) => st8[w].step >= item.at && await free(w)))).every(Boolean);
      if (ok || item.sent) break;
      if (k > 900) { issue('host', `phones never became free for ${item.key}`); break; }
      await sleep(200);
    }
    if (item.sent) continue;
    await sendItem(item);
    await sleep(600);
  }
  // wait until everything sent was finished
  for (let k = 0; k < 600; k++) { if ((await Promise.all(['sarah', 'sara'].map(free))).every(Boolean) && st8.sarah.step >= 16 && st8.sara.step >= 16) break; await sleep(500); }
  hostFinished = true;
}

P.sarah = await phone('sarah'); P.sara = await phone('sara');
await Promise.all([play('sarah', P.sarah), play('sara', P.sara), host()]);

// ── after the game: the host panel ─────────────────────────────────────────
for (const w of ['sarah', 'sara']) {
  const expect = [...own[w], ...shared];
  const missing = expect.filter((k) => !done[w].includes(k));
  if (missing.length) issue(w, `missions never done: ${missing.join(', ')}`); else note(w, `all ${expect.length} missions done ✓`);
}
// a phone WITHOUT notifications (never allowed, or the subscription got lost): an open app must still get the mission
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await routeWorker(ctx);
  const q = await ctx.newPage();
  q.on('pageerror', (e) => issue('nopush', 'JS error: ' + e.message));
  await q.goto('http://localhost:8000');
  await q.evaluate(() => localStorage.setItem('bezirkssaufen.v1', JSON.stringify({ char: 'sara', phase: 'clue', step: 4 })));
  await q.reload(); await q.waitForTimeout(1500);
  await adminCall('/send', 'POST', { to: 'sara', title: 'test', body: 'x', ch: 's_nap' });
  let got = false;
  for (let k = 0; k < 40 && !got; k++) { await q.waitForTimeout(500); got = !!await q.$('.ch-banner.sur'); }
  if (!got) issue('nopush', 'an open app without notifications did not get the mission'); else note('nopush', 'phone without notifications: mission appeared within 20 s while the app was open ✓');
  await ctx.close();
}
const ver = (await workerCall('/version', 'GET')).json.version;
const adminWants = Number((fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8').match(/WORKER_VERSION = (\d+)/) || [])[1]);
if (ver !== adminWants) issue('worker', `worker.js says version ${ver}, admin.html expects ${adminWants}`);
await hostOpen();
for (const to of ['sarah', 'sara', 'both']) {
  await H.click(`[data-to=${to}]`); await H.waitForTimeout(200);
  const total = await H.locator('.mission').count(), marked = await H.locator('.mission.sent').count();
  note('host', `after reload, ${to}: ${marked}/${total} missions marked ✓ Done`);
  if (marked !== total) issue('host', `${to}: only ${marked}/${total} marked as done after a reload`);
}
const prog = await adminCall('/progress', 'GET');
note('host', `sync: ${Object.keys(prog.steps).length} stops solved by both: ${Object.values(prog.steps).every((s) => s.sarah && s.sara)}`);
await H.screenshot({ path: `${OUT}/admin.png`, fullPage: true });
await H.evaluate(() => { document.querySelector('#reset').closest('details').open = true; }); await H.click('#reset'); await H.waitForTimeout(800);
const after = await adminCall('/status', 'GET');
await H.click('[data-to=sara]'); await H.waitForTimeout(200);
const inboxAfter = (await workerCall('/inbox', 'POST', { endpoint: 'https://push.test/sara' })).json;
if ((inboxAfter.recent || []).length || inboxAfter.ch) issue('host', 'Reset left old missions in the inbox');
if (after.started || await H.locator('.mission.sent').count()) issue('host', 'Reset did not clear the game / the done marks'); else note('host', 'Reset: game back to "not started", done marks cleared ✓');
fs.writeFileSync(`${OUT}/play.log`, log.join('\n') + '\n\nISSUES:\n' + (issues.join('\n') || 'none') + '\n');
console.log('\n===== ISSUES =====\n' + (issues.join('\n') || 'none'));
await browser.close();
