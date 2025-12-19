export type Category = 'Books & Comics' | 'Games' | 'Movies';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;

  /** Image URL (either absolute https://... or a /images/... path served from /public). */
  imageUrl: string;

  /** Display author name shown on cards/detail. */
  author: string;

  /** Human-readable date string, e.g. "Dec 19, 2025" */
  date: string;

  category: Category;

  /** When true, this post is the lead story on the front page. */
  isFeatured?: boolean;
}
