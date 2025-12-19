import { Post } from './types';

// Put your logo file in /public (e.g. public/logo.jpg) and reference it from the site root.
export const LOGO_URL = '/logo.jpg';

// If you add real articles, put them in public/posts.json (see README snippet in App.tsx) and the app will load them automatically.
export const INITIAL_POSTS: Post[] = [
  {
    id: 'welcome',
    title: 'Welcome to NerdXNews',
    excerpt: 'Your site is deployed. Next: add your real articles and images.',
    content:
      'This is a placeholder post. To show your 4 real articles, add them to public/posts.json and put images in public/images/. Then redeploy.',
    date: new Date().toISOString().split('T')[0],
    category: 'tech',
    imageUrl: '/logo.jpg',
    author: 'NerdXNews'
  }
];

export const SOCIAL_LINKS = {
  twitter: 'https://x.com',
  github: 'https://github.com/nerdxLinc/nerdxnews',
  newsletter: '#'
};
