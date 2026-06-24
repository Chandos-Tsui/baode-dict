import { useEffect, useState } from 'react';
import { Check, X, Clock, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import { api } from '@/lib/api';
import type { Submission, PaginatedList, Category } from '@/types/dict';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending: { label: '待审核', icon: Clock, color: 'text-orange-500', badge: 'secondary' },
  approved: { label: '已通过', icon: CheckCircle2, color: 'text-green-500', badge: 'default' },
  rejected: { label: '已驳回', icon: XCircle, color: 'text-destructive', badge: 'destructive' },
};

export function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Submission | null>(null);
  const [rejecting, setRejecting] = useState<Submission | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Editable data in review dialog
  const [editData, setEditData] = useState<any>({});

  const load = () => {
    setLoading(true);
    api.getSubmissions(status, 1, 50)
      .then((data: PaginatedList<Submission>) => setSubmissions(data.items || []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [status]);

  const openReview = (sub: Submission) => {
    setReviewing(sub);
    setEditData({ ...sub.proposed_data });
  };

  const handleApprove = async () => {
    if (!reviewing) return;
    setActionLoading(true);
    try {
      await api.approveSubmission(reviewing.id, editData);
      toast.success('已通过并写入词条');
      setReviewing(null);
      load();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setActionLoading(true);
    try {
      await api.rejectSubmission(rejecting.id, rejectNote);
      toast.success('已驳回');
      setRejecting(null);
      setRejectNote('');
      load();
    } catch (err: any) {
      toast.error(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-dialect text-2xl font-bold flex items-center gap-2">
          <Inbox className="h-5 w-5 text-primary" />投稿审核
        </h1>
      </div>

      {/* Status tabs */}
      <Tabs value={status} onValueChange={setStatus} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">待审核</TabsTrigger>
          <TabsTrigger value="approved">已通过</TabsTrigger>
          <TabsTrigger value="rejected">已驳回</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Submissions list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : submissions.length > 0 ? (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const cfg = STATUS_CONFIG[sub.status];
            const Icon = cfg.icon;
            return (
              <Card key={sub.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={cfg.badge as any} className="text-xs">
                        <Icon className={`h-3 w-3 mr-1 ${cfg.color}`} />
                        {cfg.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {sub.type === 'add' ? '增补' : '纠错'}
                      </Badge>
                      {sub.target_word && (
                        <span className="text-sm text-muted-foreground">原词：{sub.target_word}</span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(sub.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-dialect text-lg font-bold">{sub.proposed_data.word}</span>
                        {sub.proposed_data.pinyin_jin && (
                          <span className="font-pinyin text-sm text-accent">{sub.proposed_data.pinyin_jin}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{sub.proposed_data.definition}</p>
                      {sub.contributor_name && (
                        <p className="text-xs text-muted-foreground">贡献者：{sub.contributor_name}{sub.contributor_contact ? ` (${sub.contributor_contact})` : ''}</p>
                      )}
                      {sub.note && <p className="text-xs text-muted-foreground italic">备注：{sub.note}</p>}
                      {sub.review_note && <p className="text-xs text-destructive">驳回原因：{sub.review_note}</p>}
                    </div>
                  </div>
                  {sub.status === 'pending' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" onClick={() => openReview(sub)}>
                        <Check className="h-4 w-4 mr-1" />审核
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejecting(sub)}>
                        <X className="h-4 w-4 mr-1" />驳回
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center text-muted-foreground">
          {status === 'pending' ? '暂无待审核的投稿' : `暂无${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}的投稿`}
        </Card>
      )}

      {/* Review dialog (approve with editable data) */}
      <Dialog open={reviewing !== null} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>审核投稿</DialogTitle>
            <DialogDescription>
              {reviewing?.type === 'add' ? '增补新词 - 通过后将写入词条库' : `纠错「${reviewing?.target_word}」- 通过后将更新原词条`}
            </DialogDescription>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>方言词</Label>
                  <Input value={editData.word || ''} onChange={(e) => setEditData({ ...editData, word: e.target.value })} />
                </div>
                <div>
                  <Label>晋语拼音</Label>
                  <Input value={editData.pinyin_jin || ''} onChange={(e) => setEditData({ ...editData, pinyin_jin: e.target.value })} className="font-pinyin" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>国际音标</Label>
                  <Input value={editData.ipa || ''} onChange={(e) => setEditData({ ...editData, ipa: e.target.value })} />
                </div>
                <div>
                  <Label>普通话近似</Label>
                  <Input value={editData.pinyin_mandarin || ''} onChange={(e) => setEditData({ ...editData, pinyin_mandarin: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>释义</Label>
                <Textarea value={editData.definition || ''} onChange={(e) => setEditData({ ...editData, definition: e.target.value })} rows={3} />
              </div>
              <div>
                <Label>例句（每行一句）</Label>
                <Textarea value={(editData.examples || []).join('\n')} onChange={(e) => setEditData({ ...editData, examples: e.target.value.split('\n').filter(Boolean) })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>分类</Label>
                  <Select value={editData.category_id ? String(editData.category_id) : ''} onValueChange={(v) => setEditData({ ...editData, category_id: v ? parseInt(v) : null })}>
                    <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>标签（顿号分隔）</Label>
                  <Input value={(editData.tags || []).join('、')} onChange={(e) => setEditData({ ...editData, tags: e.target.value.split(/[、,，\s]+/).filter(Boolean) })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>取消</Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              <Check className="h-4 w-4 mr-1" />
              {actionLoading ? '处理中...' : '通过并写入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejecting !== null} onOpenChange={(open) => { if (!open) { setRejecting(null); setRejectNote(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回投稿</DialogTitle>
            <DialogDescription>请填写驳回原因（可选）</DialogDescription>
          </DialogHeader>
          <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="驳回原因..." rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>取消</Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {actionLoading ? '处理中...' : '确认驳回'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
