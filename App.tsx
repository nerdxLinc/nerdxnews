// App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Header from './components/Header';
import PostCard from './components/PostCard';
import PostDetail from './components/PostDetail';
import Newsletter from './components/Newsletter';
import Editor from './components/Editor';

import { Post, Category } from './types';
import { INITIAL_POSTS } from './constants';

type AppProps = {
  routeSlug?: string;
};

// LIVE endpoint (Cloudflare Pages Functions)
const POSTS_ENDPOINT = '/posts';

// Accept both legacy and current featured flag spellings (and numeric flags)
const isFeaturedFlag = (p: any) =>
  Boolean(
    p?.IsFeatured ??
      p?.isFeatured ??
      (typeof p?.isFeatured === 'number' ? p.isFeatured === 1 : false) ??
      (typeof p?.IsFeatured === 'number' ? p.IsFeatured === 1 : false)
  );

const slugify = (input: string) => {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
};

const normalizeImagePath = (src?: string) => {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('/')) return src;
  return `/images/${src}`;
};

const pickHeroImage = (p: any): string => {
  return (
    normalizeImagePath(p?.imageUrl) ||
    normalizeImagePath(p?.image) ||
    normalizeImagePath(p?.heroImage) ||
    normalizeImagePath(p?.coverImage) ||
    normalizeImagePath(p?.hero) ||
    ''
  );
};

const pickExcerpt = (p: any): string => {
  return String(p?.excerpt ?? p?.blurb ?? p?.summary ?? p?.dek ?? p?.description ?? '').trim();
};

const ensureSlugs = (list: Post[]) => {
  const used = new Set<string>();
  return list.map((p) => {
    let base = (p as any).slug ? String((p as any).slug) : slugify(p.title);
    if (!base) base = `post-${p.id}`;

    let s = base;
    let n = 2;
    while (used.has(s)) {
      s = `${base}-${n++}`;
    }
    used.add(s);

    return { ...p, slug: s };
  });
};

async function fetchPostsFromServer(admin: boolean): Promise<Post[]> {
  const url = admin ? `${POSTS_ENDPOINT}?admin=true` : `${POSTS_ENDPOINT}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Failed to load posts: ${res.status} ${t}`);
  }

  const data = await res.json();

  // Support either {posts:[...]} or legacy array response
  const list = Array.isArray(data) ? data : data?.posts;
  return (Array.isArray(list) ? list : []) as Post[];
}

