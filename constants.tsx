import { Post } from './types';

export const LOGO_URL = '/logo.jpg';

export const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    title: 'Welcome to NerdXNews',
    excerpt: 'Your deployment is working.',
    content: 'This is a placeholder post generated to ensure the site builds.',
    date: new Date().toISOString().split('T')[0],
    category: 'Tech',
    imageUrl: '/images/Alpha-core.jpg',
    isFeatured: true,
    IsFeatured: true,
  },
];

export const SOCIAL_LINKS = {
  twitter: 'https://x.com',
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  github: 'https://github.com',
  newsletter: 'https://lincolnbransch.substack.com',
};
