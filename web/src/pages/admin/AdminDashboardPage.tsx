import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookText, FolderTree, Inbox, CalendarHeart, Eye, TrendingUp, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminStats } from '@/types/dict';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: '词条总数', value: stats.wordCount, icon: BookText, link: '/admin/words', color: 'text-primary' },
    { label: '待审投稿', value: stats.pendingSubmissions, icon: Inbox, link: '/admin/submissions', color: 'text-orange-500', highlight: stats.pendingSubmissions > 0 },
    { label: '分类数', value: stats.categoryCount, icon: FolderTree, link: '/admin/categories', color: 'text-accent' },
    { label: '总浏览量', value: stats.totalViews, icon: Eye, link: '/admin/words', color: 'text-blue-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-dialect text-2xl font-bold">仪表盘</h1>
        <Button asChild size="sm">
          <Link to="/admin/words/new"><Plus className="h-4 w-4 mr-1" />新增词条</Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.link}>
              <Card className={`p-5 hover:shadow-md transition-all ${card.highlight ? 'border-orange-400/50 bg-orange-50/50' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div className="text-3xl font-bold">{card.value}</div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">已发布词条</div>
          <div className="text-xl font-bold">{stats.publishedCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">含音频词条</div>
          <div className="text-xl font-bold">{stats.audioCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">投稿总数</div>
          <div className="text-xl font-bold">{stats.totalSubmissions}</div>
        </Card>
      </div>

      {/* Submission trend */}
      {stats.trend.length > 0 && (
        <Card className="p-5">
          <h2 className="font-dialect text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />近 7 天投稿趋势
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
        <Link to="/admin/words"><Button variant="outline" className="w-full justify-start"><BookText className="h-4 w-4 mr-2" />词条管理</Button></Link>
        <Link to="/admin/submissions"><Button variant="outline" className="w-full justify-start"><Inbox className="h-4 w-4 mr-2" />投稿审核 {stats.pendingSubmissions > 0 && `(${stats.pendingSubmissions})`}</Button></Link>
        <Link to="/admin/daily"><Button variant="outline" className="w-full justify-start"><CalendarHeart className="h-4 w-4 mr-2" />每日推荐</Button></Link>
      </div>
    </div>
  );
}
