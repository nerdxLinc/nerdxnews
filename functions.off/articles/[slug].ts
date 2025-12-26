export interface Env {
  DB: D1Database;
  IMAGE_BASE_URL?: string;
}

function esc(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isPreviewBot(ua: string) {
  const u = (ua || "").toLowerCase();
  return (
    u.includes("facebookexternalhit") ||
    u.includes("facebot") ||
    u.includes("twitterbot") ||
    u.includes("slackbot") ||
    u.includes("discordbot") ||
    u.includes("linkedinbot") ||
    u.includes("whatsapp") ||
    u.includes("telegrambot") ||
    u.includes("embedly") ||
    u.includes("pinterest")
  );
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const ua = ctx.request.headers.get("user-agent") || "";

  // Only serve OG HTML to link-preview bots. Everyone else gets the normal SPA.
  if (!isPreviewBot(ua)) {
    return ctx.next();
  }

  const slug = (ctx.params as any)?.slug ? String((ctx.params as any).slug) : "";
  const origin = url.origin;
  const canonical = `${origin}/articles/${encodeURIComponent(slug)}`;

  let post: any = null;
  try {
    post = await ctx.env.DB
      .prepare(`SELECT title, excerpt, imageUrl FROM posts WHERE slug = ? LIMIT 1`)
      .bind(slug)
      .first();
  } catch {
    post = null;
  }

  const title = post?.title || "NerdXNews";
  const description =
    post?.excerpt || "Independent culture, comics, film, and tech coverage.";

  const base = (ctx.env.IMAGE_BASE_URL || "").replace(/\/+$/, "");
  let image = post?.imageUrl || "";
  if (image && !/^https?:\/\//i.test(image) && base) {
    image = `${base}/${image.replace(/^\/+/, "")}`;
  }
  if (!image) {
    image = `${origin}/logo.jpg`;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonical}" />

  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="NerdXNews" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${esc(image)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
</head>
<body></body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
};