export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const db = env.DB as D1Database;

  // GET /api/posts
  if (request.method === "GET") {
    const url = new URL(request.url);
    const admin = url.searchParams.get("admin") === "true";

    const query = admin
      ? `
        SELECT *
        FROM posts
        ORDER BY isFeatured DESC, date DESC
      `
      : `
        SELECT *
        FROM posts
        WHERE status = 'published'
        ORDER BY isFeatured DESC, date DESC
      `;

    const { results } = await db.prepare(query).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // POST /api/posts  (admin only – frontend gate for now)
  if (request.method === "POST") {
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
    } = body;

    if (!id || !slug || !title || !content) {
      return new Response("Missing required fields", { status: 400 });
    }

    await db
      .prepare(
        `
        INSERT INTO posts (
          id, slug, title, excerpt, content,
          imageUrl, date, category,
          isFeatured, status, byline
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          slug=excluded.slug,
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
        excerpt ?? "",
        content,
        imageUrl ?? "",
        date ?? "",
        category ?? "",
        isFeatured ? 1 : 0,
        status ?? "draft",
        byline ?? ""
      )
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
};

 