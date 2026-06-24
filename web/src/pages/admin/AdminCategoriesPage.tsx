import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, FolderTree } from 'lucide-react';
import { api } from '@/lib/api';
import type { Category } from '@/types/dict';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CategoryForm {
  id?: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  icon: string;
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryForm | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.getCategories().then(setCategories).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!editing || !editing.name || !editing.slug) {
      toast.error('名称和 slug 为必填');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: editing.name,
        slug: editing.slug,
        description: editing.description || null,
        sort_order: editing.sort_order || 0,
        icon: editing.icon || null,
      };
      if (editing.id) {
        await api.updateCategory(editing.id, data);
        toast.success('分类更新成功');
      } else {
        await api.createCategory(data);
        toast.success('分类创建成功');
      }
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.deleteCategory(deleteId);
      toast.success('分类已删除');
      setDeleteId(null);
      load();
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-dialect text-2xl font-bold flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-primary" />分类管理
        </h1>
        <Button size="sm" onClick={() => setEditing({ name: '', slug: '', description: '', sort_order: 0, icon: '' })}>
          <Plus className="h-4 w-4 mr-1" />新增分类
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">排序</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>描述</TableHead>
                <TableHead className="w-20">词条数</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="text-muted-foreground">{cat.sort_order}</TableCell>
                  <TableCell className="font-dialect font-bold">{cat.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{cat.description}</TableCell>
                  <TableCell>{cat.word_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => setEditing({ id: cat.id, name: cat.name, slug: cat.slug, description: cat.description || '', sort_order: cat.sort_order, icon: cat.icon || '' })}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(cat.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit dialog */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? '编辑分类' : '新增分类'}</DialogTitle>
            <DialogDescription>分类用于词条的分门别类浏览</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>名称</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="称谓·亲属" />
                </div>
                <div>
                  <Label>Slug（英文标识）</Label>
                  <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="kinship" />
                </div>
              </div>
              <div>
                <Label>描述</Label>
                <Input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="家人、亲戚、人称相关词汇" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>排序（数字）</Label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>图标（Lucide 名称）</Label>
                  <Input value={editing.icon || ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="Users" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>删除分类后，该分类下的词条将变为未分类。确定删除吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
