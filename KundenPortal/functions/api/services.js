const ok = d => new Response(JSON.stringify(d), { headers: { "content-type":"application/json" }});
const bad = (m,c=400)=> new Response(JSON.stringify({error:m}), { status:c, headers:{ "content-type":"application/json" }});

export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT id,title,descr,created_at FROM services ORDER BY created_at DESC LIMIT 500"
  ).all();
  return ok(results);
};

export const onRequestPost = async ({ request, env }) => {
  let b; try { b = await request.json(); } catch { return bad("Invalid JSON"); }
  const { title, desc } = b || {};
  if(!title) return bad("Missing title");
  await env.DB.prepare("INSERT INTO services (title,descr) VALUES (?,?)")
    .bind(String(title), String(desc || "")).run();
  return ok({ ok:true });
};

export const onRequestDelete = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get("id");
  if(!id) return bad("Missing id");
  await env.DB.prepare("DELETE FROM services WHERE id=?").bind(id).run();
  return ok({ ok:true });
};
