import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AudioPlayer({ src, className, size = 'md' }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const handleEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const sizeClass = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }[size];

  const iconSize = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <audio ref={audioRef} src={src} preload="none" />
      <Button
        type="button"
        variant="default"
        size="icon"
        className={cn('rounded-full bg-primary hover:bg-primary/90', sizeClass)}
        onClick={toggle}
      >
        {playing ? <Pause className={iconSize} /> : <Play className={cn(iconSize, 'ml-0.5')} />}
      </Button>
      {playing && (
        <div className="w-20 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {!playing && size !== 'sm' && (
        <Volume2 className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}
