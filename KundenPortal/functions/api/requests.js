const ok = d => new Response(JSON.stringify(d), { headers: { "content-type":"application/json" }});
const bad = (m,c=400)=> new Response(JSON.stringify({error:m}), { status:c, headers:{ "content-type":"application/json" }});

export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT id,user,type,prio,due,descr AS desc,status,created_at FROM requests ORDER BY created_at DESC LIMIT 500"
  ).all();
  return ok(results);
};

export const onRequestPost = async ({ request, env }) => {
  let b; try { b = await request.json(); } catch { return bad("Invalid JSON"); }
  const { user, type, prio, due, desc } = b || {};
  if (![user,type,prio,due,desc].every(Boolean)) return bad("Missing fields");
  await env.DB.prepare(
    "INSERT INTO requests (user,type,prio,due,descr) VALUES (?,?,?,?,?)"
  ).bind(String(user), String(type), String(prio), String(due), String(desc)).run();
  return ok({ ok:true });
};
