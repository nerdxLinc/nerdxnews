export const LOGO_URL = '/logo.jpg';
import { Post } from './types';


export const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    title: 'Welcome to NerdXNews',
    excerpt: 'Your deployment is working.',
    content: 'This is a placeholder post generated to ensure the site builds.',
    date: new Date().toISOString().split('T')[0],
    category: 'tech'
  }
];

export const SOCIAL_LINKS = {
  twitter: 'https://x.com',
  github: 'https://github.com',
  newsletter: '#'
};