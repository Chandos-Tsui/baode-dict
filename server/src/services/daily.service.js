import db from '../db.js';

// Get today's date in YYYY-MM-DD format (local time)
function todayStr() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
}

/**
 * Get the daily recommendation for a given date.
 * Strategy:
 * 1. Check if there's a manual/auto entry for today
 * 2. If not, auto-select using weighted randomness:
 *    - Not recommended in last 30 days (bonus)
 *    - Lower view_count (bonus for cold words)
 *    - Has audio (bonus)
 * 3. Cache the selection in daily_recommendations
 */
export function getDailyRecommendation(dateStr) {
  const date = dateStr || todayStr();

  // Check existing entry for this date
  const existing = db.prepare(`
    SELECT dr.id as daily_id, dr.date, dr.word_id, dr.editor_note, dr.is_manual,
           w.id, w.word, w.pinyin_jin, w.ipa, w.pinyin_mandarin, w.definition,
           w.examples, w.tags, w.audio_path, w.category_id, w.region_note, w.etymology,
           c.name as category_name, c.slug as category_slug
    FROM daily_recommendations dr
    JOIN words w ON dr.word_id = w.id
    LEFT JOIN categories c ON w.category_id = c.id
    WHERE dr.date = ?
  `).get(date);

  if (existing) {
    return { ...existing, is_manual: !!existing.is_manual };
  }

  // Auto-select: weighted random from published words
  const candidate = db.prepare(`
    SELECT w.id, w.word, w.pinyin_jin, w.ipa, w.pinyin_mandarin, w.definition,
           w.examples, w.tags, w.audio_path, w.category_id, w.region_note, w.etymology,
           w.view_count,
           c.name as category_name, c.slug as category_slug,
           (SELECT MAX(date) FROM daily_recommendations WHERE word_id = w.id) as last_rec_date,
           (CASE WHEN w.audio_path IS NOT NULL THEN 1 ELSE 0 END) as has_audio
    FROM words w
    LEFT JOIN categories c ON w.category_id = c.id
    WHERE w.status = 'published'
    ORDER BY
      has_audio DESC,
      (last_rec_date IS NULL OR julianday(?) - julianday(last_rec_date) > 30) DESC,
      w.view_count ASC,
      RANDOM()
    LIMIT 1
  `).get(date);

  if (!candidate) return null;

  // Cache the auto-selection
  db.prepare(`
    INSERT INTO daily_recommendations (date, word_id, is_manual) VALUES (?, ?, 0)
  `).run(date, candidate.id);

  return { ...candidate, date, is_manual: false, editor_note: null };
}

/**
 * Set a manual daily recommendation (maintainer)
 */
export function setDailyRecommendation(date, wordId, editorNote) {
  // Delete existing entry for this date
  db.prepare('DELETE FROM daily_recommendations WHERE date = ?').run(date);

  db.prepare(`
    INSERT INTO daily_recommendations (date, word_id, editor_note, is_manual)
    VALUES (?, ?, ?, 1)
  `).run(date, wordId, editorNote || null);
}

/**
 * Get recommendation history
 */
export function getDailyHistory(limit = 30) {
  return db.prepare(`
    SELECT dr.date, dr.editor_note, dr.is_manual,
           w.id as word_id, w.word, w.pinyin_jin, w.definition,
           c.name as category_name
    FROM daily_recommendations dr
    JOIN words w ON dr.word_id = w.id
    LEFT JOIN categories c ON w.category_id = c.id
    ORDER BY dr.date DESC
    LIMIT ?
  `).all(limit);
}
