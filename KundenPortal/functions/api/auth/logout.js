const ok = (data, cookie) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(cookie ? { "set-cookie": cookie } : {})
    }
  });

export const onRequestPost = async () => {
  // Cookie invalidieren
  const expired =
    "ff_sess=; Path=/; HttpOnly; Secure; SameSite=None; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  return ok({ ok: true }, expired);
};
