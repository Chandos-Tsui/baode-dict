import { Router } from 'express';
import db from '../db.js';
import { success, fail } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// ─── Public Routes ───

// GET /api/categories - list with word count
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.slug, c.description, c.sort_order, c.icon,
           (SELECT COUNT(*) FROM words w WHERE w.category_id = c.id AND w.status = 'published') as word_count
    FROM categories c
    ORDER BY c.sort_order ASC, c.id ASC
  `).all();
  res.json(success(rows));
});

// GET /api/categories/:slug - category detail with words
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  const { page = 1, size = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const sizeNum = Math.min(50, Math.max(1, parseInt(size) || 20));
  const offset = (pageNum - 1) * sizeNum;

  const cat = db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug);
  if (!cat) return res.status(404).json(fail('分类不存在'));

  const total = db.prepare(`
    SELECT COUNT(*) as c FROM words WHERE category_id = ? AND status = 'published'
  `).get(cat.id).c;

  const words = db.prepare(`
    SELECT w.id, w.word, w.pinyin_jin, w.ipa, w.definition, w.tags, w.audio_path, w.view_count
    FROM words w
    WHERE w.category_id = ? AND w.status = 'published'
    ORDER BY w.id DESC
    LIMIT ? OFFSET ?
  `).all(cat.id, sizeNum, offset);

  res.json(success({ ...cat, word_count: total, words, page: pageNum, size: sizeNum }));
});

// ─── Admin Routes (mounted at /api/admin/categories) ───

// POST / - create
router.post('/', authMiddleware, (req, res) => {
  const { name, slug, description, sort_order, icon } = req.body;
  if (!name || !slug) return res.status(400).json(fail('名称和 slug 为必填项'));
  try {
    const result = db.prepare(`
      INSERT INTO categories (name, slug, description, sort_order, icon)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, slug, description || null, sort_order || 0, icon || null);
    res.json(success({ id: result.lastInsertRowid }, '分类创建成功'));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json(fail('名称或 slug 已存在'));
    throw e;
  }
});

// PUT /:id
router.put('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json(fail('分类不存在'));

  const { name, slug, description, sort_order, icon } = req.body;
  try {
    db.prepare(`
      UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ?, icon = ?
      WHERE id = ?
    `).run(
      name ?? existing.name,
      slug ?? existing.slug,
      description ?? existing.description,
      sort_order ?? existing.sort_order,
      icon ?? existing.icon,
      id
    );
    res.json(success({ id }, '分类更新成功'));
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json(fail('名称或 slug 已存在'));
    throw e;
  }
});

// DELETE /:id
router.delete('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json(fail('分类不存在'));
  res.json(success(null, '分类已删除'));
});

export default router;
