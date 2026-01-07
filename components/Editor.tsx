// components/Editor.tsx
// Blocks-capable editor with INLINE IMAGE UPLOAD (no URL-copy workaround)

import React, { useEffect, useMemo, useState } from "react";
import { Post, Category, ContentBlock } from "../types";

type EditorProps = {
  post: Post | null | undefined; // undefined means editor closed; null means "new"
  onSave: (post: Post) => void;  // saves to local (App.tsx localStorage)
  onClose: () => void;
};

const CATEGORIES: Exclude<Category, "All">[] = [
  "Books & Comics",
  "Tabletop Games & RPGs",
  "Video Games",
  "Movies",
  "Television",
  "Pop Culture",
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
  return (p?.imageUrl || p?.heroImage || p?.image || "").toString();
}

function isProbablyUrl(v: string): boolean {
  const s = (v || "").trim();
  if (!s) return true;
  return /^https?:\/\/.+/i.test(s);
}

// Keep your known-working upload endpoint as-is
function getUploadEndpoint(): string {
  return "https://noisy-scene-8c2f.blincolnbransch.workers.dev/upload-image";
}

function textToParagraphBlocks(raw: string): ContentBlock[] {
  const s = String(raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!s) return [];
  return s
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((text) => ({ type: "p", text }));
}

function blocksToText(blocks: ContentBlock[]): string {
  // Conservative: only paragraphs + headings convert to text.
  // Images do not get embedded into legacy text.
  const parts: string[] = [];
  for (const b of blocks) {
    if (b.type === "h2") parts.push(b.text.trim());
    if (b.type === "p") parts.push(b.text.trim());
  }
  return parts.filter(Boolean).join("\n\n");
}

function cloneBlocks(b: ContentBlock[]): ContentBlock[] {
  return JSON.parse(JSON.stringify(b || []));
}

async function uploadFileToR2(opts: {
  file: File;
  slugSeed: string;
}): Promise<string> {
  const endpoint = getUploadEndpoint();

  const form = new FormData();
  form.append("file", opts.file);
  form.append("folder", "articles");
  form.append("slug", slugify(opts.slugSeed || "article"));

  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);

  const data = await res.json();
  const url = String(data?.url || "").trim();
  if (!url) throw new Error("Upload did not return a url");
  return url;
}

