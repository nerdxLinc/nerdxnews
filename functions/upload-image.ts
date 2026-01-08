/// <reference types="@cloudflare/workers-types" />
// functions/upload-image.ts
// Cloudflare Pages Function: /upload-image

type Env = {
  R2: R2Bucket;
  R2_PUBLIC_URL: string;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function buildObjectKey(filename: string): string {
  const cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `uploads/${stamp}-${cleaned || "image"}`;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!env.R2) return json({ error: "Missing R2 binding" }, 500);
  if (!env.R2_PUBLIC_URL) return json({ error: "Missing R2_PUBLIC_URL" }, 500);

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return json({ error: "Missing file" }, 400);
    }

    const key = buildObjectKey(file.name || "image");

    await env.R2.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });

    const base = env.R2_PUBLIC_URL.replace(/\/$/, "");
    return json({ url: `${base}/${key}` }, 200);
  } catch (e) {
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }
};
