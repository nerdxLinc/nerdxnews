interface Env {
  DB: any;
}

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  date?: string;
}

export const onRequestGet = async (context: { request: Request; env: Env; params: { slug: string } }) => {
  const slug = context.params.slug;

  if (!slug) {
    return redirectToHome();
  }

  try {
    const db = context.env.DB;
    if (!db) {
      return redirectToHome();
    }

    const post = await db
      .prepare('SELECT id, slug, title, excerpt, imageUrl, category, date FROM posts WHERE slug = ?')
      .bind(slug)
      .first() as Post | null;

    if (!post) {
      return redirectToHome();
    }

    return generateOgHtml(post);
  } catch (error) {
    console.error('Article OG error:', error);
    return redirectToHome();
  }
};

function generateOgHtml(post: Post): Response {
  const title = escapeHtml(post.title || 'NerdXNews');
  const description = escapeHtml(post.excerpt || 'The Evolution of Nerd Culture');
  const image = post.imageUrl || 'https://nerdxnews.com/NerdXNews_Logo.png';
  const url = `https://nerdxnews.com/articles/${post.slug}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | NerdXNews</title>
  
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:site_name" content="NerdXNews">
  
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${image}">
  
  <script>
    if (typeof window !== 'undefined') {
      window.location.replace('/?article=${post.slug}');
    }
  </script>
</head>
<body style="background:#050505;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="text-align:center;">
    <h1 style="font-size:1.5rem;margin-bottom:1rem;">${title}</h1>
    <p>Redirecting to article...</p>
    <noscript>
      <a href="/?article=${post.slug}" style="color:#ea580c;">Click here to read the article</a>
    </noscript>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function redirectToHome(): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NerdXNews | The Evolution of Nerd Culture</title>
  
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://nerdxnews.com">
  <meta property="og:title" content="NerdXNews">
  <meta property="og:description" content="The Evolution of Nerd Culture">
  <meta property="og:image" content="https://nerdxnews.com/NerdXNews_Logo.png">
  
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:title" content="NerdXNews">
  <meta property="twitter:description" content="The Evolution of Nerd Culture">
  <meta property="twitter:image" content="https://nerdxnews.com/NerdXNews_Logo.png">
  
  <script>window.location.replace('/');</script>
</head>
<body style="background:#050505;color:#f4f4f5;">
  <p>Redirecting...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
