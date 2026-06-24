import { Router } from 'express';
import db from '../db.js';
import { success, fail } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { getDailyRecommendation, setDailyRecommendation, getDailyHistory } from '../services/daily.service.js';
import { parseJSON } from '../utils/response.js';

const router = Router();

// ─── Public Routes (mounted at /api/daily) ───

// GET / - today's recommendation
router.get('/', (req, res) => {
  const { date } = req.query;
  const rec = getDailyRecommendation(date);
  if (!rec) return res.status(404).json(fail('暂无可推荐的词条'));
  const result = {
    ...rec,
    examples: parseJSON(rec.examples, []),
    tags: parseJSON(rec.tags, []),
  };
  res.json(success(result));
});

// GET /history
router.get('/history', (req, res) => {
  const { limit = 30 } = req.query;
  const rows = getDailyHistory(parseInt(limit) || 30);
  res.json(success(rows));
});

// ─── Admin Routes (mounted at /api/admin/daily, require auth) ───

// POST / - set manual recommendation
router.post('/', authMiddleware, (req, res) => {
  const { date, word_id, editor_note } = req.body;
  if (!date || !word_id) return res.status(400).json(fail('日期和词条 ID 为必填项'));

  const word = db.prepare('SELECT id FROM words WHERE id = ?').get(word_id);
  if (!word) return res.status(404).json(fail('词条不存在'));

  setDailyRecommendation(date, word_id, editor_note);
  res.json(success(null, '每日推荐已设置'));
});

// GET /list - list all recommendations
router.get('/list', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT dr.*, w.word, w.pinyin_jin
    FROM daily_recommendations dr
    JOIN words w ON dr.word_id = w.id
    ORDER BY dr.date DESC
  `).all();
  res.json(success(rows));
});

// DELETE /:id
router.delete('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const result = db.prepare('DELETE FROM daily_recommendations WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json(fail('推荐记录不存在'));
  res.json(success(null, '已取消该推荐'));
});

export default router;
