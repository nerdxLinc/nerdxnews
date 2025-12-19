import React from 'react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
  onEdit?: (post: Post) => void;
  isAdmin: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick, onEdit, isAdmin }) => {
  const img = post.imageUrl || post.image;

  return (
    <article className="group border border-zinc-800 bg-zinc-950/60 hover:border-orange-500/60 transition overflow-hidden">
      <button
        type="button"
        onClick={() => onClick(post)}
        className="block w-full text-left"
        aria-label={`Open ${post.title}`}
      >
        <div className="relative aspect-[16/9] bg-zinc-900 overflow-hidden">
          {img ? (
            <img
              src={img}
              alt={post.title}
              className="h-full w-full object-cover opacity-95 group-hover:scale-[1.02] transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">
              No image
            </div>
          )}

          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center px-2 py-1 text-[10px] sm:text-xs font-black tracking-widest uppercase border border-orange-500/60 bg-black/70 text-orange-400">
              {post.category}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <h3 className="text-lg sm:text-xl font-black leading-tight">
            {post.title}
          </h3>

          <p className="mt-2 text-sm sm:text-base text-zinc-300 line-clamp-3">
            {post.excerpt}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs sm:text-sm text-zinc-400">
            <span>{post.author ? `By ${post.author}` : ''}</span>
            <span>{post.date}</span>
          </div>
        </div>
      </button>

      {isAdmin && onEdit && (
        <div className="px-4 sm:px-5 pb-4">
          <button
            type="button"
            onClick={() => onEdit(post)}
            className="w-full px-3 py-2 text-xs sm:text-sm font-bold uppercase border border-orange-500/60 text-orange-300 hover:bg-orange-500/10 transition"
          >
            Edit
          </button>
        </div>
      )}
    </article>
  );
};

export default PostCard;
