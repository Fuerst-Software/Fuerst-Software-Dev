const ok = (data, cookie) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(cookie ? { "set-cookie": cookie } : {})
    }
  });

const bad = (msg, code = 400) =>
  new Response(JSON.stringify({ error: msg }), {
    status: code,
    headers: { "content-type": "application/json; charset=utf-8" }
  });

// Cross-Site Cookie (für credentials: "include")
const makeCookie = (name, val, ttlSec = 60 * 60 * 4) => {
  const exp = new Date(Date.now() + ttlSec * 1000).toUTCString();
  return `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=None; Expires=${exp}`;
};

export const onRequestPost = async ({ request, env }) => {
  let body;
  try { body = await request.json(); } catch { return bad("Invalid JSON"); }

  const { username, password } = body || {};
  if (!username || !password) return bad("Missing credentials");

  // Dein Schema hat password_hash (nicht "password")
  const row = await env.DB
    .prepare("SELECT username, role FROM users WHERE username = ? AND password_hash = ?")
    .bind(username, password) // TODO: später Hashen!
    .first();

  if (!row) return bad("Invalid login", 401);

  const token = btoa(JSON.stringify({ u: row.username, r: row.role, t: Date.now() }));
  return ok({ ok: true, user: row.username, role: row.role }, makeCookie("ff_sess", token));
};
