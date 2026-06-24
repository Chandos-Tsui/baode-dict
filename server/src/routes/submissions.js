import { Router } from 'express';
import db from '../db.js';
import { success, fail, parseJSON, toJSON } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// ─── Public Route (mounted at /api/submissions) ───

// POST / - user submits a new word or correction
router.post('/', (req, res) => {
  const { type, word_id, proposed_data, contributor_name, contributor_contact, note } = req.body;
  if (!type || !['add', 'correct'].includes(type)) {
    return res.status(400).json(fail('提交类型无效（add 或 correct）'));
  }
  if (!proposed_data || typeof proposed_data !== 'object') {
    return res.status(400).json(fail('提交数据不能为空'));
  }
  if (type === 'correct' && !word_id) {
    return res.status(400).json(fail('纠错需指定原词条 ID'));
  }

  const result = db.prepare(`
    INSERT INTO submissions (type, word_id, proposed_data, contributor_name, contributor_contact, note, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    type,
    word_id || null,
    toJSON(proposed_data),
    contributor_name || null,
    contributor_contact || null,
    note || null
  );
  res.json(success({ id: result.lastInsertRowid }, '提交成功，感谢您的贡献！'));
});

// ─── Admin Routes (mounted at /api/admin/submissions, require auth) ───

// GET / - list (filter by status)
router.get('/list', authMiddleware, (req, res) => {
  const { status, page = 1, size = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const sizeNum = Math.min(50, Math.max(1, parseInt(size) || 20));
  const offset = (pageNum - 1) * sizeNum;

  let where = '1=1';
  let params = [];
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    where = 's.status = ?';
    params.push(status);
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM submissions s WHERE ${where}`).get(...params).c;

  const rows = db.prepare(`
    SELECT s.*, w.word as target_word
    FROM submissions s
    LEFT JOIN words w ON s.word_id = w.id
    WHERE ${where}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, sizeNum, offset);

  const items = rows.map(r => ({
    ...r,
    proposed_data: parseJSON(r.proposed_data, {}),
  }));

  res.json(success({ items, total, page: pageNum, size: sizeNum }));
});

// GET /:id - detail
router.get('/detail/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const row = db.prepare(`
    SELECT s.*, w.word as target_word
    FROM submissions s
    LEFT JOIN words w ON s.word_id = w.id
    WHERE s.id = ?
  `).get(id);
  if (!row) return res.status(404).json(fail('提交记录不存在'));
  res.json(success({ ...row, proposed_data: parseJSON(row.proposed_data, {}) }));
});

// POST /:id/approve - approve (optionally with edited data)
router.post('/:id/approve', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
  if (!sub) return res.status(404).json(fail('提交记录不存在'));
  if (sub.status !== 'pending') return res.status(400).json(fail('该提交已处理'));

  const data = req.body.data || parseJSON(sub.proposed_data, {});
  const { word, pinyin_jin, ipa, pinyin_mandarin, definition, examples, tags, category_id, region_note, etymology } = data;

  if (!word || !definition) {
    return res.status(400).json(fail('词条和解释为必填项'));
  }

  if (sub.type === 'add') {
    const result = db.prepare(`
      INSERT INTO words (word, pinyin_jin, ipa, pinyin_mandarin, definition, examples, tags, category_id, region_note, etymology, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `).run(
      word, pinyin_jin || null, ipa || null, pinyin_mandarin || null, definition,
      toJSON(examples), toJSON(tags), category_id || null,
      region_note || null, etymology || null
    );
    db.prepare(`
      UPDATE submissions SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now'), word_id = ?
      WHERE id = ?
    `).run(req.admin.id, result.lastInsertRowid, id);
  } else {
    const existing = db.prepare('SELECT * FROM words WHERE id = ?').get(sub.word_id);
    if (!existing) return res.status(404).json(fail('原词条不存在'));

    db.prepare(`
      UPDATE words SET
        word = ?, pinyin_jin = ?, ipa = ?, pinyin_mandarin = ?, definition = ?,
        examples = ?, tags = ?, category_id = ?, region_note = ?, etymology = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      word, pinyin_jin ?? existing.pinyin_jin, ipa ?? existing.ipa,
      pinyin_mandarin ?? existing.pinyin_mandarin, definition,
      examples != null ? toJSON(examples) : existing.examples,
      tags != null ? toJSON(tags) : existing.tags,
      category_id !== undefined ? (category_id || null) : existing.category_id,
      region_note ?? existing.region_note, etymology ?? existing.etymology,
      sub.word_id
    );
    db.prepare(`
      UPDATE submissions SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).run(req.admin.id, id);
  }

  res.json(success(null, '已通过并写入词条'));
});

// POST /:id/reject
router.post('/:id/reject', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { review_note } = req.body;
  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
  if (!sub) return res.status(404).json(fail('提交记录不存在'));
  if (sub.status !== 'pending') return res.status(400).json(fail('该提交已处理'));

  db.prepare(`
    UPDATE submissions SET status = 'rejected', review_note = ?, reviewed_by = ?, reviewed_at = datetime('now')
    WHERE id = ?
  `).run(review_note || null, req.admin.id, id);

  res.json(success(null, '已驳回'));
});

export default router;
