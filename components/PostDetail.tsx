// components/PostDetail.tsx
// Displays an article. Supports legacy plain-text bodies AND block-based bodies with inline images.

import React, { useMemo, useState } from "react";
import { Post, ContentBlock } from "../types";

type Props = {
  post: Post;
  onBack: () => void;
  isAdmin?: boolean;
};

function normalizeImagePath(src?: string): string | undefined {
  if (!src) return undefined;
  const s = String(src).trim();
  if (!s) return undefined;
  if (s.startsWith("http")) return s;
  if (s.startsWith("/")) return s;
  return `/images/${s}`;
}

// Legacy-tolerant field pickers (keeps PostDetail resilient to older JSON shapes)
function pickExcerpt(p: any): string {
  return String(p?.excerpt ?? p?.blurb ?? p?.summary ?? p?.dek ?? p?.description ?? "").trim();
}

function pickContent(p: any): string {
  return String(p?.content ?? p?.body ?? p?.story ?? p?.article ?? p?.text ?? "");
}

function pickDate(p: any): string {
  return String(p?.date ?? p?.publishedAt ?? p?.publishDate ?? p?.createdAt ?? "").trim();
}

function pickCategory(p: any): string {
  return String(p?.category ?? p?.section ?? "").trim();
}

function pickSlug(p: any): string {
  return String(p?.slug ?? p?.path ?? p?.permalink ?? "").trim();
}

function splitParagraphs(text: string): string[] {
  const s = String(text ?? "").replace(/\r\n/g, "\n").trim();
  if (!s) return [];
  return s
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

type ParsedBody =
  | { kind: "blocks"; blocks: ContentBlock[] }
  | { kind: "text"; text: string };

function parseBlocksFromContentMaybe(content: unknown): ParsedBody {
  // If someone already stored blocks as an array in content, accept it
  if (Array.isArray(content)) return { kind: "blocks", blocks: content as ContentBlock[] };

  const s = String(content ?? "").trim();
  if (!s) return { kind: "text", text: "" };

  // If blocks were stored as JSON string like: {"type":"blocks","blocks":[...]}
  if (s.startsWith("{") && s.endsWith("}")) {
    try {
      const obj = JSON.parse(s);
      if (obj?.type === "blocks" && Array.isArray(obj?.blocks)) {
        return { kind: "blocks", blocks: obj.blocks as ContentBlock[] };
      }
    } catch {
      // ignore
    }
  }

  return { kind: "text", text: s };
}

function renderBlocks(blocks: ContentBlock[]) {
  return (
    <div className="space-y-6">
      {blocks.map((b, i) => {
        if (b.type === "img") {
          const src = normalizeImagePath(b.url);
          if (!src) return null;

          return (
            <figure key={i} className="space-y-2">
              <img
                src={src}
                alt={b.alt || b.caption || "Inline image"}
                className="w-full rounded-xl border border-zinc-800 bg-black"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              {b.caption ? (
                <figcaption className="text-xs md:text-sm text-zinc-400">{b.caption}</figcaption>
              ) : null}
            </figure>
          );
        }

        // Default to paragraph block
        return (
          <p key={i} className="text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {"text" in b ? (b as any).text : ""}
          </p>
        );
      })}
    </div>
  );
}

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

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const slug = pickSlug(post as any);
    return slug ? `${origin}/articles/${slug}` : window.location.href;
  }, [post]);

  const parsedBody = useMemo<ParsedBody>(() => {
    // 1) Prefer real block field
    const blocks = (post as any)?.contentBlocks;
    if (Array.isArray(blocks) && blocks.length) return { kind: "blocks", blocks: blocks as ContentBlock[] };

    // 2) Otherwise, attempt to parse blocks stored in content
    return parseBlocksFromContentMaybe((post as any)?.content);
  }, [post]);

  const paragraphs = useMemo(() => {
    if (parsedBody.kind !== "text") return [];
    return splitParagraphs(parsedBody.text);
  }, [parsedBody]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } catch {
        // ignore
      }
    }
  };

  const shareNative = async () => {
    const nav: any = navigator;
    if (nav?.share) {
      try {
        await nav.share({
          title: post.title,
          text: excerpt || "",
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
              {copied ? "Copied" : "Copy Link"}
            </button>

            <button
              type="button"
              onClick={shareNative}
              className="inline-flex items-center justify-center px-3 py-2 md:px-4 md:py-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-orange-600 hover:text-white transition-colors"
              title="Share"
            >
              Share
            </button>

            {isAdmin ? (
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                Admin View
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Hero image (optional) */}
      {heroImage ? (
        <div className="relative mt-6 md:mt-8">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800">
              <img
                src={heroImage}
                alt={post.title}
                className="w-full h-[240px] md:h-[420px] object-cover opacity-90"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Title + meta */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-8 md:pt-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-orange-600/90 text-white text-[9px] font-black tracking-[0.2em] uppercase">
            Field Intel
          </span>

          {metaDate ? (
            <span className="text-zinc-400 text-[10px] font-mono uppercase tracking-widest">{metaDate}</span>
          ) : null}

          {metaCategory ? (
            <span className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">{metaCategory}</span>
          ) : null}
        </div>

        <h1 className="text-3xl md:text-5xl font-black uppercase italic leading-[0.95] tracking-tight text-white drop-shadow-2xl">
          {post.title}
        </h1>

        {excerpt ? (
          <p className="mt-6 text-base md:text-xl text-zinc-200 leading-relaxed font-medium pl-4 border-l-2 border-orange-600">
            {excerpt}
          </p>
        ) : null}
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pb-16 md:pb-24 pt-10">
        {parsedBody.kind === "blocks" ? (
          <div className="space-y-6 text-zinc-200 text-base md:text-lg leading-relaxed">{renderBlocks(parsedBody.blocks)}</div>
        ) : paragraphs.length > 0 ? (
          <div className="space-y-6 text-zinc-200 text-base md:text-lg leading-relaxed">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-wrap">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm font-mono">
            No article body found. (The post has no recognized body field like <code>content</code>, <code>body</code>,
            or <code>story</code>.)
          </p>
        )}
      </div>
    </article>
  );
};

export default PostDetail;
