import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import PostCard from './components/PostCard';
import PostDetail from './components/PostDetail';
import Newsletter from './components/Newsletter';
import Editor from './components/Editor';
import { Post, Category } from './types';
import { INITIAL_POSTS, SOCIAL_LINKS } from './constants';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('nerdxnews_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null | undefined>(undefined); 

  useEffect(() => {
    localStorage.setItem('nerdxnews_posts', JSON.stringify(posts));
  }, [posts]);

  const featuredPost = useMemo(() => posts.find(p => p.isFeatured) || posts[0], [posts]);
  
  const filteredPosts = useMemo(() => {
    let list = posts.filter(p => p.id !== (selectedPost?.id || ''));
    if (activeCategory !== 'All') {
      list = list.filter(p => p.category === activeCategory);
    }
    return list;
  }, [posts, activeCategory, selectedPost]);

  const handleSavePost = (updatedPost: Post) => {
    setPosts(prev => {
      const exists = prev.find(p => p.id === updatedPost.id);
      if (exists) {
        return prev.map(p => p.id === updatedPost.id ? updatedPost : p);
      }
      return [updatedPost, ...prev];
    });
    setEditingPost(undefined);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-orange-500 selection:text-white ${isAdmin ? 'border-4 border-orange-500/20' : ''}`}>
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-600 text-black text-[10px] font-black text-center py-1 tracking-[0.5em] uppercase animate-pulse pointer-events-none">
          SYSTEM ACCESS GRANTED • EDITOR MODE ACTIVE
        </div>
      )}
      
      <Header 
        onHome={() => { setSelectedPost(null); setActiveCategory('All'); }}
        onAdminToggle={() => setIsAdmin(!isAdmin)}
        isAdmin={isAdmin}
      />

      <main className="flex-1">
        {selectedPost ? (
          <PostDetail 
            post={selectedPost} 
            onBack={() => setSelectedPost(null)} 
            isAdmin={isAdmin}
          />
        ) : (
          <>
            <section 
              className="relative w-full h-[60vh] md:h-[80vh] flex items-end cursor-pointer group"
              onClick={() => handlePostClick(featuredPost)}
            >
              <img 
                src={featuredPost.imageUrl} 
                alt={featuredPost.title} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
              
              <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-20">
                <div className="max-w-3xl">
                  <div className="inline-block px-4 py-1 bg-orange-600/20 border border-orange-500 text-orange-500 text-[10px] font-black tracking-[0.4em] uppercase mb-6 rounded-none transform -skew-x-12">
                    TOP SECRET INTEL
                  </div>
                  <h2 className="text-4xl md:text-8xl font-black mb-8 leading-[0.9] retro-glow uppercase italic">
                    {featuredPost.title}
                  </h2>
                  <p className="text-xl md:text-2xl text-zinc-300 mb-10 line-clamp-2 max-w-2xl leading-relaxed font-medium">
                    {featuredPost.excerpt}
                  </p>
                  <button className="btn-retro px-12 py-5 rounded-sm font-black text-black uppercase tracking-[0.2em] italic text-sm shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
                    READ THE FULL REPORT
                  </button>
                </div>
              </div>
            </section>

            <Newsletter />

            <section className="max-w-7xl mx-auto px-6 py-24">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic">LATEST BROADCASTS</h2>
                  <div className="w-32 h-2 bg-orange-500 transform -skew-x-12"></div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  {(['All', 'Books & Comics', 'Games', 'Movies'] as Category[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-5 py-2 rounded-none text-xs font-black uppercase tracking-widest transition-all transform -skew-x-12 ${
                        activeCategory === cat 
                        ? 'bg-zinc-100 text-black' 
                        : 'text-zinc-500 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  {isAdmin && (
                    <button
                      onClick={() => setEditingPost(null)}
                      className="ml-4 px-6 py-2 bg-orange-600 text-white rounded-none text-xs font-black uppercase tracking-widest hover:bg-orange-500 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] transform -skew-x-12 animate-pulse"
                    >
                      + NEW INTEL
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    isAdmin={isAdmin}
                    onClick={handlePostClick}
                    onEdit={(p) => setEditingPost(p)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="bg-zinc-950 border-t-4 border-zinc-900 py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="md:col-span-2">
            <h2 className="text-4xl font-black mb-8 uppercase italic tracking-tighter">NERDX<span className="text-orange-500">NEWS</span></h2>
            <p className="text-zinc-500 max-w-sm leading-relaxed mb-10 font-bold uppercase text-xs tracking-[0.2em]">
              Documenting the evolution of nerd culture since the golden age. Join the frontlines of the Nerd X Army.
            </p>
            <div className="flex gap-4">
              <a href={SOCIAL_LINKS.x} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-none bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center hover:border-orange-500 hover:shadow-[0_0_20px_rgba(255,87,34,0.4)] transition-all group transform hover:-translate-y-1">
                <svg className="w-6 h-6 fill-zinc-500 group-hover:fill-orange-500" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-none bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center hover:border-orange-500 hover:shadow-[0_0_20px_rgba(255,87,34,0.4)] transition-all group transform hover:-translate-y-1">
                <svg className="w-6 h-6 fill-zinc-500 group-hover:fill-orange-500" viewBox="0 0 24 24"><path d="M9.101 24v-11.063H5.442V9.285h3.659V6.63c0-3.629 2.215-5.607 5.457-5.607 1.552 0 3.103.277 3.103.277v3.41h-1.747c-1.8 0-2.361 1.117-2.361 2.261v2.714h3.844l-.614 3.652h-3.23V24H9.101z"/></svg>
              </a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-none bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center hover:border-orange-500 hover:shadow-[0_0_20px_rgba(255,87,34,0.4)] transition-all group transform hover:-translate-y-1">
                <svg className="w-6 h-6 fill-zinc-500 group-hover:fill-orange-500" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.981 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-black text-white uppercase tracking-[0.3em] mb-8 text-xs italic">DIVISIONS</h4>
            <ul className="space-y-5 text-zinc-500 text-xs font-black tracking-widest uppercase">
              <li><a href="#" className="hover:text-orange-500 transition-colors">Books & Comics</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Video Games</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Movies & TV</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-white uppercase tracking-[0.3em] mb-8 text-xs italic">RESOURCES</h4>
            <ul className="space-y-5 text-zinc-500 text-xs font-black tracking-widest uppercase">
              <li><a href="#" className="hover:text-orange-500 transition-colors">About NerdX</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Support</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] text-zinc-600 font-black uppercase tracking-[0.5em]">
          <p>© 2024 NERDXNEWS MEDIA. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
            <p>EST. 1984 / REBORN 2024</p>
            <p className="text-orange-500/50">SECURE CONNECTION ACTIVE</p>
          </div>
        </div>
      </footer>

      {editingPost !== undefined && (
        <Editor 
          post={editingPost}
          onClose={() => setEditingPost(undefined)}
          onSave={handleSavePost}
        />
      )}
    </div>
  );
};

export default App;