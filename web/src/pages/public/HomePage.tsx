import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { DailyRecommendation, Category, WordListItem } from '@/types/dict';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function HomePage() {
  const navigate = useNavigate();
  const [daily, setDaily] = useState<DailyRecommendation | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentWords, setRecentWords] = useState<WordListItem[]>([]);
  const [query, setQuery] = useState('');
  const [, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDaily().catch(() => null),
      api.getCategories().catch(() => []),
      api.getWords({ size: 8 }).catch(() => ({ items: [] })),
    ]).then(([d, cats, words]) => {
      setDaily(d);
      setCategories(cats);
      setRecentWords(words.items || []);
      setLoading(false);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* 标题区 */}
      <header className="text-center mb-16">
        <h1 className="font-display text-4xl tracking-wide mb-3">保德方言词典</h1>
        <p className="text-sm text-muted-foreground tracking-widest">晋 语 · 黄 河 畔 · 乡 音 录</p>
      </header>

      {/* 搜索 */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto mb-20">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索方言词、释义或例句"
            className="pl-11 h-11 text-sm bg-card border-border/60"
          />
        </div>
      </form>

      {/* 每日推荐 */}
      {daily && (
        <section className="mb-20">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-display text-lg">每日一词</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <Link to={`/word/${daily.id}`}>
            <Card className="p-8 hover:shadow-sm transition-shadow border-border/50">
              <div className="text-center">
                <div className="font-display text-5xl mb-4">{daily.word}</div>
                {daily.pinyin_jin && (
                  <div className="font-pinyin text-sm text-muted-foreground mb-1">{daily.pinyin_jin}</div>
                )}
                {daily.ipa && (
                  <div className="font-ipa text-sm text-muted-foreground mb-6">{daily.ipa}</div>
                )}
                <div className="w-8 h-px bg-border mx-auto mb-6" />
                <p className="text-sm leading-relaxed text-foreground/80 max-w-md mx-auto">
                  {daily.definition}
                </p>
                {daily.examples?.[0] && (
                  <p className="font-display text-base text-muted-foreground mt-5">
                    {daily.examples[0]}
                  </p>
                )}
              </div>
            </Card>
          </Link>
        </section>
      )}

      {/* 分类 */}
      <section className="mb-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-lg">分类浏览</h2>
          <Link to="/search" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            全部词条 →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border/40 rounded-lg overflow-hidden border border-border/40">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="bg-card px-5 py-4 hover:bg-accent/5 transition-colors group"
            >
              <div className="font-display text-sm mb-0.5 group-hover:text-accent transition-colors">{cat.name}</div>
              <div className="text-xs text-muted-foreground/60 tabular-nums">{cat.word_count} 条</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 最近收录 */}
      <section className="mb-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-lg">最近收录</h2>
          <Link to="/search" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            查看全部 →
          </Link>
        </div>
        <div className="space-y-px">
          {recentWords.map((word) => (
            <Link
              key={word.id}
              to={`/word/${word.id}`}
              className="flex items-baseline gap-4 py-3 px-2 -mx-2 rounded hover:bg-secondary/40 transition-colors group"
            >
              <span className="font-display text-lg w-20 shrink-0 group-hover:text-accent transition-colors truncate">{word.word.length > 5 ? word.word.slice(0, 5) + '…' : word.word}</span>
              {word.pinyin_jin && (
                <span className="font-pinyin text-xs text-muted-foreground w-24 shrink-0 hidden sm:inline">{word.pinyin_jin}</span>
              )}
              <span className="text-sm text-muted-foreground flex-1 truncate">{word.definition}</span>
              {word.category_name && (
                <span className="text-xs text-muted-foreground/50 shrink-0 hidden md:inline">{word.category_name}</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* 投稿入口 */}
      <section className="text-center py-8 mb-8">
        <Link to="/submit" className="text-sm text-accent hover:underline">
          投稿增补 · 为词典补充词条
        </Link>
      </section>

      <footer className="pt-12 border-t border-border/30 text-center">
        <p className="text-xs text-muted-foreground/50 tracking-wide">乡音不老 · 方言长存</p>
      </footer>
    </div>
  );
}
