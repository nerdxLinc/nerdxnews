import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import PostCard from './components/PostCard';
import PostDetail from './components/PostDetail';
import Newsletter from './components/Newsletter';
import Editor from './components/Editor';
import { Post, Category } from './types';
import { INITIAL_POSTS } from './constants';

const App: React.FC = () => {
  // Safe initialization that won't break during static build
  const [posts, setPosts] = useState<Post[]>(() => {
    if (typeof window === 'undefined') return INITIAL_POSTS;
    try {
      const saved = localStorage.getItem('nerdxnews_posts');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch (e) {
      console.error("Failed to load posts", e);
      return INITIAL_POSTS;
    }
  });
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [isAdmin, setIsAdmin] = useState(false);
  // undefined = closed, null = new post, Post object = editing
  const [editingPost, setEditingPost] = useState<Post | null | undefined>(undefined); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nerdxnews_posts', JSON.stringify(posts));
      } catch (e) {
        console.error("Failed to save posts", e);
      }
    }
  }, [posts]);

  // Ensure featuredPost is never undefined by falling back multiple times
  const featuredPost = useMemo(() => {
    const featured = posts.find(p => p.isFeatured);
    if (featured) return featured;
    if (posts.length > 0) return posts[0];
    return INITIAL_POSTS[0];
  }, [posts]);
  
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
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAdminLogin = () => {
    if (isAdmin) {
      // Logout logic
      const confirmLogout = window.confirm("Terminate Admin Session?");
      if (confirmLogout) setIsAdmin(false);
      return;
    }

    // Login logic
    const password = window.prompt("ENTER COMMAND CODE (Hint: nerdx)");
    if (password && password.toLowerCase() === 'nerdx') {
      setIsAdmin(true);
      // Give the user immediate feedback
      alert("ACCESS GRANTED.\n\nEditor Mode Initialized.\nLook for the orange [+] button in the bottom right corner to add new intel.");
    } else {
      if (password !== null) { // Only alert if they typed something and didn't hit cancel
        alert("ACCESS DENIED. INVALID CREDENTIALS.");
      }
    }
  };

  // Guard clause - if for some reason no data loads
  if (!featuredPost) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono animate-pulse">
        INITIALIZING DATA STREAM...
      </div>
    );
  }

  // Determine if editor is active
  const isEditorActive = editingPost !== undefined;

  return (
    <div className={`min-h-screen flex flex-col selection:bg-orange-500 selection:text-white bg-[#050505] ${isAdmin ? 'border-t-4 border-orange-600' : ''}`}>
      {isAdmin && (
        <div className="fixed bottom-4 left-4 z-[50] bg-orange-600 text-white text-[10px] font-black px-4 py-2 tracking-widest uppercase shadow-lg border border-white/20 pointer-events-none">
          EDITOR MODE ACTIVE
        </div>
      )}
      
      <Header 
        onHome={() => { setSelectedPost(null); setActiveCategory('All'); }}
        onAdminToggle={handleAdminLogin}
        isAdmin={isAdmin}
      />

      <main className="flex-1 relative">
        {selectedPost ? (
          <PostDetail 
            post={selectedPost} 
            onBack={() => setSelectedPost(null)} 
            isAdmin={isAdmin}
          />
        ) : (
          <>
            {/* Featured Hero Section */}
            <section 
              className="relative w-full h-[75vh] min-h-[500px] flex items-end cursor-pointer group overflow-hidden border-b border-zinc-800"
              onClick={() => handlePostClick(featuredPost)}
            >
              <div className="absolute inset-0 bg-zinc-900">
                <img 
                  src={featuredPost.imageUrl} 
                  alt={featuredPost.title} 
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-[1.5s] ease-out"
                />
              </div>
              
              {/* Refined Cinematic Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent opacity-90"></div>
              
              {/* Content */}
              <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-16">
                <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="px-3 py-1 bg-orange-600/90 backdrop-blur-md text-white text-[9px] font-black tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(234,88,12,0.4)]">
                      Featured Intel
                    </span>
                    <div className="h-px w-8 bg-white/40"></div>
                    <span className="text-zinc-300 text-[10px] font-mono uppercase tracking-widest">
                      {featuredPost.date}
                    </span>
                  </div>
                  
                  <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-[0.95] tracking-tight uppercase italic text-white retro-glow title-stroke group-hover:text-yellow-400 transition-colors duration-500 drop-shadow-2xl">
                    {featuredPost.title}
                  </h2>
                  
                  <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <p className="text-base md:text-xl text-zinc-200 max-w-2xl leading-relaxed font-medium pl-4 border-l-2 border-orange-600">
                      {featuredPost.excerpt}
                    </p>
                    <button className="whitespace-nowrap bg-white text-black px-8 py-4 font-black uppercase tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] text-xs md:text-sm">
                       Read Protocol &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter Bar */}
            <div className="sticky top-[73px] z-40 bg-[#050505]/95 backdrop-blur-md border-b border-zinc-800">
              <div className="max-w-7xl mx-auto px-6 py-4 flex overflow-x-auto no-scrollbar gap-8">
                {(['All', 'Books & Comics', 'Games', 'Movies'] as Category[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                      activeCategory === cat 
                        ? 'text-orange-600 scale-105' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {cat === 'All' ? '/// All Feeds' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Grid */}
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onClick={handlePostClick}
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
             <span className="text-2xl font-['Orbitron'] font-black text-white tracking-tighter">NERD<span className="text-orange-600">X</span>NEWS</span>
             <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Est. 2024 /// The Resistance</span>
           </div>
           
           <div className="flex gap-8 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
             <a href="#" className="hover:text-orange-600 transition-colors">Manifesto</a>
             <a href="#" className="hover:text-orange-600 transition-colors">Encrypted Comms</a>
             <a href="#" className="hover:text-orange-600 transition-colors">Support</a>
           </div>

           <div className="text-[10px] text-zinc-700 font-mono">
             © 2024 NERDXNEWS. SYSTEM SECURE.
           </div>
        </div>
      </footer>

      {/* Admin Editor Modal - Higher Z-Index */}
      {isEditorActive && (
        <Editor 
          post={editingPost} 
          onSave={handleSavePost}
          onClose={() => setEditingPost(undefined)}
        />
      )}
      
      {/* Floating Action Button for Admin to create new post */}
      {/* Only show if Admin is TRUE, Editor is CLOSED (undefined), and NOT reading a post */}
      {isAdmin && !isEditorActive && !selectedPost && (
        <button
          onClick={() => setEditingPost(null)}
          className="fixed bottom-8 right-8 z-[100] bg-orange-600 text-white w-16 h-16 flex items-center justify-center shadow-[4px_4px_0_0_#fff] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-white group"
          aria-label="Create New Article"
        >
          <span className="text-4xl font-black group-hover:rotate-90 transition-transform">+</span>
        </button>
      )}
    </div>
  );
};

export default App;