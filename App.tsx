import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import PostCard from './components/PostCard';
import PostDetail from './components/PostDetail';
import Newsletter from './components/Newsletter';
import Editor from './components/Editor';
import { INITIAL_POSTS } from './constants';
import { Post } from './types';

// This app loads posts in this order:
// 1) LocalStorage (so your edits persist in your browser)
// 2) public/posts.json (so you can ship real articles with your deploy)
// 3) constants.tsx INITIAL_POSTS (fallback)
//
// To add your 4 real articles:
// - Put images in: public/images/
// - Add/replace entries in: public/posts.json
// - Push to GitHub -> Netlify will redeploy.

const STORAGE_KEY = 'nerdxnews.posts.v1';

async function loadPostsJson(): Promise<Post[] | null> {
  try {
    const res = await fetch('/posts.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data as Post[];
  } catch {
    return null;
  }
}

function loadFromStorage(): Post[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Post[]) : null;
  } catch {
    return null;
  }
}

function saveToStorage(posts: Post[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // ignore
  }
}

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);

  // Load posts from storage / posts.json on first mount
  useEffect(() => {
    const fromStorage = loadFromStorage();
    if (fromStorage && fromStorage.length) {
      setPosts(fromStorage);
      return;
    }
    loadPostsJson().then((jsonPosts) => {
      if (jsonPosts && jsonPosts.length) setPosts(jsonPosts);
    });
  }, []);

  // Persist posts if admin edits them
  useEffect(() => {
    saveToStorage(posts);
  }, [posts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => set.add(String(p.category)));
    return ['All', ...Array.from(set).sort()];
  }, [posts]);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return posts;
    return posts.filter((p) => String(p.category) === activeCategory);
  }, [posts, activeCategory]);

  const featured = filtered[0] ?? posts[0];

  const handleAdminLogin = () => {
    // Simple toggle for prototype. Replace with real auth later.
    setIsAdmin((v) => !v);
  };

  const handleSavePost = (draft: Post) => {
    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === draft.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = draft;
        return next;
      }
      return [draft, ...prev];
    });
    setEditingPost(null);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <Header
        onHome={() => {
          setSelectedPost(null);
          setActiveCategory('All');
        }}
        onAdminToggle={handleAdminLogin}
        isAdmin={isAdmin}
      />

      {editingPost ? (
        <Editor post={editingPost} onSave={handleSavePost} onCancel={() => setEditingPost(null)} />
      ) : (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
          {/* Hero / Featured */}
          {featured && (
            <section className="border border-orange-500/40 bg-zinc-950/60 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-5 sm:p-8">
                  <div className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-orange-400">
                    Featured
                  </div>
                  <h2 className="mt-2 text-2xl sm:text-4xl font-black leading-tight">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-zinc-300">
                    {featured.excerpt}
                  </p>

                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPost(featured)}
                      className="px-4 py-3 font-bold uppercase border border-orange-500 bg-orange-600/90 hover:bg-orange-500 transition"
                    >
                      Read →
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setEditingPost(featured)}
                        className="px-4 py-3 font-bold uppercase border border-orange-500/60 text-orange-300 hover:bg-orange-500/10 transition"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="aspect-[16/9] md:aspect-auto bg-zinc-900">
                  {(featured.imageUrl || featured.image) ? (
                    <img
                      src={featured.imageUrl || featured.image}
                      alt={featured.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">
                      No image
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Category tabs */}
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                className={`px-3 py-2 text-xs sm:text-sm font-bold uppercase border transition
                  ${activeCategory === c ? 'border-orange-500 text-orange-300' : 'border-zinc-800 text-zinc-300 hover:border-orange-500/70'}`}
              >
                {c}
              </button>
            ))}
            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setEditingPost({
                    id: String(Date.now()),
                    title: '',
                    excerpt: '',
                    content: '',
                    date: new Date().toISOString().split('T')[0],
                    category: 'news',
                    imageUrl: '',
                    author: ''
                  })
                }
                className="ml-auto px-3 py-2 text-xs sm:text-sm font-bold uppercase border border-orange-500 bg-orange-600/90 hover:bg-orange-500 transition"
              >
                + New
              </button>
            )}
          </div>

          {/* Grid */}
          <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                isAdmin={isAdmin}
                onClick={(post) => setSelectedPost(post)}
                onEdit={(post) => setEditingPost(post)}
              />
            ))}
          </section>

          <Newsletter />
        </main>
      )}

      {/* Detail view (on top of list) */}
      {selectedPost && !editingPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm overflow-auto z-50">
          <div className="min-h-full">
            <PostDetail
              post={selectedPost}
              isAdmin={isAdmin}
              onBack={() => setSelectedPost(null)}
              onEdit={(p) => setEditingPost(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
