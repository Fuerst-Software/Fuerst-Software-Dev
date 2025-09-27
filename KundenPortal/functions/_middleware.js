export async function onRequest(context) {
  const { request } = context;
  const origin = request.headers.get("Origin") || "";

  // Erlaubte Frontends:
  const ALLOW = new Set([
    "https://fuerst-software.github.io",
    "https://fuerst-software.github.io/Fuerst-Software-Dev",
    "https://www.fuerst-software.com",
    "https://fuerst-software-dev.pages.dev",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8788",
    "http://localhost:5500",
    "http://localhost:8788",
  ]);

  const corsHeaders = {
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
  if (ALLOW.has(origin)) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
  }

  // Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const resp = await context.next();

  // bei JSON-Antworten CORS-Header injizieren
  const newHeaders = new Headers(resp.headers);
  Object.entries(corsHeaders).forEach(([k,v]) => newHeaders.set(k,v));
  return new Response(resp.body, { status: resp.status, headers: newHeaders });
}
