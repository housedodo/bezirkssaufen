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
  const here = () => ROUTE[state.step];
  const next = () => ROUTE[state.step + 1];
  const label = (id) => `${DISTRICTS[id].roman} · ${DISTRICTS[id].name}`;
  const paras = (text) =>
    text.trim().split(/\n\s*\n/).map((p) => `<p>${p.trim()}</p>`).join("");
  const stopInfo = (id) => (typeof STOPS !== "undefined" && STOPS[id]) || null;
  const mapsUrl = (id) => {
    const s = stopInfo(id);
    const q = s && s.venue && !/wherever/i.test(s.venue)
      ? `${s.venue}, ${DISTRICTS[id].name}, Graz`
      : `Graz ${DISTRICTS[id].name}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  };
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };

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

    $("#topbar-story").textContent = `${story().name} · ${story().title}`;
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
          <span class="pick-art" aria-hidden="true">${s.theme === "ice" ? "🏒" : "📚"}</span>
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
    app.innerHTML = `
      <section class="screen intro">
        <p class="kicker">Happy birthday, ${s.name}</p>
        <h1 class="title">${s.title}</h1>
        <div class="card story">${paras(s.intro)}</div>
        <div class="card how">
          <h2>How it works</h2>
          <ol>
            <li>In every district, read what happened and the clue.</li>
            <li>Guess the district it points to. Wrong guesses are allowed — hints too.</li>
            <li>Go there. Have a drink. Tap “we've arrived”.</li>
          </ol>
        </div>
        <p class="start-note">You start where you are: <b>${label(first)}</b>${stopInfo(first) ? ` — ${stopInfo(first).venue}, ca. ${stopInfo(first).time}` : ""}.</p>
        <button class="btn primary big" id="start">We're in the ${DISTRICTS[first].name} 🍻</button>
      </section>`;
    $("#start").addEventListener("click", () => {
      set({ phase: "clue", step: 0, wrong: [], hint: false });
      announceItem();
    });
  }

  function renderClue() {
    const s = story();
    const d = here();
    const stop = s.stops[d];
    const visited = new Set(ROUTE.slice(0, state.step + 1));
    const options = Object.keys(DISTRICTS).map(Number).filter((id) => !visited.has(id));
    const wrongCount = state.wrong.length;
    const canHint = wrongCount >= HINT_AFTER || state.hint;
    const canGiveUp = wrongCount >= GIVE_UP_AFTER;

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

        <article class="card riddle">
          <p class="card-label">${s.clueLabel || "The clue"}</p>
          ${paras(stop.riddle)}
          ${state.hint ? `<p class="hint"><b>Hint:</b> ${stop.hint}</p>` : ""}
        </article>

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
        </div>
      </section>`;

    app.querySelectorAll("[data-guess]").forEach((b) =>
      b.addEventListener("click", () => guess(Number(b.dataset.guess), b))
    );
    $("#hint")?.addEventListener("click", () => set({ hint: true }));
    $("#giveup")?.addEventListener("click", () => solve(true));
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
      set({ step, phase: step === TOTAL - 1 ? "done" : "clue", wrong: [], hint: false, solvedGaveUp: false });
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
          <span class="here-label">The end of the line</span>
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
    celebrate(s.theme === "ice" ? ["🏒", "🧊", "🍻", "🎂"] : ["📚", "🐈", "🍻", "🎂"]);
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
    $("#drawer-title").textContent = `${s.name}'s journal`;
    $("#drawer-body").innerHTML = reached.length === 0
      ? `<p class="empty">Nothing yet. Go get your first drink.</p>`
      : `<ol class="journal">${reached.map((d, i) => {
          const st = s.stops[d];
          const log = state.log[i];
          const note = log ? (log.gaveUp ? "gave up" : log.wrong === 0 ? "first try" : `${log.wrong} wrong`) : "here now";
          return `<li>
            <span class="j-icon">${st.item.icon}</span>
            <span class="j-main"><b>${label(d)}</b><span>${st.item.name}</span></span>
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
