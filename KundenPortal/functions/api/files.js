const ok = (d) => new Response(JSON.stringify(d), { headers: { "content-type":"application/json; charset=utf-8" }});
const bad = (m,c=400) => new Response(JSON.stringify({ error:m }), { status:c, headers:{ "content-type":"application/json; charset=utf-8" }});

export const onRequestGet = async ({ env }) => {
  const list = await env.DB.prepare("SELECT id, name, url, title, uploader, created_at FROM files ORDER BY created_at DESC LIMIT 200").all();
  return ok(list.results || []);
};

// Variante A (ohne R2): Nur Metadaten annehmen: name,url,title
export const onRequestPost = async ({ request, env }) => {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    // Hier könntest du später R2 integrieren. Bis dahin: ablehnen
    return bad("Datei-Upload erfordert R2-Integration. Reiche name/url als JSON ein.", 400);
  }
  let body; try { body = await request.json(); } catch { return bad("invalid json"); }
  const name = (body.name||"").trim();
  const url  = (body.url||"").trim();
  const title= (body.title||"").trim();
  const uploader = (body.uploader||"system").trim();
  if (!name || !url) return bad("name and url required");

  await env.DB.prepare("INSERT INTO files (name, url, title, uploader) VALUES (?, ?, ?, ?)")
    .bind(name, url, title || null, uploader || null).run();

  const row = await env.DB.prepare("SELECT last_insert_rowid() AS id").all();
  return ok({ ok:true, id: row.results?.[0]?.id });
};

export const onRequestDelete = async ({ request, env }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return bad("id required");
  await env.DB.prepare("DELETE FROM files WHERE id=?").bind(id).run();
  return ok({ ok:true });
};
