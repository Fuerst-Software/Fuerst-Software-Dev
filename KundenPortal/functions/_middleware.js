// Globales CORS für alle API-Routen (Whitelist + Credentials)
const ALLOWED_ORIGINS = new Set([
  "https://www.fuerst-software.com",
  "https://fuerst-software.com",
  // Zum Debuggen optional:
  "https://fuerst-software.pages.dev",
]);

function corsHeaders(origin, extra = {}) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "vary": "origin",
    ...extra,
  };
}

export const onRequestOptions = async ({ request }) => {
  const origin = request.headers.get("Origin") || "";
  const reqHeaders = request.headers.get("Access-Control-Request-Headers") || "content-type,authorization";
  if (!ALLOWED_ORIGINS.has(origin)) {
    // trotzdem sauber antworten, aber ohne Erlaubnis
    return new Response(null, { status: 204 });
  }
  return new Response(null, {
    headers: corsHeaders(origin, {
      "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
      "access-control-allow-headers": reqHeaders,
      "access-control-max-age": "86400",
    }),
  });
};

export const onRequest = async ({ request, next }) => {
  const resp = await next();
  const origin = request.headers.get("Origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) return resp;

  const res = new Response(resp.body, resp);
  const h = corsHeaders(origin);
  for (const [k, v] of Object.entries(h)) res.headers.set(k, v);
  if (!res.headers.get("content-type")) {
    res.headers.set("content-type", "application/json; charset=utf-8");
  }
  return res;
};
