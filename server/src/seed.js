import bcrypt from 'bcryptjs';
import db from './db.js';
import { runMigrations } from './migrate.js';
import { config } from './config.js';
import { toJSON } from './utils/response.js';

const CATEGORIES = [
  { name: '称谓·亲属', slug: 'kinship', icon: 'Users', description: '家人、亲戚、人称相关词汇', sort_order: 1 },
  { name: '天时·气象', slug: 'weather', icon: 'Cloud', description: '天气、节气、自然现象', sort_order: 2 },
  { name: '饮食·炊事', slug: 'food', icon: 'UtensilsCrossed', description: '饭菜、炊具、饮食动作', sort_order: 3 },
  { name: '身体·病痛', slug: 'body', icon: 'HeartPulse', description: '身体部位、疾病、健康', sort_order: 4 },
  { name: '动作·行为', slug: 'action', icon: 'Footprints', description: '动词、行为方式', sort_order: 5 },
  { name: '时间·节令', slug: 'time', icon: 'Clock', description: '时间词、节令、时令', sort_order: 6 },
  { name: '器物·居所', slug: 'objects', icon: 'Home', description: '器具、房屋、用品', sort_order: 7 },
  { name: '虚词·叹词', slug: 'particles', icon: 'Type', description: '语气词、助词、叹词', sort_order: 8 },
  { name: '俗语·歇后语', slug: 'proverb', icon: 'Quote', description: '俗话、歇后语、惯用语', sort_order: 9 },
];

const SAMPLE_WORDS = [
  {
    word: '圪蹴',
    pinyin_jin: 'geq jiu',
    ipa: '[kəʔ tɕiəu]',
    pinyin_mandarin: 'gē jiù',
    definition: '蹲下。保德方言中最常见的身体动作之一，「圪」为晋语特征前缀。',
    examples: ['你圪蹴下歇歇哇。', '老汉圪蹴在墙根底晒阳婆。'],
    tags: ['动词', '身体动作', '高频词'],
    category_slug: 'action',
    region_note: '保德及周边晋语区通用',
    etymology: '「圪」为晋语广泛使用的词头，「蹴」古义为踢、踩，在此表蹲。',
  },
  {
    word: '夜来',
    pinyin_jin: 'ie lai',
    ipa: '[iɛ lai]',
    pinyin_mandarin: 'yè lái',
    definition: '昨天。保德人指称前一天的说法。',
    examples: ['夜来我进城去咧。', '夜来的雨下得大。'],
    tags: ['时间词', '高频词'],
    category_slug: 'time',
    region_note: '晋语区常见说法',
    etymology: '古汉语「夜来」指夜里以来，引申为昨天。',
  },
  {
    word: '婆姨',
    pinyin_jin: 'po yi',
    ipa: "[pʰo i]",
    pinyin_mandarin: 'pó yí',
    definition: '妻子；泛指已婚妇女。保德话中对妻子的常用称呼。',
    examples: ['他婆姨去赶集咧。', '那婆姨能干得很。'],
    tags: ['名词', '称谓', '高频词'],
    category_slug: 'kinship',
    region_note: '陕北晋语区通用',
    etymology: '源自「婆娘」一类说法的音变。',
  },
  {
    word: '日怪',
    pinyin_jin: 'rih guai',
    ipa: '[ʐɿ kuai]',
    pinyin_mandarin: 'rì guài',
    definition: '奇怪、不可思议。常用于感叹事物反常。',
    examples: ['这事儿真日怪。', '天气日怪得很，一会儿晴一会儿阴。'],
    tags: ['形容词', '感叹'],
    category_slug: 'particles',
    region_note: '保德常用',
  },
  {
    word: '咋接',
    pinyin_jin: 'za jie',
    ipa: '[tsa tɕiɛ]',
    pinyin_mandarin: 'zǎ jiē',
    definition: '怎么办、怎么。用于询问方式或表示无奈。',
    examples: ['这事儿咋接弄咧？', '你说咋接就咋接。'],
    tags: ['疑问词', '高频词'],
    category_slug: 'particles',
    region_note: '晋语区通用',
  },
  {
    word: '阳婆',
    pinyin_jin: 'yo po',
    ipa: '[iɔ pʰo]',
    pinyin_mandarin: 'yáng pó',
    definition: '太阳。保德话称太阳为「阳婆」。',
    examples: ['阳婆出来咧。', '坐在阳婆地晒晒。'],
    tags: ['名词', '自然现象'],
    category_slug: 'weather',
    region_note: '晋语区常见',
    etymology: '「阳」指太阳，「婆」为拟人后缀。',
  },
];

export async function runSeed() {
  // First run migrations to ensure tables exist
  runMigrations();

  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as c FROM categories').get();
  if (count.c > 0) {
    console.log('[seed] 数据已存在，跳过种子数据');
    return;
  }

  // Seed categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, description, sort_order, icon)
    VALUES (@name, @slug, @description, @sort_order, @icon)
  `);
  for (const cat of CATEGORIES) {
    insertCategory.run(cat);
  }
  console.log(`[seed] 已插入 ${CATEGORIES.length} 个分类`);

  // Seed words
  const insertWord = db.prepare(`
    INSERT INTO words (word, pinyin_jin, ipa, pinyin_mandarin, definition, examples, tags, category_id, region_note, etymology, status)
    VALUES (@word, @pinyin_jin, @ipa, @pinyin_mandarin, @definition, @examples, @tags, @category_id, @region_note, @etymology, 'published')
  `);
  const getCategory = db.prepare('SELECT id FROM categories WHERE slug = ?');

  for (const w of SAMPLE_WORDS) {
    const cat = getCategory.get(w.category_slug);
    insertWord.run({
      word: w.word,
      pinyin_jin: w.pinyin_jin,
      ipa: w.ipa,
      pinyin_mandarin: w.pinyin_mandarin,
      definition: w.definition,
      examples: toJSON(w.examples),
      tags: toJSON(w.tags),
      category_id: cat ? cat.id : null,
      region_note: w.region_note || null,
      etymology: w.etymology || null,
    });
  }
  console.log(`[seed] 已插入 ${SAMPLE_WORDS.length} 条示例词条`);

  // Seed default admin
  const passwordHash = bcrypt.hashSync(config.adminDefaultPassword, 10);
  db.prepare(`
    INSERT INTO admins (username, password_hash, display_name) VALUES (?, ?, ?)
  `).run('admin', passwordHash, '管理员');
  console.log(`[seed] 已创建默认管理员 (用户名: admin, 密码: ${config.adminDefaultPassword})`);
}

// Allow running directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed().then(() => process.exit(0)).catch(err => {
    console.error('[seed] 错误:', err);
    process.exit(1);
  });
}
