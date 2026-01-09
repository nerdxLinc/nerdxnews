# NerdXNews

## Overview
NerdXNews is a React + TypeScript news/blog platform focused on nerd culture (books, comics, games, movies). It features a retro-styled UI with a dark theme and orange accents.

## Project Structure
- `App.tsx` - Main application component with routing and state management
- `components/` - React components (Header, PostCard, PostDetail, Newsletter, Editor)
- `services/` - External service integrations (gemini.ts for AI)
- `functions/` - Server-side API functions (posts, health)
- `public/` - Static assets (images, JSON data)
- `types.ts` - TypeScript type definitions
- `constants.tsx` - Initial posts and constants

## Tech Stack
- React 18 with TypeScript
- Vite for build/dev server
- Tailwind CSS (via CDN)
- React Router for navigation
- Google Gemini AI integration

## Development
- Frontend runs on port 5000 with `npm run dev`
- Production build: `npm run build` outputs to `dist/`

## Architecture Notes
- Posts are loaded from `/posts` API endpoint or fall back to local constants
- Admin mode allows creating/editing posts (password: nerdx)
- Originally designed for Netlify/Cloudflare deployment, now configured for Replit
