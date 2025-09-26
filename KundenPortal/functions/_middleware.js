// KundenPortal/functions/_middleware.js
const ALLOWED = new Set([
  "https://fuerst-software.github.io",
  "https://www.fuerst-software.com",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:8788",
  "http://localhost:8788",
]);

export const onRequestOptions = async ({ request }) => {
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = ALLOWED.has(origin) ? origin : "";
  const headers = new Headers();
  if (allowOrigin) headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Max-Age", "86400"); // 1 Tag
  return new Response(null, { status: 204, headers });
};

export const onRequest = async ({ request, next }) => {
  // Preflight oben schon abgefangen
  const res = await next();

  // CORS-Header an JEDE Antwort hängen
  const origin = request.headers.get("Origin") || "";
  const allowOrigin = ALLOWED.has(origin) ? origin : "";
  const headers = new Headers(res.headers);

  if (allowOrigin) headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");

  return new Response(res.body, { status: res.status, headers });
};
