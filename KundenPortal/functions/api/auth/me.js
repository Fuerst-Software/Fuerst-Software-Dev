const bad = (m,c=400)=> new Response(JSON.stringify({error:m}),{status:c,headers:{"content-type":"application/json"}});

export const onRequestGet = async ({ request }) => {
  const m = /ff_sess=([^;]+)/.exec(request.headers.get("cookie") || "");
  if (!m) return bad("No session", 401);
  try {
    const payload = JSON.parse(atob(m[1]));
    return new Response(JSON.stringify({ user: payload.u, role: payload.r }), {
      headers: { "content-type":"application/json" }
    });
  } catch { return bad("Invalid session", 401); }
};
