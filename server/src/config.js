import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const config = {
  port: process.env.PORT || 8787,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123',
  dbPath: path.join(__dirname, '..', 'data', 'baode.db'),
  uploadsDir: path.join(__dirname, '..', 'uploads', 'audio'),
  rootDir: path.join(__dirname, '..'),
};

export const __dirnameResolved = __dirname;
