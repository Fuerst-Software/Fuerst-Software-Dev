const ok = (d, cookie) => new Response(JSON.stringify(d), {
  headers: { "content-type": "application/json; charset=utf-8", ...(cookie ? { "set-cookie": cookie } : {}) }
});
const bad = (m, c=400) => new Response(JSON.stringify({ error: m }), {
  status: c, headers: { "content-type":"application/json; charset=utf-8" }
});

// Cross-Site Cookie -> SameSite=None; Secure; HttpOnly
const makeCookie = (name, val, ttlSec=60*60*4) => {
  const exp = new Date(Date.now() + ttlSec*1000).toUTCString();
  return `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=None; Expires=${exp}`;
};

export const onRequestPost = async ({ request, env }) => {
  let body; try { body = await request.json(); } catch { return bad("Invalid JSON"); }
  const { username, password } = body || {};
  if (!username || !password) return bad("Missing credentials");

  // Demo-Auth über D1
  const row = await env.DB.prepare(
    "SELECT username, role FROM users WHERE username=? AND password=?"
  ).bind(username, password).first();

  if (!row) return bad("Invalid login", 401);

  const token = btoa(JSON.stringify({ u: row.username, r: row.role, t: Date.now() }));
  return ok({ ok:true, user: row.username, role: row.role }, makeCookie("ff_sess", token));
};
