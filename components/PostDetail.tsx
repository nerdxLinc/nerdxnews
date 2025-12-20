import React, { useMemo } from 'react';
import { Post } from '../types';

type Props = {
  post: Post;
  onBack: () => void;
  isAdmin?: boolean;
};

const normalizeImagePath = (src?: string) => {
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  if (src.startsWith('/')) return src;
  return `/images/${src}`;
};

const PostDetail: React.FC<Props> = ({ post, onBack, isAdmin }) => {
  const heroImage = useMemo(() => {
    // Support multiple legacy names
    return (
      normalizeImagePath((post as any).heroImage) ||
      normalizeImagePath((post as any).imageUrl) ||
      normalizeImagePath((post as any).image) ||
      undefined
    );
  }, [post]);

  const paragraphs = useMemo(() => {
    const raw = (post as any).content ?? '';
    if (!raw || typeof raw !== 'string') return [];

    // Split into paragraphs on blank lines
    return raw
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/g)
      .map(p => p.trim())
      .filter(Boolean);
  }, [post]);

  return (
    <article className="min-h-[calc(100vh-140px)] bg-[#050505] text-white">
      {/* Top bar */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300 hover:text-orange-500 transition-colors"
          >
            <span className="text-lg leading-none">←</span> Back to Feed
          </button>

          {isAdmin && (
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
              Admin View
            </span>
          )}
        </div>
      </div>

      {/* Hero image (optional) */}
      {heroImage && (
        <div className="relative mt-6 md:mt-8">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800">
              <img
                src={heroImage}
                alt={post.title}
                className="w-full h-[240px] md:h-[420px] object-cover opacity-90"
                onError={(e) => {
                  // If the image is missing, hide the broken element cleanly
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      )}

      {/* Title + meta */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-8 md:pt-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-orange-600/90 text-white text-[9px] font-black tracking-[0.2em] uppercase">
            Field Intel
          </span>
          <span className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
            {post.date}
          </span>
          <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
            {post.category}
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black uppercase italic leading-[0.95] tracking-tight text-white drop-shadow-2xl">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="mt-6 text-base md:text-xl text-zinc-200 leading-relaxed font-medium pl-4 border-l-2 border-orange-600">
            {post.excerpt}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-16 md:pb-24 pt-10">
        {paragraphs.length > 0 ? (
          <div className="space-y-6 text-zinc-200 text-base md:text-lg leading-relaxed">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-wrap">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm font-mono">
            No article body found. (The post has no <code>content</code> field.)
          </p>
        )}
      </div>
    </article>
  );
};

export default PostDetail;
