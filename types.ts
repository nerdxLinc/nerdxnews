export type Category = 'news' | 'opinion' | 'tech' | 'culture';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  date: string;
  category: Category;
}