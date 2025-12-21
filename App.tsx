import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

const STORAGE_KEY = 'nerdxnews_production_build_v1';

// Accept both legacy and current featured flag spellings
const isFeaturedFlag = (p: any) => Boolean(p?.IsFeatured ?? p?.isFeatured);

const slugify = (input: string) => {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
};

const ensureSlugs = (list: Post[]) => {
  const used = new Set<string>();
  return list.map((p) => {
    let base = (p as any).slug ? String((p as any).slug) : slugify((p as any).title);
    if (!base) base = `post-${(p as any).id}`;

    let s = base;
    let n = 2;
    while (used.has(s)) {
      s = `${base}-${n++}`;
    }
    used.add(s);

    return { ...p, slug: s } as Post;
  });
};

const normalizeImagePath = (src?: string) => {
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  if (src.startsWith('/')) return src;
  return `/images/${src}`;
};

async function fetchPublishedPosts(): Promise<Post[] | null> {
  try {
    // posts.json lives in /public so it is served from site root
    const res = await fetch('/posts.json', { cache: 'no-store' });
    if (!res.ok) return null;

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return null;

    // best-effort coerce; your Post typing will guide correctness
    return data as Post[];
  } catch {
    return null;
  }
}

/**
 * Merge posts by id (published first, then local overrides).
 * - Published posts are the canonical public set.
 * - Local posts override same-id published ones (useful for drafts/edits).
 * - Unique slugs are ensured after merge.
 */
function mergePublishedAndLocal(published: Post[], local: Post[]): Post[] {
  const byId = new Map<string, Post>();

  for (const p of published) byId.set(String((p as any).id), p);
  for (const p of local) byId.set(String((p as any).id), p);

  return Array.from(byId.values());
}

const App: React.FC<AppProps> = ({ routeSlug }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- Load local drafts first (fast, offline-friendly) ---
  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window === 'undefined') return ensureSlugs(INITIAL_POSTS);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Post[];
        const base = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_POSTS;
        return ensureSlugs(base);
      }
      return ensureSlugs(INITIAL_POSTS);
    } catch (e) {
      console.error('Failed to load posts', e);
      return ensureSlugs(INITIAL_POSTS);
    }
  });

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null | undefined>(undefined);

  const isEditorActive = editingPost !== undefined;

  // --- Persist posts to localStorage ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      } catch (e) {
        console.error('Failed to save posts', e);
      }
    }
  }, [posts]);

  // --- On first mount, try to load published posts.json ---
  // If found and non-empty, merge it with local drafts and prefer published as baseline.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const published = await fetchPublishedPosts();
      if (cancelled) return;

      if (published && published.length > 0) {
        setPosts((prevLocal) => {
          const merged = mergePublishedAndLocal(published, prevLocal);
          return ensureSlugs(merged);
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // --- If the URL is /articles/:slug, select that post. If URL is /, clear selection. ---
  useEffect(() => {
    if (routeSlug) {
      const found = posts.find((p) => (p.slug || slugify((p as any).title)) === routeSlug);

      if (found) {
        setSelectedPost(found);
      } else {
        // unknown slug: show not found as a pseudo selection (keeps UX coherent)
        setSelectedPost({
          id: '__not_found__',
          title: 'Article Not Found',
          excerpt: 'That link does not match any published article on this build.',
          content:
            'This can happen if the article exists only in local storage on another device, or the slug was changed.\n\nIf you intended this to be live, publish it into public/posts.json and redeploy.',
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

  // Choose the featured post from the current view; fall back safely
  const featuredPost = useMemo(() => {
    const featured = filteredPosts.find((p) => isFeaturedFlag(p));
    if (featured) return featured;

    if (filteredPosts.length > 0) return filteredPosts[0];
    if (posts.length > 0) return posts[0];

    return ensureSlugs(INITIAL_POSTS)[0];
  }, [filteredPosts, posts]);

  // Prevent duplication: remove hero post from the grid list
  const gridPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter((p) => p.id !== featuredPost.id);
  }, [filteredPosts, featuredPost]);

  const goToPost = (post: Post) => {
    const slug = post.slug || slugify((post as any).title) || `post-${(post as any).id}`;
    setSelectedPost(post);
    navigate(`/articles/${slug}`);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSavePost = (updatedPost: Post) => {
    const nextPost: Post = {
      ...updatedPost,
      slug:
        updatedPost.slug && updatedPost.slug.trim().length > 0
          ? slugify(updatedPost.slug)
          : slugify((updatedPost as any).title),
    };

    setPosts((prev) => {
      // Upsert
      const exists = prev.find((p) => p.id === nextPost.id);
      let next = exists ? prev.map((p) => (p.id === nextPost.id ? nextPost : p)) : [nextPost, ...prev];

      // Ensure slugs are present and unique
      next = ensureSlugs(next);

      // If marked Featured: make it the only featured post + move to top
      if (isFeaturedFlag(nextPost)) {
        next = next.map((p) =>
          p.id === nextPost.id
            ? { ...p, IsFeatured: true, isFeatured: true }
            : { ...p, IsFeatured: false, isFeatured: false }
        );

        const hero = next.find((p) => p.id === nextPost.id)!;
        next = [hero, ...next.filter((p) => p.id !== nextPost.id)];
      }

      return next;
    });

    setEditingPost(undefined);

    // Route to the post immediately (shareable URL)
    goToPost(nextPost);
  };

  const handleAdminLogin = () => {
    if (isAdmin) {
      const confirmLogout = window.confirm('Terminate Admin Session?');
      if (confirmLogout) setIsAdmin(false);
      return;
    }

    const password = window.prompt('ENTER COMMAND CODE (Hint: nerdx)');
    if (password && password.toLowerCase() === 'nerdx') {
      setIsAdmin(true);
      alert('ACCESS GRANTED.\n\nEditor Mode Initialized.');
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

  const heroImage =
    normalizeImagePath((featuredPost as any)?.imageUrl) ||
    normalizeImagePath((featuredPost as any)?.image) ||
    normalizeImagePath((featuredPost as any)?.heroImage) ||
    '/images/Alpha-core.jpg';

  if (!featuredPost) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono animate-pulse">
        INITIALIZING DATA STREAM...
      </div>
    );
  }

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
        ) : (
          <>
            {/* Featured Hero Section */}
            <section
              className="relative w-full h-[60vh] md:h-[75vh] min-h-[400px] md:min-h-[500px] flex items-end cursor-pointer group overflow-hidden border-b border-zinc-800"
              onClick={() => goToPost(featuredPost)}
            >
              <div className="absolute inset-0 bg-zinc-900 pointer-events-none">
                <img
                  src={heroImage}
                  alt={(featuredPost as any).title}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-[1.5s] ease-out"
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
                      {(featuredPost as any).date}
                    </span>
                  </div>

                  <h2 className="text-3xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 leading-[0.95] tracking-tight uppercase italic text-white retro-glow title-stroke group-hover:text-yellow-400 transition-colors duration-500 drop-shadow-2xl">
                    {(featuredPost as any).title}
                  </h2>

                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                    <p className="text-sm md:text-xl text-zinc-200 max-w-2xl leading-relaxed font-medium pl-4 border-l-2 border-orange-600 line-clamp-3 md:line-clamp-none">
                      {(featuredPost as any).excerpt}
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
                {(['All', 'Books & Comics', 'Games', 'Movies', 'Tech'] as Category[]).map((cat) => (
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
                    key={(post as any).id}
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

      {isEditorActive && (
        <Editor post={editingPost} onSave={handleSavePost} onClose={() => setEditingPost(undefined)} />
      )}

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
