const ALLOWED_ORIGINS = new Set([
  "https://<DEIN-PROJEKTNAME>.pages.dev",
  "https://fuerst-software.github.io",
  "https://www.fuerst-software.com",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
]);

const BASE_HEADERS = {
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Vary": "Origin",
};

export async function onRequest(context, next) {
  const origin = context.request.headers.get("Origin") || "";
  if (context.request.method === "OPTIONS") {
    const h = new Headers(BASE_HEADERS);
    if (ALLOWED_ORIGINS.has(origin)) h.set("Access-Control-Allow-Origin", origin);
    return new Response(null, { status: 204, headers: h });
  }

  const res = await next();
  const h = new Headers(res.headers);
  Object.entries(BASE_HEADERS).forEach(([k, v]) => h.set(k, v));
  if (ALLOWED_ORIGINS.has(origin)) h.set("Access-Control-Allow-Origin", origin);

  return new Response(res.body, { status: res.status, headers: h });
}
