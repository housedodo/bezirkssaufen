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

  // ── State ──────────────────────────────────────────────────
  const fresh = () => ({
    char: null,      // "sarah" | "sara"
    phase: "pick",   // pick | intro | clue | travel | done
    step: 0,         // index into ROUTE of the district they are in
    wrong: [],       // wrong district ids guessed at the current step
    hint: false,     // hint revealed at the current step
    liked: false,    // dating story: profile at the current step was liked
    passes: 0,       // dating story: how often she tried to pass on him
    log: [],         // [{ d, wrong, hint, gaveUp }] for finished steps
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

  // ── Helpers ────────────────────────────────────────────────
  const story = () => STORIES[state.char];
  const isDating = () => state.char && story().theme === "dating";
  const here = () => ROUTE[state.step];
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

  // ── Chrome (top bar, progress) ─────────────────────────────
  function renderChrome() {
    const inGame = state.char && state.phase !== "pick";
    document.body.dataset.theme = state.char ? story().theme : "night";
    $("#topbar").hidden = !inGame;
    $("#progress").hidden = !inGame || state.phase === "intro";
    if (!inGame) return;

    $("#topbar-story").textContent = isDating()
      ? (story().app || story().title)
      : `${story().name} · ${story().title}`;
    const arrived = state.phase === "intro" ? 0 : state.step + 1;
    $("#topbar-count").textContent =
      state.phase === "intro" ? "Ready?" : `District ${arrived} of ${TOTAL}`;
    $("#drinks").textContent = arrived ? `🍻 ${arrived}` : "";

    $("#progress").innerHTML = ROUTE.map((d, i) => {
      const cls = i < state.step || state.phase === "done" ? "done"
        : i === state.step ? "now" : "";
      return `<span class="seg ${cls}" title="${i <= state.step ? DISTRICTS[d].name : "?"}"></span>`;
    }).join("");
  }

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
          <p class="kicker">Graz · 17 Bezirke · 17 Drinks</p>
          <h1 class="logo">Bezirks&shy;saufen</h1>
          <p class="lede">Two birthdays. Two stories. One very long day out.<br>Pick your own story — and no peeking at the other phone.</p>
        </div>
        <div class="pick-grid">${card("sarah")}${card("sara")}</div>
        <p class="fineprint">Progress is saved on this phone. Add it to your home screen so it works like an app.</p>
      </section>`;
    app.querySelectorAll("[data-pick]").forEach((b) =>
      b.addEventListener("click", () => set({ ...fresh(), char: b.dataset.pick, phase: "intro" }))
    );
  }

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
        <div class="card how">
          <h2>How it works</h2>
          <ol>${steps.map((t) => `<li>${t}</li>`).join("")}</ol>
        </div>
        <p class="start-note">You start where you are: <b>${label(first)}</b>${stopInfo(first) ? ` — ${stopInfo(first).venue}, ca. ${stopInfo(first).time}` : ""}.</p>
        <button class="btn primary big" id="start">We're in the ${DISTRICTS[first].name} 🍻</button>
      </section>`;
    $("#start").addEventListener("click", () => {
      set({ phase: "clue", step: 0, wrong: [], hint: false, liked: false, passes: 0 });
      announceItem();
    });
  }

  // Shared "Where to next?" block (district guessing).
  function guessBlock(stop) {
    const visited = new Set(ROUTE.slice(0, state.step + 1));
    const options = Object.keys(DISTRICTS).map(Number).filter((id) => !visited.has(id));
    const wrongCount = state.wrong.length;
    const canHint = wrongCount >= HINT_AFTER || state.hint;
    const canGiveUp = wrongCount >= GIVE_UP_AFTER;
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
          ${!state.hint ? `<button class="btn ghost" id="hint" ${canHint ? "" : "disabled"}>
            ${canHint ? "💡 Show a hint" : "💡 Hint unlocks after a wrong guess"}</button>` : ""}
          ${canGiveUp ? `<button class="btn ghost" id="giveup">🏳️ Just tell us</button>` : ""}
        </div>
      </div>`;
  }
  function bindGuess() {
    app.querySelectorAll("[data-guess]").forEach((b) =>
      b.addEventListener("click", () => guess(Number(b.dataset.guess), b))
    );
    $("#hint")?.addEventListener("click", () => set({ hint: true }));
    $("#giveup")?.addEventListener("click", () => solve(true));
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

    app.innerHTML = `
      <section class="screen clue">
        <div class="here">
          <span class="here-label">You're in</span>
          <span class="here-roman">${DISTRICTS[d].roman}</span>
          <span class="here-name">${DISTRICTS[d].name}</span>
        </div>

        <article class="card encounter">
          <p class="card-label">${s.narrator}</p>
          ${paras(stop.encounter)}
          <p class="item"><span class="item-icon">${stop.item.icon}</span> ${stop.item.name}</p>
        </article>

        ${riddleCard(s, stop)}
        ${guessBlock(stop)}
      </section>`;
    bindGuess();
  }

  // ── Sarah: dating-app clue screen ──────────────────────────
  const PASS_LINES = [
    "",
    "He's the only one who saw Jakob leave. Give him a chance?",
    "Sarah. Swipe right. Trust the process.",
    "We're not letting you skip this one. 😇",
  ];

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

  function renderDatingClue() {
    const s = story();
    const d = here();
    const stop = s.stops[d];
    const p = stop.profile;

    // 1) A teammate's profile that hasn't been liked yet: swipe screen.
    if (p && !state.liked) {
      app.innerHTML = `
        <section class="screen clue dating">
          <p class="match-kicker"><span class="dot"></span> New match nearby · ${DISTRICTS[d].name} · like him to see where Jakob went</p>
          ${state.passes ? `<p class="pass-line">${PASS_LINES[Math.min(state.passes, PASS_LINES.length - 1)]}</p>` : ""}
          ${profileCard(p, d)}
          <div class="swipe-btns">
            <button class="round pass" id="pass" aria-label="Pass">${ICON_X}</button>
            <button class="round like" id="like" aria-label="Like">${ICON_HEART}</button>
          </div>
        </section>`;
      $("#pass").addEventListener("click", () => {
        buzz(80);
        $("#profile").classList.add("swipe-left");
        setTimeout(() => set({ passes: state.passes + 1 }), 320);
      });
      $("#like").addEventListener("click", () => {
        buzz([30, 40, 30]);
        $("#profile").classList.add("swipe-right");
        setTimeout(() => showMatch(p), 280);
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
        ${guessBlock(stop)}
      </section>`;
    bindGuess();
  }

  function showMatch(p) {
    const o = document.createElement("div");
    o.className = "match-overlay";
    o.setAttribute("role", "status");
    o.innerHTML = `
      <div class="match-inner">
        <p class="match-title">It's a match!</p>
        <img src="${p.face || p.photo}" alt="" class="match-photo">
        <p class="match-sub">${esc(p.name)} liked you back. He has something to tell you…</p>
      </div>`;
    document.body.appendChild(o);
    requestAnimationFrame(() => o.classList.add("show"));
    setTimeout(() => {
      o.classList.remove("show");
      setTimeout(() => o.remove(), 300);
      set({ liked: true });
      window.scrollTo({ top: 0 });
    }, 1500);
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
    set({ phase: "travel", log: [...state.log, entry], solvedGaveUp: gaveUp });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderTravel() {
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
      set({ step, phase: step === TOTAL - 1 ? "done" : "clue", wrong: [], hint: false, liked: false, passes: 0, solvedGaveUp: false });
      window.scrollTo({ top: 0 });
      announceItem();
    });
  }

  function renderDone() {
    const s = story();
    const d = here();
    const stop = s.stops[d];
    const firstTries = state.log.filter((l) => l.wrong === 0 && !l.gaveUp).length;
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
        <div class="stats">
          <div><b>${TOTAL}</b><span>districts</span></div>
          <div><b>${TOTAL}</b><span>drinks</span></div>
          <div><b>${firstTries}</b><span>first-try guesses</span></div>
        </div>
      </section>`;
    celebrate(s.theme === "paper" ? ["📚", "🐈", "🍻", "🎂"] : ["🏒", "❤️", "🍻", "🎂"]);
  }

  function announceItem() {
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
          const icon = st.profile
            ? `<img class="j-photo" src="${st.profile.face || st.profile.photo}" alt="">`
            : `<span class="j-icon">${st.item.icon}</span>`;
          const sub = st.profile ? `${esc(st.profile.name)} #${st.profile.number} · ${st.item.name}` : st.item.name;
          return `<li>
            ${icon}
            <span class="j-main"><b>${label(d)}</b><span>${sub}</span></span>
            <span class="j-note">${note}</span>
          </li>`;
        }).join("")}</ol>`;
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
    if (!state.char) state.phase = "pick";
    renderChrome();
    ({ pick: renderPick, intro: renderIntro, clue: renderClue, travel: renderTravel, done: renderDone }[state.phase] || renderPick)();
  }

  render();

  // ── Offline support ────────────────────────────────────────
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