const Editor: React.FC<EditorProps> = ({ post, onSave, onClose }) => {
  const isOpen = post !== undefined;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState((post as any)?.slug ?? "");
  const [date, setDate] = useState((post as any)?.date ?? safeTodayISO());
  const [category, setCategory] = useState<Category>((post as any)?.category ?? "Books & Comics");
  const [excerpt, setExcerpt] = useState((post as any)?.excerpt ?? "");

  // Legacy body (kept for backward compatibility)
  const [content, setContent] = useState(
    (post as any)?.content ?? (post as any)?.body ?? (post as any)?.story ?? ""
  );

  // New best-practice body
  const initialBlocks = useMemo<ContentBlock[]>(() => {
    const b = (post as any)?.contentBlocks;
    if (Array.isArray(b) && b.length) return cloneBlocks(b as ContentBlock[]);
    return [];
  }, [post]);

  const [useBlocks, setUseBlocks] = useState<boolean>(() => {
    const b = (post as any)?.contentBlocks;
    return Array.isArray(b) && b.length > 0;
  });

  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);

  const [imageUrl, setImageUrl] = useState<string>(pickImage(post));
  const [featured, setFeatured] = useState<boolean>(!!((post as any)?.isFeatured ?? (post as any)?.IsFeatured ?? (post as any)?.featured));

  // Upload state
  const [heroUploading, setHeroUploading] = useState(false);
  const [blockUploadingIndex, setBlockUploadingIndex] = useState<number | null>(null);

  // When switching between posts, refresh fields
  useEffect(() => {
    setTitle(post?.title ?? "");
    setSlug((post as any)?.slug ?? "");
    setDate((post as any)?.date ?? safeTodayISO());
    setCategory((post as any)?.category ?? "Books & Comics");
    setExcerpt((post as any)?.excerpt ?? "");
    setContent((post as any)?.content ?? (post as any)?.body ?? (post as any)?.story ?? "");
    setImageUrl(pickImage(post));
    setFeatured(!!((post as any)?.isFeatured ?? (post as any)?.IsFeatured ?? (post as any)?.featured));

    const b = (post as any)?.contentBlocks;
    const hasBlocks = Array.isArray(b) && b.length > 0;
    setUseBlocks(hasBlocks);
    setBlocks(hasBlocks ? cloneBlocks(b as ContentBlock[]) : []);
  }, [post]);

  const derivedSlug = useMemo(() => slugify(title), [title]);

  const updateBlock = (idx: number, next: ContentBlock) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? next : b)));
  };

  const addBlock = (b: ContentBlock) => setBlocks((prev) => [...prev, b]);

  const moveBlock = (idx: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[idx];
      next[idx] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const deleteBlock = (idx: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const turnOnBlocksFromLegacy = () => {
    const converted = textToParagraphBlocks(content);
    setBlocks(converted.length ? converted : [{ type: "p", text: "" }]);
    setUseBlocks(true);
  };

  const onSubmit = () => {
    const finalSlug = (slug || derivedSlug || "").trim();

    if (!title.trim()) {
      alert("Title is required.");
      return;
    }
    if (!finalSlug.trim()) {
      alert("Slug is required (or enter a Title so it can auto-generate).");
      return;
    }
    if (!excerpt.trim()) {
      alert("Excerpt is required.");
      return;
    }
    if (!date.trim()) {
      alert("Date is required.");
      return;
    }
    if (!category || category === "All") {
      alert("Choose a category.");
      return;
    }
    if (!isProbablyUrl(imageUrl)) {
      alert("Hero Image must be a full URL (https://...) or left blank.");
      return;
    }

    // Decide body
    let outContent = content;
    let outBlocks: ContentBlock[] | undefined = undefined;

    if (useBlocks) {
      if (!blocks || blocks.length === 0) {
        alert("Blocks mode is ON, but there are no blocks. Add at least one paragraph.");
        return;
      }
      outBlocks = cloneBlocks(blocks);
      // Keep a readable legacy content field too
      outContent = blocksToText(outBlocks);
    } else {
      if (!content.trim()) {
        alert("Full story is required.");
        return;
      }
    }

    const payload: Post = {
      ...(post ?? { id: crypto.randomUUID() }),
      title: title.trim(),
      slug: finalSlug.trim(),
      date: date.trim(),
      category,
      excerpt: excerpt.trim(),
      content: outContent,
      imageUrl: imageUrl.trim() || undefined,
      isFeatured: featured ? 1 : 0,
      IsFeatured: featured ? 1 : 0,
      ...(outBlocks ? { contentBlocks: outBlocks } : {}),
    };

    onSave(payload);
    onClose();
  };

  const slugSeed = slug || derivedSlug || title || "article";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center overflow-auto py-10">
      <div className="w-[92vw] max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest font-black">Field Intel</div>
            <div className="text-2xl text-white font-black mt-1">{post ? "Edit Article" : "New Article"}</div>
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
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-sm"
              placeholder="Article title..."
            />
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Slug</div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-sm"
              placeholder={derivedSlug || "auto-generated from title"}
            />
            {derivedSlug && !slug.trim() ? (
              <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                Auto: <span className="text-zinc-300">{derivedSlug}</span>
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Date</div>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-sm"
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Category</div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Excerpt</div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full min-h-[88px] bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono text-sm"
              placeholder="Short blurb / dek..."
            />
          </div>

          <div className="md:col-span-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Hero Image</div>

            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-xs"
              placeholder="Paste image URL here (...) or upload below"
            />

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      setHeroUploading(true);
                      const url = await uploadFileToR2({ file, slugSeed });
                      setImageUrl(url);
                    } catch (err) {
                      alert("Hero image upload failed.");
                      console.error(err);
                    } finally {
                      setHeroUploading(false);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <span className="cursor-pointer bg-orange-600 text-black px-4 py-2 text-xs font-black uppercase tracking-widest rounded inline-block">
                  {heroUploading ? "Uploading..." : "Upload Hero"}
                </span>
              </label>

              {imageUrl ? (
                <span className="text-xs text-zinc-400 font-mono break-all">
                  {imageUrl}
                </span>
              ) : null}
            </div>

            {imageUrl && (
              <div className="mt-2 border border-zinc-800 rounded overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Hero preview"
                  className="w-full max-h-[220px] object-cover"
                  onError={() => console.warn("Hero image preview failed to load:", imageUrl)}
                />
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex items-center gap-3 mt-2">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Featured (front page lead)
            </label>

            <div className="ml-auto flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={useBlocks}
                  onChange={(e) => {
                    const next = e.target.checked;
                    if (next && (!blocks || blocks.length === 0)) {
                      if (String(content || "").trim()) {
                        turnOnBlocksFromLegacy();
                        return;
                      }
                      setBlocks([{ type: "p", text: "" }]);
                    }
                    setUseBlocks(next);
                  }}
                />
                Best-practice body (blocks)
              </label>

              {!useBlocks && String(content || "").trim() ? (
                <button
                  onClick={turnOnBlocksFromLegacy}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 text-xs font-black uppercase tracking-widest rounded"
                  title="Convert current story text into paragraph blocks"
                >
                  Convert to Blocks
                </button>
              ) : null}
            </div>
          </div>

          {/* BODY */}
          <div className="md:col-span-2 mt-2">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Full Story
              {useBlocks ? " (Blocks: inline images, wrap, captions)" : ""}
            </div>

            {!useBlocks ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[260px] bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono text-sm"
                placeholder="Paste the full story here..."
              />
            ) : (
              <div className="border border-zinc-800 rounded-xl p-3 bg-black">
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => addBlock({ type: "p", text: "" })}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 text-xs font-black uppercase tracking-widest rounded"
                  >
                    + Paragraph
                  </button>
                  <button
                    onClick={() => addBlock({ type: "h2", text: "" })}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 text-xs font-black uppercase tracking-widest rounded"
                  >
                    + Heading
                  </button>
                  <button
                    onClick={() =>
                      addBlock({
                        type: "image",
                        src: "",
                        align: "left",
                        width: "40%",
                        caption: "",
                        alt: "",
                      })
                    }
                    className="bg-orange-600 text-black px-3 py-2 text-xs font-black uppercase tracking-widest rounded"
                  >
                    + Inline Image
                  </button>
                </div>

                {blocks.length === 0 ? (
                  <div className="text-sm text-zinc-400">No blocks yet. Add one above.</div>
                ) : (
                  <div className="space-y-3">
                    {blocks.map((b, idx) => (
                      <div key={idx} className="border border-zinc-800 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="text-xs text-zinc-400 font-mono">
                            #{idx + 1} — <span className="text-zinc-200">{b.type}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveBlock(idx, -1)}
                              className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-2 py-1 text-xs font-black rounded"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveBlock(idx, 1)}
                              className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-2 py-1 text-xs font-black rounded"
                              title="Move down"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => deleteBlock(idx)}
                              className="bg-zinc-900 border border-zinc-800 text-red-300 px-2 py-1 text-xs font-black rounded"
                              title="Delete"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {b.type === "p" ? (
                          <textarea
                            value={b.text}
                            onChange={(e) => updateBlock(idx, { type: "p", text: e.target.value })}
                            className="w-full min-h-[110px] bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-sm rounded"
                            placeholder="Paragraph text..."
                          />
                        ) : null}

                        {b.type === "h2" ? (
                          <input
                            value={b.text}
                            onChange={(e) => updateBlock(idx, { type: "h2", text: e.target.value })}
                            className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-sm rounded"
                            placeholder="Heading..."
                          />
                        ) : null}

                        {b.type === "image" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                                  Image URL
                                </div>

                                {/* INLINE UPLOAD BUTTON (the fix you demanded) */}
                                <label className="inline-flex items-center gap-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={blockUploadingIndex === idx}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;

                                      try {
                                        setBlockUploadingIndex(idx);
                                        const url = await uploadFileToR2({ file, slugSeed });
                                        updateBlock(idx, { ...b, src: url });
                                      } catch (err) {
                                        alert("Inline image upload failed.");
                                        console.error(err);
                                      } finally {
                                        setBlockUploadingIndex(null);
                                        (e.target as HTMLInputElement).value = "";
                                      }
                                    }}
                                  />
                                  <span
                                    className={`cursor-pointer px-3 py-1 text-xs font-black uppercase tracking-widest rounded border ${
                                      blockUploadingIndex === idx
                                        ? "bg-zinc-900 text-zinc-400 border-zinc-800"
                                        : "bg-orange-600 text-black border-orange-500"
                                    }`}
                                    title="Upload from your computer and auto-fill the URL"
                                  >
                                    {blockUploadingIndex === idx ? "Uploading..." : "Upload Image"}
                                  </span>
                                </label>
                              </div>

                              <input
                                value={b.src}
                                onChange={(e) => updateBlock(idx, { ...b, src: e.target.value })}
                                className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-xs rounded"
                                placeholder="https://images.nerdxnews.com/...jpg"
                              />
                            </div>

                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                                Align (wrap)
                              </div>
                              <select
                                value={b.align ?? "center"}
                                onChange={(e) =>
                                  updateBlock(idx, {
                                    ...b,
                                    align: e.target.value as any,
                                  })
                                }
                                className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-sm rounded"
                              >
                                <option value="left">left</option>
                                <option value="right">right</option>
                                <option value="center">center</option>
                              </select>
                            </div>

                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                                Width
                              </div>
                              <input
                                value={b.width ?? ""}
                                onChange={(e) => updateBlock(idx, { ...b, width: e.target.value })}
                                className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-sm rounded"
                                placeholder='e.g. 40% or 320px'
                              />
                            </div>

                            <div className="md:col-span-2">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                                Caption (optional)
                              </div>
                              <input
                                value={b.caption ?? ""}
                                onChange={(e) => updateBlock(idx, { ...b, caption: e.target.value })}
                                className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-sm rounded"
                                placeholder="Caption text..."
                              />
                            </div>

                            <div className="md:col-span-2">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">
                                Alt (optional)
                              </div>
                              <input
                                value={b.alt ?? ""}
                                onChange={(e) => updateBlock(idx, { ...b, alt: e.target.value })}
                                className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-sm rounded"
                                placeholder="Alt text..."
                              />
                            </div>

                            {b.src && /^https?:\/\//i.test(b.src) ? (
                              <div className="md:col-span-2 border border-zinc-800 rounded overflow-hidden">
                                <img
                                  src={b.src}
                                  alt={b.alt || b.caption || "Inline image preview"}
                                  className="w-full max-h-[260px] object-cover"
                                  onError={() => console.warn("Inline image preview failed:", b.src)}
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
