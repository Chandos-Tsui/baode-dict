import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    cb(null, `${timestamp}-${random}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/ogg', 'audio/webm', 'audio/webm;codecs=opus'];
  if (allowed.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('仅支持音频文件'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
