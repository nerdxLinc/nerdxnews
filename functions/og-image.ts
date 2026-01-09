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

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response('Missing slug parameter', { status: 400 });
  }

  try {
    const db = context.env.DB;
    if (!db) {
      return generateFallbackHtml();
    }

    const post = await db
      .prepare('SELECT id, slug, title, excerpt, imageUrl, category, date FROM posts WHERE slug = ?')
      .bind(slug)
      .first() as Post | null;

    if (!post) {
      return generateFallbackHtml();
    }

    return generateOgHtml(post);
  } catch (error) {
    console.error('OG image error:', error);
    return generateFallbackHtml();
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
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:site_name" content="NerdXNews">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${image}">
  
  <!-- Redirect to SPA -->
  <script>window.location.replace('/?article=${post.slug}');</script>
</head>
<body>
  <p>Redirecting to article...</p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function generateFallbackHtml(): Response {
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
  
  <script>if(typeof window!=='undefined')window.location.replace('/');</script>
</head>
<body>
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
