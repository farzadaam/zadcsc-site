// Zad CSC — API worker (Cloudflare Workers + D1)
// Static pages (public/) are served by Workers Assets; this script answers /api/*.

import { GCC_MODELS, MAKES } from "./vehicles.js";

const SESSION_DAYS = 30;
const PBKDF2_ITER = 25000;

/* ---------------- helpers ---------------- */
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=UTF-8", "cache-control": "no-store", ...headers } });
const bad = (msg, status = 400) => json({ error: msg }, status);

async function body(req) {
  try { return await req.json(); } catch { return {}; }
}
const str = (v, max = 500) => (v == null ? null : String(v).trim().slice(0, max) || null);
const int = v => (v === "" || v == null || isNaN(+v) ? null : Math.round(+v));
const num = v => (v === "" || v == null || isNaN(+v) ? null : +v);

function normPhone(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 8) d = "968" + d; // Oman local number
  return d.length >= 8 && d.length <= 15 ? d : null;
}

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
async function hashPassword(password, saltB64) {
  const salt = saltB64 ? Uint8Array.from(atob(saltB64), c => c.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITER }, key, 256);
  return { hash: b64(bits), salt: b64(salt) };
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function newToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, "0")).join("");
}
function getCookie(req, name) {
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}
const cookie = (token, maxAge) =>
  `zad_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

async function currentUser(req, env) {
  const token = getCookie(req, "zad_session");
  if (!token) return null;
  return await env.DB.prepare(
    "SELECT u.id,u.phone,u.name,u.email,u.role,u.created_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>datetime('now')"
  ).bind(token).first();
}

async function startSession(env, userId) {
  const token = newToken();
  await env.DB.prepare("INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,datetime('now',?))")
    .bind(token, userId, `+${SESSION_DAYS} days`).run();
  return cookie(token, SESSION_DAYS * 86400);
}

/* ---------------- VIN ---------------- */
const WMI = {
  JT: "Toyota", JTE: "Toyota", JTM: "Toyota", JTN: "Toyota", MR0: "Toyota", AHT: "Toyota", "5TD": "Toyota", "4T1": "Toyota", "5TF": "Toyota",
  JTJ: "Lexus", JTH: "Lexus", "2T2": "Lexus",
  JN: "Nissan", JN1: "Nissan", JN8: "Nissan", "1N4": "Nissan", "5N1": "Nissan", "3N1": "Nissan", JNK: "Infiniti", JNR: "Infiniti", "5N3": "Infiniti",
  JMB: "Mitsubishi", JA4: "Mitsubishi", MMB: "Mitsubishi", JMY: "Mitsubishi",
  KMH: "Hyundai", KM8: "Hyundai", "5NP": "Hyundai", KNA: "Kia", KND: "Kia", "5XY": "Kia",
  JHM: "Honda", SHH: "Honda", "1HG": "Honda", "2HG": "Honda", "5J6": "Honda", "7FA": "Honda",
  JM1: "Mazda", JM3: "Mazda", JMZ: "Mazda",
  "1GN": "Chevrolet", "1GC": "Chevrolet", "3GN": "Chevrolet", "1G1": "Chevrolet", "1GK": "GMC", "1GT": "GMC", "3GT": "GMC",
  "1FM": "Ford", "1FT": "Ford", "1FA": "Ford",
  "1C4": "Jeep", "1J4": "Jeep", "1J8": "Jeep",
  WDB: "Mercedes-Benz", WDC: "Mercedes-Benz", WDD: "Mercedes-Benz", W1N: "Mercedes-Benz", W1K: "Mercedes-Benz",
  WBA: "BMW", WBS: "BMW", "5UX": "BMW", WAU: "Audi", WVW: "Volkswagen", WVG: "Volkswagen", WP0: "Porsche", WP1: "Porsche",
  SAL: "Land Rover", SAJ: "Jaguar", YV1: "Volvo", ZFA: "Fiat", VF1: "Renault", VF3: "Peugeot", LVS: "Ford", LGW: "Haval", LSG: "Chevrolet"
};
const YEAR_CODES = "ABCDEFGHJKLMNPRSTVWXY123456789";
function vinYear(c) {
  const i = YEAR_CODES.indexOf(c);
  if (i < 0) return null;
  const now = new Date().getFullYear() + 1;
  let y = 1980 + i;
  while (y + 30 <= now) y += 30;
  return y;
}
function validVin(v) { return /^[A-HJ-NPR-Z0-9]{17}$/.test(v); }

async function decodeVin(vin) {
  const out = { vin, make: null, model: null, year: vinYear(vin[9]), engine: null, body: null, source: "local" };
  out.make = WMI[vin.slice(0, 3)] || WMI[vin.slice(0, 2)] || null;
  try {
    const r = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`, { cf: { cacheTtl: 86400 } });
    if (r.ok) {
      const j = await r.json();
      const d = j.Results && j.Results[0];
      if (d) {
        const cap = s => s ? s.toLowerCase().replace(/(^|[\s-])\w/g, m => m.toUpperCase()) : null;
        if (d.Make) out.make = cap(d.Make);
        if (d.Model) out.model = d.Model;
        if (d.ModelYear) out.year = +d.ModelYear;
        const eng = [d.DisplacementL && (+d.DisplacementL).toFixed(1) + "L", d.EngineCylinders && d.EngineCylinders + " cyl", d.FuelTypePrimary].filter(Boolean).join(" · ");
        out.engine = eng || null;
        out.body = d.BodyClass || null;
        out.source = "nhtsa";
      }
    }
  } catch (e) { /* keep local decode */ }
  return out;
}

