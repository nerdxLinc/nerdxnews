import React from "react";

export default function Newsletter() {
  return (
    <section id="newsletter" className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="border border-orange-500/40 bg-zinc-950/60 p-5 sm:p-8">
        <h2 className="text-xl sm:text-3xl font-black">Newsletter</h2>
        <p className="mt-2 text-sm sm:text-base text-zinc-300">
          Subscribe to get new posts in your inbox. (Prototype form — you can wire this to Mailchimp/Substack later.)
        </p>

        <form
          className="mt-5 flex flex-col sm:flex-row gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            alert("Newsletter signup is a placeholder in this prototype.");
          }}
        >
          <input
            type="email"
            required
            placeholder="you@example.com"
            className="flex-1 px-3 py-3 border border-zinc-700 bg-black/40 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="px-5 py-3 font-bold uppercase border border-orange-500 bg-orange-600/90 hover:bg-orange-500 transition"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
