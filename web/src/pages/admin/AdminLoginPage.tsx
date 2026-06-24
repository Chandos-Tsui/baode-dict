import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TOKEN_KEY = 'baode_dict_token';

export function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.code === 0 && data.data?.token) {
        localStorage.setItem(TOKEN_KEY, data.data.token);
        window.location.href = '/admin';
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err: any) {
      setError('网络错误: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-xl tracking-wide mb-1">保德方言词典</h1>
          <p className="text-xs text-muted-foreground tracking-widest">维护者登录</p>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded border border-destructive/30 bg-destructive/5 text-destructive text-xs text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="username" className="text-xs text-muted-foreground">用户名</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 bg-card"
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-xs text-muted-foreground">密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 bg-card"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← 返回首页</Link>
        </div>
      </div>
    </div>
  );
}
