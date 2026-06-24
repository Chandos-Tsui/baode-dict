import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Volume2, Mic, Square, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { Category, Word } from '@/types/dict';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AudioPlayer } from '@/components/word/AudioPlayer';
import { IPAPicker } from '@/components/word/IPAPicker';
import { toast } from 'sonner';

export function AdminWordEditPage() {
  const { id } = useParams();
  const isNew = !id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // 录音状态
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [word, setWord] = useState('');
  const [pinyinJin, setPinyinJin] = useState('');
  const [ipa, setIpa] = useState('');
  const [definition, setDefinition] = useState('');
  const [examples, setExamples] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [regionNote, setRegionNote] = useState('');
  const [etymology, setEtymology] = useState('');
  const [audioPath, setAudioPath] = useState<string | null>(null);
  // 保存后获得的新词条ID（用于音频上传/录音保存）
  const [savedId, setSavedId] = useState<number | null>(id ? parseInt(id) : null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      api.getWord(parseInt(id))
        .then((w: Word) => {
          setWord(w.word);
          setPinyinJin(w.pinyin_jin || '');
          setIpa(w.ipa || '');
          setDefinition(w.definition);
          setExamples(w.examples?.join('\n') || '');
          setTags(w.tags?.join('、') || '');
          setCategoryId(w.category_id ? String(w.category_id) : '');
          setRegionNote(w.region_note || '');
          setEtymology(w.etymology || '');
          setAudioPath(w.audio_path);
        })
        .catch(() => toast.error('加载词条失败'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const currentId = savedId || (id ? parseInt(id) : null);

  // 清空表单（用于"添加下一条"）
  const resetForm = () => {
    setWord(''); setPinyinJin(''); setIpa(''); setDefinition('');
    setExamples(''); setTags(''); setCategoryId('');
    setRegionNote(''); setEtymology(''); setAudioPath(null);
    setRecordedBlob(null);
    setSavedId(null);
  };

  const buildData = () => ({
    word,
    pinyin_jin: pinyinJin || null,
    ipa: ipa || null,
    definition,
    examples: examples ? examples.split('\n').filter(Boolean) : [],
    tags: tags ? tags.split(/[、,，\s]+/).filter(Boolean) : [],
    category_id: categoryId ? parseInt(categoryId) : null,
    region_note: regionNote || null,
    etymology: etymology || null,
  });

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!word || !definition) {
      toast.error('方言词和释义为必填项');
      return;
    }
    setSaving(true);
    try {
      const data = buildData();
      if (isNew || !id) {
        const result = await api.createWord(data);
        setSavedId(result.id);
        toast.success('词条创建成功');
      } else {
        await api.updateWord(parseInt(id), data);
        toast.success('词条更新成功');
      }
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存并添加下一条
  const handleSaveAndNext = async () => {
    if (!word || !definition) {
      toast.error('方言词和释义为必填项');
      return;
    }
    setSaving(true);
    try {
      const data = buildData();
      if (isNew || !id) {
        await api.createWord(data);
      } else {
        await api.updateWord(parseInt(id), data);
      }
      toast.success('已保存，请继续添加');
      resetForm();
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ─── 音频：文件上传 ───
  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentId) return;
    setUploading(true);
    try {
      const result = await api.uploadAudio(currentId, file);
      setAudioPath(result.audio_path);
      toast.success('音频上传成功');
    } catch (err: any) {
      toast.error(err.message || '上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── 音频：浏览器录音 ───
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
    } catch (err: any) {
      toast.error('无法访问麦克风：' + (err.message || '请检查浏览器权限'));
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const saveRecording = async () => {
    if (!recordedBlob || !currentId) return;
    setUploading(true);
    try {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      const result = await api.uploadAudio(currentId, file);
      setAudioPath(result.audio_path);
      setRecordedBlob(null);
      toast.success('录音已保存');
    } catch (err: any) {
      toast.error(err.message || '保存失败');
    } finally {
      setUploading(false);
    }
  };

  const discardRecording = () => {
    setRecordedBlob(null);
  };

  const handleDeleteAudio = async () => {
    if (!currentId) return;
    try {
      await api.deleteAudio(currentId);
      setAudioPath(null);
      toast.success('音频已删除');
    } catch (err: any) {
      toast.error(err.message || '删除失败');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Link to="/admin/words" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" />返回列表
        </Link>
        <span className="text-xs text-muted-foreground">{isNew ? '新增词条' : '编辑词条'}</span>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 基本信息 */}
        <section className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">方言词 <span className="text-primary">*</span></Label>
              <Input value={word} onChange={(e) => setWord(e.target.value)} required className="mt-1.5 font-display text-lg" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">保德拼音</Label>
              <Input value={pinyinJin} onChange={(e) => setPinyinJin(e.target.value)} className="mt-1.5 font-pinyin" placeholder="geq jiu" />
            </div>
          </div>

          {/* IPA 选择器 */}
          <div>
            <Label className="text-xs text-muted-foreground">国际音标 IPA</Label>
            <div className="mt-1.5">
              <IPAPicker value={ipa} onChange={setIpa} placeholder="[kəʔ tɕiəu]" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">释义 <span className="text-primary">*</span></Label>
            <Textarea value={definition} onChange={(e) => setDefinition(e.target.value)} required rows={3} className="mt-1.5" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">例句（每行一句）</Label>
            <Textarea value={examples} onChange={(e) => setExamples(e.target.value)} rows={3} className="mt-1.5" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">分类</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="选择分类" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">标签（顿号分隔）</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="动词、身体动作" className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">使用区域</Label>
            <Input value={regionNote} onChange={(e) => setRegionNote(e.target.value)} placeholder="保德全境" className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">词源考证</Label>
            <Textarea value={etymology} onChange={(e) => setEtymology(e.target.value)} rows={2} className="mt-1.5" />
          </div>
        </section>

        {/* 录音区 */}
        <section className="border-t border-border/40 pt-6">
          <Label className="text-xs text-muted-foreground mb-3 block">读音录音</Label>

          {/* 已有音频 */}
          {audioPath && (
            <div className="flex items-center gap-3 mb-3 p-3 rounded bg-secondary/30">
              <AudioPlayer src={audioPath} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Volume2 className="h-3.5 w-3.5" /> 已上传
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={handleDeleteAudio} className="ml-auto text-destructive text-xs">
                删除
              </Button>
            </div>
          )}

          {/* 录音按钮 */}
          {!recordedBlob && !audioPath && (
            <div className="flex items-center gap-3">
              {!recording ? (
                <Button type="button" variant="outline" size="sm" onClick={startRecording}>
                  <Mic className="h-3.5 w-3.5 mr-1.5" />
                  开始录音
                </Button>
              ) : (
                <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
                  <Square className="h-3.5 w-3.5 mr-1.5" />
                  停止录音
                </Button>
              )}
              <span className="text-xs text-muted-foreground">或</span>
              <input ref={fileInputRef} type="file" accept="audio/mpeg,audio/wav,audio/mp3,audio/webm" onChange={handleUploadAudio} className="hidden" />
              <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                上传文件
              </Button>
            </div>
          )}

          {/* 录音预览 */}
          {recordedBlob && (
            <div className="p-3 rounded bg-secondary/30 space-y-3">
              <div className="text-xs text-muted-foreground">录音预览：</div>
              <audio src={URL.createObjectURL(recordedBlob)} controls className="w-full h-8" />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={saveRecording} disabled={uploading || !currentId}>
                  {uploading ? '保存中...' : '保存录音'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={discardRecording}>
                  丢弃
                </Button>
              </div>
              {!currentId && <p className="text-xs text-destructive">请先保存词条再录音</p>}
            </div>
          )}

          {/* 提示 */}
          {!audioPath && !recordedBlob && !recording && (
            <p className="text-xs text-muted-foreground/60 mt-2">可直接录音或上传已有音频文件（mp3/wav/webm）</p>
          )}
        </section>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? '保存中...' : '保存'}
          </Button>
          {isNew && (
            <Button type="button" variant="outline" onClick={handleSaveAndNext} disabled={saving}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              保存并添加下一条
            </Button>
          )}
          <Button type="button" variant="ghost" asChild>
            <Link to="/admin/words">返回列表</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
