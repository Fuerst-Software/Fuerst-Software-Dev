const ok = d => new Response(JSON.stringify(d), { headers: { "content-type":"application/json" }});
const bad = (m,c=400)=> new Response(JSON.stringify({error:m}), { status:c, headers:{ "content-type":"application/json" }});

export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT id,title,created_at FROM categories ORDER BY created_at DESC LIMIT 500"
  ).all();
  return ok(results);
};

export const onRequestPost = async ({ request, env }) => {
  let b; try { b = await request.json(); } catch { return bad("Invalid JSON"); }
  const { title } = b || {};
  if(!title) return bad("Missing title");
  await env.DB.prepare("INSERT INTO categories (title) VALUES (?)").bind(String(title)).run();
  return ok({ ok:true });
};