async function findFitments(env, make, model, year) {
  if (!make) return [];
  const rows = (await env.DB.prepare("SELECT * FROM fitments WHERE lower(make)=lower(?)").bind(make).all()).results || [];
  const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const m = norm(model);
  let list = rows.filter(f => !year || (year >= f.year_from && year <= f.year_to));
  if (m) {
    const exact = list.filter(f => norm(f.model) === m);
    list = exact.length ? exact : list.filter(f => { const fm = norm(f.model); return fm.includes(m) || m.includes(fm); });
  }
  return list.map(f => ({ ...f, tire_sizes: safeJSON(f.tire_sizes, []) }));
}
const safeJSON = (s, d) => { try { return JSON.parse(s); } catch { return d; } };

/* all models for a make: GCC list + shop fitments + NHTSA (US) list */
async function carModels(env, make) {
  const key = make.toLowerCase();
  const gccKey = Object.keys(GCC_MODELS).find(k => k.toLowerCase() === key);
  const out = new Map();
  const add = m => { const n = String(m || "").trim(); if (n && !out.has(n.toLowerCase())) out.set(n.toLowerCase(), n); };
  (GCC_MODELS[gccKey] || []).forEach(add);
  const { results } = await env.DB.prepare("SELECT DISTINCT model FROM fitments WHERE lower(make)=?").bind(key).all();
  results.forEach(r => add(r.model));
  try {
    const r = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`, { cf: { cacheTtl: 604800, cacheEverything: true } });
    if (r.ok) ((await r.json()).Results || []).forEach(x => add(x.Model_Name));
  } catch (e) { /* GCC list is enough */ }
  return [...out.values()].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

/* one-time import of the shop's tire list (public/data/tires.json) into D1 */
/* live OE tire sizes from the Wheel Fitment API (wheel-size.com); needs secret WS_KEY. No results are stored. */
const WS = "https://api.wheel-size.com/v2";
const wsSlug = (list, name) => {
  const n = String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!n) return null;
  const hit = list.find(x => [x.slug, x.name, x.name_en].some(v => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "") === n));
  return hit ? hit.slug : null;
};
async function wsGet(env, path, ttl) {
  const r = await fetch(`${WS}${path}${path.includes("?") ? "&" : "?"}user_key=${encodeURIComponent(env.WS_KEY)}`, ttl ? { cf: { cacheTtl: ttl, cacheEverything: true } } : {});
  if (!r.ok) throw new Error("ws " + r.status);
  return (await r.json()).data || [];
}
async function wsLookup(env, make, model, year) {
  if (!env.WS_KEY) return { enabled: false };
  if (!make || !model || !year) return { enabled: true, trims: [] };
  const mk = wsSlug(await wsGet(env, "/makes/", 604800), make);
  if (!mk) return { enabled: true, trims: [] };
  const md = wsSlug(await wsGet(env, `/models/?make=${mk}`, 604800), model);
  if (!md) return { enabled: true, trims: [] };
  const rows = await wsGet(env, `/search/by_model/?make=${mk}&model=${md}&year=${year}&region=medm`);
  const tire = w => w && (w.tire_full || w.tire) || null;
  const rim = w => w && w.rim || null;
  const trims = rows.slice(0, 30).map(d => ({
    trim: d.trim || d.name || null,
    generation: d.generation && d.generation.name || null,
    engine: [d.engine && d.engine.capacity && d.engine.capacity + "L", d.engine && d.engine.type, d.engine && d.engine.fuel].filter(Boolean).join(" ") || null,
    bolt: d.technical && d.technical.bolt_pattern || null,
    wheels: (d.wheels || []).map(w => ({ stock: !!w.is_stock, front: tire(w.front), rear: w.showing_fp_only ? null : tire(w.rear), rim: rim(w.front) })).filter(w => w.front)
  })).filter(t => t.wheels.length);
  return { enabled: true, trims };
}

async function ensureFitImport(env, origin) {
  await importFitFile(env, origin, "fitments_import_v2", "/data/fitments.json", "DELETE FROM fitments WHERE id <= 43");
  await importFitFile(env, origin, "fitments_import_v3", "/data/fitments_v3.json", null);
}
async function importFitFile(env, origin, KEY, file, pre) {
  const lock = await env.DB.prepare("INSERT OR IGNORE INTO meta (k, v) VALUES (?, 'running')").bind(KEY).run();
  if (lock.meta.changes !== 1) return;
  try {
    const res = await env.ASSETS.fetch(new Request(origin + file));
    const rows = await res.json();
    const cols = ["make", "model", "year_from", "year_to", "engine", "oil_grade", "oil_capacity_l", "tire_sizes", "notes"];
    const q = v => v == null ? "NULL" : typeof v === "number" ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
    const stmts = pre ? [env.DB.prepare(pre)] : [];
    for (let i = 0; i < rows.length; i += 100) {
      const vals = rows.slice(i, i + 100).map(r => "(" + cols.map(c => q(r[c])).join(",") + ")");
      stmts.push(env.DB.prepare(`INSERT INTO fitments (${cols.join(",")}) VALUES ${vals.join(",")}`));
    }
    stmts.push(env.DB.prepare("UPDATE meta SET v=?, at=datetime('now') WHERE k=?").bind(`done:${rows.length}`, KEY));
    await env.DB.batch(stmts);
  } catch (e) {
    await env.DB.prepare("DELETE FROM meta WHERE k=?").bind(KEY).run();
  }
}

async function ensureTireImport(env, origin) {
  const KEY = "tires_import_v1";
  const lock = await env.DB.prepare("INSERT OR IGNORE INTO meta (k, v) VALUES (?, 'running')").bind(KEY).run();
  if (lock.meta.changes !== 1) return;
  try {
    const res = await env.ASSETS.fetch(new Request(origin + "/data/tires.json"));
    const rows = await res.json();
    const cols = ["brand", "pattern", "sizeText", "width", "profile", "rim", "system", "dotYear", "oeType", "sku", "desc_en", "vehicles", "images", "rating", "reviews"];
    const q = v => v == null ? "NULL" : typeof v === "number" ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
    for (let i = 0; i < rows.length; i += 150) {
      const vals = rows.slice(i, i + 150).map(r => "(" + cols.map(c => q(c === "vehicles" || c === "images" ? "[]" : c === "rating" ? 5 : c === "reviews" ? 0 : r[c])).join(",") + ")");
      await env.DB.prepare(`INSERT INTO tires (${cols.join(",")}) VALUES ${vals.join(",")}`).run();
    }
    await env.DB.prepare("UPDATE meta SET v=?, at=datetime('now') WHERE k=?").bind(`done:${rows.length}`, KEY).run();
  } catch (e) {
    await env.DB.prepare("DELETE FROM meta WHERE k=?").bind(KEY).run();
  }
}

/* ---------------- routes ---------------- */
async function api(req, env, url) {
  const p = url.pathname.replace(/\/+$/, "");
  const M = req.method;
  const DB = env.DB;

  /* public catalogue */
  if (p === "/api/tires" && M === "GET") {
    await ensureTireImport(env, url.origin);
    await ensureFitImport(env, url.origin);
    const { results } = await DB.prepare("SELECT * FROM tires ORDER BY id DESC").all();
    return json(results.map(t => ({ ...t, vehicles: safeJSON(t.vehicles, []), images: safeJSON(t.images, []) })));
  }
  if (p === "/api/makes" && M === "GET") {
    const { results } = await DB.prepare("SELECT make, model, MIN(year_from) y1, MAX(year_to) y2 FROM fitments GROUP BY make, model ORDER BY make, model").all();
    return json(results);
  }
  if (p === "/api/car-makes" && M === "GET") {
    const { results } = await DB.prepare("SELECT DISTINCT make FROM fitments").all();
    const all = [...new Set([...MAKES, ...results.map(r => r.make)])].sort((a, b) => a.localeCompare(b));
    return json(all, 200, { "cache-control": "public, max-age=3600" });
  }
  if (p === "/api/car-models" && M === "GET") {
    const make = str(url.searchParams.get("make"), 60);
    if (!make) return json([]);
    return json(await carModels(env, make), 200, { "cache-control": "public, max-age=3600" });
  }
  if (p === "/api/fitments" && M === "GET") {
    await ensureFitImport(env, url.origin);
    const make = str(url.searchParams.get("make"), 60), model = str(url.searchParams.get("model"), 60), year = int(url.searchParams.get("year"));
    return json(await findFitments(env, make, model, year));
  }
  if (p === "/api/oils" && M === "GET") {
    const { results } = await DB.prepare("SELECT * FROM oils ORDER BY id DESC").all();
    return json(results.map(o => ({ ...o, images: safeJSON(o.images, []) })));
  }
  const mm = p.match(/^\/api\/media\/(\d+)$/);
  if (mm && M === "GET") {
    const r = await DB.prepare("SELECT mime, data FROM media WHERE id=?").bind(+mm[1]).first();
    if (!r) return bad("not_found", 404);
    return new Response(new Uint8Array(r.data), { headers: { "content-type": r.mime, "cache-control": "public, max-age=31536000, immutable" } });
  }
  if (p === "/api/reviews" && M === "GET") {
    const type = url.searchParams.get("type") === "oil" ? "oil" : "tire", id = int(url.searchParams.get("id"));
    const { results } = await DB.prepare("SELECT id, name, rating, text, created_at FROM reviews WHERE item_type=? AND item_id=? AND status='approved' ORDER BY id DESC LIMIT 100").bind(type, id).all();
    return json(results);
  }
  if (p === "/api/insta" && M === "GET") {
    const { results } = await DB.prepare("SELECT id, url FROM insta ORDER BY id DESC LIMIT 6").all();
    return json(results, 200, { "cache-control": "public, max-age=300" });
  }
  if (p === "/api/ws" && M === "GET") {
    try {
      return json(await wsLookup(env, str(url.searchParams.get("make"), 60), str(url.searchParams.get("model"), 60), int(url.searchParams.get("year"))));
    } catch (e) { return json({ enabled: true, trims: [], error: "ws_unavailable" }); }
  }
  if (p.startsWith("/api/vin/") && M === "GET") {
    const vin = decodeURIComponent(p.slice(9)).toUpperCase().replace(/\s/g, "");
    if (!validVin(vin)) return bad("invalid_vin");
    const car = await decodeVin(vin);
    return json({ car, fitments: await findFitments(env, car.make, car.model, car.year) });
  }

  /* auth */
  if (p === "/api/auth/register" && M === "POST") {
    const b = await body(req);
    const phone = normPhone(b.phone), name = str(b.name, 80), pass = String(b.password || "");
    if (!phone) return bad("invalid_phone");
    if (!name) return bad("name_required");
    if (pass.length < 6) return bad("password_short");
    const exists = await DB.prepare("SELECT id, pass_hash FROM users WHERE phone=?").bind(phone).first();
    const { hash, salt } = await hashPassword(pass);
    let id;
    if (exists) {
      if (exists.pass_hash) return bad("phone_taken", 409);
      // customer created by admin in the shop, claiming the account now
      await DB.prepare("UPDATE users SET pass_hash=?, pass_salt=?, name=COALESCE(name,?), email=COALESCE(email,?) WHERE id=?")
        .bind(hash, salt, name, str(b.email, 120), exists.id).run();
      id = exists.id;
    } else {
      const r = await DB.prepare("INSERT INTO users (phone,name,email,pass_hash,pass_salt) VALUES (?,?,?,?,?)")
        .bind(phone, name, str(b.email, 120), hash, salt).run();
      id = r.meta.last_row_id;
    }
    return json({ ok: true }, 200, { "set-cookie": await startSession(env, id) });
  }
  if (p === "/api/auth/login" && M === "POST") {
    const b = await body(req);
    const phone = normPhone(b.phone);
    const LK = "lf:" + (phone || "x");
    const lf = await DB.prepare("SELECT v FROM meta WHERE k=? AND at>datetime('now','-15 minutes')").bind(LK).first();
    if (lf && +lf.v >= 5) return bad("too_many_attempts", 429);
    const fail = async () => {
      await DB.prepare("INSERT INTO meta (k,v,at) VALUES (?,1,datetime('now')) ON CONFLICT(k) DO UPDATE SET v=CASE WHEN at>datetime('now','-15 minutes') THEN v+1 ELSE 1 END, at=datetime('now')").bind(LK).run();
      return bad("wrong_login", 401);
    };
    const u = phone && await DB.prepare("SELECT id, pass_hash, pass_salt FROM users WHERE phone=?").bind(phone).first();
    if (!u || !u.pass_hash) return fail();
    const { hash } = await hashPassword(String(b.password || ""), u.pass_salt);
    if (!safeEqual(hash, u.pass_hash)) return fail();
    await DB.prepare("DELETE FROM meta WHERE k=?").bind(LK).run();
    await DB.prepare("DELETE FROM sessions WHERE expires_at<=datetime('now')").run();
    return json({ ok: true }, 200, { "set-cookie": await startSession(env, u.id) });
  }
  if (p === "/api/auth/logout" && M === "POST") {
    const t = getCookie(req, "zad_session");
    if (t) await DB.prepare("DELETE FROM sessions WHERE token=?").bind(t).run();
    return json({ ok: true }, 200, { "set-cookie": cookie("x", 0) });
  }

  /* public booking & order (login optional) */
  const me = await currentUser(req, env);

  if (p === "/api/reviews" && M === "POST") {
    const b = await body(req);
    const type = b.type === "oil" ? "oil" : "tire", id = int(b.id), rating = int(b.rating);
    const name = str(b.name, 60) || me?.name, text = str(b.text, 1500);
    if (!id || !rating || rating < 1 || rating > 5) return bad("invalid_review");
    if (!name) return bad("name_required");
    const exists = await DB.prepare(`SELECT id FROM ${type === "oil" ? "oils" : "tires"} WHERE id=?`).bind(id).first();
    if (!exists) return bad("not_found", 404);
    const ip = req.headers.get("cf-connecting-ip") || "x";
    const rk = "rv:" + ip;
    const rl = await DB.prepare("SELECT v FROM meta WHERE k=? AND at>datetime('now','-1 hour')").bind(rk).first();
    if (rl && +rl.v >= 5) return bad("too_many_attempts", 429);
    await DB.prepare("INSERT INTO meta (k,v,at) VALUES (?,1,datetime('now')) ON CONFLICT(k) DO UPDATE SET v=CASE WHEN at>datetime('now','-1 hour') THEN v+1 ELSE 1 END, at=datetime('now')").bind(rk).run();
    await DB.prepare("INSERT INTO reviews (item_type,item_id,user_id,name,rating,text) VALUES (?,?,?,?,?,?)").bind(type, id, me?.id || null, name, rating, text).run();
    return json({ ok: true });
  }
  if (p === "/api/bookings" && M === "POST") {
    const b = await body(req);
    const name = str(b.name, 80) || me?.name, phone = normPhone(b.phone) || me?.phone;
    const date = str(b.date, 10), time = str(b.time, 5), service = str(b.service, 60);
    if (!name || !phone) return bad("contact_required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !/^\d{2}:\d{2}$/.test(time || "")) return bad("invalid_datetime");
    if (!service) return bad("service_required");
    const r = await DB.prepare("INSERT INTO bookings (user_id,name,phone,vehicle,service,date,time,note) VALUES (?,?,?,?,?,?,?,?)")
      .bind(me?.id || null, name, phone, str(b.vehicle, 120), service, date, time, str(b.note, 500)).run();
    return json({ ok: true, id: r.meta.last_row_id });
  }
  if (p === "/api/orders" && M === "POST") {
    const b = await body(req);
    const items = Array.isArray(b.items) ? b.items.slice(0, 50).map(i => ({ id: int(i.id), name: str(i.name, 200), size: str(i.size, 60), qty: Math.max(1, Math.min(99, int(i.qty) || 1)) })) : [];
    if (!items.length) return bad("empty_order");
    const name = str(b.name, 80) || me?.name || null, phone = normPhone(b.phone) || me?.phone || null;
    const r = await DB.prepare("INSERT INTO orders (user_id,name,phone,items,note) VALUES (?,?,?,?,?)")
      .bind(me?.id || null, name, phone, JSON.stringify(items), str(b.note, 500)).run();
    return json({ ok: true, id: r.meta.last_row_id });
  }

  /* customer account */
  if (p.startsWith("/api/me")) {
    if (!me) return bad("login_required", 401);
    if (p === "/api/me" && M === "GET") {
      const [vehicles, services, orders, bookings] = await Promise.all([
        DB.prepare("SELECT * FROM vehicles WHERE user_id=? ORDER BY id DESC").bind(me.id).all(),
        DB.prepare("SELECT * FROM services WHERE user_id=? ORDER BY date DESC, id DESC").bind(me.id).all(),
        DB.prepare("SELECT * FROM orders WHERE user_id=? ORDER BY id DESC").bind(me.id).all(),
        DB.prepare("SELECT * FROM bookings WHERE user_id=? ORDER BY date DESC, time DESC").bind(me.id).all()
      ]);
      return json({ user: me, vehicles: vehicles.results, services: services.results, orders: orders.results.map(o => ({ ...o, items: safeJSON(o.items, []) })), bookings: bookings.results });
    }
    if (p === "/api/me" && M === "PUT") {
      const b = await body(req);
      await DB.prepare("UPDATE users SET name=COALESCE(?,name), email=? WHERE id=?").bind(str(b.name, 80), str(b.email, 120), me.id).run();
      if (b.new_password) {
        if (String(b.new_password).length < 6) return bad("password_short");
        const { hash, salt } = await hashPassword(String(b.new_password));
        await DB.prepare("UPDATE users SET pass_hash=?, pass_salt=? WHERE id=?").bind(hash, salt, me.id).run();
      }
      return json({ ok: true });
    }
    if (p === "/api/me/vehicles" && M === "POST") {
      const b = await body(req);
      const vin = str(b.vin, 17)?.toUpperCase() || null;
      if (vin && !validVin(vin)) return bad("invalid_vin");
      const r = await DB.prepare("INSERT INTO vehicles (user_id,vin,make,model,year,plate,mileage) VALUES (?,?,?,?,?,?,?)")
        .bind(me.id, vin, str(b.make, 40), str(b.model, 60), int(b.year), str(b.plate, 20), int(b.mileage)).run();
      return json({ ok: true, id: r.meta.last_row_id });
    }
    const vm = p.match(/^\/api\/me\/vehicles\/(\d+)$/);
    if (vm && M === "DELETE") {
      await DB.prepare("DELETE FROM vehicles WHERE id=? AND user_id=?").bind(+vm[1], me.id).run();
      return json({ ok: true });
    }
    return bad("not_found", 404);
  }

  /* admin */
  if (p.startsWith("/api/admin")) {
    if (!me) return bad("login_required", 401);
    if (me.role !== "admin") return bad("forbidden", 403);
    return admin(req, env, url, p, M, me);
  }

  return bad("not_found", 404);
}

/* ---------------- admin ---------------- */
const TABLES = {
  tires: ["brand", "pattern", "sizeText", "width", "profile", "rim", "system", "utqg", "warranty", "rating", "reviews", "dotYear", "oeType", "sku", "vehicles", "images", "desc_fa", "desc_ar", "desc_en"],
  fitments: ["make", "model", "year_from", "year_to", "engine", "oil_grade", "oil_capacity_l", "tire_sizes", "notes"],
  vehicles: ["user_id", "vin", "make", "model", "year", "plate", "mileage"],
  services: ["user_id", "vehicle_id", "date", "type", "mileage", "details", "price", "next_due_date", "next_due_km"],
  orders: ["user_id", "name", "phone", "items", "total", "status", "note"],
  bookings: ["user_id", "name", "phone", "vehicle", "service", "date", "time", "status", "note"],
  users: ["phone", "name", "email", "role", "notes"],
  insta: ["url"],
  oils: ["brand", "name", "grade", "spec", "type", "sizes", "sku", "images", "desc_fa", "desc_ar", "desc_en"],
  reviews: ["status", "name", "rating", "text"]
};
const NUMERIC = new Set(["rating", "reviews", "year_from", "year_to", "oil_capacity_l", "user_id", "vehicle_id", "year", "mileage", "price", "next_due_km", "total"]);
const JSONCOLS = new Set(["vehicles", "images", "tire_sizes", "items"]);
async function syncRating(DB, type, id) {
  const t = type === "oil" ? "oils" : "tires";
  const s = await DB.prepare("SELECT COUNT(*) n, AVG(rating) a FROM reviews WHERE item_type=? AND item_id=? AND status='approved'").bind(type, id).first();
  await DB.prepare(`UPDATE ${t} SET reviews=?, rating=? WHERE id=?`).bind(s.n, s.n ? Math.round(s.a * 10) / 10 : (type === "oil" ? 0 : 5), id).run();
}

function cleanRow(table, b) {
  const row = {};
  for (const c of TABLES[table]) {
    if (!(c in b)) continue;
    let v = b[c];
    if (JSONCOLS.has(c)) v = typeof v === "string" ? v : JSON.stringify(v ?? []);
    else if (NUMERIC.has(c)) v = num(v);
    else v = str(v, 2000);
    if (c === "phone" && v != null) v = normPhone(v);
    if (c === "role" && v && !["customer", "admin"].includes(v)) v = "customer";
    if (table === "reviews" && c === "status" && !["pending", "approved"].includes(v)) v = "pending";
    if (table === "insta" && c === "url") {
      const m = String(v || "").match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/i);
      v = m ? `https://www.instagram.com/${m[1].toLowerCase()}/${m[2]}/` : null;
    }
    row[c] = v;
  }
  return row;
}

