import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { WordListItem, PaginatedList, Category } from '@/types/dict';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function AdminWordsPage() {
  const [words, setWords] = useState<WordListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadWords = () => {
    setLoading(true);
    const params: any = { size: 100 };
    if (query) params.q = query;
    api.getWords(params)
      .then((data: PaginatedList<WordListItem>) => setWords(data.items || []))
      .catch(() => setWords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    loadWords();
  }, [query]);

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await api.deleteWord(deleteId);
      setWords(prev => prev.filter(w => w.id !== deleteId));
      toast.success('已删除');
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const catName = (id: number | null) => categories.find(c => c.id === id)?.name || '-';
  void catName;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-lg">词条管理</h1>
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/words/new"><Plus className="h-3.5 w-3.5 mr-1" />新增</Link>
        </Button>
      </div>

      {/* 搜索 */}
      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索..."
          className="pl-9"
        />
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : words.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">词</TableHead>
                <TableHead className="w-28">拼音</TableHead>
                <TableHead>释义</TableHead>
                <TableHead className="w-24">分类</TableHead>
                <TableHead className="w-16">浏览</TableHead>
                <TableHead className="w-20 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {words.map((word) => (
                <TableRow key={word.id}>
                  <TableCell className="font-display text-base">{word.word}</TableCell>
                  <TableCell className="font-pinyin text-xs text-muted-foreground">{word.pinyin_jin || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{word.definition}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{word.category_name || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">{word.view_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link to={`/admin/words/${word.id}/edit`}><Edit3 className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(word.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="py-16 text-center text-sm text-muted-foreground">
          暂无词条，<Link to="/admin/words/new" className="text-primary">点击新增</Link>
        </div>
      )}

      {/* 删除确认 */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
          <Card className="p-6 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-sm mb-4">删除后无法恢复，确定要删除吗？</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>取消</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? '删除中...' : '确认删除'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
