/// <reference types="@cloudflare/workers-types" />
// functions/posts.ts
// Cloudflare Pages Function: /posts

type Env = { DB: D1Database };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function s(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function boolInt(v: unknown): number {
  if (v === true) return 1;
  if (v === false) return 0;
  if (v === 1 || v === 0) return v;
  const t = s(v).toLowerCase();
  if (t === "1" || t === "true" || t === "yes") return 1;
  if (t === "0" || t === "false" || t === "no") return 0;
  return 0;
}

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  if (!env.DB) return json({ error: "Missing D1 binding: DB" }, 500);

  const url = new URL(request.url);

  if (request.method === "GET") {
    const admin = url.searchParams.get("admin") === "true";
    const slug = s(url.searchParams.get("slug"));

    try {
      if (slug) {
        const row = await env.DB
          .prepare(
            admin
              ? "SELECT * FROM posts WHERE slug = ? LIMIT 1"
              : "SELECT * FROM posts WHERE slug = ? AND status = 'published' LIMIT 1"
          )
          .bind(slug)
          .first();

        return json({ post: row ?? null }, 200);
      }

      const sql = admin
        ? "SELECT * FROM posts ORDER BY isFeatured DESC, date DESC, updated_at DESC"
        : "SELECT * FROM posts WHERE status = 'published' ORDER BY isFeatured DESC, date DESC, updated_at DESC";

      const out = await env.DB.prepare(sql).all();
      return json({ posts: out.results ?? [] }, 200);
    } catch (e) {
      return json({ error: String((e as any)?.message ?? e) }, 500);
    }
  }

  if (request.method === "POST") {
    try {
      const body = await request.json();

      const slug = s(body?.slug);
      if (!slug) return json({ error: "Missing slug" }, 400);

      const title = s(body?.title);
      const excerpt = s(body?.excerpt);
      const content = s(body?.content);

      if (!title) return json({ error: "Missing title" }, 400);
      if (!content) return json({ error: "Missing content" }, 400);

      const id = s(body?.id) || null;
      const category = s(body?.category);
      const date = s(body?.date);
      const status = s(body?.status) || "draft";
      const byline = s(body?.byline);

      const imageUrl = s(body?.imageUrl || body?.image || body?.heroImage);
      const isFeatured = boolInt(body?.isFeatured);

      await env.DB
        .prepare(
          `
          INSERT INTO posts (
            id, slug, title, excerpt, content,
            imageUrl, date, category,
            isFeatured, status, byline,
            created_at, updated_at
          )
          VALUES (
            COALESCE(?, lower(hex(randomblob(16)))),
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            COALESCE((SELECT created_at FROM posts WHERE slug = ?), datetime('now')),
            datetime('now')
          )
          ON CONFLICT(slug) DO UPDATE SET
            title=excluded.title,
            excerpt=excluded.excerpt,
            content=excluded.content,
            imageUrl=excluded.imageUrl,
            date=excluded.date,
            category=excluded.category,
            isFeatured=excluded.isFeatured,
            status=excluded.status,
            byline=excluded.byline,
            updated_at=datetime('now')
        `
        )
        .bind(
          id,
          slug,
          title,
          excerpt,
          content,
          imageUrl,
          date,
          category,
          isFeatured,
          status,
          byline,
          slug
        )
        .run();

      return json({ ok: true }, 200);
    } catch (e) {
      return json({ error: String((e as any)?.message ?? e) }, 500);
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
};
