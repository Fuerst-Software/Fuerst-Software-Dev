// /api/chat  GET: ?room=admin|team|customer[&since=ISO]  → Array
//             POST: { room, text, fileId?, fileUrl? }   → { ok:true }
const ok = (d) => new Response(JSON.stringify(d), {
  headers: { "content-type": "application/json; charset=utf-8" }
});
const bad = (m, c=400) => new Response(JSON.stringify({ error: m }), {
  status: c, headers: { "content-type": "application/json; charset=utf-8" }
});

// Helper: Cookie lesen (ff_sess enthält user/role – wie in deinen auth-Funktionen)
function getSession(request) {
  const m = /ff_sess=([^;]+)/.exec(request.headers.get("cookie") || "");
  if (!m) return null;
  try { return JSON.parse(atob(m[1])); } catch { return null; }
}

export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const room = url.searchParams.get("room");
  if (!room) return bad("room required");
  const since = url.searchParams.get("since");

  let q = "SELECT id, room, author, text, file_url, created_at FROM chat_messages WHERE room=? ";
  const binds = [room];
  if (since) { q += "AND created_at > ? "; binds.push(since); }
  q += "ORDER BY created_at ASC LIMIT 200";

  const list = await env.DB.prepare(q).bind(...binds).all();
  return ok(list.results || []);
};

export const onRequestPost = async ({ request, env }) => {
  const sess = getSession(request);
  if (!sess?.u) return bad("unauthorized", 401);

  let body; try { body = await request.json(); } catch { return bad("invalid json"); }
  const room = (body.room || "").trim();
  const text = (body.text || "").trim();
  let fileUrl = (body.fileUrl || "").trim();

  // optional: fileId -> files.url auflösen
  if (!fileUrl && body.fileId) {
    const row = await env.DB.prepare("SELECT url FROM files WHERE id=?").bind(body.fileId).first();
    fileUrl = row?.url || "";
  }

  if (!room || (!text && !fileUrl)) return bad("missing fields");

  await env.DB.prepare(
    "INSERT INTO chat_messages (room, author, text, file_url) VALUES (?, ?, ?, ?)"
  ).bind(room, sess.u, text, fileUrl || null).run();

  return ok({ ok: true });
};
