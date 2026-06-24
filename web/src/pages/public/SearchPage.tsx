import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { WordListItem, PaginatedList } from '@/types/dict';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<WordListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => { setQuery(q); }, [q]);

  useEffect(() => {
    setLoading(true);
    setResults([]);
    setPage(1);
    setHasMore(true);
    const params: any = { page: 1, size: 20 };
    if (q) params.q = q;
    if (tag) params.tag = tag;
    api.getWords(params)
      .then((data: PaginatedList<WordListItem>) => {
        setResults(data.items || []);
        setTotal(data.total);
        setHasMore(data.items.length < data.total);
      })
      .catch(() => { setResults([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [q, tag]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(query.trim() ? { q: query.trim() } : {});
  };

  const loadMore = () => {
    const next = page + 1;
    const params: any = { page: next, size: 20 };
    if (q) params.q = q;
    if (tag) params.tag = tag;
    api.getWords(params).then((data: PaginatedList<WordListItem>) => {
      setResults(prev => [...prev, ...(data.items || [])]);
      setPage(next);
      setHasMore(results.length + data.items.length < data.total);
    });
  };

  const clearFilters = () => { setQuery(''); setSearchParams({}); };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <form onSubmit={handleSearch} className="max-w-md mx-auto mb-3">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索方言词、释义、例句" className="pl-11 h-11" />
          {(q || tag) && (
            <button type="button" onClick={clearFilters} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      <div className="text-center mb-8">
        {q && <span className="text-xs text-muted-foreground">搜索「{q}」</span>}
        {tag && <span className="text-xs text-muted-foreground">标签「{tag}」</span>}
        {!q && !tag && <span className="text-xs text-muted-foreground">全部词条</span>}
        <span className="text-xs text-muted-foreground/60 ml-2">共 {total} 条</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="space-y-px">
            {results.map((word) => (
              <Link
                key={word.id}
                to={`/word/${word.id}`}
                className="flex items-baseline gap-4 py-3 px-2 -mx-2 rounded hover:bg-secondary/40 transition-colors group"
              >
                <span className="font-display text-lg w-20 shrink-0 group-hover:text-primary transition-colors">{word.word}</span>
                {word.pinyin_jin && (
                  <span className="font-pinyin text-xs text-muted-foreground w-24 shrink-0 hidden sm:inline">{word.pinyin_jin}</span>
                )}
                <span className="text-sm text-muted-foreground flex-1 truncate">{word.definition}</span>
                {word.audio_path && <Volume2 className="h-3 w-3 text-muted-foreground shrink-0" />}
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <Button variant="outline" size="sm" onClick={loadMore}>加载更多</Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground mb-2">没有找到相关词条</p>
          <Link to="/submit" className="text-xs text-primary hover:underline">投稿增补 →</Link>
        </div>
      )}
    </div>
  );
}

function Volume2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}
