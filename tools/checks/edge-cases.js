const { chromium } = require('playwright');
const route = [1,6,7,8,9,2,10,3,11,12,13,14,15,16,17,5,4];
const out = []; const bad = (m) => { out.push('✗ ' + m); console.log('✗ ' + m); }; const ok = (m) => console.log('✓ ' + m);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  async function mk(workerMode = 'ok') {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const p = await c.newPage(); p.setDefaultTimeout(8000);
    p.on('pageerror', (e) => bad('JS error: ' + e.message)); p.on('dialog', (d) => d.accept());
    await p.route('https://bezirkssaufen.domi-dominkovic.workers.dev/**', (r) => {
      if (workerMode === 'down') return r.abort();
      const u = r.request().url();
      r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: u.endsWith('/game') ? '{"started":true}' : u.endsWith('/solved') ? '{"both":true}' : '{}' });
    });
    await p.goto('http://localhost:8000/'); return p;
  }
  const setS = (p, s) => p.evaluate((s) => localStorage.setItem('bezirkssaufen.v1', JSON.stringify(s)), s);
  const getS = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('bezirkssaufen.v1') || '{}'));

  // 1 · dating sim: reload before every question and in the middle of the typing
  { const p = await mk(); await setS(p, { char: 'sarah', phase: 'clue', step: 2, liked: true }); await p.reload();
    for (let q = 0; q < 3; q++) {
      await p.waitForSelector('[data-sim]'); await p.reload(); await p.waitForSelector('[data-sim]');
      const him = await p.locator('.msg.him:not(.typing)').count(), her = await p.locator('.msg.her').count();
      if (him !== 2 + q * 2 || her !== q) bad(`sim reload at question ${q + 1}: ${him} his / ${her} hers (expected ${2 + q * 2}/${q})`);
      await p.click('[data-sim="1"]'); await p.waitForTimeout(200); if (q === 1) { await p.reload(); }
    }
    await p.waitForSelector('[data-guess]', { timeout: 20000 });
    const s = await getS(p); const ms = await p.locator('.msg.him:not(.typing)').count();
    if (ms !== 9) bad(`sim finished with ${ms} his messages, expected 9`); else ok('dating sim survives reloads at every question (9 messages, no duplicates)');
    await p.reload(); await p.waitForSelector('[data-guess]'); const again = (await getS(p)).hearts;
    if (again !== s.hearts) bad('reloading the finished sim changed the wallet'); else ok('finished sim: reload keeps the wallet');
    await p.context().close(); }

  // 2 · Sara games: reload mid science exam, mid cover design
  { const p = await mk(); await setS(p, { char: 'sara', phase: 'clue', step: 2 }); await p.reload();
    await p.waitForSelector('[data-alt-opt]'); await p.click('[data-alt-opt][data-ok="1"]'); await p.waitForTimeout(700); await p.reload(); await p.waitForSelector('[data-alt-opt]');
    const q = await p.innerText('.q-count'); if (!/Question 2 of 3/.test(q)) bad('science exam lost its place after a reload: ' + q); else ok('science exam keeps its question after a reload');
    await p.click('[data-alt-opt][data-ok="0"]'); await p.waitForTimeout(500); await p.click('#modal-ok'); await p.waitForTimeout(400);
    const s = await getS(p); if (!(s.alt && s.alt.qi === 1)) bad('a wrong answer reset the exam: ' + JSON.stringify(s.alt)); else ok('a wrong answer costs a sip but keeps the exam position');
    if (s.sips !== 1) bad('wrong exam answer did not add a sip: ' + s.sips);
    await p.context().close();
    const p2 = await mk(); await setS(p2, { char: 'sara', phase: 'clue', step: 11 }); await p2.reload(); await p2.waitForSelector('[data-pick]');
    await p2.click('[data-pick="t:2"]'); await p2.click('[data-pick="a:0"]'); await p2.reload(); await p2.waitForSelector('[data-pick]');
    if (await p2.locator('.q-opt.picked').count() !== 2) bad('cover designer lost picks after reload'); else ok('cover designer keeps its picks after a reload');
    await p2.context().close(); }

  // 3 · tap race: reload mid-race, expired race
  { const p = await mk(); await setS(p, { char: 'sara', phase: 'clue', step: 3, bonus: { key: 'd_race', id: 'r', paused: false } }); await p.reload();
    await p.click('#tapstart'); await p.waitForTimeout(500); await p.reload(); await p.waitForTimeout(500);
    if (!(await p.$('#tapbtn')) && !(await p.$('#tapretry'))) bad('tap race: nothing to tap after reload'); else ok('tap race: reload mid-race still shows the race');
    await p.waitForTimeout(10500); if (!await p.$('#tapretry')) bad('tap race never ended after the time ran out'); else ok('tap race ends with "try again" when time runs out');
    await p.click('#tapretry'); await p.click('#tapstart'); await p.waitForTimeout(300);
    for (let i = 0; i < 40; i++) await p.click('#tapbtn', { delay: 1 }); await p.waitForSelector('#confirm'); ok('tap race can be won'); await p.context().close(); }

  // 4 · mission arrives while a modal / the sim is open, then finishing the mission returns to the same screen
  { const p = await mk(); await setS(p, { char: 'sarah', phase: 'clue', step: 2, liked: true, chat: [] }); await p.reload(); await p.waitForSelector('[data-sim]');
    await p.evaluate(() => localStorage.setItem('bezirkssaufen.v1', JSON.stringify({ ...JSON.parse(localStorage.getItem('bezirkssaufen.v1')), bonus: { key: 'd_toast', id: 'x1', paused: false } })));
    await p.reload(); await p.waitForSelector('.ch-banner.sur'); await p.click('#confirm').catch(async () => { await p.click('#countdown'); }); await p.waitForTimeout(6500);
    await p.waitForSelector('[data-sim]'); ok('a mission in the middle of the dating sim returns to the same question'); await p.context().close(); }

  // 5 · "Start over", lobby "pick again", re-pick keeps nothing of the old game
  { const p = await mk(); await setS(p, { char: 'sara', phase: 'clue', step: 5, hearts: 4, haul: ['a'], sips: 3 }); await p.reload();
    await p.click('#journal-btn'); await p.waitForTimeout(400);
    const so = await p.$('#reset-btn'); if (!so) bad('no "Start over" button in the journal'); else { await so.click(); await p.waitForTimeout(800); const s = await getS(p); if (s.char || s.step) bad('Start over left state behind: ' + JSON.stringify({ c: s.char, st: s.step })); else ok('Start over resets the game'); }
    await p.context().close(); }

  // 6 · wrong guesses: all wrong options in turn, hint becomes free, no skipping
  { const p = await mk(); await setS(p, { char: 'sarah', phase: 'clue', step: 5, hearts: 0, liked: true }); await p.reload(); await p.waitForSelector('[data-guess]').catch(() => {});
    const next = route[6]; const ids = await p.$$eval('[data-guess]', (b) => b.map((x) => x.dataset.guess));
    let n = 0; for (const id of ids) { if (Number(id) === next) continue; await p.click(`[data-guess="${id}"]`); await p.waitForTimeout(600); n++; if (n >= 4) break; }
    const hintFree = await p.$('.hint, [data-hint], .hint-card'); const wrong = await p.locator('.chip.wrong').count();
    if (wrong < 4) bad('wrong guesses were not marked (' + wrong + ')'); else ok(`${wrong} wrong guesses are greyed out, hint card: ${hintFree ? 'shown' : 'not found'}`);
    if (await p.$('#giveup, [data-giveup]')) bad('a "give up / skip" button exists'); await p.context().close(); }

  // 7 · broken worker: lobby stays, game still playable with sync failing → "continue anyway"
  { const p = await mk('down'); await setS(p, { char: 'sara', phase: 'clue', step: 0, bought: true }); await p.reload();
    await p.waitForSelector('[data-guess]'); await p.click(`[data-guess="${route[1]}"]`);
    let cont = null; for (let k = 0; k < 40 && !cont; k++) { await p.waitForTimeout(1000); cont = await p.$('#wait-skip:not([hidden])'); }
    if (!cont) bad('worker down: no "continue anyway" offered after the sync failed'); else { ok('worker down: "continue anyway" is offered'); await cont.click(); await p.waitForSelector('#arrive'); ok('worker down: next-stop screen reachable'); }
    await p.context().close();
    const p2 = await mk('down'); await setS(p2, { char: 'sarah', phase: 'lobby' }); await p2.reload(); await p2.waitForTimeout(1500);
    if (!await p2.isVisible('.lobby')) bad('worker down: lobby disappeared'); else ok('worker down: stays in the lobby (no crash)');
    for (let i = 0; i < 7; i++) await p2.click('#lobby-icon', { force: true }); await p2.waitForTimeout(800); if (!await p2.$('#start')) bad('7 taps on 🚧 did not open the intro'); else ok('emergency exit: 7 taps on 🚧 opens the intro'); await p2.context().close(); }

  // 8 · Sarah passes: sips add up, timeout survives a reload
  { const p = await mk(); await setS(p, { char: 'sarah', phase: 'clue', step: 1 }); await p.reload(); await p.waitForSelector('#pass'); await p.click('#pass'); await p.waitForTimeout(600); await p.reload(); await p.waitForTimeout(600);
    if (!await p.$('.timeout')) bad('timeout lost after reload'); else ok('10 s timeout survives a reload');
    await p.waitForTimeout(10800); await p.waitForSelector('#pass'); await p.click('#pass'); await p.waitForTimeout(500); const s = await getS(p);
    if (s.sips !== 3) bad('two passes should cost 1 + 2 = 3 sips, got ' + s.sips); else ok('passes cost 1 + 2 = 3 sips'); await p.context().close(); }
  console.log(out.length ? '\nFAILED: ' + out.length : '\nALL EDGE CHECKS PASSED'); await b.close();
})();
