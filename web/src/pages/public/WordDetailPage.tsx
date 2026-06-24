import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Edit3, Volume2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Word, WordListItem } from '@/types/dict';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AudioPlayer } from '@/components/word/AudioPlayer';
import { ShareCard } from '@/components/word/ShareCard';

export function WordDetailPage() {
  const { id } = useParams();
  const [word, setWord] = useState<Word | null>(null);
  const [related, setRelated] = useState<WordListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setWord(null);
    const wordId = parseInt(id || '0');
    Promise.all([
      api.getWord(wordId).catch(() => null),
      api.getRelatedWords(wordId).catch(() => []),
    ]).then(([w, r]) => {
      setWord(w);
      setRelated(r || []);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 space-y-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-16 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!word) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-muted-foreground mb-4">词条不存在</p>
        <Button variant="outline" size="sm" asChild><Link to="/search">返回浏览</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/search" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-3 w-3" />返回
      </Link>

      {/* 词条主体 */}
      <article className="mb-12">
        {/* 词头 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-5xl mb-3">{word.word}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {word.pinyin_jin && (
                <div>
                  <span className="text-xs text-muted-foreground/70 mr-1">保德拼音</span>
                  <span className="font-pinyin text-sm text-muted-foreground">{word.pinyin_jin}</span>
                </div>
              )}
              {word.ipa && (
                <div>
                  <span className="text-xs text-muted-foreground/70 mr-1">IPA</span>
                  <span className="font-ipa text-sm text-muted-foreground">{word.ipa}</span>
                </div>
              )}
            </div>
          </div>
          {word.audio_path && (
            <AudioPlayer src={word.audio_path} size="lg" />
          )}
        </div>

        <div className="w-8 h-px bg-border mb-8" />

        {/* 释义 */}
        <section className="mb-8">
          <p className="text-base leading-relaxed text-foreground/90">{word.definition}</p>
        </section>

        {/* 例句 */}
        {word.examples?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs text-muted-foreground/70 mb-3 tracking-wider">例句</h2>
            <div className="space-y-3">
              {word.examples.map((ex, i) => (
                <p key={i} className="font-display text-lg text-foreground/70 border-l-2 border-border pl-4 py-0.5">
                  {ex}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* 词源 */}
        {word.etymology && (
          <section className="mb-8">
            <h2 className="text-xs text-muted-foreground/70 mb-2 tracking-wider">词源</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{word.etymology}</p>
          </section>
        )}

        {/* 使用区域 */}
        {word.region_note && (
          <section className="mb-8">
            <h2 className="text-xs text-muted-foreground/70 mb-2 tracking-wider">使用区域</h2>
            <p className="text-sm text-muted-foreground">{word.region_note}</p>
          </section>
        )}

        {/* 标签 + 分类 */}
        <div className="flex items-center gap-3 flex-wrap pt-6 border-t border-border/40">
          {word.category_name && (
            <Link to={`/category/${word.category_slug}`} className="text-xs text-primary hover:underline">
              {word.category_name}
            </Link>
          )}
          {word.tags?.map((tag) => (
            <Link key={tag} to={`/search?tag=${encodeURIComponent(tag)}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {tag}
            </Link>
          ))}
          <span className="text-xs text-muted-foreground/50 ml-auto tabular-nums">{word.view_count} 次浏览</span>
        </div>

        {/* 操作 */}
        <div className="flex gap-2 mt-6">
          <ShareCard
            word={word}
            trigger={
              <Button variant="outline" size="sm">
                <Share2 className="h-3.5 w-3.5 mr-1" />分享图片
              </Button>
            }
          />
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/submit?wordId=${word.id}&type=correct`}>
              <Edit3 className="h-3.5 w-3.5 mr-1" />纠错
            </Link>
          </Button>
        </div>
      </article>

      {/* 相关词条 */}
      {related.length > 0 && (
        <section>
          <h2 className="font-display text-base mb-4">相关词条</h2>
          <div className="space-y-px">
            {related.map((w) => (
              <Link
                key={w.id}
                to={`/word/${w.id}`}
                className="flex items-baseline gap-4 py-3 px-2 -mx-2 rounded hover:bg-secondary/40 transition-colors group"
              >
                <span className="font-display text-lg w-20 shrink-0 group-hover:text-primary transition-colors">{w.word}</span>
                {w.pinyin_jin && (
                  <span className="font-pinyin text-xs text-muted-foreground w-20 shrink-0 hidden sm:inline">{w.pinyin_jin}</span>
                )}
                <span className="text-sm text-muted-foreground flex-1 truncate">{w.definition}</span>
                {w.audio_path && <Volume2 className="h-3 w-3 text-muted-foreground shrink-0" />}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
