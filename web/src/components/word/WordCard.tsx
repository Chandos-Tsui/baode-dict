import { Link } from 'react-router-dom';
import { Volume2, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WordListItem } from '@/types/dict';

interface WordCardProps {
  word: WordListItem;
}

export function WordCard({ word }: WordCardProps) {
  return (
    <Link to={`/word/${word.id}`}>
      <Card className="p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-dialect text-xl font-bold text-foreground">{word.word}</h3>
            {word.pinyin_jin && (
              <p className="font-pinyin text-sm text-accent mt-0.5">{word.pinyin_jin}</p>
            )}
          </div>
          {word.audio_path && (
            <Volume2 className="h-4 w-4 text-primary shrink-0 mt-1" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{word.definition}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {word.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
          {word.category_name && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <BookOpen className="h-3 w-3" />
              {word.category_name}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
