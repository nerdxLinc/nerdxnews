# Hosting

This project is intended to run on Cloudflare Pages with Pages Functions, D1, and R2.

## Required bindings

- `DB` (D1 database)
- `R2` (R2 bucket)
- `R2_PUBLIC_URL` (public base URL for the bucket)

## D1 schema

Create the `posts` table in your D1 database before publishing:

```bash
wrangler d1 execute DB --file migrations/0001_create_posts.sql
```

If you prefer the dashboard, run the SQL in `migrations/0001_create_posts.sql` in the D1 console.

## Deployment checklist

1. Cloudflare Pages project is connected to this repo.
2. Pages Functions are enabled.
3. Bindings configured: `DB`, `R2`, `R2_PUBLIC_URL`.
4. D1 schema applied (`migrations/0001_create_posts.sql`).
5. Upload an image via the Editor to confirm `/upload-image` responds with a URL.
6. Publish a post and confirm it appears after refresh.
