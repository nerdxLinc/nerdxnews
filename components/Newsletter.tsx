import React from "react";

export default function Newsletter() {
  return (
    <section className="p-6 border rounded">
      <h2 className="text-xl font-bold">Newsletter</h2>
      <p className="mt-2 text-sm opacity-80">
        Subscribe to get new posts in your inbox.
      </p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          alert("Newsletter signup is a placeholder in this prototype.");
        }}
      >
        <input
          type="email"
          required
          placeholder="you@example.com"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 border rounded">
          Subscribe
        </button>
      </form>
    </section>
  );
}