async function postToServer(post: any): Promise<void> {
  const res = await fetch(POSTS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(post),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Publish failed: ${res.status} ${t}`);
  }
}

const App: React.FC<AppProps> = ({ routeSlug }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Start empty; we load from D1 via /posts immediately
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null | undefined>(undefined);

  // Initial load (published)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    (async () => {
      try {
        const list = await fetchPostsFromServer(false);
        const next = ensureSlugs(list.length > 0 ? list : (INITIAL_POSTS as any));
        setPosts(next);
      } catch (e) {
        console.error(e);
        // Fallback only if server fails
        setPosts(ensureSlugs(INITIAL_POSTS as any));
      }
    })();
  }, []);

  // Route selection: /articles/:slug
  useEffect(() => {
    if (routeSlug) {
      const found = posts.find((p) => (p.slug || slugify(p.title)) === routeSlug);
      if (found) {
        setSelectedPost(found);
      } else {
        setSelectedPost({
          id: '__not_found__',
          title: 'Article Not Found',
          excerpt: 'That link does not match any published article on this build.',
          content:
            'This can happen if the article exists only in local storage on another device, or the slug was changed.\n\nReturn to the feed and open the article again, then copy the link from the article page.',
          date: new Date().toISOString().split('T')[0],
          category: 'Tech' as any,
          slug: routeSlug,
        } as Post);
      }
    } else {
      if (location.pathname === '/' || location.pathname === '') {
        setSelectedPost(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSlug, posts]);

  const filteredPosts = useMemo(() => {
    let list = posts.filter((p) => p.id !== (selectedPost?.id || ''));
    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory);
    }
    return list;
  }, [posts, activeCategory, selectedPost]);

  const featuredPost = useMemo(() => {
    const featured = filteredPosts.find((p) => isFeaturedFlag(p));
    if (featured) return featured;

    if (filteredPosts.length > 0) return filteredPosts[0];
    if (posts.length > 0) return posts[0];

    return null;
  }, [filteredPosts, posts]);

  const gridPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter((p) => p.id !== featuredPost.id);
  }, [filteredPosts, featuredPost]);

  const goToPost = (post: Post) => {
    const slug = post.slug || slugify(post.title) || `post-${post.id}`;
    setSelectedPost(post);
    navigate(`/articles/${slug}`);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // STRAIGHT LINE PUBLISH:
  // Editor Save -> POST /posts -> reload from server -> navigate
  const handleSavePost = async (updatedPost: Post) => {
    const normalizedSlug =
      updatedPost.slug && updatedPost.slug.trim().length > 0 ? slugify(updatedPost.slug) : slugify(updatedPost.title);

    const payload: any = {
      ...updatedPost,
      id: (updatedPost as any).id || crypto.randomUUID(),
      slug: normalizedSlug,
      // normalize common fields expected by your D1 schema
      excerpt: (updatedPost as any).excerpt ?? (updatedPost as any).blurb ?? '',
      imageUrl: (updatedPost as any).imageUrl ?? (updatedPost as any).image ?? '',
      date: (updatedPost as any).date ?? new Date().toISOString().split('T')[0],
      category: (updatedPost as any).category ?? 'Tech',
      byline: (updatedPost as any).byline ?? '',
      status: (updatedPost as any).status ?? 'published',
      // send numeric flag to match D1
      isFeatured: isFeaturedFlag(updatedPost) ? 1 : 0,
      // also keep legacy for your UI logic if any component reads it
      IsFeatured: isFeaturedFlag(updatedPost) ? 1 : 0,
    };

    try {
      await postToServer(payload);

      // Reload (admin view so you see everything if you ever use drafts)
      const list = await fetchPostsFromServer(true);
      const next = ensureSlugs(list);
      setPosts(next);

      setEditingPost(undefined);

      const saved = next.find((p) => (p.slug || slugify(p.title)) === normalizedSlug);
      if (saved) goToPost(saved);
      else goToPost(payload as Post);
    } catch (e) {
      console.error(e);
      alert('PUBLISH FAILED. Check /posts endpoint + D1 binding.');
    }
  };

  const handleAdminLogin = async () => {
    if (isAdmin) {
      const confirmLogout = window.confirm('Terminate Admin Session?');
      if (confirmLogout) {
        setIsAdmin(false);
        // Refresh published view
        try {
          const list = await fetchPostsFromServer(false);
          setPosts(ensureSlugs(list.length > 0 ? list : (INITIAL_POSTS as any)));
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    const password = window.prompt('ENTER COMMAND CODE (Hint: nerdx)');
    if (password && password.toLowerCase() === 'nerdx') {
      setIsAdmin(true);
      alert('ACCESS GRANTED.\n\nEditor Mode Initialized.');

      // Refresh admin view
      try {
        const list = await fetchPostsFromServer(true);
        setPosts(ensureSlugs(list.length > 0 ? list : (INITIAL_POSTS as any)));
      } catch (e) {
        console.error(e);
      }
    } else {
      if (password !== null) {
        alert('ACCESS DENIED.');
      }
    }
  };

  const onHome = () => {
    setSelectedPost(null);
    setActiveCategory('All');
    navigate('/');
  };

  const isEditorActive = editingPost !== undefined;

  const heroImage = pickHeroImage(featuredPost as any) || '/images/Alpha-core.jpg';
  const heroExcerpt = pickExcerpt(featuredPost as any);

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-orange-500 selection:text-white bg-[#050505] ${
        isAdmin ? 'border-t-4 border-orange-600' : ''
      }`}
    >
      {isAdmin && (
        <div className="fixed bottom-4 left-4 z-[50] bg-orange-600 text-white text-[10px] font-black px-4 py-2 tracking-widest uppercase shadow-lg border border-white/20 pointer-events-none">
          EDITOR MODE ACTIVE
        </div>
      )}

      <Header onHome={onHome} onAdminToggle={handleAdminLogin} isAdmin={isAdmin} />

      <main className="flex-1 relative">
        {selectedPost ? (
          <PostDetail post={selectedPost} onBack={onHome} isAdmin={isAdmin} />
        ) : featuredPost ? (
          <>
            {/* Featured Hero Section */}
            <section
              className="relative w-full h-[60vh] md:h-[75vh] min-h-[400px] md:min-h-[500px] flex items-end cursor-pointer group overflow-hidden border-b border-zinc-800"
              onClick={() => goToPost(featuredPost)}
            >
              <div className="absolute inset-0 bg-zinc-900 pointer-events-none">
                <img
                  src={heroImage}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-[1.5s] ease-out"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent opacity-90 pointer-events-none"></div>

              <div className="relative z-10 max-w-7xl mx-auto w-full px-4 md:px-6 pb-8 md:pb-16">
                <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <div className="flex items-center gap-4 mb-4 md:mb-6">
                    <span className="px-2 md:px-3 py-1 bg-orange-600/90 backdrop-blur-md text-white text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                      Featured Intel
                    </span>
                    <div className="h-px w-6 md:w-8 bg-white/40"></div>
                    <span className="text-zinc-300 text-[9px] md:text-[10px] font-mono uppercase tracking-widest">
                      {featuredPost.date}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 leading-[0.95] tracking-tight uppercase italic text-white retro-glow title-stroke group-hover:text-yellow-400 transition-colors duration-500 drop-shadow-2xl">
                    {featuredPost.title}
                  </h2>

                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                    <p className="text-sm md:text-xl text-zinc-200 max-w-2xl leading-relaxed font-medium pl-4 border-l-2 border-orange-600 line-clamp-3 md:line-clamp-none">
                      {heroExcerpt}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPost(featuredPost);
                      }}
                      className="w-full md:w-auto whitespace-nowrap bg-white text-black px-6 py-3 md:px-8 md:py-4 font-black uppercase tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] text-xs md:text-sm"
                    >
                      Read Protocol &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter Bar */}
            <div className="sticky top-[65px] md:top-[73px] z-40 bg-[#050505]/95 backdrop-blur-md border-b border-zinc-800">
              <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex overflow-x-auto no-scrollbar gap-6 md:gap-8">
                {(['All', 'Books & Comics', 'Games', 'Movies'] as Category[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all flex-shrink-0 ${
                      activeCategory === cat ? 'text-orange-600 scale-105' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {cat === 'All' ? '/// All Feeds' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {gridPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => goToPost(post)}
                    onEdit={isAdmin ? () => setEditingPost(post) : undefined}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </div>

            <Newsletter />
          </>
        ) : (
          <div className="min-h-[70vh] flex items-center justify-center px-6">
            <div className="max-w-xl w-full text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4">No published intel</div>
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight text-white mb-4">
                Ready when you are.
              </h2>
              <p className="text-sm md:text-base text-zinc-300 leading-relaxed mb-8">
                There are currently no published articles on this build. Enter Admin mode to create the first post.
              </p>

              {isAdmin && (
                <button
                  onClick={() => setEditingPost(null)}
                  className="w-full md:w-auto bg-white text-black px-6 py-3 md:px-8 md:py-4 font-black uppercase tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] text-xs md:text-sm"
                >
                  Create First Article &rarr;
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 bg-black py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="text-2xl font-['Orbitron'] font-black text-white tracking-tighter">
              NERD<span className="text-orange-600">X</span>NEWS
            </span>
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Est. 2024 /// The Resistance</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <a href="#" className="hover:text-orange-600 transition-colors">
              Manifesto
            </a>
            <a href="#" className="hover:text-orange-600 transition-colors">
              Encrypted Comms
            </a>
            <a href="#" className="hover:text-orange-600 transition-colors">
              Support
            </a>
          </div>

          <div className="text-[10px] text-zinc-700 font-mono text-center md:text-right">© 2024 NERDXNEWS. SYSTEM SECURE.</div>
        </div>
      </footer>

      {isEditorActive && <Editor post={editingPost} onSave={handleSavePost} onClose={() => setEditingPost(undefined)} />}

      {isAdmin && !isEditorActive && !selectedPost && (
        <button
          onClick={() => setEditingPost(null)}
          className="fixed bottom-6 right-6 z-[100] bg-orange-600 text-white w-14 h-14 md:w-16 md:h-16 flex items-center justify-center shadow-[4px_4px_0_0_#fff] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-white group"
          aria-label="Create New Article"
        >
          <span className="text-3xl md:text-4xl font-black group-hover:rotate-90 transition-transform">+</span>
        </button>
      )}
    </div>
  );
};

export default App;
