import React from 'react';
import { Post } from '../types';

interface PostDetailProps {
  post: Post;
  onBack: () => void;
  isAdmin: boolean;
  onEdit?: (post: Post) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onBack, isAdmin, onEdit }) => {
  const img = post.imageUrl || post.image;
  const paragraphs = (post.content || '').split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-3 py-2 text-xs sm:text-sm font-bold uppercase border border-zinc-700 hover:border-orange-500/70 transition"
        >
          ← Back
        </button>

        {isAdmin && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(post)}
            className="px-3 py-2 text-xs sm:text-sm font-bold uppercase border border-orange-500/70 text-orange-300 hover:bg-orange-500/10 transition"
          >
            Edit
          </button>
        )}
      </div>

      <h1 className="mt-5 text-2xl sm:text-4xl font-black leading-tight">
        {post.title}
      </h1>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-zinc-400">
        <span className="uppercase tracking-widest text-orange-400">{post.category}</span>
        <span>{post.author ? `By ${post.author}` : ''}</span>
        <span>{post.date}</span>
      </div>

      {img && (
        <div className="mt-6 overflow-hidden border border-zinc-800 bg-zinc-950/60">
          <img src={img} alt={post.title} className="w-full max-h-[55vh] object-cover" />
        </div>
      )}

      <div className="prose prose-invert max-w-none mt-6">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="text-sm sm:text-base leading-relaxed text-zinc-200">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
};

export default PostDetail;
