import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { Post, Category } from "../types";

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-float': {
        default: null,
        parseHTML: element => element.getAttribute('data-float'),
        renderHTML: attributes => {
          if (!attributes['data-float']) {
            return {};
          }
          return { 'data-float': attributes['data-float'] };
        },
      },
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width') || element.style.width?.replace('px', ''),
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width, style: `width: ${attributes.width}px` };
        },
      },
    };
  },
});

type EditorProps = {
  post: Post | null | undefined;
  onSave: (post: Post) => void;
  onClose: () => void;
};

const CATEGORIES: Exclude<Category, "All">[] = [
  "Books & Comics",
  "Games",
  "Movies",
  "Tech",
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

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const addImage = useCallback(() => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addYouTube = useCallback(() => {
    const url = window.prompt("Enter YouTube URL:");
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  const uploadImage = useCallback(async (file: File) => {
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/upload-image", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      const data = await res.json();
      if (data?.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } catch (err) {
      alert("Image upload failed. Try pasting a URL instead.");
      console.error(err);
    }
  }, [editor]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = "";
  }, [uploadImage]);

  const setImageFloat = useCallback((float: string) => {
    if (float === "none") {
      editor.chain().focus().updateAttributes('image', { 'data-float': null }).run();
    } else {
      editor.chain().focus().updateAttributes('image', { 'data-float': float }).run();
    }
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-zinc-900 border-b border-zinc-700 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("bold") ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-xs italic rounded ${editor.isActive("italic") ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 2 }) ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 text-xs font-bold rounded ${editor.isActive("heading", { level: 3 }) ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 text-xs rounded ${editor.isActive("bulletList") ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2 py-1 text-xs rounded ${editor.isActive("blockquote") ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
      >
        Quote
      </button>

      <div className="w-px h-6 bg-zinc-700 mx-1 self-center" />

      <button
        type="button"
        onClick={addImage}
        className="px-2 py-1 text-xs rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        title="Add image by URL"
      >
        Image URL
      </button>

      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <span className="px-2 py-1 text-xs rounded bg-orange-600 text-white hover:bg-orange-500 inline-block">
          Upload Image
        </span>
      </label>

      <button
        type="button"
        onClick={addYouTube}
        className="px-2 py-1 text-xs rounded bg-red-700 text-white hover:bg-red-600"
        title="Add YouTube video"
      >
        YouTube
      </button>

      <div className="w-px h-6 bg-zinc-700 mx-1 self-center" />

      <span className="text-[10px] text-zinc-500 self-center mr-1">Image align:</span>
      <button
        type="button"
        onClick={() => setImageFloat("left")}
        className="px-2 py-1 text-[10px] rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        title="Float image left (text wraps right)"
      >
        ← Left
      </button>
      <button
        type="button"
        onClick={() => setImageFloat("none")}
        className="px-2 py-1 text-[10px] rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        title="Center image (no text wrap)"
      >
        Center
      </button>
      <button
        type="button"
        onClick={() => setImageFloat("right")}
        className="px-2 py-1 text-[10px] rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        title="Float image right (text wraps left)"
      >
        Right →
      </button>

      <div className="w-px h-6 bg-zinc-700 mx-1 self-center" />

      <button
        type="button"
        onClick={() => {
          if (editor.isActive('image') || editor.isActive('youtube')) {
            editor.chain().focus().deleteSelection().run();
          } else {
            alert('Select an image or video first, then click delete.');
          }
        }}
        className="px-2 py-1 text-[10px] rounded bg-red-700 text-white hover:bg-red-600"
        title="Delete selected image or video"
      >
        Delete Selected
      </button>

      <div className="w-px h-6 bg-zinc-700 mx-1 self-center" />

      <span className="text-[10px] text-zinc-500 self-center mr-1">Width:</span>
      <input
        type="number"
        min="100"
        max="1200"
        step="50"
        placeholder="px"
        className="w-16 px-2 py-1 text-[10px] rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const val = parseInt((e.target as HTMLInputElement).value);
            if (val && val >= 100 && val <= 1200) {
              editor.chain().focus().updateAttributes('image', { width: val }).run();
            }
          }
        }}
        title="Set image width (100-1200px), press Enter"
      />
      <button
        type="button"
        onClick={() => {
          const input = document.querySelector('input[type="number"][placeholder="px"]') as HTMLInputElement;
          const val = parseInt(input?.value || '400');
          if (val && val >= 100 && val <= 1200) {
            editor.chain().focus().updateAttributes('image', { width: val }).run();
          }
        }}
        className="px-2 py-1 text-[10px] rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
        title="Apply width to selected image"
      >
        Apply
      </button>
    </div>
  );
};

const Editor: React.FC<EditorProps> = ({ post, onSave, onClose }) => {
  const isOpen = post !== undefined;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState((post as any)?.slug ?? "");
  const [date, setDate] = useState((post as any)?.date ?? safeTodayISO());
  const [category, setCategory] = useState<Category>((post as any)?.category ?? "Books & Comics");
  const [excerpt, setExcerpt] = useState((post as any)?.excerpt ?? "");
  const [imageUrl, setImageUrl] = useState<string>(pickImage(post));
  const [featured, setFeatured] = useState<boolean>(!!(post as any)?.isFeatured || !!(post as any)?.IsFeatured);
  const [uploading, setUploading] = useState(false);

  const initialContent = useMemo(() => {
    const content = (post as any)?.content ?? (post as any)?.body ?? (post as any)?.story ?? "";
    if (content.startsWith("<") && content.includes("</")) {
      return content;
    }
    if (content) {
      return content.split(/\n{2,}/).map((p: string) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
    }
    return "";
  }, [post]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage.configure({
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: "editor-youtube",
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Write your article here... Use the toolbar to add images and YouTube videos.",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none min-h-[300px] p-4 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    setTitle(post?.title ?? "");
    setSlug((post as any)?.slug ?? "");
    setDate((post as any)?.date ?? safeTodayISO());
    setCategory((post as any)?.category ?? "Books & Comics");
    setExcerpt((post as any)?.excerpt ?? "");
    setImageUrl(pickImage(post));
    setFeatured(!!(post as any)?.isFeatured || !!(post as any)?.IsFeatured);
    
    if (editor) {
      const content = (post as any)?.content ?? (post as any)?.body ?? (post as any)?.story ?? "";
      if (content.startsWith("<") && content.includes("</")) {
        editor.commands.setContent(content);
      } else if (content) {
        const html = content.split(/\n{2,}/).map((p: string) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
        editor.commands.setContent(html);
      } else {
        editor.commands.setContent("");
      }
    }
  }, [post, editor]);

  const derivedSlug = useMemo(() => slugify(title), [title]);

  useEffect(() => {
    if (!slug.trim() && title.trim()) setSlug(derivedSlug);
  }, [derivedSlug]);

  if (!isOpen) return null;

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

    const htmlContent = editor?.getHTML() || "";

    const next: any = {
      ...(post ?? {}),
      title: cleanTitle,
      slug: cleanSlug,
      date: (date || safeTodayISO()).trim(),
      category,
      excerpt: excerpt.trim(),
      content: htmlContent,
      imageUrl: cleanImage || undefined,
      isFeatured: featured ? 1 : 0,
      IsFeatured: featured ? 1 : 0,
    };

    if (!next.id) next.id = (post as any)?.id;

    onSave(next as Post);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-start justify-center overflow-auto py-6">
      <div className="w-[95vw] max-w-6xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-zinc-800">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest font-black">
              Rich Text Editor
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

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
                Title
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none rounded"
                placeholder="Enter title..."
                autoComplete="off"
              />
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
                Slug
              </div>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono text-sm rounded"
                placeholder={derivedSlug || "auto-generated-from-title"}
                autoComplete="off"
              />
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
                Date
              </div>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none font-mono text-sm rounded"
                placeholder="YYYY-MM-DD"
                autoComplete="off"
              />
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
                Category
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-black border border-zinc-800 px-3 py-3 text-white outline-none rounded"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
                Excerpt (Card Preview)
              </div>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full min-h-[80px] bg-black border border-zinc-800 px-3 py-3 text-white outline-none rounded"
                placeholder="Short teaser used on cards..."
              />
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
                Hero Image (Top of Article)
              </div>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-white outline-none font-mono text-xs rounded"
                placeholder="Paste image URL or upload below"
                autoComplete="off"
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
                      alert("Image upload failed.");
                      console.error(err);
                    } finally {
                      setUploading(false);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <span className="cursor-pointer bg-orange-600 text-black px-4 py-2 text-xs font-black uppercase tracking-widest rounded inline-block">
                  {uploading ? "Uploading..." : "Upload Hero"}
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 items-start mb-6">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="mt-1"
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

          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">
              Article Content
            </div>
            <div className="bg-black border border-zinc-800 rounded-lg overflow-hidden">
              <style>{`
                .ProseMirror img[data-float="left"] {
                  float: left;
                  margin: 0 1.5rem 1rem 0;
                  max-width: 50%;
                }
                .ProseMirror img[data-float="right"] {
                  float: right;
                  margin: 0 0 1rem 1.5rem;
                  max-width: 50%;
                }
                .ProseMirror img {
                  cursor: pointer;
                  border: 2px solid transparent;
                  transition: border-color 0.2s;
                }
                .ProseMirror img.ProseMirror-selectednode {
                  border-color: #f97316;
                  outline: none;
                }
                .ProseMirror p {
                  clear: none;
                }
                .ProseMirror::after {
                  content: "";
                  display: table;
                  clear: both;
                }
              `}</style>
              <MenuBar editor={editor} />
              <EditorContent editor={editor} />
            </div>
            <div className="mt-2 text-[10px] text-zinc-600">
              Tip: For inline images, recommended size is 400-500px wide for left/right float (text wrap), or 1200px for full-width. Click an image to select it, then use Width controls to resize.
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-6 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-6 py-3 text-xs font-black uppercase tracking-widest rounded"
            >
              Close
            </button>
            <button
              onClick={onSubmit}
              className="bg-orange-600 text-black px-6 py-3 text-xs font-black uppercase tracking-widest rounded"
            >
              Publish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
