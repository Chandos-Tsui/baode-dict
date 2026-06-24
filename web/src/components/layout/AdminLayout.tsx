import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { path: '/admin', label: '概览', exact: true },
  { path: '/admin/words', label: '词条' },
  { path: '/admin/categories', label: '分类' },
  { path: '/admin/submissions', label: '投稿' },
  { path: '/admin/daily', label: '推荐' },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-48 shrink-0 border-r border-border/60 flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-border/60">
          <Link to="/admin" className="font-display text-sm tracking-wide text-sidebar-foreground">管理后台</Link>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded text-sm transition-colors ${
                isActive(item)
                  ? 'bg-primary/8 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border/60 space-y-2">
          <Link to="/" className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← 返回前台
          </Link>
          <div className="px-3 text-xs text-muted-foreground/60">{admin?.username}</div>
          <button onClick={handleLogout} className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
            退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
