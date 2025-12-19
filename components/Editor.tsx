import React, { useMemo, useState } from 'react';
import { Post } from '../types';

interface EditorProps {
  post?: Post | null;
  onSave: (post: Post) => void;
  onCancel: () => void;
}

const Editor: React.FC<EditorProps> = ({ post, onSave, onCancel }) => {
  const initial = useMemo<Post>(() => {
    const now = new Date().toISOString().split('T')[0];
    return (
      post ?? {
        id: crypto?.randomUUID?.() ?? String(Date.now()),
        title: '',
        excerpt: '',
        content: '',
        date: now,
        category: 'news',
        imageUrl: '',
        author: ''
      }
    );
  }, [post]);

  const [draft, setDraft] = useState<Post>(initial);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="border border-orange-500/40 bg-zinc-950/60 p-5 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-black">
          {post ? 'Edit Post' : 'New Post'}
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4">
          <label className="text-sm text-zinc-300">
            Title
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-zinc-700 bg-black/40 outline-none focus:border-orange-500"
            />
          </label>

          <label className="text-sm text-zinc-300">
            Excerpt
            <textarea
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-zinc-700 bg-black/40 outline-none focus:border-orange-500"
            />
          </label>

          <label className="text-sm text-zinc-300">
            Content (use blank lines for paragraphs)
            <textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              rows={10}
              className="mt-1 w-full px-3 py-2 border border-zinc-700 bg-black/40 outline-none focus:border-orange-500"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm text-zinc-300">
              Category
              <input
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-zinc-700 bg-black/40 outline-none focus:border-orange-500"
              />
            </label>

            <label className="text-sm text-zinc-300">
              Date
              <input
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-zinc-700 bg-black/40 outline-none focus:border-orange-500"
              />
            </label>
          </div>

          <label className="text-sm text-zinc-300">
            Image URL (example: /images/article-1.jpg)
            <input
              value={draft.imageUrl ?? ''}
              onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-zinc-700 bg-black/40 outline-none focus:border-orange-500"
            />
          </label>

          <label className="text-sm text-zinc-300">
            Author
            <input
              value={draft.author ?? ''}
              onChange={(e) => setDraft({ ...draft, author: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-zinc-700 bg-black/40 outline-none focus:border-orange-500"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 font-bold uppercase border border-zinc-700 hover:border-orange-500/70 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="px-4 py-2 font-bold uppercase border border-orange-500 bg-orange-600/90 hover:bg-orange-500 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor;
