// components/Editor.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Post, Category } from "../types";

type EditorProps = {
  post: Post | null | undefined; // undefined means editor closed; null means "new"
  onSave: (post: Post) => void;  // App.tsx handles LIVE publish to /posts (D1)
  onClose: () => void;
};

const CATEGORIES: Exclude<Category, "All">[] = [
  "Books & Comics",
  "Games",
  "Movies",
  "Tech",
];

function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function safeTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function pickFeatured(p: any): boolean {
  return Boolean(p?.IsFeatured ?? p?.isFeatured);
}

function pickImage(p: any): string {
  return p?.imageUrl || p?.image || p?.heroImage || "";
}

export default function Editor({ post, onSave, onClose }: EditorProps) {
  if (post === undefined) return null;

  const isEditing = Boolean(post && post.id);
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
  const [uploading, setUploading] = useState(false);

  const [topic, setTopic] = useState("");

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
  }, [postKey]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  const urlPreview = useMemo(() => {
    const s = (slug || "").trim();
    return s ? `/articles/${s}` : "/articles/your-article-slug";
  }, [slug]);

  const handlePublishLive = () => {
    if (!title.trim()) return alert("Headline is required.");
    if (!slug.trim()) return alert("Slug is required.");
    if (!excerpt.trim()) return alert("Excerpt is required.");
    if (!content.trim()) return alert("Content is required.");

    onSave({
      id: post?.id ?? String(Date.now()),
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      date: post?.date ?? safeTodayISO(),
      category,
      imageUrl: imageUrl.trim() || undefined,
      isFeatured: featured ? 1 : 0,
      IsFeatured: featured ? 1 : 0,
      status: (post as any)?.status ?? "published",
      byline: (post as any)?.byline ?? "NerdX",
    } as Post);
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
              LIVE publish workflow (D1 via /posts)
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xs tracking-widest uppercase"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-140px)] px-6 py-6 space-y-6">
          {/* Headline */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Headline
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none"
            />
          </div>

          {/* Slug */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Slug
            </div>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono"
            />
            <div className="mt-2 text-[10px] text-zinc-500 font-mono">
              URL: <span className="text-zinc-300">{urlPreview}</span>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Excerpt
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full min-h-[90px] bg-black border border-zinc-800 px-3 py-3 text-white outline-none"
            />
          </div>

          {/* Category + Image Upload */}
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
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
                Hero Image
              </div>

              <input
                value={imageUrl}
                readOnly
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-xs"
                placeholder="Upload an image to generate URL"
              />

              <label className="inline-block mt-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setUploading(true);
                    const form = new FormData();
                    form.append("file", file);
                    form.append("slug", slug || "untitled");

                    try {
                      const res = await fetch("/upload-image", {
                        method: "POST",
                        body: form,
                      });
                      if (!res.ok) throw new Error("Upload failed");
                      const data = await res.json();
                      setImageUrl(data.url);
                    } catch (err) {
                      alert("Image upload failed.");
                      console.error(err);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                <span className="cursor-pointer bg-orange-600 hover:bg-orange-500 text-black px-4 py-2 text-xs font-black uppercase tracking-widest">
                  {uploading ? "Uploading..." : "Upload Image"}
                </span>
              </label>

              {imageUrl && (
                <img
                  src={imageUrl}
                  className="mt-3 max-h-32 border border-zinc-800"
                />
              )}
            </div>
          </div>

          {/* Featured */}
          <div className="flex gap-3 items-start">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            <div>
              <div className="text-[11px] text-zinc-200 uppercase tracking-widest font-black">
                Featured
              </div>
              <div className="text-[10px] text-zinc-500">
                Front page hero article
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Full Story
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[260px] bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono text-sm"
            />
          </div>
        </div>

        <div className="border-t border-zinc-800 px-6 py-4 flex justify-between">
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xs font-black uppercase tracking-widest"
          >
            Abort
          </button>
          <button
            onClick={handlePublishLive}
            className="bg-orange-600 hover:bg-orange-500 text-black px-5 py-2 text-xs font-black uppercase tracking-[0.2em]"
          >
            Publish (Live)
          </button>
        </div>
      </div>
    </div>
  );
}
