import React, { useState } from 'react';
import { Post, Category } from '../types';
import { generateArticleDraft } from '../services/gemini';

interface EditorProps {
  post?: Post | null;
  onSave: (post: Post) => void;
  onClose: () => void;
}

const Editor: React.FC<EditorProps> = ({ post, onSave, onClose }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [content, setContent] = useState(post?.content || '');
  const [category, setCategory] = useState<Category>(post?.category || 'Games');
  const [imageUrl, setImageUrl] = useState(post?.imageUrl || 'https://picsum.photos/seed/nerdx/800/600');
  const [isFeatured, setIsFeatured] = useState<boolean>(post?.isFeatured || false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleMagicDraft = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    const draft = await generateArticleDraft(aiPrompt);
    if (draft) {
      setTitle(draft.title);
      setExcerpt(draft.excerpt);
      setContent(draft.content);
    }
    setIsGenerating(false);
  };

  const getPostObject = () => {
    return {
      id: post?.id || Date.now().toString(),
      title,
      excerpt,
      content,
      category,
      imageUrl,
      author: post?.author || 'Commander X',
      date: post?.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isFeatured
    };
  };

  const handleSave = () => {
    onSave(getPostObject());
  };

  const handleCopyForCode = () => {
    const obj = getPostObject();
    // Format it as a JSON object string, but simpler for pasting into code
    const codeString = `  {
    id: '${obj.id}',
    title: ${JSON.stringify(obj.title)},
    excerpt: ${JSON.stringify(obj.excerpt)},
    content: ${JSON.stringify(obj.content)},
    author: '${obj.author}',
    date: '${obj.date}',
    category: '${obj.category}',
    imageUrl: '${obj.imageUrl}',
    isFeatured: ${obj.isFeatured}
  },`;
    
    navigator.clipboard.writeText(codeString);
    alert("DEPLOYMENT CODE COPIED!\n\n1. Open 'constants.tsx'\n2. Scroll to 'INITIAL_POSTS'\n3. Paste this code at the top of the list.\n4. Commit & Push to publish.");
  };

  // z-[200] ensures it is above the scanline effect (z-100)
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <div className="bg-zinc-900 border border-orange-600/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl relative">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-10">
          <h2 id="editor-title" className="text-2xl font-bold uppercase tracking-widest text-orange-600">
            {post ? 'Edit Field Intel' : 'New Field Intel'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none" aria-label="Close Editor">✕</button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-orange-600/5 p-4 rounded border border-orange-600/10 mb-8">
            <h3 className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-tighter">AI Magic Assistant (Gemini)</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter a topic (e.g. 'Classic 80s arcade games')" 
                className="flex-1 bg-zinc-950 border border-zinc-800 px-4 py-2 rounded text-sm outline-none focus:border-orange-600 text-white"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                aria-label="AI Prompt Topic"
              />
              <button 
                onClick={handleMagicDraft}
                disabled={isGenerating}
                className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded text-xs font-bold disabled:opacity-50 uppercase tracking-wider"
              >
                {isGenerating ? 'Writing...' : 'Generate Draft'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="post-title" className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Headline</label>
                <input 
                  id="post-title"
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded text-white outline-none focus:border-orange-600 font-bold"
                />
              </div>
              <div>
                <label htmlFor="post-category" className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Category</label>
                <select 
                  id="post-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded text-white outline-none focus:border-orange-600"
                >
                  <option value="Books & Comics">Books & Comics</option>
                  <option value="Games">Games</option>
                  <option value="Movies">Movies</option>
                </select>
              </div>
              <div>
                <label htmlFor="post-image" className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Image URL</label>
                <input 
                  id="post-image"
                  type="text" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... or /images/file.jpg"
                  className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded text-white outline-none focus:border-orange-600 text-xs"
                />


<div className="mt-3 flex items-center gap-2">
  <input
    id="post-featured"
    type="checkbox"
    checked={isFeatured}
    onChange={(e) => setIsFeatured(e.target.checked)}
    className="h-4 w-4 accent-orange-600"
  />
  <label htmlFor="post-featured" className="text-xs font-bold text-zinc-500 uppercase">
    Featured (Front Page Lead Story)
  </label>
</div>
                <p className="text-[9px] text-zinc-600 mt-2 font-mono leading-tight">
                  <span className="text-orange-600 font-bold">TIP:</span> Use <span className="text-zinc-400">https://imgur.com/...</span> OR create a <span className="text-zinc-400">public/images</span> folder and use <span className="text-zinc-400">/images/filename.jpg</span>.
                </p>
              </div>
            </div>
            
            <div>
              <label htmlFor="post-excerpt" className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Excerpt</label>
              <textarea 
                id="post-excerpt"
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded text-white outline-none focus:border-orange-600 text-sm h-40 resize-none"
              ></textarea>
            </div>
          </div>

          <div>
            <label htmlFor="post-content" className="block text-xs font-bold text-zinc-500 mb-2 uppercase">Full Story Content</label>
            <textarea 
              id="post-content"
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 rounded text-white outline-none focus:border-orange-600 leading-relaxed font-mono text-sm"
            ></textarea>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-between items-center bg-zinc-900 sticky bottom-0">
          <div className="flex flex-col gap-1">
             <button
                onClick={handleCopyForCode}
                className="flex items-center gap-2 text-yellow-500 text-[10px] uppercase font-bold tracking-widest hover:text-white transition-colors border border-yellow-500/30 px-4 py-2 rounded hover:bg-yellow-500/10"
             >
                <span>&lt;/&gt; COPY DEPLOYMENT CODE</span>
             </button>
             <span className="text-[9px] text-zinc-600 font-mono hidden md:inline">Paste into 'constants.tsx' to publish</span>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-zinc-400 font-bold uppercase tracking-widest text-sm hover:text-white"
            >
              Abort
            </button>
            <button 
              onClick={handleSave}
              className="bg-orange-600 text-white hover:bg-yellow-400 hover:text-black px-10 py-2 rounded-sm font-bold uppercase tracking-widest transition-all shadow-[4px_4px_0_0_#000]"
            >
              Save (Local)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;