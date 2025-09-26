const ok = d => new Response(JSON.stringify(d), { headers: { "content-type":"application/json" }});
const bad = (m,c=400)=> new Response(JSON.stringify({error:m}), { status:c, headers:{ "content-type":"application/json" }});

export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT id,author,text,created_at FROM notes ORDER BY created_at DESC LIMIT 500"
  ).all();
  return ok(results);
};

export const onRequestPost = async ({ request, env }) => {
  let b; try { b = await request.json(); } catch { return bad("Invalid JSON"); }
  const { author, text } = b || {};
  if(!author || !text) return bad("Missing fields");
  await env.DB.prepare("INSERT INTO notes (author,text) VALUES (?,?)")
    .bind(String(author), String(text)).run();
  return ok({ ok:true });
};
