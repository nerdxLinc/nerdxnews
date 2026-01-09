# NerdXNews

## Overview
NerdXNews is a React + TypeScript news/blog platform focused on nerd culture (books, comics, games, movies). It features a retro-styled UI with a dark theme and orange accents.

## Project Structure
- `App.tsx` - Main application component with routing and state management
- `components/` - React components
  - `Editor.tsx` - TipTap rich text editor with YouTube and image embed support
  - `Header.tsx` - Navigation header
  - `PostCard.tsx` - Article preview cards
  - `PostDetail.tsx` - Full article view with HTML rendering
  - `Newsletter.tsx` - Newsletter signup component
- `services/` - External service integrations (gemini.ts for AI)
- `functions/` - Cloudflare Pages Functions
  - `posts.ts` - D1 database CRUD operations
  - `upload-image.ts` - R2 image upload endpoint
- `public/` - Static assets (images, JSON data)
- `types.ts` - TypeScript type definitions
- `constants.tsx` - Initial posts and constants

## Tech Stack
- React 18 with TypeScript
- Vite for build/dev server
- Tailwind CSS (via CDN)
- React Router for navigation
- TipTap rich text editor
- Google Gemini AI integration

## Rich Text Editor Features
- **YouTube Embeds**: Paste any YouTube URL to embed videos
- **Inline Images**: Add images via URL or upload to R2
- **Image Alignment**: Float images left/right for text wrapping
  - Recommended sizes: 400-500px wide for floated images, 1200px for full-width
- **Text Formatting**: Bold, italic, headings, lists, blockquotes

## Development
- Frontend runs on port 5000 with `npm run dev`
- Production build: `npm run build` outputs to `dist/`

## Cloudflare Integration
- **D1 Database**: Stores posts with full HTML content
- **R2 Storage**: Image uploads stored in `IMAGES` bucket
- **IMAGE_BASE_URL**: Environment variable for R2 public URL

## Architecture Notes
- Posts are loaded from `/posts` API endpoint or fall back to local constants
- Admin mode allows creating/editing posts (password: nerdx)
- Content is stored as HTML in D1, supporting rich formatting
- Images can be aligned left/right/center with text wrapping
