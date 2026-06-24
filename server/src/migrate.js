import db from './db.js';

const SCHEMA_SQL = `
-- 管理员
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 分类
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  icon TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 词条
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  pinyin_jin TEXT,
  ipa TEXT,
  pinyin_mandarin TEXT,
  definition TEXT NOT NULL,
  examples TEXT,
  tags TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  audio_path TEXT,
  region_note TEXT,
  etymology TEXT,
  status TEXT DEFAULT 'published',
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_category ON words(category_id);

-- 全文搜索虚拟表 (FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS words_fts USING fts5(
  word, definition, examples, tags, pinyin_jin,
  content='words', content_rowid='id'
);

-- FTS 同步触发器: INSERT
CREATE TRIGGER IF NOT EXISTS words_ai AFTER INSERT ON words BEGIN
  INSERT INTO words_fts(rowid, word, definition, examples, tags, pinyin_jin)
  VALUES (new.id, new.word, new.definition, new.examples, new.tags, new.pinyin_jin);
END;

-- FTS 同步触发器: DELETE
CREATE TRIGGER IF NOT EXISTS words_ad AFTER DELETE ON words BEGIN
  INSERT INTO words_fts(words_fts, rowid, word, definition, examples, tags, pinyin_jin)
  VALUES ('delete', old.id, old.word, old.definition, old.examples, old.tags, old.pinyin_jin);
END;

-- FTS 同步触发器: UPDATE
CREATE TRIGGER IF NOT EXISTS words_au AFTER UPDATE ON words BEGIN
  INSERT INTO words_fts(words_fts, rowid, word, definition, examples, tags, pinyin_jin)
  VALUES ('delete', old.id, old.word, old.definition, old.examples, old.tags, old.pinyin_jin);
  INSERT INTO words_fts(rowid, word, definition, examples, tags, pinyin_jin)
  VALUES (new.id, new.word, new.definition, new.examples, new.tags, new.pinyin_jin);
END;

-- 用户提交 (增补 / 纠错)
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  proposed_data TEXT NOT NULL,
  contributor_name TEXT,
  contributor_contact TEXT,
  note TEXT,
  status TEXT DEFAULT 'pending',
  review_note TEXT,
  reviewed_by INTEGER REFERENCES admins(id),
  reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- 每日推荐
CREATE TABLE IF NOT EXISTS daily_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  editor_note TEXT,
  is_manual INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 音频文件登记
CREATE TABLE IF NOT EXISTS audio_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER REFERENCES words(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size INTEGER,
  uploaded_by INTEGER REFERENCES admins(id),
  created_at TEXT DEFAULT (datetime('now'))
);
`;

export function runMigrations() {
  db.exec(SCHEMA_SQL);
  console.log('[migrate] 数据库表结构已就绪');
}

// Allow running directly
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations();
  process.exit(0);
}
