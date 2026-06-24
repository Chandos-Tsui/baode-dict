import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, BookOpen, Plus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SiteHeader() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="seal text-sm">保德</span>
            <span className="font-dialect text-xl font-bold text-foreground hidden sm:inline">
              方言词典
            </span>
          </Link>

          {/* Search (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索方言词语、解释、例句..."
                className="pl-9 bg-card"
              />
            </div>
          </form>

          {/* Nav (desktop) */}
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/search"><BookOpen className="h-4 w-4 mr-1" />浏览</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/submit"><Plus className="h-4 w-4 mr-1" />投稿</Link>
            </Button>
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索方言词语..."
                  className="pl-9 bg-card"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild className="flex-1">
                <Link to="/search" onClick={() => setMenuOpen(false)}><BookOpen className="h-4 w-4 mr-1" />浏览</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="flex-1">
                <Link to="/submit" onClick={() => setMenuOpen(false)}><Plus className="h-4 w-4 mr-1" />投稿</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
