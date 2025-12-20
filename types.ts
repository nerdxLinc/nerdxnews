export type Category =
  | 'tech'
  | 'books'
  | 'comics'
  | 'games'
  | 'movies';

export interface Post {
  id: string;

  /** URL-safe identifier used for routing and sharing */
  slug?: string;

  title: string;
  excerpt: string;
  content: string;
  date: string;

  /** Posts must belong to a real category, not "All" */
  category: Category;

  /** Image support (legacy + current) */
  image?: string;
  imageUrl?: string;
  heroImage?: string;

  /** Featured flags (supports legacy + current spelling) */
  isFeatured?: boolean;
  IsFeatured?: boolean;

  /** Optional metadata */
  author?: string;
  tags?: string[];
}
