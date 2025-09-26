const clearCookie = (name) =>
  `${name}=; Path=/; HttpOnly; Secure; SameSite=None; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

export const onRequestPost = async () => {
  return new Response(JSON.stringify({ ok:true }), {
    headers: { "content-type":"application/json; charset=utf-8", "set-cookie": clearCookie("ff_sess") }
  });
};
