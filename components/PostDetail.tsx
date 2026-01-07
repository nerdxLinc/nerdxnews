import React, { useMemo, useState } from 'react';
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

// Legacy-tolerant field pickers (keeps PostDetail resilient to older JSON shapes)
const pickExcerpt = (p: any): string => {
  return String(
    p?.excerpt ??
      p?.blurb ??
      p?.summary ??
      p?.dek ??
      p?.description ??
      ''
  ).trim();
};

const pickContent = (p: any): string => {
  return String(
    p?.content ??
      p?.body ??
      p?.story ??
      p?.article ??
      p?.text ??
      ''
  );
};

const pickDate = (p: any): string => {
  return String(
    p?.date ??
      p?.publishedAt ??
      p?.publishDate ??
      p?.createdAt ??
      ''
  ).trim();
};

const pickCategory = (p: any): string => {
  return String(p?.category ?? p?.section ?? '').trim();
};

const pickSlug = (p: any): string => {
  return String(p?.slug ?? p?.path ?? p?.permalink ?? '').trim();
};

const PostDetail: React.FC<Props> = ({ post, onBack, isAdmin }) => {
  const [copied, setCopied] = useState(false);

  const heroImage = useMemo(() => {
    return (
      normalizeImagePath((post as any).heroImage) ||
      normalizeImagePath((post as any).imageUrl) ||
      normalizeImagePath((post as any).image) ||
      normalizeImagePath((post as any).coverImage) ||
      normalizeImagePath((post as any).hero) ||
      undefined
    );
  }, [post]);

  const excerpt = useMemo(() => pickExcerpt(post as any), [post]);
  const metaDate = useMemo(() => pickDate(post as any), [post]);
  const metaCategory = useMemo(() => pickCategory(post as any), [post]);

  const blocks = useMemo(() => {
    const raw = pickContent(post as any);
    if (!raw || typeof raw !== 'string') return [] as string[];

    return raw
      .replace(/\r\n/g, '\n')
      .trim()
      .split(/\n{2,}/g)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [post]);

  const renderInlineMarkdown = (text: string) => {
    const nodes: React.ReactNode[] = [];
    const regex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"(left|right|center)")?\)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const [full, alt, url, align] = match;
      const start = match.index;
      if (start > lastIndex) {
        nodes.push(text.slice(lastIndex, start));
      }

      const src = normalizeImagePath(url.trim());
      if (src) {
        const alignment = (align || "center").toLowerCase();
        const alignmentClass =
          alignment === "left"
            ? "float-left mr-4"
            : alignment === "right"
              ? "float-right ml-4"
              : "mx-auto";
        nodes.push(
          <img
            key={`${src}-${start}`}
            src={src}
            alt={alt || 'Inline image'}
            className={`my-4 w-full max-w-xs md:max-w-sm rounded-xl border border-zinc-800 object-cover ${alignmentClass}`}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        );
      } else {
        nodes.push(full);
      }

      lastIndex = start + full.length;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }

    return nodes;
  };

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const slug = pickSlug(post as any);
    return slug ? `${origin}/articles/${slug}` : window.location.href;
  }, [post]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    }
  };

  const shareNative = async () => {
    const nav: any = navigator;
    if (nav.share) {
      try {
        await nav.share({
          title: post.title,
          text: excerpt || '',
          url: shareUrl,
        });
        return;
      } catch {
        // user canceled or blocked — fall through to copy
      }
    }
    await copyLink();
  };

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

          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center px-3 py-2 md:px-4 md:py-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] bg-zinc-900 border border-zinc-700 hover:border-orange-600 hover:text-orange-400 transition-colors"
              title="Copy article link"
            >
              {copied ? 'Copied' : 'Copy Link'}
            </button>

            <button
              type="button"
              onClick={shareNative}
              className="inline-flex items-center justify-center px-3 py-2 md:px-4 md:py-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-orange-600 hover:text-white transition-colors"
              title="Share"
            >
              Share
            </button>

            {isAdmin && (
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                Admin View
              </span>
            )}
          </div>
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

          {metaDate ? (
            <span className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
              {metaDate}
            </span>
          ) : null}

          {metaCategory ? (
            <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
              {metaCategory}
            </span>
          ) : null}
        </div>

        <h1 className="text-3xl md:text-5xl font-black uppercase italic leading-[0.95] tracking-tight text-white drop-shadow-2xl">
          {post.title}
        </h1>

        {!!excerpt && (
          <p className="mt-6 text-base md:text-xl text-zinc-200 leading-relaxed font-medium pl-4 border-l-2 border-orange-600">
            {excerpt}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-16 md:pb-24 pt-10">
        {blocks.length > 0 ? (
          <div className="space-y-6 text-zinc-200 text-base md:text-lg leading-relaxed break-words">
            {blocks.map((p, idx) => (
              <p key={idx} className="whitespace-pre-wrap break-words after:content-[''] after:block after:clear-both">
                {renderInlineMarkdown(p)}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm font-mono">
            No article body found. (The post has no recognized body field like{' '}
            <code>content</code>, <code>body</code>, or <code>story</code>.)
          </p>
        )}
      </div>
    </article>
  );
};

export default PostDetail;
