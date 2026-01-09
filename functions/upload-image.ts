/// <reference types="@cloudflare/workers-types" />

type Env = { 
  IMAGES: R2Bucket;
  IMAGE_BASE_URL?: string;
};

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const bucket = env.IMAGES;

  if (!bucket) {
    return new Response(JSON.stringify({ error: "R2 bucket not configured" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response(JSON.stringify({ error: "Expected multipart form data" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ext.replace(/[^a-z0-9]/g, "");
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const key = `uploads/${timestamp}-${random}.${safeExt}`;

    await bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type || "image/jpeg",
      },
    });

    const base = String(env.IMAGE_BASE_URL || "https://pub-nerdxnews-images.r2.dev").replace(/\/+$/, "");
    const publicUrl = `${base}/${key}`;

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ error: "Upload failed" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
