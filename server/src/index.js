import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';
import { runMigrations } from './migrate.js';
import { runSeed } from './seed.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import wordRoutes from './routes/words.js';
import categoryRoutes from './routes/categories.js';
import submissionRoutes from './routes/submissions.js';
import dailyRoutes from './routes/daily.js';
import db from './db.js';
import { authMiddleware } from './middleware/auth.js';
import { success } from './utils/response.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static: serve uploaded audio files
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(config.rootDir, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json(success({ status: 'ok', time: new Date().toISOString() }));
});

// Admin stats endpoint
app.get('/api/admin/stats', authMiddleware, (req, res) => {
  const wordCount = db.prepare("SELECT COUNT(*) as c FROM words").get().c;
  const publishedCount = db.prepare("SELECT COUNT(*) as c FROM words WHERE status = 'published'").get().c;
  const categoryCount = db.prepare("SELECT COUNT(*) as c FROM categories").get().c;
  const pendingSubmissions = db.prepare("SELECT COUNT(*) as c FROM submissions WHERE status = 'pending'").get().c;
  const totalSubmissions = db.prepare("SELECT COUNT(*) as c FROM submissions").get().c;
  const audioCount = db.prepare("SELECT COUNT(*) as c FROM words WHERE audio_path IS NOT NULL").get().c;
  const totalViews = db.prepare("SELECT COALESCE(SUM(view_count),0) as s FROM words").get().s;

  // Recent 7 days submission trend
  const trend = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM submissions
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all();

  res.json(success({
    wordCount, publishedCount, categoryCount,
    pendingSubmissions, totalSubmissions,
    audioCount, totalViews, trend,
  }));
});

// Routes — public
app.use('/api/auth', authRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/daily', dailyRoutes);

// Routes — admin (mounted at /api/admin/* to match frontend expectations)
app.use('/api/admin/words', wordRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/submissions', submissionRoutes);
app.use('/api/admin/daily', dailyRoutes);

// 404 & Error handlers (only for /api routes)
app.use('/api', notFoundHandler);
app.use(errorHandler);

// Serve built frontend (production mode — single server)
const distPath = path.join(config.rootDir, '..', 'web', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: all non-API, non-static routes return index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log('[server] 前端静态文件已挂载:', distPath);
}

// Initialize and start
async function start() {
  // Run migrations and seed on startup
  runMigrations();
  await runSeed();

  app.listen(config.port, () => {
    console.log(`[server] 保德方言词典后端已启动: http://localhost:${config.port}`);
    console.log(`[server] API 前缀: /api`);
  });
}

start().catch(err => {
  console.error('[server] 启动失败:', err);
  process.exit(1);
});
