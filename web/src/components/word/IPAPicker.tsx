import { useState, useRef, useEffect } from 'react';

// IPA 符号分类表
const IPA_GROUPS: { name: string; symbols: { char: string; label: string }[] }[] = [
  {
    name: '元音',
    symbols: [
      { char: 'a', label: '前低不圆唇' }, { char: 'ɑ', label: '后低不圆唇' },
      { char: 'ɐ', label: '次低央' }, { char: 'ə', label: '中央元音 schwa' },
      { char: 'ɛ', label: '次低前不圆' }, { char: 'e', label: '半高前不圆' },
      { char: 'æ', label: '次低前不圆' }, { char: 'ɪ', label: '次高前不圆' },
      { char: 'i', label: '高前不圆唇' }, { char: 'ʏ', label: '次高前圆' },
      { char: 'y', label: '高前圆唇' }, { char: 'ø', label: '半高前圆' },
      { char: 'œ', label: '次低前圆' }, { char: 'ɵ', label: '中央圆唇' },
      { char: 'o', label: '半高后圆' }, { char: 'ɔ', label: '次低后圆' },
      { char: 'ʊ', label: '次高后圆' }, { char: 'u', label: '高后圆唇' },
      { char: 'ɤ', label: '半高后不圆' }, { char: 'ʌ', label: '次低后不圆' },
      { char: 'ɯ', label: '高后不圆唇' }, { char: 'ɨ', label: '高央不圆' },
      { char: 'ʉ', label: '高央圆唇' }, { char: 'ɜ', label: '次低央不圆' },
      { char: 'ɞ', label: '次低央圆' }, { char: 'ɚ', label: 'r化schwa' },
    ],
  },
  {
    name: '塞音',
    symbols: [
      { char: 'p', label: '双唇清' }, { char: 'b', label: '双唇浊' },
      { char: 't', label: '齿龈清' }, { char: 'd', label: '齿龈浊' },
      { char: 'ʈ', label: '卷舌清' }, { char: 'ɖ', label: '卷舌浊' },
      { char: 'c', label: '硬腭清' }, { char: 'ɟ', label: '硬腭浊' },
      { char: 'k', label: '软腭清' }, { char: 'g', label: '软腭浊' },
      { char: 'q', label: '小舌清' }, { char: 'ɢ', label: '小舌浊' },
      { char: 'ʔ', label: '声门塞音' }, { char: 'ʡ', label: '会厌塞音' },
    ],
  },
  {
    name: '擦音',
    symbols: [
      { char: 'f', label: '唇齿清' }, { char: 'v', label: '唇齿浊' },
      { char: 'θ', label: '齿间清' }, { char: 'ð', label: '齿间浊' },
      { char: 's', label: '齿龈清' }, { char: 'z', label: '齿龈浊' },
      { char: 'ʃ', label: '龈后清' }, { char: 'ʒ', label: '龈后浊' },
      { char: 'ɕ', label: '龈腭清' }, { char: 'ʑ', label: '龈腭浊' },
      { char: 'ʂ', label: '卷舌清' }, { char: 'ʐ', label: '卷舌浊' },
      { char: 'ç', label: '硬腭清' }, { char: 'x', label: '软腭清' },
      { char: 'ɣ', label: '软腭浊' }, { char: 'χ', label: '小舌清' },
      { char: 'h', label: '声门清' }, { char: 'ɦ', label: '声门浊' },
      { char: 'ɸ', label: '双唇清' }, { char: 'β', label: '双唇浊' },
    ],
  },
  {
    name: '塞擦音',
    symbols: [
      { char: 't͡s', label: '清齿龈' }, { char: 'd͡z', label: '浊齿龈' },
      { char: 't͡ɕ', label: '清龈腭' }, { char: 'd͡ʑ', label: '浊龈腭' },
      { char: 't͡ʃ', label: '清龈后' }, { char: 'd͡ʒ', label: '浊龈后' },
      { char: 't͡ʂ', label: '清卷舌' }, { char: 'd͡ʐ', label: '浊卷舌' },
    ],
  },
  {
    name: '鼻音·边音',
    symbols: [
      { char: 'm', label: '双唇鼻' }, { char: 'n', label: '齿龈鼻' },
      { char: 'ɲ', label: '硬腭鼻' }, { char: 'ŋ', label: '软腭鼻' },
      { char: 'ɴ', label: '小舌鼻' }, { char: 'l', label: '齿龈边' },
      { char: 'ɫ', label: '软腭化边' }, { char: 'ʎ', label: '硬腭边' },
      { char: 'ɭ', label: '卷舌边' },
    ],
  },
  {
    name: '近音·颤音',
    symbols: [
      { char: 'ɹ', label: '齿龈近音' }, { char: 'ɻ', label: '卷舌近音' },
      { char: 'j', label: '硬腭近音' }, { char: 'ɰ', label: '软腭近音' },
      { char: 'w', label: '圆唇软腭' }, { char: 'ʋ', label: '唇齿近音' },
      { char: 'r', label: '齿龈颤音' }, { char: 'ɾ', label: '齿龈闪音' },
      { char: 'ʀ', label: '小舌颤音' }, { char: 'ʁ', label: '小舌擦音' },
      { char: 'ʐ', label: '卷舌浊擦' },
    ],
  },
  {
    name: '附加符号',
    symbols: [
      { char: 'ʰ', label: '送气' }, { char: 'ʼ', label: '挤喉' },
      { char: 'ⁿ', label: '鼻化/鼻冠' }, { char: 'ˡ', label: '边除阻' },
      { char: 'ʷ', label: '唇化' }, { char: 'ʲ', label: '腭化' },
      { char: 'ˤ', label: '咽化' }, { char: 'ˠ', label: '软腭化' },
      { char: '̚', label: '唯闭/无声除阻' }, { char: '̬', label: '浊化' },
      { char: '̥', label: '清化' }, { char: '̹', label: '更圆唇' },
      { char: '̜', label: '更不圆' }, { char: '̟', label: '前移' },
      { char: '̠', label: '后移' }, { char: '̈', label: '央化' },
    ],
  },
  {
    name: '超音段',
    symbols: [
      { char: 'ˈ', label: '主重音' }, { char: 'ˌ', label: '次重音' },
      { char: 'ː', label: '长音' }, { char: 'ˑ', label: '半长' },
      { char: '̆', label: '超短' }, { char: '|', label: '小停顿' },
      { char: '‖', label: '大停顿' }, { char: '.', label: '音节界' },
    ],
  },
  {
    name: '声调',
    symbols: [
      { char: '˥', label: '高平5' }, { char: '˦', label: '次高4' },
      { char: '˧', label: '中平3' }, { char: '˨', label: '次低2' },
      { char: '˩', label: '低平1' }, { char: '̌', label: '升调' },
      { char: '̂', label: '降调' }, { char: '̂', label: '降调' },
    ],
  },
];

