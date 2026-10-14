// Bezirkssaufen mission pusher — Cloudflare Worker.
//   POST /subscribe  {who, sub}            phone registers its push subscription (who = "sarah" | "sara")
//   POST /inbox      {endpoint}            service worker asks "what is my mission?" after an (empty) push
//   POST /send       {to, title, body, ch?} admin only (Authorization: Bearer <ADMIN_PIN>); to = sarah | sara | both
//   GET  /status                           admin only: how many phones are registered
//   POST /solved     {who, step}           step sync: "I solved stop <step>" → {both, released, other}; both phones poll this
//   GET  /progress                         admin only: per step who has solved, and released steps
//   POST /release    {step}                admin only: let both continue although one hasn't solved (override)
//   POST /reset                            admin only: forget all progress (do this before the game starts)
// Pushes are sent WITHOUT payload (no encryption needed, only a VAPID signature). The phone then fetches
// the text from /inbox. Needs: KV binding `KV`, secrets ADMIN_PIN + VAPID_PRIVATE_JWK, vars VAPID_PUBLIC + VAPID_SUBJECT.

const WHO = ["sarah", "sara"];
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = new TextEncoder();

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...CORS } });

async function sameSecret(a, b) {
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", enc.encode(String(s)))));
  const [u, v] = [new Uint8Array(x), new Uint8Array(y)];
  let diff = 0;
  for (let i = 0; i < u.length; i++) diff |= u[i] ^ v[i];
  return diff === 0;
}
async function isAdmin(req, env) {
  const pin = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return !!env.ADMIN_PIN && pin !== "" && (await sameSecret(pin, env.ADMIN_PIN));
}

const getSubs = async (env, who) => JSON.parse((await env.KV.get(`subs:${who}`)) || "[]");
const putSubs = (env, who, subs) => env.KV.put(`subs:${who}`, JSON.stringify(subs));

// VAPID JWT (ES256) for the push service that owns `endpoint`.
async function vapidAuth(env, endpoint) {
  const key = await crypto.subtle.importKey(
    "jwk", JSON.parse(env.VAPID_PRIVATE_JWK), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: env.VAPID_SUBJECT || "mailto:admin@example.com",
  })));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${head}.${body}`));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${env.VAPID_PUBLIC}`;
}

// ch = optional challenge key: tapping the notification opens that challenge in the app ("surprise mission")
async function pushTo(env, who, title, body, ch) {
  await env.KV.put(`msg:${who}`, JSON.stringify({ title, body, ch: ch || null, id: crypto.randomUUID(), t: Date.now() }));
  const subs = await getSubs(env, who);
  const alive = [];
  let sent = 0, failed = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      const res = await fetch(s.endpoint, {
        method: "POST",
        headers: { authorization: await vapidAuth(env, s.endpoint), ttl: "3600", urgency: "high", "content-length": "0" },
      });
      if (res.status === 404 || res.status === 410) { failed++; return; } // subscription is gone
      res.ok ? sent++ : failed++;
      alive.push(s);
    } catch (_) { failed++; alive.push(s); }
  }));
  if (alive.length !== subs.length) await putSubs(env, who, alive);
  return { devices: subs.length, sent, failed };
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const path = new URL(req.url).pathname;

    try {
      if (path === "/subscribe" && req.method === "POST") {
        const { who, sub } = await req.json();
        if (!WHO.includes(who) || !sub || !/^https:\/\//.test(sub.endpoint || "")) return json({ error: "bad request" }, 400);
        const other = WHO.find((w) => w !== who);
        // a phone belongs to one player: drop it from the other list, replace an older copy in this one
        const [mine, theirs] = await Promise.all([getSubs(env, who), getSubs(env, other)]);
        await Promise.all([
          putSubs(env, who, [...mine.filter((s) => s.endpoint !== sub.endpoint), { endpoint: sub.endpoint, keys: sub.keys }]),
          theirs.some((s) => s.endpoint === sub.endpoint) ? putSubs(env, other, theirs.filter((s) => s.endpoint !== sub.endpoint)) : null,
        ]);
        return json({ ok: true });
      }

      if (path === "/inbox" && req.method === "POST") {
        const { endpoint } = await req.json();
        for (const who of WHO) {
          if ((await getSubs(env, who)).some((s) => s.endpoint === endpoint)) {
            const msg = JSON.parse((await env.KV.get(`msg:${who}`)) || "null");
            return json(msg || { title: "New mission 🎯", body: "Open the app." });
          }
        }
        return json({ title: "New mission 🎯", body: "Open the app." });
      }

      if (path === "/send" && req.method === "POST") {
        if (!(await isAdmin(req, env))) return json({ error: "wrong pin" }, 401);
        const { to, title, body, ch } = await req.json();
        if (ch && !/^[a-z_]{1,40}$/i.test(ch)) return json({ error: "bad request" }, 400);
        const targets = to === "both" ? WHO : WHO.filter((w) => w === to);
        if (!targets.length || !String(title || "").trim()) return json({ error: "bad request" }, 400);
        const result = {};
        for (const who of targets) result[who] = await pushTo(env, who, String(title).slice(0, 120), String(body || "").slice(0, 400), ch);
        return json({ ok: true, result });
      }

      // ── step sync: both girls must have solved a stop before either continues ──
      if (path === "/solved" && req.method === "POST") {
        const { who, step } = await req.json();
        if (!WHO.includes(who) || !Number.isInteger(step) || step < 0 || step > 40) return json({ error: "bad request" }, 400);
        const key = `prog:${step}`;
        const p = JSON.parse((await env.KV.get(key)) || "{}");
        if (!p[who]) { p[who] = Date.now(); await env.KV.put(key, JSON.stringify(p), { expirationTtl: 172800 }); }
        const other = WHO.find((w) => w !== who);
        return json({ both: !!(p.sarah && p.sara), released: !!p.released, other: !!p[other] });
      }

      if (path === "/progress" && req.method === "GET") {
        if (!(await isAdmin(req, env))) return json({ error: "wrong pin" }, 401);
        const list = await env.KV.list({ prefix: "prog:" });
        const steps = {};
        await Promise.all(list.keys.map(async (k) => { steps[k.name.slice(5)] = JSON.parse((await env.KV.get(k.name)) || "{}"); }));
        return json({ ok: true, steps });
      }

      if (path === "/release" && req.method === "POST") {
        if (!(await isAdmin(req, env))) return json({ error: "wrong pin" }, 401);
        const { step } = await req.json();
        if (!Number.isInteger(step) || step < 0 || step > 40) return json({ error: "bad request" }, 400);
        const key = `prog:${step}`;
        const p = JSON.parse((await env.KV.get(key)) || "{}");
        p.released = Date.now();
        await env.KV.put(key, JSON.stringify(p), { expirationTtl: 172800 });
        return json({ ok: true });
      }

      if (path === "/reset" && req.method === "POST") {
        if (!(await isAdmin(req, env))) return json({ error: "wrong pin" }, 401);
        const list = await env.KV.list({ prefix: "prog:" });
        await Promise.all(list.keys.map((k) => env.KV.delete(k.name)));
        return json({ ok: true, cleared: list.keys.length });
      }

      if (path === "/status" && req.method === "GET") {
        if (!(await isAdmin(req, env))) return json({ error: "wrong pin" }, 401);
        const out = {};
        for (const who of WHO) out[who] = (await getSubs(env, who)).length;
        return json({ ok: true, devices: out });
      }
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
    return json({ error: "not found" }, 404);
  },
};
