import { Router } from 'express';
import db from '../db.js';
import { success, fail, parseJSON, toJSON } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { config } from '../config.js';
import path from 'path';
import fs from 'fs';

const router = Router();

// Helper: parse JSON fields in a word row
function parseWord(row) {
  if (!row) return null;
  return {
    ...row,
    examples: parseJSON(row.examples, []),
    tags: parseJSON(row.tags, []),
  };
}

// Build FTS5 MATCH query string from user input
function buildFTSQuery(q) {
  const cleaned = (q || '').replace(/["*+\-:()^]/g, ' ').trim();
  if (!cleaned) return null;
  const terms = cleaned.split(/\s+/).filter(Boolean);
  return terms.map(t => t + '*').join(' OR ');
}

// ─── Public Routes ───

// GET /api/words - list/search
router.get('/', (req, res) => {
  const { q, category, tag, page = 1, size = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const sizeNum = Math.min(50, Math.max(1, parseInt(size) || 20));
  const offset = (pageNum - 1) * sizeNum;

  let where = ["w.status = 'published'"];
  let params = [];

  if (q && q.trim()) {
    const ftsQuery = buildFTSQuery(q);
    if (ftsQuery) {
      where.push('w.id IN (SELECT rowid FROM words_fts WHERE words_fts MATCH ?)');
      params.push(ftsQuery);
    }
  }
  if (category) {
    where.push('c.slug = ?');
    params.push(category);
  }
  if (tag) {
    where.push('w.tags LIKE ?');
    params.push(`%"${tag}"%`);
  }

  const whereClause = where.join(' AND ');

  const total = db.prepare(`
    SELECT COUNT(*) as c FROM words w
    LEFT JOIN categories c ON w.category_id = c.id
    WHERE ${whereClause}
  `).get(...params).c;

  const rows = db.prepare(`
    SELECT w.id, w.word, w.pinyin_jin, w.ipa, w.pinyin_mandarin, w.definition,
           w.examples, w.tags, w.audio_path, w.category_id, w.region_note,
           w.view_count, w.created_at,
           c.name as category_name, c.slug as category_slug, c.icon as category_icon
    FROM words w
    LEFT JOIN categories c ON w.category_id = c.id
    WHERE ${whereClause}
    ORDER BY w.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, sizeNum, offset);

  const items = rows.map(parseWord);
  res.json(success({ items, total, page: pageNum, size: sizeNum }));
});

// GET /api/tags - popular tags cloud
router.get('/tags', (req, res) => {
  const rows = db.prepare(`
    SELECT tags FROM words WHERE status = 'published' AND tags IS NOT NULL
  `).all();
  const tagCount = {};
  for (const row of rows) {
    const tags = parseJSON(row.tags, []);
    for (const t of tags) {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }
  const tags = Object.entries(tagCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
  res.json(success(tags));
});

// GET /api/words/:id - detail (increments view_count)
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const row = db.prepare(`
    SELECT w.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon
    FROM words w
    LEFT JOIN categories c ON w.category_id = c.id
    WHERE w.id = ? AND w.status = 'published'
  `).get(id);

  if (!row) return res.status(404).json(fail('词条不存在'));

  // Increment view count
  db.prepare('UPDATE words SET view_count = view_count + 1 WHERE id = ?').run(id);

  res.json(success(parseWord(row)));
});

// GET /api/words/:id/related
router.get('/:id/related', (req, res) => {
  const id = parseInt(req.params.id);
  const word = db.prepare('SELECT category_id, tags FROM words WHERE id = ?').get(id);
  if (!word) return res.status(404).json(fail('词条不存在'));

  const tags = parseJSON(word.tags, []);
  const rows = db.prepare(`
    SELECT w.id, w.word, w.pinyin_jin, w.definition, w.tags, w.audio_path,
           c.name as category_name, c.slug as category_slug
    FROM words w
    LEFT JOIN categories c ON w.category_id = c.id
    WHERE w.id != ? AND w.status = 'published' AND w.category_id = ?
    ORDER BY RANDOM() LIMIT 6
  `).all(id, word.category_id);

  const items = rows.map(parseWord);
  res.json(success(items));
});

// ─── Admin Routes (require auth, mounted at /api/admin/words) ───

// POST / - create
router.post('/', authMiddleware, (req, res) => {
  const { word, pinyin_jin, ipa, pinyin_mandarin, definition, examples, tags, category_id, region_note, etymology, status } = req.body;
  if (!word || !definition) {
    return res.status(400).json(fail('词条和解释为必填项'));
  }
  const result = db.prepare(`
    INSERT INTO words (word, pinyin_jin, ipa, pinyin_mandarin, definition, examples, tags, category_id, region_note, etymology, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    word, pinyin_jin || null, ipa || null, pinyin_mandarin || null, definition,
    toJSON(examples), toJSON(tags), category_id || null,
    region_note || null, etymology || null, status || 'published'
  );
  res.json(success({ id: result.lastInsertRowid }, '词条创建成功'));
});

// PUT /:id - update
router.put('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM words WHERE id = ?').get(id);
  if (!existing) return res.status(404).json(fail('词条不存在'));

  const { word, pinyin_jin, ipa, pinyin_mandarin, definition, examples, tags, category_id, region_note, etymology, status, audio_path } = req.body;
  db.prepare(`
    UPDATE words SET
      word = ?, pinyin_jin = ?, ipa = ?, pinyin_mandarin = ?, definition = ?,
      examples = ?, tags = ?, category_id = ?, region_note = ?, etymology = ?,
      status = ?, audio_path = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    word ?? existing.word,
    pinyin_jin ?? existing.pinyin_jin,
    ipa ?? existing.ipa,
    pinyin_mandarin ?? existing.pinyin_mandarin,
    definition ?? existing.definition,
    examples != null ? toJSON(examples) : existing.examples,
    tags != null ? toJSON(tags) : existing.tags,
    category_id !== undefined ? (category_id || null) : existing.category_id,
    region_note ?? existing.region_note,
    etymology ?? existing.etymology,
    status ?? existing.status,
    audio_path ?? existing.audio_path,
    id
  );
  res.json(success({ id }, '词条更新成功'));
});

// DELETE /:id
router.delete('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const result = db.prepare('DELETE FROM words WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json(fail('词条不存在'));
  res.json(success(null, '词条已删除'));
});

// POST /:id/audio - upload audio
router.post('/:id/audio', authMiddleware, upload.single('audio'), (req, res) => {
  const id = parseInt(req.params.id);
  const word = db.prepare('SELECT id, audio_path FROM words WHERE id = ?').get(id);
  if (!word) return res.status(404).json(fail('词条不存在'));
  if (!req.file) return res.status(400).json(fail('未收到音频文件'));

  // Delete old audio file if exists
  if (word.audio_path) {
    const oldFile = path.join(config.rootDir, word.audio_path);
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
  }

  const audioPath = `/uploads/audio/${req.file.filename}`;
  db.prepare('UPDATE words SET audio_path = ?, updated_at = datetime("now") WHERE id = ?').run(audioPath, id);

  // Register in audio_files table
  db.prepare(`
    INSERT INTO audio_files (word_id, filename, original_name, mime_type, size, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.admin.id);

  res.json(success({ audio_path: audioPath }, '音频上传成功'));
});

// DELETE /:id/audio
router.delete('/:id/audio', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const word = db.prepare('SELECT audio_path FROM words WHERE id = ?').get(id);
  if (!word) return res.status(404).json(fail('词条不存在'));
  if (word.audio_path) {
    const file = path.join(config.rootDir, word.audio_path);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  db.prepare('UPDATE words SET audio_path = NULL, updated_at = datetime("now") WHERE id = ?').run(id);
  res.json(success(null, '音频已删除'));
});

export default router;
