import React, { useMemo, useState } from 'react';
import { Post } from '../types';

type Props = {
  post: Post;
  onBack: () => void;
  isAdmin?: boolean;
  onEdit?: (post: Post) => void;
};

const normalizeImagePath = (src?: string) => {
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  if (src.startsWith('/')) return src;
  return `/images/${src}`;
};

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

const isHtmlContent = (content: string): boolean => {
  return content.trim().startsWith('<') && (
    content.includes('</p>') || 
    content.includes('</div>') || 
    content.includes('</h') ||
    content.includes('<img') ||
    content.includes('<iframe')
  );
};

const PostDetail: React.FC<Props> = ({ post, onBack, isAdmin, onEdit }) => {
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

  const content = useMemo(() => pickContent(post as any), [post]);
  const isHtml = useMemo(() => isHtmlContent(content), [content]);

  const paragraphs = useMemo(() => {
    if (isHtml) return [];
    const raw = content;
    if (!raw || typeof raw !== 'string') return [];

    return raw
      .replace(/\r\n/g, '\n')
      .trim()
      .split(/\n{2,}/g)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [content, isHtml]);

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
      } catch {}
    }
    await copyLink();
  };

  return (
    <article className="min-h-[calc(100vh-140px)] bg-[#050505] text-white">
      <style>{`
        .article-content {
          color: #e4e4e7;
          font-size: 1.125rem;
          line-height: 1.75;
        }
        .article-content p {
          margin-bottom: 1.5rem;
        }
        .article-content h2 {
          font-size: 1.75rem;
          font-weight: 800;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: white;
          text-transform: uppercase;
          font-style: italic;
        }
        .article-content h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: white;
        }
        .article-content ul, .article-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .article-content li {
          margin-bottom: 0.5rem;
        }
        .article-content blockquote {
          border-left: 4px solid #ea580c;
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #a1a1aa;
        }
        .article-content a {
          color: #ea580c;
          text-decoration: underline;
        }
        .article-content a:hover {
          color: #facc15;
        }
        .article-content strong {
          color: white;
          font-weight: 600;
        }
        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }
        .article-content img[data-float="left"] {
          float: left;
          max-width: 45%;
          margin: 0.5rem 1.5rem 1rem 0;
        }
        .article-content img[data-float="right"] {
          float: right;
          max-width: 45%;
          margin: 0.5rem 0 1rem 1.5rem;
        }
        .article-content .editor-image {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }
        .article-content .editor-image[data-float="left"] {
          float: left;
          max-width: 45%;
          margin: 0.5rem 1.5rem 1rem 0;
        }
        .article-content .editor-image[data-float="right"] {
          float: right;
          max-width: 45%;
          margin: 0.5rem 0 1rem 1.5rem;
        }
        .article-content iframe,
        .article-content .editor-youtube {
          max-width: 100%;
          margin: 2rem auto;
          display: block;
          border-radius: 0.5rem;
          aspect-ratio: 16/9;
          width: 100%;
          height: auto;
          min-height: 360px;
        }
        .article-content::after {
          content: "";
          display: table;
          clear: both;
        }
        .article-content-light {
          color: #1f1f1f;
        }
        .article-content-light h2,
        .article-content-light h3,
        .article-content-light strong {
          color: #0a0a0a;
        }
        .article-content-light blockquote {
          color: #525252;
        }
        .article-content-light a {
          color: #c2410c;
        }
        .article-content-light a:hover {
          color: #ea580c;
        }
        @media (max-width: 640px) {
          .article-content img[data-float="left"],
          .article-content img[data-float="right"],
          .article-content .editor-image[data-float="left"],
          .article-content .editor-image[data-float="right"] {
            float: none;
            max-width: 100%;
            margin: 1rem 0;
          }
        }
      `}</style>

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
            {isAdmin && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(post)}
                className="inline-flex items-center justify-center px-3 py-2 md:px-4 md:py-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] bg-orange-600 text-white hover:bg-orange-500 transition-colors"
              >
                Edit
              </button>
            )}
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

      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-16 md:pb-24 pt-10">
        <div className="bg-zinc-200 rounded-lg p-6 md:p-10">
          {isHtml ? (
            <div 
              className="article-content article-content-light"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : paragraphs.length > 0 ? (
            <div className="space-y-6 text-zinc-800 text-base md:text-lg leading-relaxed">
              {paragraphs.map((p, idx) => (
                <p key={idx} className="whitespace-pre-wrap">
                  {p}
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
      </div>
    </article>
  );
};

export default PostDetail;
