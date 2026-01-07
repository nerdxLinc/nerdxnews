// types.ts

/** Legacy categories (older builds / older seeded content) */
export type LegacyCategory =
  | 'tech'
  | 'books'
  | 'comics'
  | 'games'
  | 'movies';

/** Live site / UI categories (what your current app and D1 are using) */
export type SiteCategory =
  | 'Tech'
  | 'Books & Comics'
  | 'Games'
  | 'Movies';

/**
 * Category stored on a Post.
 * Supports both legacy + current values so old content doesn't break.
 */
export type Category =
  | "All"
  | "Books & Comics"
  | "Tabletop Games & RPGs"
  | "Video Games"
  | "Movies"
  | "Television"
  | "Pop Culture";

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "img"; url: string; alt?: string; caption?: string };


/** UI filter category (adds "All") */
export type CategoryFilter = 'All' | Category;

export interface Post {
  id: string;

  /** URL-safe identifier used for routing and sharing */
  slug?: string;

  title: string;
  excerpt: string;
  content: string;
  contentBlocks?: ContentBlock[];
  date: string;

  /** Posts must belong to a real category, not "All" */
  category: Category;

  /** Image support (legacy + current) */
  image?: string;
  imageUrl?: string;
  heroImage?: string;

  /** Featured flags (supports legacy + current spelling) */
  isFeatured?: boolean | 0 | 1;
  IsFeatured?: boolean | 0 | 1;

  /** Optional metadata */
  author?: string;
  tags?: string[];

  /** Optional fields you’re already using in D1 results */
  status?: string;
  byline?: string;
  created_at?: string;
  updated_at?: string;
}
