import { Link, Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <nav className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-display text-sm tracking-wide hover:text-accent transition-colors">
            保德方言词典
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors">浏览</Link>
            <Link to="/submit" className="text-muted-foreground hover:text-foreground transition-colors">投稿</Link>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