interface IPAPickerProps {
  value: string;
  onChange: (val: string) => void;
  inputClassName?: string;
  placeholder?: string;
}

export function IPAPicker({ value, onChange, inputClassName, placeholder }: IPAPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const insertSymbol = (sym: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart ?? value.length;
      const end = input.selectionEnd ?? value.length;
      const newVal = value.slice(0, start) + sym + value.slice(end);
      onChange(newVal);
      // 恢复光标位置
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + sym.length, start + sym.length);
      }, 0);
    } else {
      onChange(value + sym);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '[kəʔ tɕiəu]'}
          className={`flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-ipa outline-none focus:ring-1 focus:ring-ring ${inputClassName || ''}`}
        />
        <button
          type="button"
          onClick={() => { setShowPicker(!showPicker); setActiveGroup(0); }}
          className={`px-3 rounded-md border text-xs transition-colors shrink-0 ${
            showPicker ? 'bg-accent/10 border-accent/30 text-accent' : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          IPA
        </button>
      </div>

      {showPicker && (
        <div className="absolute z-50 mt-2 w-[460px] max-w-[90vw] bg-popover border border-border rounded-lg shadow-lg">
          {/* 分类标签 */}
          <div className="flex flex-wrap gap-1 p-2 border-b border-border/60">
            {IPA_GROUPS.map((g, i) => (
              <button
                key={g.name}
                type="button"
                onClick={() => setActiveGroup(i)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeGroup === i ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* 符号网格 */}
          <div className="p-3 max-h-52 overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {IPA_GROUPS[activeGroup].symbols.map((s) => (
                <button
                  key={s.char + s.label}
                  type="button"
                  onClick={() => insertSymbol(s.char)}
                  title={s.label}
                  className="font-ipa w-10 h-10 flex items-center justify-center rounded border border-border/50 hover:border-accent hover:bg-accent/5 hover:text-accent transition-colors text-base"
                >
                  {s.char}
                </button>
              ))}
            </div>
          </div>

          <div className="px-3 py-2 border-t border-border/60 text-xs text-muted-foreground">
            点击符号插入到光标位置
          </div>
        </div>
      )}
    </div>
  );
}
