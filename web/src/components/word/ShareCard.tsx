import { useRef, useState, forwardRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Word } from '@/types/dict';
import { toast } from 'sonner';

interface ShareCardProps {
  word: Word;
  date?: string;
  editorNote?: string | null;
  trigger?: React.ReactNode;
}

const CardContent = forwardRef<HTMLDivElement, { word: Word; date: string; editorNote?: string | null }>(
  function CardContent({ word, date, editorNote }, ref) {
    const example = word.examples?.[0] || '';

    return (
      <div
        ref={ref}
        style={{
          width: '1080px',
          height: '1350px',
          background: '#f0ebe0',
          padding: '90px 80px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
          boxSizing: 'border-box',
        }}
      >
        {/* 内框线 */}
        <div style={{
          position: 'absolute',
          top: '40px', left: '40px', right: '40px', bottom: '40px',
          border: '1px solid #c4b8a4',
        }} />

        {/* 顶栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '80px' }}>
          <span style={{ fontSize: '24px', color: '#6b5d4a', fontFamily: '"Songti SC", "STSong", serif', fontWeight: 600, letterSpacing: '0.1em' }}>
            保德方言词典
          </span>
          <span style={{ fontSize: '20px', color: '#9a8d76' }}>{date}</span>
        </div>

        {/* 标签 */}
        {editorNote !== undefined && (
          <div style={{ fontSize: '22px', color: '#8a7560', marginBottom: '50px', letterSpacing: '0.05em' }}>
            {editorNote || '每日一词'}
          </div>
        )}

        {/* 方言词 */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{
            fontSize: '110px', color: '#3a3228',
            fontFamily: '"Songti SC", "STSong", "SimSun", serif',
            fontWeight: 600, lineHeight: 1.2, margin: 0,
          }}>
            {word.word}
          </h1>
        </div>

        {/* 注音 */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          {word.pinyin_jin && (
            <p style={{
              fontSize: '30px', color: '#7a6b56',
              fontFamily: '"SF Mono", "Menlo", monospace',
              letterSpacing: '0.08em', margin: '0 0 10px 0',
            }}>
              {word.pinyin_jin}
            </p>
          )}
          {word.ipa && (
            <p style={{
              fontSize: '26px', color: '#9a8d76',
              fontFamily: '"Doulos SIL", "Times New Roman", serif',
              margin: 0,
            }}>
              {word.ipa}
            </p>
          )}
        </div>

        {/* 分隔线 */}
        <div style={{ width: '50px', height: '1px', background: '#c4b8a4', margin: '0 auto 40px auto' }} />

        {/* 释义 */}
        <p style={{
          fontSize: '30px', color: '#4a4036', lineHeight: 1.7,
          textAlign: 'center', margin: '0 40px 40px 40px',
        }}>
          {word.definition}
        </p>

        {/* 例句 */}
        {example && (
          <p style={{
            fontSize: '26px', color: '#7a6b56',
            fontFamily: '"Songti SC", "STSong", serif',
            lineHeight: 1.6, margin: '0 40px 30px 40px', textAlign: 'center',
          }}>
            {example}
          </p>
        )}

        {/* 标签 */}
        {word.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            {word.tags.slice(0, 4).map((tag) => (
              <span key={tag} style={{
                fontSize: '20px', color: '#9a8d76',
                border: '1px solid #c4b8a4', borderRadius: '3px',
                padding: '3px 14px',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 底部 */}
        <div style={{ marginTop: 'auto', textAlign: 'center' }}>
          <div style={{ width: '100%', height: '1px', background: '#d4c8b4', marginBottom: '24px' }} />
          <p style={{
            fontSize: '22px', color: '#9a8d76', letterSpacing: '0.1em',
            fontFamily: '"Songti SC", "STSong", serif', margin: 0,
          }}>
            乡音不老 · 方言长存
          </p>
        </div>
      </div>
    );
  }
);

export function ShareCard({ word, date, editorNote, trigger }: ShareCardProps) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const today = date || new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      await document.fonts.ready;
      const dataUrl = await toPng(cardRef.current, { width: 1080, height: 1350, pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `保德方言-${word.word}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('图片已保存');
    } catch (err) {
      toast.error('生成失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">{trigger}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden">
          <DialogTitle className="sr-only">分享卡片</DialogTitle>
          <div className="flex justify-center bg-secondary/20 p-4 overflow-hidden">
            <div style={{ transform: 'scale(0.33)', transformOrigin: 'top center', height: '446px' }}>
              <CardContent ref={cardRef} word={word} date={today} editorNote={editorNote} />
            </div>
          </div>
          <div className="p-4 flex gap-2">
            <Button variant="outline" className="flex-1" size="sm" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5 mr-1" />关闭
            </Button>
            <Button className="flex-1" size="sm" onClick={handleExport} disabled={exporting}>
              <Download className="h-3.5 w-3.5 mr-1" />
              {exporting ? '生成中...' : '保存图片'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
