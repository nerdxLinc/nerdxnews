// functions/posts.ts
export const onRequest = async (context: any) => {
  const { request, env } = context;
  const db = env.DB as D1Database;

  // GET /posts
  // - default: published only
  // - ?admin=true : include drafts
  // - ?slug=...   : fetch single post (published-only unless admin=true)
  if (request.method === "GET") {
    const url = new URL(request.url);
    const admin = url.searchParams.get("admin") === "true";
    const slug = (url.searchParams.get("slug") || "").trim();

    try {
      if (slug) {
        const row = admin
          ? await db
              .prepare(
                `
                SELECT *
                FROM posts
                WHERE slug = ?
                LIMIT 1
              `
              )
              .bind(slug)
              .first()
          : await db
              .prepare(
                `
                SELECT *
                FROM posts
                WHERE slug = ?
                  AND status = 'published'
                LIMIT 1
              `
              )
              .bind(slug)
              .first();

        return json({ post: row ?? null });
      }

      const query = admin
        ? `
          SELECT *
          FROM posts
          ORDER BY isFeatured DESC, date DESC, updated_at DESC
        `
        : `
          SELECT *
          FROM posts
          WHERE status = 'published'
          ORDER BY isFeatured DESC, date DESC, updated_at DESC
        `;

      const { results } = await db.prepare(query).all();
      return json({ posts: results ?? [] });
    } catch (err: any) {
      return json({ error: String(err?.message ?? err) }, 500);
    }
  }

  // POST /posts  (admin-only by frontend gate, for now)
  // Upsert by slug (stable key). Enforces "only one featured post".
  if (request.method === "POST") {
    try {
      const body = await request.json();

      const {
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
      } = body ?? {};

      const cleanSlug = String(slug || "").trim();
      const cleanTitle = String(title || "").trim();
      const cleanContent = String(content || "").trim();

      if (!cleanSlug || !cleanTitle || !cleanContent) {
        return json(
          { error: "Missing required fields: slug, title, content" },
          400
        );
      }

      const featuredFlag = isFeatured ? 1 : 0;

      // Enforce "only one featured post"
      if (featuredFlag === 1) {
        await db
          .prepare(`UPDATE posts SET isFeatured = 0 WHERE isFeatured = 1`)
          .run();
      }

      // Upsert by slug. Preserve created_at if row exists.
      await db
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
          id ?? null,
          cleanSlug,
          cleanTitle,
          String(excerpt ?? ""),
          cleanContent,
          String(imageUrl ?? ""),
          String(date ?? ""),
          String(category ?? ""),
          featuredFlag,
          String(status ?? "published"),
          String(byline ?? ""),
          cleanSlug
        )
        .run();

      return json({ success: true, slug: cleanSlug });
    } catch (err: any) {
      return json({ error: String(err?.message ?? err) }, 500);
    }
  }

  return json({ error: "Method Not Allowed" }, 405);
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
