import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import type { Category, WordListItem } from '@/types/dict';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [words, setWords] = useState<WordListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setWords([]);
    api.getCategory(slug || '', 1, 100)
      .then((data) => { setCategory(data); setWords(data.words || []); })
      .catch(() => setCategory(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 space-y-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground mb-4">分类不存在</p>
        <Button variant="outline" size="sm" asChild><Link to="/">返回首页</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-3 w-3" />返回
      </Link>

      <header className="mb-10">
        <h1 className="font-display text-3xl mb-2">{category.name}</h1>
        {category.description && <p className="text-sm text-muted-foreground">{category.description}</p>}
        <p className="text-xs text-muted-foreground/60 mt-2">共 {words.length} 条</p>
      </header>

      {words.length > 0 ? (
        <div className="space-y-px">
          {words.map((word) => (
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
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground mb-2">该分类下暂无词条</p>
          <Link to="/submit" className="text-xs text-primary hover:underline">投稿增补 →</Link>
        </div>
      )}
    </div>
  );
}
