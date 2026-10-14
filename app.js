// ─────────────────────────────────────────────────────────────
//  BEZIRKSSAUFEN — app logic (no framework, no build step)
//  Story content lives in story.js.
// ─────────────────────────────────────────────────────────────
(() => {
  "use strict";

  const STORE_KEY = "bezirkssaufen.v1";
  const TOTAL = ROUTE.length;

  const $ = (sel) => document.querySelector(sel);
  const app = $("#app");
  let tick = null; // interval for countdown timers

  // ── State ──────────────────────────────────────────────────
  const fresh = () => ({
    char: null,      // "sarah" | "sara"
    phase: "pick",   // pick | lobby | intro | clue | travel | done
    step: 0,         // index into ROUTE of the district they are in
    wrong: [],       // wrong district ids guessed at the current step
    hint: false,     // hint revealed at the current step
    log: [],         // [{ d, wrong, hint, gaveUp }] for finished steps
    // dating story (Sarah)
    liked: false,    // profile at the current step was liked
    passes: 0,       // passes on the current profile
    evDone: false,   // event challenge at the current step done
    imDone: false,   // intermission at the current step done
    ch: {},          // progress inside the current challenge
    hearts: 0,       // wallet: ❤️/🔖 earned through challenges minus what was spent (COSTS in story.js)
    earned: 0,       // total ever earned (finale stat)
    sipsStep: 0,     // penalty sips added at the current stop (what "cancel" removes)
    revealed: false, // Sara: real listing revealed at the current stop
    waiting: false,  // solved this stop, waiting for the other phone (step sync)
    sips: 0,         // penalty sips for passing
    myBio: "",       // profile written by the crew
    superLikes: [],  // super likes written by the crew
    // surprise missions sent by the host (notification → challenge)
    bonus: null,     // { key, id, paused } mission waiting / in progress
    bch: {},         // progress inside the surprise mission (separate from `ch`)
    missions: [],    // ids of surprise missions already done
    // book story (Sara)
    bought: false,   // the right listing was bought at the current step
    shopWrong: [],   // titles of dark romances bought by mistake at the current step
    haul: [],        // all dark romances bought by mistake (whole game)
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return { ...fresh(), ...JSON.parse(raw) };
    } catch (_) { /* private mode etc. */ }
    return fresh();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
  }
  function set(patch) {
    state = { ...state, ...patch };
    save();
    render();
  }
  let chMode = "event"; // set by renderChallenge: "surprise" keeps its progress in `bch`, everything else in `ch`
  const chKey = () => (chMode === "surprise" ? "bch" : "ch");
  const chNow = () => state[chKey()] || {};
  const setCh = (patch) => set({ [chKey()]: { ...chNow(), ...patch } });

  // ── Helpers ────────────────────────────────────────────────
  const story = () => STORIES[state.char];
  const isDating = () => state.char && story().theme === "dating";
  const here = () => ROUTE[state.step];
  const unit = () => (isDating() ? "❤️" : "🔖"); // reward icon (stored in state.hearts)
  const can = (cost) => state.hearts >= cost;
  // Step sync: both phones must have solved the current stop before either continues (needs the worker, see worker/README.md).
  const syncOn = () => typeof PUSH !== "undefined" && !!PUSH.workerUrl && PUSH.syncSteps !== false;
  let pollT = null;
  // Lobby: until the host presses "Start game" a phone that picked a name only shows "Under construction".
  const lobbyOn = () => typeof PUSH !== "undefined" && !!PUSH.workerUrl && PUSH.lobby !== false;
  let lobbyT = null, lobbyL = null, lobbyCheckNow = null, introHint = false;
  // Sara's Bookbazaar: the stop has a shop page that must be cleared before the riddle.
  const shopAt = (id) => !isDating() && typeof SARA_SHOP !== "undefined" && !!SARA_SHOP.real[id];
  const hasShop = () => shopAt(here());
  const next = () => ROUTE[state.step + 1];
  const label = (id) => `${DISTRICTS[id].roman} · ${DISTRICTS[id].name}`;
  const paras = (text) =>
    text.trim().split(/\n\s*\n/).map((p) => `<p>${p.trim()}</p>`).join("");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const stopInfo = (id) => (typeof STOPS !== "undefined" && STOPS[id]) || null;
  const mapsUrl = (id) => {
    const s = stopInfo(id);
    const q = s && s.venue && !/wherever/i.test(s.venue)
      ? `${s.venue}, ${DISTRICTS[id].name}, Graz`
      : `Graz ${DISTRICTS[id].name}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  };
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };
  const mmss = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const ICON_PIN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"></path><circle cx="12" cy="9" r="2.5"></circle></svg>`;
  const ICON_X = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>`;
  const ICON_HEART = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21l-8.5-8.6A5 5 0 0 1 12 5.6a5 5 0 0 1 8.5 6.8z"></path></svg>`;

  function toast(html, ms = 2600) {
    const t = $("#toast");
    t.innerHTML = html;
    t.hidden = false;
    t.classList.remove("show");
    void t.offsetWidth;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.classList.remove("show"); t.hidden = true; }, ms);
  }

  // Full-screen flash (match, boost, countdown).
  function flash(html, ms, cls = "") {
    return new Promise((resolve) => {
      const o = document.createElement("div");
      o.className = `match-overlay ${cls}`;
      o.setAttribute("role", "status");
      o.innerHTML = `<div class="match-inner">${html}</div>`;
      document.body.appendChild(o);
      requestAnimationFrame(() => o.classList.add("show"));
      setTimeout(() => {
        o.classList.remove("show");
        setTimeout(() => { o.remove(); resolve(); }, 280);
      }, ms);
    });
  }

  // ── Chrome (top bar, progress) ─────────────────────────────
  function renderChrome() {
    const inGame = state.char && state.phase !== "pick" && state.phase !== "lobby";
    document.body.dataset.theme = state.char ? story().theme : "night";
    $("#topbar").hidden = !inGame;
    $("#mission-pill").hidden = !(inGame && state.phase !== "intro" && state.bonus && state.bonus.paused);
    $("#progress").hidden = !inGame || state.phase === "intro";
    if (!inGame) return;

    $("#topbar-story").textContent = isDating()
      ? (story().app || story().title)
      : `${story().name} · ${story().title}`;
    const arrived = state.phase === "intro" ? 0 : state.step + 1;
    $("#topbar-count").textContent =
      state.phase === "intro" ? "Ready?" : `District ${arrived} of ${TOTAL}`;
    $("#drinks").textContent = !arrived ? ""
      : isDating() ? `🍻 ${arrived} · ❤️ ${state.hearts}`
      : `🍻 ${arrived} · 🔖 ${state.hearts}${state.haul.length ? ` · 🌶️ ${state.haul.length}` : ""}`;

    $("#progress").innerHTML = ROUTE.map((d, i) => {
      const cls = i < state.step || state.phase === "done" ? "done"
        : i === state.step ? "now" : "";
      return `<span class="seg ${cls}" title="${i <= state.step ? DISTRICTS[d].name : "?"}"></span>`;
    }).join("");
  }

  // ── Mission alerts (Web Push) ──────────────────────────────
  // Needs push-config.js to be filled in (see worker/README.md). Otherwise everything here stays hidden.
  const pushCfg = () => (typeof PUSH !== "undefined" && PUSH.workerUrl && PUSH.vapidPublicKey ? PUSH : null);
  const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const isStandalone = () => window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  const keyBytes = (b64) => {
    const raw = atob(b64.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64.length / 4) * 4, "="));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  };

  async function sendSubscription(sub) {
    const r = await fetch(`${pushCfg().workerUrl}/subscribe`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ who: state.char, sub: sub.toJSON() }),
    });
    if (!r.ok) throw new Error("subscribe failed");
  }
  async function enablePush() {
    if (await Notification.requestPermission() !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(pushCfg().vapidPublicKey) }));
    await sendSubscription(sub);
  }
  // Quietly re-register on every start (subscriptions can change); also tells the worker which player this phone is.
  async function pushSync() {
    try {
      if (!pushCfg() || !pushSupported() || !state.char || Notification.permission !== "granted") return;
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) await sendSubscription(sub);
    } catch (_) {}
  }

  // Fills `el` with the right state: add to home screen / turn on / on / blocked.
  async function fillPush(el) {
    if (!el || !pushCfg() || !state.char) return;
    let html;
    if (!pushSupported() || !isStandalone()) {
      html = `<p><b>🔔 Mission alerts</b></p>
        <p class="push-note">Your host can send you surprise missions. On iPhone this only works from the home screen:
        tap <b>Share</b> → <b>Add to Home Screen</b>, open the app from the new icon, then come back to this screen.</p>`;
    } else if (Notification.permission === "denied") {
      html = `<p><b>🔔 Mission alerts are blocked</b></p>
        <p class="push-note">Turn them back on in iPhone Settings → Notifications → Icebreakers.</p>`;
    } else if (Notification.permission === "granted") {
      html = `<p><b>🔔 Mission alerts are on</b> ✅</p>
        <p class="push-note">You'll get a notification when your host sends a mission.</p>`;
    } else {
      html = `<p><b>🔔 Mission alerts</b></p>
        <p class="push-note">Your host can send you surprise missions during the day. Turn on notifications so you don't miss them.</p>
        <button class="btn primary" data-push-on>Turn on mission alerts</button>`;
    }
    el.innerHTML = html;
    el.querySelector("[data-push-on]")?.addEventListener("click", async (ev) => {
      ev.target.disabled = true;
      try { await enablePush(); } catch (_) { toast("Couldn't turn on alerts. Check your connection and try again."); }
      fillPush(el);
    });
  }
  const pushSlot = () => (pushCfg() && state.char ? `<div class="card push-card" data-push-slot></div>` : "");

  // ── Install as an app (Android Chrome: real install prompt; iPhone: Share → Add to Home Screen) ──
  let installEvt = null;
  const isAndroid = () => /Android/i.test(navigator.userAgent);
  const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const installSlot = () => `<div class="card install-card" data-install-slot hidden></div>`;
  function fillInstall(el) {
    if (!el) return;
    if (isStandalone() || (!installEvt && !isAndroid() && !isIOS())) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = installEvt
      ? `<p><b>📲 Install the app</b></p><p class="push-note">Opens full screen like a real app and keeps working offline.</p><button class="btn primary" data-install>Install</button>`
      : isIOS()
        ? `<p><b>📲 Install the app</b></p><p class="push-note">Tap <b>Share</b> → <b>Add to Home Screen</b>, then open it from the new icon.</p>`
        : `<p><b>📲 Install the app</b></p><p class="push-note">Open the browser menu <b>⋮</b> and choose <b>Install app</b> (or <b>Add to Home screen</b>), then open it from the new icon.</p>`;
    el.querySelector("[data-install]")?.addEventListener("click", async () => {
      const ev = installEvt;
      if (!ev) return;
      ev.prompt();
      try { await ev.userChoice; } catch (_) {}
      installEvt = null;
      document.querySelectorAll("[data-install-slot]").forEach(fillInstall);
    });
  }
  const fillInstallSlots = () => document.querySelectorAll("[data-install-slot]").forEach(fillInstall);
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; fillInstallSlots(); });
  window.addEventListener("appinstalled", () => { installEvt = null; fillInstallSlots(); });

  // ── Screens ────────────────────────────────────────────────
  function renderPick() {
    const card = (key) => {
      const s = STORIES[key];
      return `
        <button class="pick-card pick-${s.theme}" data-pick="${key}">
          <span class="pick-art" aria-hidden="true">${s.theme === "paper" ? "📚" : "🏒"}</span>
          <span class="pick-name">${s.name}</span>
          <span class="pick-title">${s.title}</span>
          <span class="pick-tag">${s.tagline}</span>
          <span class="pick-go">This is me →</span>
        </button>`;
    };
    app.innerHTML = `
      <section class="screen pick">
        <div class="pick-head">
          <p class="kicker">Enemies to lovers · 17 districts · 17 drinks</p>
          <h1 class="logo">Icebreakers<span class="logo-sub">&amp; Heated Rivalries</span></h1>
          <p class="lede">Two birthdays. Two stories. One long day.<br>Only one bed (at the end). Choose your name — and no peeking at the other phone.</p>
        </div>
        <div class="pick-grid">${card("sarah")}${card("sara")}</div>
        <p class="fineprint">Progress is saved on this phone. Add it to your home screen so it works like an app.</p>
        ${installSlot()}
      </section>`;
    fillInstall(app.querySelector("[data-install-slot]"));
    app.querySelectorAll("[data-pick]").forEach((b) =>
      b.addEventListener("click", () => set({ ...fresh(), char: b.dataset.pick, phase: lobbyOn() ? "lobby" : "intro", bonus: state.bonus, missions: state.missions }))
    );
  }

  // ── Lobby ("Under construction") ───────────────────────────
  function renderLobby() {
    const s = story();
    app.innerHTML = `
      <section class="screen lobby">
        <p class="lobby-icon" id="lobby-icon" aria-hidden="true">🚧</p>
        <p class="kicker">Hi ${esc(s.name)}!</p>
        <h1 class="title">Under construction</h1>
        <p class="lobby-line" id="lobby-line">${LOBBY_LINES[0]}</p>
        <div class="card lobby-card">
          <p>You're all set. This screen unlocks by itself the moment the host starts the game, and your phone will buzz.</p>
          <p class="push-note">Keep the app installed and notifications on. Nothing else to do. Really.</p>
        </div>
        ${installSlot()}
        ${pushSlot()}
        <p class="lobby-status" id="lobby-status"></p>
        <button class="text-btn" id="lobby-back">Not ${esc(s.name)}? Pick again</button>
      </section>`;
    fillInstall(app.querySelector("[data-install-slot]"));
    fillPush(app.querySelector("[data-push-slot]"));
    $("#lobby-back").addEventListener("click", () => {
      if (confirm("Go back and choose your name again?")) { state = { ...fresh(), bonus: state.bonus, missions: state.missions }; save(); render(); }
    });
    // Emergency exit for the host (e.g. the server is down): tap the hard hat 7 times.
    let taps = 0;
    $("#lobby-icon").addEventListener("click", () => { if (++taps >= 7) set({ phase: "intro" }); });
    let li = 0, fails = 0;
    lobbyL = setInterval(() => { li = (li + 1) % LOBBY_LINES.length; const el = $("#lobby-line"); if (el) el.textContent = LOBBY_LINES[li]; }, 6000);
    const check = async () => {
      try {
        const r = await fetch(`${PUSH.workerUrl}/game?t=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) throw new Error("bad status");
        const j = await r.json();
        fails = 0;
        if (state.phase !== "lobby") return;
        if (j.started) {
          clearInterval(lobbyT); lobbyT = null;
          buzz([80, 60, 80, 60, 200]);
          await flash(`<p class="match-title">It's on! 🎂</p><p class="match-sub">The host has started the game.</p>`, 1600, "boost");
          set({ phase: "intro" });
          window.scrollTo({ top: 0 });
        }
      } catch (_) {
        const st = $("#lobby-status");
        if (++fails >= 3 && st) st.textContent = "Can't reach the server right now. Check your connection — we keep trying.";
      }
    };
    lobbyCheckNow = check;
    check();
    lobbyT = setInterval(check, 5000);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && state.phase === "lobby" && lobbyCheckNow) lobbyCheckNow(); });

  function renderIntro() {
    const s = story();
    const first = ROUTE[0];
    const steps = s.howTo || [
      "In every district, read what happened and the clue.",
      "Guess the district it points to. Wrong guesses are allowed — hints too.",
      "Go there. Have a drink. Tap “we've arrived”.",
    ];
    app.innerHTML = `
      <section class="screen intro">
        ${s.app ? `<p class="app-logo">${s.app}</p>` : ""}
        <p class="kicker">Happy birthday, ${s.name}</p>
        <h1 class="title">${s.title}</h1>
        <div class="card story">${paras(s.intro)}</div>
        ${s.firstClue ? `
        <article class="card riddle first-clue">
          <p class="card-label">Your first lead — where to go</p>
          <p class="clue-from">${s.firstClue.label}</p>
          ${paras(s.firstClue.text)}
          ${introHint
            ? `<p class="hint"><b>Hint:</b> ${s.firstClue.hint}</p><a class="btn ghost" href="${mapsUrl(first)}" target="_blank" rel="noopener">Open in Maps</a>`
            : `<button class="btn ghost" id="introhint">💡 Need a hint?</button>`}
        </article>` : ""}
        <div class="card how">
          <h2>How it works</h2>
          <ol>${steps.map((t) => `<li>${t}</li>`).join("")}</ol>
        </div>
        ${pushSlot()}
        <p class="start-note">Found the place? Sit down, get your first drink — then press the button. The quest starts as soon as you do.</p>
        <button class="btn primary big" id="start">Start the quest 🍻</button>
      </section>`;
    fillPush(app.querySelector("[data-push-slot]"));
    $("#introhint")?.addEventListener("click", () => { introHint = true; render(); });
    $("#start").addEventListener("click", () => {
      set({ phase: "clue", step: 0, ...stepReset() });
      announceItem();
    });
  }

  const stepReset = () => ({ wrong: [], hint: false, liked: false, passes: 0, evDone: false, imDone: false, ch: {}, solvedGaveUp: false, bought: false, shopWrong: [], sipsStep: 0, revealed: false, waiting: false });

  // Shared "Where to next?" block (district guessing).
  function guessBlock() {
    const visited = new Set(ROUTE.slice(0, state.step + 1));
    const options = Object.keys(DISTRICTS).map(Number).filter((id) => !visited.has(id));
    const wrongCount = state.wrong.length;
    const canHint = wrongCount >= HINT_AFTER || state.hint;
    return `
      <div class="guess">
        <h2>Where to next?</h2>
        <p class="guess-sub">${wrongCount === 0 ? "Pick a district. No pressure. (Some pressure.)"
          : wrongCount === 1 ? "Nope. Read it again — slower this time."
          : `Nope. That's ${wrongCount} wrong. Maybe another drink helps?`}</p>
        <div class="chips">
          ${options.map((id) => `
            <button class="chip ${state.wrong.includes(id) ? "wrong" : ""}" data-guess="${id}"
              ${state.wrong.includes(id) ? "disabled" : ""}>
              <span class="chip-roman">${DISTRICTS[id].roman}</span>
              <span class="chip-name">${DISTRICTS[id].name}</span>
            </button>`).join("")}
        </div>
        <div class="guess-help">
          ${!state.hint ? (canHint
            ? `<button class="btn ghost" id="hint">💡 Show a hint</button>`
            : `<button class="btn ghost" id="buyhint" ${can(COSTS.hint) ? "" : "disabled"}>💡 Buy a hint · ${COSTS.hint} ${unit()}</button>`) : ""}
        </div>
      </div>`;
  }
  function bindGuess() {
    app.querySelectorAll("[data-guess]").forEach((b) =>
      b.addEventListener("click", () => guess(Number(b.dataset.guess), b))
    );
    $("#hint")?.addEventListener("click", () => set({ hint: true }));
    $("#buyhint")?.addEventListener("click", () => { set({ hint: true, hearts: state.hearts - COSTS.hint }); toast(`💡 Hint bought · −${COSTS.hint} ${unit()}`); });
  }
  const riddleCard = (s, stop) => `
    <article class="card riddle">
      <p class="card-label">${s.clueLabel || "The clue"}</p>
      ${paras(stop.riddle)}
      ${state.hint ? `<p class="hint"><b>Hint:</b> ${stop.hint}</p>` : ""}
    </article>`;

  function renderClue() {
    if (isDating()) return renderDatingClue();
    const s = story();
    const d = here();
    const stop = s.stops[d];
    if (stop.intermission && !state.imDone) return renderChallenge(stop.intermission, "intermission");
    if (stop.event && !state.evDone) return renderChallenge(stop.event, "event");
    if (hasShop() && !state.bought) return renderShop();

    app.innerHTML = `
      <section class="screen clue">
        <div class="here">
          <span class="here-label">You're in</span>
          <span class="here-roman">${DISTRICTS[d].roman}</span>
          <span class="here-name">${DISTRICTS[d].name}</span>
        </div>
        ${hasShop() ? `<p class="order-ok">📦 Order confirmed — the parcel with Ottilie's note has arrived.</p>` : ""}

        <article class="card encounter">
          <p class="card-label">${s.narrator}</p>
          ${paras(stop.encounter)}
          <p class="item"><span class="item-icon">${stop.item.icon}</span> ${stop.item.name}</p>
        </article>

        ${riddleCard(s, stop)}
        ${guessBlock()}
      </section>`;
    bindGuess();
  }

  // ── Sara: Bookbazaar (shop) ────────────────────────────────
  const starsOf = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  const COVER_ICONS = ["🖤", "🌹", "🗡️", "🦇", "🔥", "🐺", "👑", "🕯️", "⛓️", "🌙"];

  function shopOffers() {
    const N = SARA_SHOP.decoys.length;
    const decoys = [0, 1, 2].map((k) => {
      const i = (state.step * 3 + k) % N;
      return { id: `d${i}`, i, real: false, ...SARA_SHOP.decoys[i] };
    });
    const real = { id: "real", real: true, ...SARA_SHOP.real[here()], ...story().stops[here()].item };
    const offers = [...decoys];
    offers.splice((state.step * 2 + 1) % 4, 0, real); // position of the real one varies
    return offers;
  }

  function offerCard(o) {
    const owned = state.shopWrong.includes(o.id);
    const cover = o.real
      ? `<div class="cover cover-real" aria-hidden="true"><span>${o.icon}</span></div>`
      : `<div class="cover" style="background:linear-gradient(160deg,hsl(${(o.i * 47) % 360} 55% 24%),hsl(${(o.i * 47 + 40) % 360} 60% 10%))" aria-hidden="true"><span>${COVER_ICONS[o.i % COVER_ICONS.length]}</span></div>`;
    const meta = o.real
      ? `<span class="stars">★★★★★</span> <span class="rv">1 review</span>`
      : `<span class="stars">${starsOf(4)}</span> <span class="rv">4.${(o.i * 3) % 6 + 3} (${(1000 + o.i * 371).toLocaleString("en")})</span>`;
    const badges = o.real
      ? `<span class="obadge only">Only 1 left</span>${state.revealed ? `<span class="obadge best">⭐ The real one</span>` : ""}`
      : `${o.i % 3 === 0 ? `<span class="obadge spons">Sponsored</span>` : ""}${o.i % 4 === 1 ? `<span class="obadge best">Bestseller</span>` : ""}
         <span class="obadge spice">${"🌶️".repeat(o.s)}</span>`;
    return `
      <article class="offer ${o.real ? "offer-real" : ""} ${o.real && state.revealed ? "revealed" : ""} ${owned ? "owned" : ""}">
        ${cover}
        <div class="offer-main">
          <div class="offer-badges">${badges}</div>
          <h3 class="offer-title">${esc(o.real ? o.name : o.t)}</h3>
          <p class="offer-by">${o.real ? "Sold by <b>Ottilie's Cart 🐾</b>" : `by ${esc(o.a)} · Dark Desires Verlag`}</p>
          <p class="offer-desc">${o.real ? esc(o.d) : `<i>${esc(o.d)}</i>`}</p>
          ${o.real ? `<p class="offer-rv">${esc(o.rv)}</p>` : ""}
          <div class="offer-meta">${meta}</div>
          <div class="offer-buy">
            <span class="price">${o.p}</span>
            <button class="btn buy" data-buy="${o.id}" ${owned ? "disabled" : ""}>${owned ? "📦 Owned" : "🛒 Buy now"}</button>
          </div>
        </div>
      </article>`;
  }

  function renderShop() {
    const s = story();
    const d = here();
    const stop = s.stops[d];
    const n = state.shopWrong.length;
    app.innerHTML = `
      <section class="screen clue shop">
        <div class="here">
          <span class="here-label">You're in</span>
          <span class="here-roman">${DISTRICTS[d].roman}</span>
          <span class="here-name">${DISTRICTS[d].name}</span>
        </div>
        <article class="card encounter">
          <p class="card-label">${s.narrator}</p>
          ${paras(stop.encounter)}
        </article>
        <div class="shop-head">
          <p class="shop-logo">📚 ${SARA_SHOP.name}</p>
          <div class="shop-search"><span>🔍</span> “The Library of Herbert and Kafka”</div>
          <p class="shop-count">1 match · 3 “recommended for you”</p>
        </div>
        <p class="shop-tip">💡 ${SARA_SHOP.tip}</p>
        ${n ? `<p class="pass-line">🍺 Penalty: <b>${n} ${n === 1 ? "sip" : "sips"}</b> for the last wrong order. Read the listings properly.</p>` : ""}
        ${cancelBtn()}
        ${state.revealed ? "" : `<button class="btn ghost" id="reveal" ${can(COSTS.reveal) ? "" : "disabled"}>🔍 Reveal the real listing · ${COSTS.reveal} ${unit()}</button>`}
        <div class="offers">${shopOffers().map(offerCard).join("")}</div>
        <p class="locked">Buy the right listing and the parcel with Ottilie's note arrives.</p>
      </section>`;
    app.querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => buy(b.dataset.buy)));
    bindCancel();
    $("#reveal")?.addEventListener("click", () => { set({ revealed: true, hearts: state.hearts - COSTS.reveal }); toast(`🔍 Listing revealed · −${COSTS.reveal} ${unit()}`); });
  }

  async function buy(id) {
    const o = shopOffers().find((x) => x.id === id);
    if (!o || state.bought) return;
    buzz([30, 40, 30]);
    if (o.real) {
      await flash(`
        <p class="match-title">Order confirmed 📦</p>
        <p class="match-sub">Right book. Ottilie's parcel is on its way — and it's already here.</p>`, 1500, "boost");
      set({ bought: true });
      window.scrollTo({ top: 0 });
      toast(`<span class="toast-icon">${o.icon}</span> Added to journal: ${o.name}`);
    } else {
      const n = state.shopWrong.length + 1;
      buzz(150);
      await flash(`
        <p class="match-title">Delivered 📦</p>
        <p class="match-sub">“${esc(o.t)}” is now yours. Not a clue. A lifestyle.<br>🍺 ${n} ${n === 1 ? "sip" : "sips"}</p>`, 2200, "boost");
      set({ shopWrong: [...state.shopWrong, id], haul: [...state.haul, o.t], sips: state.sips + n, sipsStep: state.sipsStep + n });
    }
  }

  // ── Sarah: dating-app clue screen ──────────────────────────
  function profileCard(p, d) {
    return `
      <article class="profile" id="profile">
        <div class="profile-photo">
          <img src="${p.photo}" alt="${esc(p.name)}, ${p.age}, hockey player #${p.number}">
        </div>
        <div class="profile-info">
          <div class="profile-row">
            <span class="profile-name">${esc(p.name)}, ${p.age}</span>
            <span class="profile-loc">${ICON_PIN} ${DISTRICTS[d].name}</span>
          </div>
          <div class="profile-tags">
            <span class="tag tag-main">#${p.number} · ${esc(p.position)}</span>
            ${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}
          </div>
          <p class="profile-bio">${p.bio}</p>
        </div>
      </article>`;
  }

  const cancelBtn = () => state.sipsStep > 0
    ? `<button class="btn ghost" id="cancelsips" ${can(COSTS.cancel) ? "" : "disabled"}>🧾 Cancel ${state.sipsStep} ${state.sipsStep === 1 ? "sip" : "sips"} · ${COSTS.cancel} ${unit()}</button>` : "";
  const bindCancel = () => $("#cancelsips")?.addEventListener("click", () => {
    set({ hearts: state.hearts - COSTS.cancel, sips: state.sips - state.sipsStep, sipsStep: 0 });
    toast(`🧾 Penalty cancelled · −${COSTS.cancel} ${unit()}`);
  });
  const passLine = (n) => {
    const sips = n === 1 ? "1 sip" : `${n} sips`;
    const tail = n === 1 ? "He's the only one who saw Jakob leave. Give him a chance?"
      : n === 2 ? "Sarah. Swipe right. Trust the process."
      : "We're not letting you skip this one. 😇";
    return `🍺 Penalty: <b>${sips}</b> for passing — and he's back. ${tail}`;
  };

  function renderDatingClue() {
    const s = story();
    const d = here();
    const stop = s.stops[d];
    const p = stop.profile;

    // 0) Sudden intermission, or "no matches nearby" challenge.
    if (stop.intermission && !state.imDone) return renderChallenge(stop.intermission, "intermission");
    if (stop.event && !state.evDone) return renderChallenge(stop.event, "event");

    // 1) A teammate's profile that hasn't been liked yet: swipe screen.
    if (p && !state.liked) {
      app.innerHTML = `
        <section class="screen clue dating">
          <p class="match-kicker"><span class="dot"></span> New match nearby · ${DISTRICTS[d].name} · like him to see where Jakob went</p>
          ${state.passes ? `<p class="pass-line">${passLine(state.passes)}</p>` : ""}
          ${state.passes ? cancelBtn() : ""}
          ${profileCard(p, d)}
          <div class="swipe-btns">
            <button class="round pass" id="pass" aria-label="Pass">${ICON_X}</button>
            <button class="round like" id="like" aria-label="Like">${ICON_HEART}</button>
          </div>
        </section>`;
      $("#pass").addEventListener("click", () => {
        buzz(80);
        $("#profile").classList.add("swipe-left");
        const n = state.passes + 1;
        setTimeout(() => { set({ passes: n, sips: state.sips + n, sipsStep: state.sipsStep + n }); window.scrollTo({ top: 0 }); }, 320);
      });
      bindCancel();
      $("#like").addEventListener("click", () => {
        buzz([30, 40, 30]);
        $("#profile").classList.add("swipe-right");
        setTimeout(async () => {
          await flash(`
            <p class="match-title">It's a match!</p>
            <img src="${p.face || p.photo}" alt="" class="match-photo">
            <p class="match-sub">${esc(p.name)} liked you back. He has something to tell you…</p>`, 1500);
          set({ liked: true });
          window.scrollTo({ top: 0 });
        }, 280);
      });
      return;
    }

    // 2) Liked teammate, or a regular message from someone in the district.
    const header = p
      ? `<div class="matched">
           <img src="${p.face || p.photo}" alt="" class="matched-photo">
           <div class="matched-main">
             <span class="matched-name">${esc(p.name)} <span class="badge">Matched</span></span>
             <span class="matched-sub">#${p.number} · ${esc(p.position)} · ${DISTRICTS[d].name}</span>
           </div>
         </div>
         <div class="bubble">${p.bio}</div>`
      : `<div class="matched">
           <span class="avatar" aria-hidden="true">${stop.from ? stop.from.avatar : "💬"}</span>
           <div class="matched-main">
             <span class="matched-name">${stop.from ? esc(stop.from.name) : "New message"}</span>
             <span class="matched-sub">${ICON_PIN} ${DISTRICTS[d].name} · just now</span>
           </div>
         </div>
         <div class="bubble">${paras(stop.encounter)}</div>`;

    app.innerHTML = `
      <section class="screen clue dating">
        <p class="match-kicker"><span class="dot"></span> ${p ? "It's a match" : "New message"} · ${DISTRICTS[d].roman} ${DISTRICTS[d].name}</p>
        <article class="chat">
          ${header}
          <p class="item"><span class="item-icon">${stop.item.icon}</span> ${stop.item.name}</p>
        </article>
        ${riddleCard(s, stop)}
        ${guessBlock()}
      </section>`;
    bindGuess();
  }

  // ── Sarah: challenges ──────────────────────────────────────
  function renderChallenge(key, mode) {
    const c = CHALLENGES[key];
    const d = here();
    chMode = mode;
    const ch = chNow();
    const dating = isDating();
    const banner = mode === "surprise"
      ? `<p class="ch-banner sur">🎯 Surprise mission from your host</p>`
      : mode === "intermission"
      ? `<p class="ch-banner im">${dating ? "⚡ Sudden intermission!" : "⚡ Sudden plot twist!"}</p>`
      : `<p class="ch-banner ev">${dating ? "💔 No matches nearby" : "📖 Reading room"} · ${DISTRICTS[d].name}</p>`;
    let body = "";

    if (c.type === "quiz") {
      const qi = ch.qi || 0;
      const q = c.questions[qi];
      const wrongOpts = ch.wrongOpts || [];
      body = `
        <div class="quiz">
          <p class="q-count">Question ${qi + 1} of ${c.questions.length}</p>
          <p class="q-text">${q.q}</p>
          <div class="q-opts">
            ${q.options.map((o, i) => `<button class="q-opt ${wrongOpts.includes(i) ? "wrong" : ""}" data-opt="${i}" ${wrongOpts.includes(i) ? "disabled" : ""}>${o}</button>`).join("")}
          </div>
          ${wrongOpts.length ? `<p class="q-miss">Nope — try again.</p>` : ""}
        </div>`;
    } else if (c.type === "confirm") {
      const line = c.lines ? c.lines[(ch.line ?? state.step) % c.lines.length] : "";
      const needsCountdown = c.countdown && !ch.counted;
      body = `
        ${c.lines ? `<blockquote class="ch-line">“${line}”</blockquote>
          <button class="btn ghost" id="another">🔄 Another line</button>` : ""}
        ${needsCountdown
          ? `<button class="btn primary big" id="countdown">3 · 2 · 1 · Prost!</button>`
          : `<button class="btn primary big" id="confirm">${c.confirmLabel || "✅ The group says it counts"}</button>`}`;
    } else if (c.type === "timer") {
      if (!ch.endsAt) {
        body = `<button class="btn primary big" id="startclock">Start the clock · ${mmss(c.seconds * 1000)}</button>`;
      } else {
        const left = ch.endsAt - Date.now();
        body = left > 0
          ? `<p class="clock" id="clock">${mmss(left)}</p><p class="clock-sub">${c.clockSub || "No talking. No phone. Just vibes."}</p>`
          : `<p class="clock done">0:00</p><button class="btn primary big" id="confirm">${c.doneLabel || "Time's up — collect your likes"}</button>`;
      }
    } else if (c.type === "write") {
      const started = !!ch.endsAt;
      const left = started ? ch.endsAt - Date.now() : c.seconds * 1000;
      body = `
        ${started ? `<p class="clock small" id="clock">${left > 0 ? mmss(left) : "Time! Hit save."}</p>`
                  : `<button class="btn ghost" id="startclock">⏱️ Start ${c.seconds} seconds</button>`}
        <label class="field-label" for="bio">${c.fieldLabel || "Sarah's profile"}</label>
        <textarea id="bio" class="field" rows="5" placeholder="${esc(c.placeholder || "")}">${esc(ch.text ?? state.myBio ?? "")}</textarea>
        <button class="btn primary big" id="confirm" ${(ch.text ?? "").trim() ? "" : "disabled"}>${c.confirmLabel}</button>`;
    } else if (c.type === "notes") {
      const notes = ch.notes || Array(c.count).fill("");
      body = `
        ${notes.map((n, i) => `
          <label class="field-label" for="note${i}">${c.noteLabel || "Super like"} #${i + 1}</label>
          <textarea id="note${i}" class="field note" data-note="${i}" rows="2" placeholder="${esc(c.placeholder || "")}">${esc(n)}</textarea>`).join("")}
        <button class="btn primary big" id="confirm" ${notes.every((n) => n.trim()) ? "" : "disabled"}>${c.confirmLabel}</button>`;
    }

    if (ch.delegated) {
      body = `
        <div class="deleg">
          <p class="deleg-title">🎭 Pick a victim</p>
          <p>Choose someone from the crew. They do <b>${c.title}</b> instead of you. The group decides whether it counts.</p>
          <button class="btn primary big" id="delegdone">✅ They did it — the group saw it</button>
        </div>`;
    }
    app.innerHTML = `
      <section class="screen clue ${dating ? "dating " : ""}challenge ${mode}">
        ${banner}
        <article class="ch-card">
          <span class="ch-icon" aria-hidden="true">${c.icon}</span>
          <h2 class="ch-title">${c.title}</h2>
          ${paras(c.story)}
          <p class="ch-reward">${ch.delegated ? "No reward — someone else is doing it" : `Reward: +${c.reward} ${unit()}${c.type === "quiz" && c.reward > 1 ? " (−1 per wrong answer, at least +1)" : ""}`}</p>
        </article>
        <div class="ch-body">${body}${mode === "surprise" ? `<button class="btn ghost" id="later">⏸ Not now — remind me later</button>`
          : ch.delegated ? "" : `<button class="btn ghost" id="delegate" ${can(COSTS.delegate) ? "" : "disabled"}>🎭 Make someone else do it · ${COSTS.delegate} ${unit()}</button>`}</div>
      </section>`;
    $("#later")?.addEventListener("click", () => set({ bonus: { ...state.bonus, paused: true } }));
    $("#delegate")?.addEventListener("click", () => {
      if (!confirm(`Pay ${COSTS.delegate} ${unit()} to make someone else do "${c.title}"? You pick the victim, no reward for you.`)) return;
      set({ hearts: state.hearts - COSTS.delegate, [chKey()]: { ...chNow(), delegated: true } });
      window.scrollTo({ top: 0 });
    });
    $("#delegdone")?.addEventListener("click", () => {
      set({ [mode === "intermission" ? "imDone" : "evDone"]: true, ch: {} });
      toast("🎭 Done — your hands stayed clean");
      window.scrollTo({ top: 0 });
    });

    // bindings
    app.querySelectorAll("[data-opt]").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.opt);
      const qi = ch.qi || 0;
      if (i === c.questions[qi].answer) {
        buzz([30, 40, 30]);
        if (qi + 1 >= c.questions.length) complete(c, mode);
        else setCh({ qi: qi + 1, wrongOpts: [] });
      } else {
        buzz(120);
        b.classList.add("shake");
        setTimeout(() => setCh({ wrongOpts: [...(chNow().wrongOpts || []), i], misses: (chNow().misses || 0) + 1 }), 350);
      }
    }));
    $("#another")?.addEventListener("click", () => setCh({ line: ((ch.line ?? state.step) + 1) % c.lines.length }));
    $("#countdown")?.addEventListener("click", async () => {
      for (const n of ["3", "2", "1"]) await flash(`<p class="count-num">${n}</p>`, 650, "count");
      await flash(`<p class="match-title">Prost! 🥃</p>`, 900);
      setCh({ counted: true });
    });
    $("#startclock")?.addEventListener("click", () => setCh({ endsAt: Date.now() + c.seconds * 1000 }));
    const bio = $("#bio");
    if (bio) bio.addEventListener("input", () => {
      state[chKey()] = { ...chNow(), text: bio.value };
      save();
      $("#confirm").disabled = !bio.value.trim();
    });
    app.querySelectorAll("[data-note]").forEach((t) => t.addEventListener("input", () => {
      const notes = [...(chNow().notes || Array(c.count).fill(""))];
      notes[Number(t.dataset.note)] = t.value;
      state[chKey()] = { ...chNow(), notes };
      save();
      $("#confirm").disabled = !notes.every((n) => n.trim());
    }));
    $("#confirm")?.addEventListener("click", () => {
      if (c.type === "write") state.myBio = (chNow().text || "").trim();
      if (c.type === "notes") state.superLikes = [...state.superLikes, ...(chNow().notes || []).map((n) => n.trim())];
      complete(c, mode);
    });

    // live clock (only while time is left — once it's up, the page shows the "done" state)
    if ((c.type === "timer" || c.type === "write") && ch.endsAt && ch.endsAt > Date.now()) {
      tick = setInterval(() => {
        const left = ch.endsAt - Date.now();
        const el = $("#clock");
        if (el) el.textContent = left > 0 ? mmss(left) : (c.type === "write" ? "Time! Hit save." : "0:00");
        if (left <= 0) {
          clearInterval(tick); tick = null;
          buzz([200, 100, 200]);
          if (c.type === "timer") render();
        }
      }, 250);
    }
  }

  async function complete(c, mode) {
    buzz([30, 40, 30, 40, 30]);
    const reward = c.type === "quiz" ? Math.max(1, c.reward - (chNow().misses || 0)) : c.reward;
    await flash(`
      <p class="match-title">+${reward} ${unit()}</p>
      <p class="match-sub">${mode === "surprise" ? "Surprise mission accomplished. Your host is impressed." : isDating()
        ? `${mode === "intermission" ? "Intermission survived." : "Profile boosted."} Your likes are back.`
        : `${mode === "intermission" ? "Plot twist survived." : "Chapter complete."} Ottilie's cart is open.`}</p>`, 1400, "boost");
    if (mode === "surprise") {
      set({ hearts: state.hearts + reward, earned: state.earned + reward, bonus: null, bch: {}, missions: [...state.missions, state.bonus && state.bonus.id], myBio: state.myBio, superLikes: state.superLikes });
    } else {
      set({ hearts: state.hearts + reward, earned: state.earned + reward, [mode === "intermission" ? "imDone" : "evDone"]: true, ch: {}, myBio: state.myBio, superLikes: state.superLikes });
    }
    window.scrollTo({ top: 0 });
  }

  function guess(id, el) {
    if (id === next()) {
      buzz([30, 40, 30]);
      solve(false);
    } else {
      buzz(120);
      el.classList.add("shake");
      setTimeout(() => set({ wrong: [...state.wrong, id] }), 380);
    }
  }

  function solve(gaveUp) {
    const entry = { d: here(), wrong: state.wrong.length, hint: state.hint, gaveUp };
    set({ phase: "travel", log: [...state.log, entry], solvedGaveUp: gaveUp, waiting: syncOn() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Solved, but the other phone hasn't yet: nobody continues until both have (the worker keeps score).
  function renderWaiting() {
    const n = next();
    const other = state.char === "sarah" ? "Sara" : "Sarah";
    app.innerHTML = `
      <section class="screen travel waiting">
        <p class="verdict">${state.solvedGaveUp ? "Fine. We'll tell you." : state.wrong.length === 0 ? "First try. Impressive." : "Got it!"}</p>
        <p class="kicker">You found it</p>
        <div class="dest">
          <span class="dest-roman">${DISTRICTS[n].roman}</span>
          <span class="dest-name">${DISTRICTS[n].name}</span>
        </div>
        <div class="card wait-card">
          <p class="wait-main" id="wait-main">⏳ Waiting for ${other} to find it too…</p>
          <p class="wait-sub" id="wait-sub">No spoilers, no pointing. You both continue together.</p>
        </div>
        <button class="btn ghost" id="wait-skip" hidden>Server not reachable — continue anyway</button>
      </section>`;
    $("#wait-skip").addEventListener("click", () => { set({ waiting: false }); window.scrollTo({ top: 0 }); });
    const step = state.step, who = state.char;
    let fails = 0;
    const check = async () => {
      try {
        const r = await fetch(`${PUSH.workerUrl}/solved`, {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ who, step }),
        });
        if (!r.ok) throw new Error("bad status");
        const j = await r.json();
        fails = 0;
        if (state.step !== step || !state.waiting) return;
        if (j.both || j.released) { buzz([60, 40, 60]); set({ waiting: false }); window.scrollTo({ top: 0 }); return; }
        const w = $("#wait-sub");
        if (w) w.textContent = "No spoilers, no pointing. You both continue together.";
      } catch (_) {
        if (++fails >= 4) {
          const w = $("#wait-sub"), b = $("#wait-skip");
          if (w) w.textContent = "Can't reach the server. Check your connection, or ask the host.";
          if (b) b.hidden = false;
        }
      }
    };
    check();
    pollT = setInterval(check, 3000);
  }

  function renderTravel() {
    if (state.waiting) return renderWaiting();
    const n = next();
    const gaveUp = state.solvedGaveUp;
    app.innerHTML = `
      <section class="screen travel">
        <p class="verdict">${gaveUp ? "Fine. We'll tell you." : state.wrong.length === 0 ? "First try. Impressive." : "Got it!"}</p>
        <p class="kicker">Next stop</p>
        <div class="dest">
          <span class="dest-roman">${DISTRICTS[n].roman}</span>
          <span class="dest-name">${DISTRICTS[n].name}</span>
        </div>
        ${stopInfo(n) ? `
        <div class="card plan">
          <div class="plan-row"><span class="plan-k">Bar</span><span class="plan-v"><b>${stopInfo(n).venue}</b></span></div>
          <div class="plan-row"><span class="plan-k">Planned</span><span class="plan-v">ca. ${stopInfo(n).time}</span></div>
          <div class="plan-row"><span class="plan-k">Getting there</span><span class="plan-v">${stopInfo(n).how}</span></div>
        </div>` : ""}
        <p class="travel-note">Finish your drink here in ${DISTRICTS[here()].name}, then head over. Get a drink in hand — then tap the button.</p>
        <button class="btn primary big" id="arrive">We're in ${DISTRICTS[n].name} 🍻</button>
        <a class="btn ghost" href="${mapsUrl(n)}" target="_blank" rel="noopener">Open in Maps</a>
      </section>`;
    $("#arrive").addEventListener("click", () => {
      const step = state.step + 1;
      set({ step, phase: step === TOTAL - 1 ? "done" : "clue", ...stepReset() });
      window.scrollTo({ top: 0 });
      announceItem();
    });
  }

  function renderDone() {
    const s = story();
    const d = here();
    const stop = s.stops[d];
    const matches = ROUTE.filter((id) => s.stops[id].profile).length;
    const stats = isDating()
      ? `<div><b>${matches}</b><span>matches</span></div>
         <div><b>${state.earned}</b><span>likes earned</span></div>
         <div><b>${state.sips}</b><span>penalty sips</span></div>`
      : `<div><b>${state.earned}</b><span>bookmarks earned</span></div>
         <div><b>${state.haul.length}</b><span>dark romances</span></div>
         <div><b>${state.sips}</b><span>penalty sips</span></div>`;
    const haulTitles = [...new Set(state.haul)];
    const extras = !isDating() ? `
      ${state.myBio ? `<article class="card memento"><p class="card-label">Back cover of “Sara: A Life”, written by your crew</p><p class="memento-text">${esc(state.myBio)}</p></article>` : ""}
      ${state.superLikes.filter(Boolean).length ? `<article class="card memento"><p class="card-label">Five-star reviews of Sara ⭐</p>
        <ul class="memento-list">${state.superLikes.filter(Boolean).map((n) => `<li>${esc(n)}</li>`).join("")}</ul></article>` : ""}
      ${haulTitles.length ? `<article class="card memento"><p class="card-label">Your accidental dark-romance library 🌶️</p>
        <ul class="memento-list">${haulTitles.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></article>` : ""}`
      : `
      ${state.myBio ? `<article class="card memento"><p class="card-label">Your profile, written by your crew</p><p class="memento-text">${esc(state.myBio)}</p></article>` : ""}
      ${state.superLikes.filter(Boolean).length ? `<article class="card memento"><p class="card-label">Your super likes ⭐</p>
        <ul class="memento-list">${state.superLikes.filter(Boolean).map((n) => `<li>${esc(n)}</li>`).join("")}</ul></article>` : ""}`;
    app.innerHTML = `
      <section class="screen done">
        <div class="here">
          <span class="here-label">${isDating() ? "Your last match" : "The end of the line"}</span>
          <span class="here-roman">${DISTRICTS[d].roman}</span>
          <span class="here-name">${DISTRICTS[d].name}</span>
        </div>
        <article class="card encounter finale">${paras(stop.encounter)}
          <p class="item big-item"><span class="item-icon">${stop.item.icon}</span> ${stop.item.name}</p>
        </article>
        <div class="stats">${stats}</div>
        ${extras}
      </section>`;
    celebrate(s.theme === "paper" ? ["📚", "🐈", "🍻", "🎂"] : ["🏒", "❤️", "🍻", "🎂"]);
  }

  function announceItem() {
    if (isDating()) return; // dating app: souvenirs show in the chat card and the journal instead
    if (hasShop()) return;  // bookshop: the page is announced when it is bought
    const stop = story().stops[here()];
    if (stop) toast(`<span class="toast-icon">${stop.item.icon}</span> Added to journal: ${stop.item.name}`);
  }

  function celebrate(icons) {
    const layer = document.createElement("div");
    layer.className = "confetti";
    layer.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 36; i++) {
      const s = document.createElement("span");
      s.textContent = icons[i % icons.length];
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDelay = Math.random() * 2.5 + "s";
      s.style.animationDuration = 3 + Math.random() * 3 + "s";
      s.style.fontSize = 18 + Math.random() * 22 + "px";
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 9000);
  }

  // ── Journal drawer ─────────────────────────────────────────
  function openJournal() {
    if (!state.char) return;
    const s = story();
    const reached = state.phase === "intro" ? [] : ROUTE.slice(0, state.step + 1);
    $("#drawer-title").textContent = isDating() ? "Your matches" : `${s.name}'s journal`;
    $("#drawer-body").innerHTML = reached.length === 0
      ? `<p class="empty">Nothing yet. Go get your first drink.</p>`
      : `<ol class="journal">${reached.map((d, i) => {
          const st = s.stops[d];
          const log = state.log[i];
          const note = log ? (log.gaveUp ? "gave up" : log.wrong === 0 ? "first try" : `${log.wrong} wrong`) : "here now";
          const shopping = i === state.step && state.phase === "clue" && shopAt(d) && !state.bought;
          const icon = shopping ? `<span class="j-icon">🛒</span>` : st.profile
            ? `<img class="j-photo" src="${st.profile.face || st.profile.photo}" alt="">`
            : `<span class="j-icon">${st.event && typeof CHALLENGES !== "undefined" ? CHALLENGES[st.event].icon : st.item.icon}</span>`;
          const sub = shopping ? "Still shopping…" : st.profile ? `${esc(st.profile.name)} #${st.profile.number} · ${st.item.name}`
            : st.event && typeof CHALLENGES !== "undefined" ? `${CHALLENGES[st.event].title} · ${st.item.name}` : st.item.name;
          return `<li>
            ${icon}
            <span class="j-main"><b>${label(d)}</b><span>${sub}</span></span>
            <span class="j-note">${note}</span>
          </li>`;
        }).join("")}</ol>`;
    $("#drawer-body").insertAdjacentHTML("beforeend", installSlot());
    fillInstall($("#drawer-body").querySelector("[data-install-slot]"));
    if (pushCfg()) {
      $("#drawer-body").insertAdjacentHTML("beforeend", pushSlot());
      fillPush($("#drawer-body").querySelector("[data-push-slot]"));
    }
    $("#scrim").hidden = false;
    $("#drawer").hidden = false;
    requestAnimationFrame(() => document.body.classList.add("drawer-open"));
  }
  function closeJournal() {
    document.body.classList.remove("drawer-open");
    setTimeout(() => { $("#scrim").hidden = true; $("#drawer").hidden = true; }, 250);
  }

  $("#journal-btn").addEventListener("click", openJournal);
  $("#drawer-close").addEventListener("click", closeJournal);
  $("#scrim").addEventListener("click", closeJournal);
  $("#reset-btn").addEventListener("click", () => {
    if (confirm("Start over? This deletes your progress on this phone.")) {
      closeJournal();
      state = fresh();
      save();
      render();
    }
  });

  // ── Render ─────────────────────────────────────────────────
  function render() {
    if (tick) { clearInterval(tick); tick = null; }
    if (pollT) { clearInterval(pollT); pollT = null; }
    if (lobbyT) { clearInterval(lobbyT); lobbyT = null; }
    if (lobbyL) { clearInterval(lobbyL); lobbyL = null; }
    lobbyCheckNow = null;
    if (!state.char) state.phase = "pick";
    renderChrome();
    const b = state.bonus;
    if (b && !b.paused && state.char && ["clue", "travel", "done"].includes(state.phase) && typeof CHALLENGES !== "undefined" && CHALLENGES[b.key]) {
      renderChallenge(b.key, "surprise");
      return;
    }
    ({ pick: renderPick, lobby: renderLobby, intro: renderIntro, clue: renderClue, travel: renderTravel, done: renderDone }[state.phase] || renderPick)();
  }

  render();
  pushSync();

  // ── Surprise missions: the notification tap hands us a challenge key + id ──
  function receiveMission(key, id) {
    if (!key || !id || typeof CHALLENGES === "undefined" || !CHALLENGES[key]) return;
    if (state.missions.includes(id) || (state.bonus && state.bonus.id === id)) return;
    set({ bonus: { key, id, paused: false }, bch: {} });
    window.scrollTo({ top: 0 });
  }
  $("#mission-pill").addEventListener("click", () => set({ bonus: { ...state.bonus, paused: false } }));
  try {
    const q = new URLSearchParams(location.search);
    if (q.get("mission")) {
      receiveMission(q.get("mission"), q.get("mid"));
      history.replaceState(null, "", location.pathname);
    }
  } catch (_) {}
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data && e.data.type === "mission") receiveMission(e.data.ch, e.data.id);
    });
  }

  // ── Offline support ────────────────────────────────────────
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
