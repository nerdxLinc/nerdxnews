export const onRequest = async (context: any) => {
  const { request, env } = context;
  const bucket = env.IMAGES as R2Bucket;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return new Response("Expected multipart form data", { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const slug = String(form.get("slug") || "").trim();

  if (!file) {
    return new Response("No file uploaded", { status: 400 });
  }

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "");
  const key = `articles/${slug}-${Date.now()}.${safeExt}`;

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || "image/jpeg",
    },
  });

  const publicUrl = `https://pub-nerdxnews-images.r2.dev/${key}`;

  return new Response(
    JSON.stringify({ url: publicUrl }, null, 2),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};
