import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/30 mt-12">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="seal text-xs">保德</span>
              <span className="font-dialect text-lg font-bold">方言词典</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              记录和传承保德方言，留住乡音乡情。我们的乡音，值得被听见。
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/search" className="text-muted-foreground hover:text-primary transition-colors">浏览词典</Link>
            <Link to="/submit" className="text-muted-foreground hover:text-primary transition-colors">投稿增补</Link>
            <Link to="/admin/login" className="text-muted-foreground hover:text-primary transition-colors">维护者入口</Link>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border/40 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} 保德方言词典 · 乡音不老，方言长存
        </div>
      </div>
    </footer>
  );
}
