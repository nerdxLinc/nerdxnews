export const onRequestGet: PagesFunction = async () => {
  return new Response("ok", { headers: { "content-type": "text/plain" } });
};
