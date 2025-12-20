// components/Editor.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Post, Category } from "../types";

type EditorProps = {
  post: Post | null | undefined; // undefined means editor closed; null means "new"
  onSave: (post: Post) => void;  // saves to local (App.tsx localStorage)
  onClose: () => void;
};

const CATEGORIES: Exclude<Category, "All">[] = [
  "Books & Comics",
  "Games",
  "Movies",
  "Tech", // keep legacy-compatible
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function safeTodayISO(): string {
  const d = new Date();
  // YYYY-MM-DD
  return d.toISOString().split("T")[0];
}

function pickFeatured(p: any): boolean {
  return Boolean(p?.IsFeatured ?? p?.isFeatured);
}

function pickImage(p: any): string {
  return p?.imageUrl || p?.image || p?.heroImage || "";
}

export default function Editor({ post, onSave, onClose }: EditorProps) {
  // Guard: editor is only visible when post is null or a Post
  if (post === undefined) return null;

  const isEditing = Boolean(post && post.id);

  // IMPORTANT: stable key so we don't reset on every render if `post` is a new object ref
  const postKey = post === null ? "new" : post.id;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);

  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [category, setCategory] = useState<Exclude<Category, "All">>(
    (post?.category as any) ?? "Books & Comics"
  );
  const [imageUrl, setImageUrl] = useState<string>(pickImage(post));
  const [featured, setFeatured] = useState<boolean>(pickFeatured(post));

  // Optional helper UI (you had an "AI assistant" box in the modal)
  const [topic, setTopic] = useState("");

  // Reset editor fields whenever you open a different post (or "new")
  useEffect(() => {
    setTitle(post?.title ?? "");
    setSlug(post?.slug ?? "");
    setSlugTouched(false);

    setExcerpt(post?.excerpt ?? "");
    setContent(post?.content ?? "");
    setCategory((post?.category as any) ?? "Books & Comics");
    setImageUrl(pickImage(post));
    setFeatured(pickFeatured(post));
    setTopic("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postKey]);

  // Auto-generate slug from title until the user manually edits slug
  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  const urlPreview = useMemo(() => {
    const s = (slug || "").trim();
    return s ? `/articles/${s}` : "/articles/your-article-slug";
  }, [slug]);

  const deploymentJsonEntry = useMemo(() => {
    const id = post?.id ?? String(Date.now());

    const entry: Post = {
      id,
      title: title.trim(),
      slug: (slug || "").trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      date: post?.date ?? safeTodayISO(),
      category,
      imageUrl: imageUrl.trim() || undefined,
      // set BOTH spellings for maximum compatibility with existing code paths
      isFeatured: featured,
      IsFeatured: featured,
    };

    return JSON.stringify(entry, null, 2);
  }, [
    post?.id,
    post?.date,
    title,
    slug,
    excerpt,
    content,
    category,
    imageUrl,
    featured,
  ]);

  const handleCopyDeploymentCode = async () => {
    try {
      await navigator.clipboard.writeText(deploymentJsonEntry);
      alert("Copied.\n\nPaste this object into public/posts.json (inside the array).");
    } catch {
      // Fallback: prompt
      window.prompt("Copy this JSON:", deploymentJsonEntry);
    }
  };

  const handleSaveLocal = () => {
    const finalTitle = title.trim();
    const finalSlug = (slug || "").trim();

    if (!finalTitle) {
      alert("Headline is required.");
      return;
    }
    if (!finalSlug) {
      alert("Slug is required (used in URL).");
      return;
    }
    if (!excerpt.trim()) {
      alert("Excerpt / blurb is required.");
      return;
    }
    if (!content.trim()) {
      alert("Full story content is required.");
      return;
    }

    const next: Post = {
      id: post?.id ?? String(Date.now()),
      title: finalTitle,
      slug: finalSlug,
      excerpt: excerpt.trim(),
      content: content.trim(),
      date: post?.date ?? safeTodayISO(),
      category,
      imageUrl: imageUrl.trim() || undefined,

      // Keep both spellings for compatibility
      isFeatured: featured,
      IsFeatured: featured,
    };

    onSave(next);
  };

  const handleGenerateDraft = () => {
    if (!topic.trim()) {
      alert("Enter a topic first.");
      return;
    }
    alert(
      "Draft generator is not wired to a backend in this build.\n\nIf you want it, we can connect it to a service later."
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0b0b0d] border border-zinc-800 shadow-2xl relative max-h-[92vh] overflow-hidden">
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <div className="text-orange-500 font-black tracking-[0.18em] uppercase text-sm">
              {isEditing ? "Edit Field Intel" : "New Field Intel"}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">
              LOCAL draft + JSON publish workflow (public/posts.json)
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xs tracking-widest uppercase"
            aria-label="Close editor"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-140px)] px-6 py-6 space-y-6">
          {/* Optional "AI Assistant" strip (kept for continuity) */}
          <div className="border border-zinc-800 bg-black/40 p-4">
            <div className="text-orange-500 text-[10px] font-black tracking-[0.2em] uppercase mb-3">
              Armory Assistant (optional)
            </div>
            <div className="flex gap-3">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-sm text-white outline-none"
                placeholder="Enter a topic (e.g. 'Classic 80s arcade games')"
              />
              <button
                onClick={handleGenerateDraft}
                className="bg-orange-600 hover:bg-orange-500 text-black font-black uppercase tracking-widest text-xs px-4 py-2"
              >
                Generate Draft
              </button>
            </div>
          </div>

          {/* Headline */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Headline
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none"
              placeholder="Enter headline"
            />
          </div>

          {/* Slug */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Slug (used in URL)
            </div>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono"
              placeholder="the-big-woke-nope"
            />
            <div className="mt-2 text-[10px] text-zinc-500 font-mono">
              URL: <span className="text-zinc-300">{urlPreview}</span>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Excerpt / Blurb
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full min-h-[90px] bg-black border border-zinc-800 px-3 py-3 text-white outline-none"
              placeholder="Short blurb that appears under the hero headline."
            />
          </div>

          {/* Category + Image URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
                Category
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
                Hero / Image URL
              </div>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono"
                placeholder="/images/Alpha-core.jpg"
              />
              <div className="mt-2 text-[10px] text-zinc-500">
                Use a local image like{" "}
                <span className="font-mono text-zinc-300">/images/Alpha-core.jpg</span>
              </div>
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="text-[11px] text-zinc-200 uppercase tracking-widest font-black">
                Featured (front page lead story)
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Featured post becomes the hero and should be the one you want at the top.
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Full Story Content
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[260px] bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono text-sm leading-relaxed"
              placeholder="Paste the full article body here."
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-zinc-800 px-6 py-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={handleCopyDeploymentCode}
              className="border border-yellow-600/60 text-yellow-400 hover:text-yellow-300 hover:border-yellow-500 px-4 py-2 text-xs font-black uppercase tracking-widest"
            >
              {"</>"} Copy Deployment Code
            </button>
            <div className="text-[10px] text-zinc-500 md:self-center">
              Paste into <span className="font-mono text-zinc-300">public/posts.json</span>{" "}
              (inside the array)
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-xs font-black uppercase tracking-widest px-4 py-2"
            >
              Abort
            </button>
            <button
              onClick={handleSaveLocal}
              className="bg-orange-600 hover:bg-orange-500 text-black px-5 py-2 text-xs font-black uppercase tracking-[0.2em]"
            >
              Save (Local)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
