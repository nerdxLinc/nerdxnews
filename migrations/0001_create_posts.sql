CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  imageUrl TEXT,
  date TEXT,
  category TEXT,
  isFeatured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  byline TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_status_date ON posts (status, date, updated_at);
