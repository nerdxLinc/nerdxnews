// App.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Header from './components/Header';
import PostCard from './components/PostCard';
import PostDetail from './components/PostDetail';
import Newsletter from './components/Newsletter';
import Editor from './components/Editor';

import { Post, Category, CategoryFilter } from './types';
import { INITIAL_POSTS } from './constants';

type AppProps = {
  routeSlug?: string;
};

const STORAGE_KEY = 'nerdxnews_production_build_v1';

// Accept both legacy and current featured flag spellings + numeric flags
const isFeaturedFlag = (p: any) => {
  const v = p?.IsFeatured ?? p?.isFeatured;
  if (v === true) return true;
  if (v === 1 || v === '1') return true;
  return Boolean(v);
};

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

function normalizeServerList(data: any): Post[] {
  if (Array.isArray(data)) return data as Post[];
  if (Array.isArray(data?.posts)) return data.posts as Post[];
  if (Array.isArray(data?.results)) return data.results as Post[];
  return [];
}

async function fetchPostsFromServer(admin: boolean): Promise<Post[]> {
  const url = admin ? '/posts?admin=true' : '/posts';
  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to load posts (${res.status})`);
  }

  const data = await res.json();
  return normalizeServerList(data);
}

async function fetchPostBySlugFromServer(slug: string, admin: boolean): Promise<Post | null> {
  const url = admin
    ? `/posts?admin=true&slug=${encodeURIComponent(slug)}`
    : `/posts?slug=${encodeURIComponent(slug)}`;

  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to load post (${res.status})`);
  }

  const data = await res.json();
  const row = data?.post ?? null;
  return row ? (row as Post) : null;
}

