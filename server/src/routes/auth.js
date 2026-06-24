import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { success, fail } from '../utils/response.js';
import { authMiddleware, signToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json(fail('用户名和密码不能为空'));
  }
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json(fail('用户名或密码错误'));
  }
  const token = signToken(admin);
  res.json(success({ token, admin: { id: admin.id, username: admin.username, display_name: admin.display_name } }, '登录成功'));
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const admin = db.prepare('SELECT id, username, display_name FROM admins WHERE id = ?').get(req.admin.id);
  if (!admin) return res.status(404).json(fail('管理员不存在'));
  res.json(success(admin));
});

export default router;
