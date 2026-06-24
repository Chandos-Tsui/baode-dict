import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, data: null, message: '未登录或令牌缺失' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.admin = { id: payload.sub, username: payload.username };
    next();
  } catch {
    return res.status(401).json({ code: 401, data: null, message: '令牌无效或已过期' });
  }
}

export function signToken(admin) {
  return jwt.sign(
    { sub: admin.id, username: admin.username },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}
