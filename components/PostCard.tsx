import React from 'react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
  onEdit?: (post: Post) => void;
  isAdmin: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick, onEdit, isAdmin }) => {
  return (
    <div className="group relative bg-zinc-900 border-2 border-zinc-800 rounded-none overflow-hidden hover:border-orange-500 transition-all duration-300 shadow-[8px_8px_0px_0px_rgba(39,39,42,1)] hover:shadow-[8px_8px_0px_0px_rgba(255,87,34,1)] hover:-translate-y-1">
      <div 
        className="aspect-video overflow-hidden cursor-pointer relative"
        onClick={() => onClick(post)}
      >
        <img 
          src={post.imageUrl} 
          alt={post.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
        />
        <div className="absolute top-4 left-4">
          <span className="px-2 py-1 bg-black text-orange-500 text-[10px] font-black tracking-widest uppercase border border-orange-500">
            {post.category}
          </span>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        <h3 
          className="text-xl sm:text-2xl font-black text-white mb-4 line-clamp-2 cursor-pointer group-hover:text-orange-400 transition-colors leading-[1.1] uppercase italic"
          onClick={() => onClick(post)}
        >
          {post.title}
        </h3>
        
        <p className="text-zinc-400 text-sm line-clamp-3 mb-6 leading-relaxed font-medium">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">AUTHOR</span>
            <span className="text-xs text-zinc-300 font-bold uppercase">{post.author}</span>
          </div>
          
          {isAdmin && onEdit ? (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(post); }}
              className="px-4 py-2 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-colors"
            >
              EDIT INTEL
            </button>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">DATE</span>
              <span className="text-xs text-zinc-300 font-bold uppercase">{post.date}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;