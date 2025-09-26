const bad = (m, c = 401) =>
  new Response(JSON.stringify({ error: m }), {
    status: c,
    headers: { "content-type": "application/json; charset=utf-8" }
  });

export const onRequestGet = async ({ request }) => {
  const cookie = request.headers.get("cookie") || "";
  const m = /ff_sess=([^;]+)/.exec(cookie);
  if (!m) return bad("No session", 401);

  try {
    const payload = JSON.parse(atob(m[1]));
    return new Response(JSON.stringify({ user: payload.u, role: payload.r }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  } catch {
    return bad("Invalid session", 401);
  }
};
