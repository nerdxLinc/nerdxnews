export type Category = 'news' | 'opinion' | 'tech' | 'culture' | 'sports' | 'business';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: Category | string;
  // Image path served from /public (e.g. "/images/my-photo.jpg") or full URL
  imageUrl?: string;
  // Back-compat (some code may still reference `image`)
  image?: string;
  author?: string;
}
