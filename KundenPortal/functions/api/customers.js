const ok = d => new Response(JSON.stringify(d), { headers: { "content-type":"application/json" }});
const bad = (m,c=400)=> new Response(JSON.stringify({error:m}), { status:c, headers:{ "content-type":"application/json" }});

export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT id,name,mail,services_count,created_at FROM customers ORDER BY created_at DESC LIMIT 500"
  ).all();
  return ok(results);
};

export const onRequestPost = async ({ request, env }) => {
  let b; try { b = await request.json(); } catch { return bad("Invalid JSON"); }
  const { name, mail } = b || {};
  if(!name) return bad("Missing name");
  await env.DB.prepare("INSERT INTO customers (name,mail) VALUES (?,?)")
    .bind(String(name), String(mail || "")).run();
  return ok({ ok:true });
};

export const onRequestDelete = async ({ request, env }) => {
  const id = new URL(request.url).searchParams.get("id");
  if(!id) return bad("Missing id");
  await env.DB.prepare("DELETE FROM customers WHERE id=?").bind(id).run();
  return ok({ ok:true });
};
