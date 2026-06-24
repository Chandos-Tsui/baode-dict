import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Category, Word } from '@/types/dict';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function SubmitPage() {
  const [searchParams] = useSearchParams();
  const correctWordId = searchParams.get('wordId');
  const type = searchParams.get('type') as 'add' | 'correct' || 'add';

  const [categories, setCategories] = useState<Category[]>([]);
  const [targetWord, setTargetWord] = useState<Word | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [word, setWord] = useState('');
  const [pinyinJin, setPinyinJin] = useState('');
  const [ipa, setIpa] = useState('');
  const [pinyinMandarin, setPinyinMandarin] = useState('');
  const [definition, setDefinition] = useState('');
  const [examples, setExamples] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [contributorContact, setContributorContact] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (correctWordId && type === 'correct') {
      api.getWord(parseInt(correctWordId)).then((w: Word) => {
        if (w) {
          setTargetWord(w);
          setWord(w.word);
          setPinyinJin(w.pinyin_jin || '');
          setIpa(w.ipa || '');
          setPinyinMandarin(w.pinyin_mandarin || '');
          setDefinition(w.definition);
          setExamples(w.examples?.join('\n') || '');
          setTags(w.tags?.join('、') || '');
          setCategoryId(w.category_id ? String(w.category_id) : '');
        }
      }).catch(() => {});
    }
  }, [correctWordId, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word || !definition) {
      toast.error('方言词和释义为必填项');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitContribution({
        type,
        word_id: type === 'correct' ? parseInt(correctWordId || '0') : undefined,
        proposed_data: {
          word,
          pinyin_jin: pinyinJin || null,
          ipa: ipa || null,
          pinyin_mandarin: pinyinMandarin || null,
          definition,
          examples: examples ? examples.split('\n').filter(Boolean) : [],
          tags: tags ? tags.split(/[、,，\s]+/).filter(Boolean) : [],
          category_id: categoryId ? parseInt(categoryId) : null,
        },
        contributor_name: contributorName || undefined,
        contributor_contact: contributorContact || undefined,
        note: note || undefined,
      });
      setSubmitted(true);
      toast.success('提交成功，感谢您的贡献！');
    } catch (err: any) {
      toast.error(err.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="font-dialect text-2xl font-bold mb-2">提交成功！</h1>
        <p className="text-muted-foreground mb-6">感谢您为保德方言的传承贡献力量，我们会尽快审核您的提交。</p>
        <div className="flex gap-3 justify-center">
          <Button asChild><Link to="/">返回首页</Link></Button>
          <Button variant="outline" onClick={() => {
            setSubmitted(false);
            setWord(''); setDefinition(''); setExamples(''); setTags('');
            setPinyinJin(''); setIpa(''); setPinyinMandarin('');
            setContributorName(''); setContributorContact(''); setNote('');
          }}>继续投稿</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />返回</Link>
      </Button>

      <h1 className="font-dialect text-3xl font-bold mb-2">
        {type === 'correct' ? '纠错' : '投稿增补'}
      </h1>
      <p className="text-muted-foreground mb-6">
        {type === 'correct' && targetWord
          ? `您正在为「${targetWord.word}」提交纠错信息`
          : '请填写方言词条信息，审核通过后将收录到词典'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="word">方言词 <span className="text-primary">*</span></Label>
              <Input id="word" value={word} onChange={(e) => setWord(e.target.value)} placeholder="如：圪蹴" required />
            </div>
            <div>
              <Label htmlFor="pinyin_jin">保德拼音</Label>
              <Input id="pinyin_jin" value={pinyinJin} onChange={(e) => setPinyinJin(e.target.value)} placeholder="如：geq jiu" className="font-pinyin" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ipa">国际音标</Label>
              <Input id="ipa" value={ipa} onChange={(e) => setIpa(e.target.value)} placeholder="如：[kəʔ tɕiəu]" className="font-ipa" />
            </div>
          </div>

          <div>
            <Label htmlFor="definition">释义 <span className="text-primary">*</span></Label>
            <Textarea id="definition" value={definition} onChange={(e) => setDefinition(e.target.value)} placeholder="解释这个方言词的意思..." required rows={3} />
          </div>

          <div>
            <Label htmlFor="examples">例句（每行一句）</Label>
            <Textarea id="examples" value={examples} onChange={(e) => setExamples(e.target.value)} placeholder={'你圪蹴下歇歇哇。\n老汉圪蹴在墙根底晒阳婆。'} rows={3} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">分类</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tags">标签（用顿号分隔）</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="动词、身体动作" />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="font-medium text-sm">贡献者信息（选填）</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">您的称呼</Label>
              <Input id="name" value={contributorName} onChange={(e) => setContributorName(e.target.value)} placeholder="如：张三" />
            </div>
            <div>
              <Label htmlFor="contact">联系方式</Label>
              <Input id="contact" value={contributorContact} onChange={(e) => setContributorContact(e.target.value)} placeholder="微信/手机（便于我们联系）" />
            </div>
          </div>
          <div>
            <Label htmlFor="note">补充说明</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="其他需要说明的内容..." rows={2} />
          </div>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          <Send className="h-4 w-4 mr-1" />
          {submitting ? '提交中...' : '提交'}
        </Button>
      </form>
    </div>
  );
}