async function postToServer(payload: any): Promise<{ success: boolean; slug?: string }> {
  const res = await fetch('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(text || `Publish failed (${res.status})`);

  try {
    return JSON.parse(text);
  } catch {
    return { success: true };
  }
}

async function deletePostFromServer(slug: string): Promise<{ ok: boolean }> {
  const res = await fetch('/posts', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(text || `Delete failed (${res.status})`);

  try {
    return JSON.parse(text);
  } catch {
    return { ok: true };
  }
}

const App: React.FC<AppProps> = ({ routeSlug }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Route slug fallback: derive from pathname or query param if prop isn't present.
  const effectiveRouteSlug = useMemo(() => {
    if (routeSlug && String(routeSlug).trim()) return String(routeSlug).trim();

    // Check for ?article=slug query parameter (from OG redirects)
    const params = new URLSearchParams(location.search);
    const articleParam = params.get('article');
    if (articleParam && articleParam.trim()) {
      return articleParam.trim();
    }

    const path = (location.pathname || '').trim();
    const prefix = '/articles/';
    if (path.startsWith(prefix)) {
      const raw = path.slice(prefix.length);
      const cleaned = raw.split('?')[0].split('#')[0];
      try {
        return decodeURIComponent(cleaned);
      } catch {
        return cleaned;
      }
    }
    return '';
  }, [routeSlug, location.pathname, location.search]);

  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window === 'undefined') return ensureSlugs(INITIAL_POSTS);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Post[];
        const merged = parsed.length > 0 ? parsed : INITIAL_POSTS;
        return ensureSlugs(merged);
      }
      return ensureSlugs(INITIAL_POSTS);
    } catch {
      return ensureSlugs(INITIAL_POSTS);
    }
  });

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null | undefined>(undefined);

  const isEditorActive = editingPost !== undefined;

  // Load from server on mount (published feed).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const list = await fetchPostsFromServer(false);
        if (cancelled) return;

        const next = ensureSlugs(list.length > 0 ? list : INITIAL_POSTS);
        setPosts(next);
      } catch (e) {
        console.error('Server load failed (keeping local)', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist posts locally (cache only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      } catch (e) {
        console.error('Failed to save posts', e);
      }
    }
  }, [posts]);

  // Deep link resolver:
  // If URL is /articles/:slug:
  // 1) try local list match
  // 2) if not found, fetch single post from server by slug
  // If URL is /, clear selection
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const slug = (effectiveRouteSlug || '').trim();

      if (slug) {
        // First try local list
        const found = posts.find((p) => (p.slug || slugify(p.title)) === slug);
        if (found) {
          setSelectedPost(found);
          return;
        }

        // Then fetch by slug from server (published feed)
        try {
          const one = await fetchPostBySlugFromServer(slug, false);
          if (cancelled) return;

          if (one) {
            // ensure it has a slug field
            const hydrated = { ...(one as any), slug: (one as any).slug || slug } as Post;

            // merge into posts list so next navigation stays consistent
            setPosts((prev) => {
              const exists = prev.some((p) => (p.slug || slugify(p.title)) === slug);
              if (exists) return prev;
              return ensureSlugs([hydrated, ...prev]);
            });

            setSelectedPost(hydrated);
            return;
          }
        } catch (e) {
          console.error('Fetch by slug failed', e);
        }

        // Not found: show explicit not-found view (still renders PostDetail)
        setSelectedPost({
          id: '__not_found__',
          title: 'Article Not Found',
          excerpt: 'That link does not match any published article on this build.',
          content:
            'This article slug could be wrong, or the article may be unpublished.\n\nReturn to the feed and open the article again, then copy the link from the article page.',
          date: new Date().toISOString().split('T')[0],
          category: 'Tech' as any,
          slug,
        } as Post);
        return;
      }

      // No slug: if at home, clear selection
      if (location.pathname === '/' || location.pathname === '') {
        setSelectedPost(null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRouteSlug, posts, location.pathname]);

  const filteredPosts = useMemo(() => {
    let list = posts.filter((p) => p.id !== (selectedPost?.id || ''));
    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory);
    }
    return list;
  }, [posts, activeCategory, selectedPost]);

  // Choose the featured post from the current view.
  const featuredPost = useMemo(() => {
    const featured = filteredPosts.find((p) => isFeaturedFlag(p));
    if (featured) return featured;

    if (filteredPosts.length > 0) return filteredPosts[0];
    if (posts.length > 0) return posts[0];

    return null;
  }, [filteredPosts, posts]);

  // Prevent duplication: remove hero post from the grid list
  const gridPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter((p) => p.id !== featuredPost.id);
  }, [filteredPosts, featuredPost]);

  const goToPost = (post: Post) => {
    const slug = (post as any).slug || slugify(post.title) || `post-${post.id}`;
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
      (updatedPost as any).slug && String((updatedPost as any).slug).trim().length > 0
        ? slugify(String((updatedPost as any).slug))
        : slugify(updatedPost.title);

    const featured = isFeaturedFlag(updatedPost);

    const payload: any = {
      ...updatedPost,
      id: (updatedPost as any).id || crypto.randomUUID(),
      slug: normalizedSlug,

      excerpt: (updatedPost as any).excerpt ?? (updatedPost as any).blurb ?? '',
      imageUrl: (updatedPost as any).imageUrl ?? (updatedPost as any).image ?? '',
      date: (updatedPost as any).date ?? new Date().toISOString().split('T')[0],
      category: (updatedPost as any).category ?? 'Books & Comics',
      byline: (updatedPost as any).byline ?? 'NerdX',
      status: (updatedPost as any).status ?? 'published',

      // numeric flag for D1
      isFeatured: featured ? 1 : 0,

      // keep legacy for UI paths that read it
      IsFeatured: featured ? 1 : 0,
    };

    try {
      await postToServer(payload);

      const list = await fetchPostsFromServer(true);

      const normalized = list.map((p: any) => ({
        ...p,
        isFeatured: p.isFeatured === 1 || p.isFeatured === '1' || p.isFeatured === true ? 1 : 0,
        IsFeatured: p.IsFeatured === 1 || p.IsFeatured === '1' || p.IsFeatured === true ? 1 : 0,
      })) as Post[];

      const next = ensureSlugs(normalized);
      setPosts(next);

      setEditingPost(undefined);

      const saved = next.find((p) => (p.slug || slugify(p.title)) === normalizedSlug);
      if (saved) goToPost(saved);
      else goToPost(payload as Post);
    } catch (e) {
      console.error('Publish error:', e);

      const msg =
        e instanceof Error
          ? e.message
          : typeof e === 'string'
            ? e
            : JSON.stringify(e);

      alert(`PUBLISH FAILED.\n\n${msg}`);
    }

  };

  const handleAdminLogin = async () => {
    if (isAdmin) {
      const confirmLogout = window.confirm('Terminate Admin Session?');
      if (confirmLogout) setIsAdmin(false);
      return;
    }

    const password = window.prompt('ENTER COMMAND CODE (Hint: nerdx)');
    if (password && password.toLowerCase() === 'nerdx') {
      setIsAdmin(true);

      try {
        const list = await fetchPostsFromServer(true);
        setPosts(ensureSlugs(list.length > 0 ? list : posts));
      } catch (e) {
        console.error('Admin refresh failed (keeping current list)', e);
      }
    } else {
      if (password !== null) {
        alert('ACCESS DENIED.');
      }
    }
  };

  const handleDeletePost = async (post: Post) => {
    const postSlug = (post as any).slug || slugify(post.title);
    
    try {
      await deletePostFromServer(postSlug);
      
      setPosts((prev) => prev.filter((p) => {
        const pSlug = (p as any).slug || slugify(p.title);
        return pSlug !== postSlug;
      }));
      
      if (selectedPost) {
        const selectedSlug = (selectedPost as any).slug || slugify(selectedPost.title);
        if (selectedSlug === postSlug) {
          setSelectedPost(null);
          navigate('/');
        }
      }
    } catch (e) {
      console.error('Delete error:', e);
      alert(`Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const onHome = () => {
    setSelectedPost(null);
    setActiveCategory('All');
    navigate('/');
  };

  const heroImage = pickHeroImage(featuredPost as any) || '/images/Alpha-core.jpg';
  const heroExcerpt = pickExcerpt(featuredPost as any);

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden flex flex-col selection:bg-orange-500 selection:text-white bg-[#050505] ${isAdmin ? 'border-t-4 border-orange-600' : ''
        }`}
    >
      {isAdmin && (
        <div className="fixed bottom-4 left-4 z-[50] bg-orange-600 text-white text-[10px] font-black px-4 py-2 tracking-widest uppercase shadow-lg border border-white/20 pointer-events-none">
          EDITOR MODE ACTIVE
        </div>
      )}

      <Header onHome={onHome} onAdminToggle={handleAdminLogin} isAdmin={isAdmin} />

      <main className="flex-1 relative w-full overflow-x-hidden">
        {selectedPost ? (
          <PostDetail post={selectedPost} onBack={onHome} isAdmin={isAdmin} onEdit={(p) => setEditingPost(p)} />
        ) : featuredPost ? (
          <>
            {/* Featured Hero Section */}
            <section
              className="relative w-full h-[60vh] md:h-[75vh] min-h-[400px] md:min-h-[500px] flex items-end cursor-pointer group overflow-hidden border-b border-zinc-800"
              onClick={() => goToPost(featuredPost)}
            >
              {/* ADMIN: Edit Hero Button */}
              {isAdmin && featuredPost && (
                <div className="absolute top-4 right-4 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingPost(featuredPost);
                    }}
                    className="bg-orange-600 hover:bg-orange-500 text-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0_0_#fff] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-white"
                  >
                    Edit Hero
                  </button>
                </div>
              )}

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

                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center min-w-0">
                    <p className="text-sm md:text-xl text-zinc-200 max-w-2xl leading-relaxed font-medium pl-4 border-l-2 border-orange-600 line-clamp-3 md:line-clamp-none break-words">
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
            <div className="sticky top-[65px] md:top-[73px] z-40 bg-[#050505]/95 backdrop-blur-md border-b border-zinc-800 overflow-x-hidden">
              <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex overflow-x-auto no-scrollbar gap-6 md:gap-8">
                {(['All', 'Books & Comics', 'Games', 'Movies'] as CategoryFilter[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all flex-shrink-0 ${activeCategory === cat ? 'text-orange-600 scale-105' : 'text-zinc-500 hover:text-white'
                      }`}
                  >
                    {cat === 'All' ? '/// All Feeds' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Grid */}
            <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {gridPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => goToPost(post)}
                    onEdit={isAdmin ? () => setEditingPost(post) : undefined}
                    onDelete={isAdmin ? handleDeletePost : undefined}
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

      <footer className="border-t border-zinc-800 bg-black py-12 px-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2 text-center md:text-left min-w-0">
            <span className="text-2xl font-['Orbitron'] font-black text-white tracking-tighter break-words">
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
