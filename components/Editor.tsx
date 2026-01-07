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
  return d.toISOString().slice(0, 10);
}

function pickImage(p: any): string {
  return p?.imageUrl || p?.image || p?.heroImage || "";
}

function isProbablyUrl(v: string): boolean {
  const s = (v || "").trim();
  if (!s) return true;
  return /^https?:\/\/.+/i.test(s);
}

const Editor: React.FC<EditorProps> = ({ post, onSave, onClose }) => {
  const isOpen = post !== undefined;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState((post as any)?.slug ?? "");
  const [date, setDate] = useState((post as any)?.date ?? safeTodayISO());
  const [category, setCategory] = useState<Category>((post as any)?.category ?? "Books & Comics");
  const [excerpt, setExcerpt] = useState((post as any)?.excerpt ?? "");
  const [content, setContent] = useState((post as any)?.content ?? (post as any)?.body ?? (post as any)?.story ?? "");
  const [imageUrl, setImageUrl] = useState<string>(pickImage(post));
  const [featured, setFeatured] = useState<boolean>(!!(post as any)?.featured);

  const [uploading, setUploading] = useState(false);
  const [inlineAlt, setInlineAlt] = useState("");
  const [inlineUrl, setInlineUrl] = useState("");
  const [inlineAlign, setInlineAlign] = useState<"left" | "right" | "center">("left");

  // When switching between posts, refresh fields
  useEffect(() => {
    setTitle(post?.title ?? "");
    setSlug((post as any)?.slug ?? "");
    setDate((post as any)?.date ?? safeTodayISO());
    setCategory((post as any)?.category ?? "Books & Comics");
    setExcerpt((post as any)?.excerpt ?? "");
    setContent((post as any)?.content ?? (post as any)?.body ?? (post as any)?.story ?? "");
    setImageUrl(pickImage(post));
    setFeatured(!!(post as any)?.featured);
    setInlineAlt("");
    setInlineUrl("");
    setInlineAlign("left");
  }, [post]);

  const derivedSlug = useMemo(() => slugify(title), [title]);

  // If slug is empty, show derived slug in UI; but don't overwrite user's manual slug unless it's empty
  useEffect(() => {
    if (!slug.trim() && title.trim()) setSlug(derivedSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedSlug]);

  if (!isOpen) return null;

  const insertAtCursor = (text: string) => {
    const textarea = document.getElementById("editor-content") as HTMLTextAreaElement | null;
    if (!textarea) {
      setContent((prev) => `${prev}\n\n${text}`.trim());
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    setContent((prev) => {
      const before = prev.slice(0, start);
      const after = prev.slice(end);
      return `${before}${text}${after}`;
    });

    window.requestAnimationFrame(() => {
      const nextPos = start + text.length;
      textarea.focus();
      textarea.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleInlineInsert = () => {
    const url = inlineUrl.trim();
    if (!url) {
      alert("Inline image URL is required.");
      return;
    }
    if (!isProbablyUrl(url)) {
      alert("Inline image must be a full URL starting with http:// or https://");
      return;
    }

    const alt = inlineAlt.trim() || "Inline image";
    const tag = `![${alt}](${url} "${inlineAlign}")`;
    insertAtCursor(tag);
    setInlineAlt("");
    setInlineUrl("");
  };

  const handleInlineUpload = async (file: File) => {
    try {
      setUploading(true);

      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/upload-image", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

      const data = await res.json();
      const url = (data?.url || "").toString().trim();
      if (!url) throw new Error("Upload succeeded but no URL returned.");

      setInlineUrl(url);
      return;
    } catch (err) {
      console.error(err);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        if (dataUrl) {
          setInlineUrl(dataUrl);
          alert(
            "Cloudflare upload failed. Using a local data URL for preview only. Paste a public URL for production."
          );
        } else {
          alert("Image upload failed.");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      alert("Title is required.");
      return;
    }

    const cleanSlug = slugify(slug || derivedSlug);
    if (!cleanSlug) {
      alert("Slug is required.");
      return;
    }

    const cleanImage = (imageUrl || "").trim();
    if (!isProbablyUrl(cleanImage)) {
      alert("Hero Image must be a full URL starting with http:// or https://");
      return;
    }

    const next: any = {
      ...(post ?? {}),
      title: cleanTitle,
      slug: cleanSlug,
      date: (date || safeTodayISO()).trim(),
      category,
      excerpt: excerpt.trim(),
      content: (content || "").trim(),
      imageUrl: cleanImage || undefined, // normalize field name used by renderer
      featured: !!featured,
    };

    // Ensure it has an id for new posts if your app expects one
    if (!next.id) next.id = (post as any)?.id;

    onSave(next as Post);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-auto py-10">
      <div className="w-[92vw] max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest font-black">
              Field Intel
            </div>
            <div className="text-2xl text-white font-black mt-1">
              {post ? "Edit Article" : "New Article"}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-4 py-2 text-xs font-black uppercase tracking-widest rounded"
            >
              Close
            </button>
            <button
              onClick={onSubmit}
              className="bg-orange-600 text-black px-4 py-2 text-xs font-black uppercase tracking-widest rounded"
            >
              Save
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Title
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none"
              placeholder="Enter title..."
            />
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Slug
            </div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono text-sm"
              placeholder={derivedSlug || "auto-generated-from-title"}
            />
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Date
            </div>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono text-sm"
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Excerpt
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full min-h-[90px] bg-black border border-zinc-800 px-3 py-3 text-white outline-none"
              placeholder="Short teaser used on cards..."
            />
          </div>
        </div>

        {/* Category + Image Upload */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              Hero Image
            </div>

            {/* FIXED: pasteable field */}
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-xs"
              placeholder="Paste image URL here (https://images.nerdxnews.com/...) or upload below"
            />

            <label className="inline-block mt-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    setUploading(true);

                    const form = new FormData();
                    form.append("file", file);

                    const res = await fetch("/upload-image", {
                      method: "POST",
                      body: form,
                    });

                    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);

                    const data = await res.json();
                    setImageUrl((data?.url || "").toString());
                  } catch (err) {
                    console.error(err);
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = typeof reader.result === "string" ? reader.result : "";
                      if (dataUrl) {
                        setImageUrl(dataUrl);
                        alert(
                          "Cloudflare upload failed. Using a local data URL for preview only. Paste a public URL for production."
                        );
                      } else {
                        alert("Image upload failed.");
                      }
                    };
                    reader.readAsDataURL(file);
                  } finally {
                    setUploading(false);
                    // allow re-uploading same file if needed
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <span className="cursor-pointer bg-orange-600 text-black px-4 py-2 text-xs font-black uppercase tracking-widest rounded inline-block">
                {uploading ? "Uploading..." : "Upload Image"}
              </span>
            </label>

            {imageUrl && (
              <div className="mt-2 border border-zinc-800 rounded overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Hero preview"
                  className="w-full max-h-[220px] object-cover"
                  onError={() => {
                    // Don’t block saving; just tell you preview failed
                    console.warn("Hero image preview failed to load:", imageUrl);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Featured */}
        <div className="mt-4 flex gap-3 items-start">
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
        <div className="mt-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
            Full Story
          </div>
          <div className="mb-3 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
            <input
              value={inlineAlt}
              onChange={(e) => setInlineAlt(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none text-xs"
              placeholder="Inline image alt text"
            />
            <select
              value={inlineAlign}
              onChange={(e) => setInlineAlign(e.target.value as "left" | "right" | "center")}
              className="bg-black border border-zinc-800 px-3 py-2 text-white outline-none text-xs"
            >
              <option value="left">Float left</option>
              <option value="right">Float right</option>
              <option value="center">Center</option>
            </select>
            <button
              type="button"
              onClick={handleInlineInsert}
              className="bg-orange-600 text-black px-4 py-2 text-xs font-black uppercase tracking-widest rounded"
            >
              Insert Inline Image
            </button>
          </div>
          <div className="mb-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
            <input
              value={inlineUrl}
              onChange={(e) => setInlineUrl(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-xs"
              placeholder="Paste inline image URL (https://...)"
            />
            <label className="inline-flex items-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handleInlineUpload(file).finally(() => {
                    (e.target as HTMLInputElement).value = "";
                  });
                }}
              />
              <span className="cursor-pointer bg-zinc-900 text-white px-4 py-2 text-xs font-black uppercase tracking-widest rounded border border-zinc-700">
                {uploading ? "Uploading..." : "Upload Inline"}
              </span>
            </label>
          </div>
          <textarea
            id="editor-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[260px] bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono text-sm"
            placeholder='Paste the full story here... (Inline: ![alt](https://... "left|right|center"))'
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;