async function admin(req, env, url, p, M, me) {
  const DB = env.DB;

  if (p === "/api/admin/stats" && M === "GET") {
    const q = s => DB.prepare(s).first();
    const [u, o, b, s, due] = await Promise.all([
      q("SELECT COUNT(*) n FROM users WHERE role='customer'"),
      q("SELECT COUNT(*) n FROM orders WHERE status IN ('new','processing')"),
      q("SELECT COUNT(*) n FROM bookings WHERE status IN ('new','confirmed') AND date>=date('now')"),
      q("SELECT COUNT(*) n FROM services WHERE date>=date('now','-30 days')"),
      q("SELECT COUNT(*) n FROM services WHERE next_due_date BETWEEN date('now') AND date('now','+14 days')")
    ]);
    const upcoming = (await DB.prepare("SELECT * FROM bookings WHERE date>=date('now') AND status!='cancelled' ORDER BY date,time LIMIT 10").all()).results;
    const reminders = (await DB.prepare(
      "SELECT s.*, u.name, u.phone FROM services s JOIN users u ON u.id=s.user_id WHERE s.next_due_date IS NOT NULL AND s.next_due_date<=date('now','+14 days') ORDER BY s.next_due_date LIMIT 20"
    ).all()).results;
    return json({ customers: u.n, openOrders: o.n, upcomingBookings: b.n, services30: s.n, dueSoon: due.n, upcoming, reminders });
  }

  if (p === "/api/admin/customers" && M === "GET") {
    const q = "%" + (url.searchParams.get("q") || "") + "%";
    const { results } = await DB.prepare(
      `SELECT u.id,u.phone,u.name,u.email,u.role,u.created_at,
        (SELECT COUNT(*) FROM vehicles v WHERE v.user_id=u.id) vehicles,
        (SELECT MAX(date) FROM services s WHERE s.user_id=u.id) last_service
       FROM users u WHERE u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?
         OR u.id IN (SELECT user_id FROM vehicles WHERE vin LIKE ? OR plate LIKE ?)
       ORDER BY u.id DESC LIMIT 200`
    ).bind(q, q, q, q, q).all();
    return json(results);
  }
  const cm = p.match(/^\/api\/admin\/customers\/(\d+)$/);
  if (cm && M === "GET") {
    const id = +cm[1];
    const user = await DB.prepare("SELECT id,phone,name,email,role,notes,created_at,(pass_hash IS NOT NULL) has_password FROM users WHERE id=?").bind(id).first();
    if (!user) return bad("not_found", 404);
    const [vehicles, services, orders, bookings] = await Promise.all([
      DB.prepare("SELECT * FROM vehicles WHERE user_id=? ORDER BY id DESC").bind(id).all(),
      DB.prepare("SELECT * FROM services WHERE user_id=? ORDER BY date DESC, id DESC").bind(id).all(),
      DB.prepare("SELECT * FROM orders WHERE user_id=? ORDER BY id DESC").bind(id).all(),
      DB.prepare("SELECT * FROM bookings WHERE user_id=? ORDER BY date DESC").bind(id).all()
    ]);
    return json({ user, vehicles: vehicles.results, services: services.results, orders: orders.results.map(o => ({ ...o, items: safeJSON(o.items, []) })), bookings: bookings.results });
  }
  if (p === "/api/admin/upload" && M === "POST") {
    const mime = (req.headers.get("content-type") || "").split(";")[0];
    if (!/^image\/(jpeg|png|webp)$/.test(mime)) return bad("image_only");
    const buf = await req.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > 1500000) return bad("image_too_large");
    const r = await DB.prepare("INSERT INTO media (mime, data) VALUES (?, ?)").bind(mime, buf).run();
    return json({ ok: true, url: "/api/media/" + r.meta.last_row_id });
  }
  const pm = p.match(/^\/api\/admin\/customers\/(\d+)\/password$/);
  if (pm && M === "POST") {
    const pw = String((await body(req)).password || "");
    if (pw.length < 6) return bad("password_short");
    const { hash, salt } = await hashPassword(pw);
    await DB.batch([
      DB.prepare("UPDATE users SET pass_hash=?, pass_salt=? WHERE id=?").bind(hash, salt, +pm[1]),
      DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(+pm[1])
    ]);
    return json({ ok: true });
  }
  if (p === "/api/admin/customers" && M === "POST") {
    const b = await body(req);
    const phone = normPhone(b.phone), name = str(b.name, 80);
    if (!phone || !name) return bad("contact_required");
    const exists = await DB.prepare("SELECT id FROM users WHERE phone=?").bind(phone).first();
    if (exists) return json({ ok: true, id: exists.id, existed: true });
    const r = await DB.prepare("INSERT INTO users (phone,name,email,notes) VALUES (?,?,?,?)").bind(phone, name, str(b.email, 120), str(b.notes, 1000)).run();
    return json({ ok: true, id: r.meta.last_row_id });
  }

  /* generic CRUD: /api/admin/:table and /api/admin/:table/:id */
  const g = p.match(/^\/api\/admin\/(tires|fitments|vehicles|services|orders|bookings|users|insta|oils|reviews)(?:\/(\d+))?$/);
  if (g) {
    const [, table, idS] = g;
    const id = idS ? +idS : null;
    if (M === "GET" && !id) {
      const status = url.searchParams.get("status");
      let sql = `SELECT * FROM ${table}`, args = [];
      if (status && ["orders", "bookings"].includes(table)) { sql += " WHERE status=?"; args.push(status); }
      sql += table === "bookings" ? " ORDER BY date DESC, time DESC" : " ORDER BY id DESC";
      sql += table === "tires" || table === "fitments" ? " LIMIT 5000" : " LIMIT 500";
      let { results } = await DB.prepare(sql).bind(...args).all();
      if (table === "users") results = results.map(({ pass_hash, pass_salt, ...u }) => u);
      return json(results);
    }
    if (M === "POST" && !id) {
      if (table === "users") return bad("use_customers_endpoint");
      const row = cleanRow(table, await body(req));
      const cols = Object.keys(row);
      if (!cols.length) return bad("empty");
      if (table === "insta" && !row.url) return bad("invalid_instagram_url");
      const r = await DB.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`).bind(...cols.map(c => row[c])).run();
      return json({ ok: true, id: r.meta.last_row_id });
    }
    if (M === "PUT" && id) {
      const row = cleanRow(table, await body(req));
      if (table === "users" && id === me.id && row.role && row.role !== "admin") return bad("cannot_demote_self");
      const cols = Object.keys(row);
      if (!cols.length) return bad("empty");
      await DB.prepare(`UPDATE ${table} SET ${cols.map(c => c + "=?").join(",")} WHERE id=?`).bind(...cols.map(c => row[c]), id).run();
      if (table === "reviews") { const rv = await DB.prepare("SELECT item_type, item_id FROM reviews WHERE id=?").bind(id).first(); if (rv) await syncRating(DB, rv.item_type, rv.item_id); }
      return json({ ok: true });
    }
    if (M === "DELETE" && id) {
      if (table === "users") {
        if (id === me.id) return bad("cannot_delete_self");
        await DB.batch([
          DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(id),
          DB.prepare("DELETE FROM vehicles WHERE user_id=?").bind(id),
          DB.prepare("DELETE FROM services WHERE user_id=?").bind(id),
          DB.prepare("UPDATE orders SET user_id=NULL WHERE user_id=?").bind(id),
          DB.prepare("UPDATE bookings SET user_id=NULL WHERE user_id=?").bind(id),
          DB.prepare("DELETE FROM users WHERE id=?").bind(id)
        ]);
      } else {
        const rv = table === "reviews" ? await DB.prepare("SELECT item_type, item_id FROM reviews WHERE id=?").bind(id).first() : null;
        await DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
        if (rv) await syncRating(DB, rv.item_type, rv.item_id);
      }
      return json({ ok: true });
    }
  }
  return bad("not_found", 404);
}

/* ---------------- entry ---------------- */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.hostname === "www.zadcsc.com") {
      url.hostname = "zadcsc.com";
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith("/api/")) {
      // same-origin only for state-changing requests
      if (req.method !== "GET") {
        const origin = req.headers.get("origin");
        if (origin && new URL(origin).host !== url.host) return bad("bad_origin", 403);
      }
      try { return await api(req, env, url); }
      catch (e) { return json({ error: "server_error" }, 500); }
    }
    return env.ASSETS.fetch(req);
  }
};
