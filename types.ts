// src/types.ts

export type Category = 'All' | 'Books & Comics' | 'Games' | 'Movies';

export interface Post {
  id: string;

  title: string;
  excerpt: string;
  content?: string;

  date: string;
  category: Exclude<Category, 'All'>; // posts should be one of the real categories

  // Images (your code supports multiple legacy names)
  image?: string;
  imageUrl?: string;
  heroImage?: string;

  // Featured flags (supports both spellings)
  isFeatured?: boolean;
  IsFeatured?: boolean;

  // Optional metadata (safe to have, doesn’t break anything if unused)
  author?: string;
  tags?: string[];
}
