// 词条类型
export interface Word {
  id: number;
  word: string;
  pinyin_jin: string | null;
  ipa: string | null;
  pinyin_mandarin: string | null;
  definition: string;
  examples: string[];
  tags: string[];
  category_id: number | null;
  audio_path: string | null;
  region_note: string | null;
  etymology: string | null;
  status?: string;
  view_count: number;
  created_at?: string;
  updated_at?: string;
  category_name?: string | null;
  category_slug?: string | null;
  category_icon?: string | null;
}

// 词条列表项（精简）
export interface WordListItem {
  id: number;
  word: string;
  pinyin_jin: string | null;
  ipa: string | null;
  definition: string;
  tags: string[];
  audio_path: string | null;
  view_count: number;
  category_name?: string | null;
  category_slug?: string | null;
}

// 分类
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  icon: string | null;
  word_count: number;
}

// 每日推荐
export interface DailyRecommendation extends Word {
  date: string;
  editor_note: string | null;
  is_manual: boolean;
}

// 用户提交
export interface Submission {
  id: number;
  type: 'add' | 'correct';
  word_id: number | null;
  proposed_data: Partial<Word>;
  contributor_name: string | null;
  contributor_contact: string | null;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  target_word?: string | null;
}

// API 响应
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// 分页列表
export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

// 标签
export interface Tag {
  name: string;
  count: number;
}

// 后台统计
export interface AdminStats {
  wordCount: number;
  publishedCount: number;
  categoryCount: number;
  pendingSubmissions: number;
  totalSubmissions: number;
  audioCount: number;
  totalViews: number;
  trend: { date: string; count: number }[];
}
