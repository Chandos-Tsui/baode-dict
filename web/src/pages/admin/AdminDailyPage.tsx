import { useEffect, useState } from 'react';
import { CalendarHeart, Search, Trash2, Plus, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import type { WordListItem, PaginatedList } from '@/types/dict';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function AdminDailyPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WordListItem[]>([]);
  const [selectedWord, setSelectedWord] = useState<WordListItem | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [editorNote, setEditorNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getDailyList().then(setList).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Search words for selection
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.getWords({ q: searchQuery, size: 10 })
        .then((data: PaginatedList<WordListItem>) => setSearchResults(data.items || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSet = async () => {
    if (!selectedWord || !selectedDate) {
      toast.error('请选择词条和日期');
      return;
    }
    setSaving(true);
    try {
      await api.setDaily(selectedDate, selectedWord.id, editorNote || undefined);
      toast.success(`${selectedDate} 的每日推荐已设置`);
      setAddOpen(false);
      setSelectedWord(null);
      setSearchQuery('');
      setEditorNote('');
      load();
    } catch (err: any) {
      toast.error(err.message || '设置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteDaily(id);
      toast.success('已取消该推荐');
      load();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-dialect text-2xl font-bold flex items-center gap-2">
          <CalendarHeart className="h-5 w-5 text-primary" />每日推荐
        </h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />设置推荐
        </Button>
      </div>

      <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="mb-1">每日推荐策略：</p>
            <p>• 维护者手动指定优先展示</p>
            <p>• 未指定日期将自动从词条库中挑选（优先有音频、较少展示的冷门词）</p>
            <p>• 取消某日推荐后，该日将恢复自动选择</p>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : list.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">日期</TableHead>
                <TableHead>词条</TableHead>
                <TableHead>拼音</TableHead>
                <TableHead>推荐语</TableHead>
                <TableHead className="w-20">类型</TableHead>
                <TableHead className="w-20 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.date}</TableCell>
                  <TableCell className="font-dialect font-bold">{item.word}</TableCell>
                  <TableCell className="font-pinyin text-xs text-accent">{item.pinyin_jin || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{item.editor_note || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_manual ? 'default' : 'secondary'} className="text-xs">
                      {item.is_manual ? '手动' : '自动'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-12 text-center text-muted-foreground">
          暂无推荐记录，每日推荐将自动生成
        </Card>
      )}

      {/* Add recommendation dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>设置每日推荐</DialogTitle>
            <DialogDescription>选择一个词条作为指定日期的推荐</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>推荐日期</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div>
              <Label>搜索词条</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入关键词搜索..."
                  className="pl-9"
                />
              </div>
            </div>
            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                {searchResults.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWord(w)}
                    className={`p-2 rounded cursor-pointer transition-colors ${selectedWord?.id === w.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-dialect font-bold">{w.word}</span>
                      {w.pinyin_jin && <span className="font-pinyin text-xs text-accent">{w.pinyin_jin}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{w.definition}</p>
                  </div>
                ))}
              </div>
            )}
            {selectedWord && (
              <Card className="p-3 bg-primary/5 border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">已选择：</div>
                <div className="flex items-center justify-between">
                  <span className="font-dialect text-lg font-bold">{selectedWord.word}</span>
                  {selectedWord.pinyin_jin && <span className="font-pinyin text-sm text-accent">{selectedWord.pinyin_jin}</span>}
                </div>
              </Card>
            )}
            <div>
              <Label>推荐语（选填）</Label>
              <Input value={editorNote} onChange={(e) => setEditorNote(e.target.value)} placeholder="如：今日推荐一个有趣的动词" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
            <Button onClick={handleSet} disabled={saving || !selectedWord}>
              {saving ? '设置中...' : '确认设置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
