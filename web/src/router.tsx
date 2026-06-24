import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { RequireAuth } from './components/layout/RequireAuth';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { SearchPage } from './pages/public/SearchPage';
import { WordDetailPage } from './pages/public/WordDetailPage';
import { CategoryPage } from './pages/public/CategoryPage';
import { SubmitPage } from './pages/public/SubmitPage';

// Admin pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminWordsPage } from './pages/admin/AdminWordsPage';
import { AdminWordEditPage } from './pages/admin/AdminWordEditPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminSubmissionsPage } from './pages/admin/AdminSubmissionsPage';
import { AdminDailyPage } from './pages/admin/AdminDailyPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Public layout
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'search', element: <SearchPage /> },
          { path: 'word/:id', element: <WordDetailPage /> },
          { path: 'category/:slug', element: <CategoryPage /> },
          { path: 'submit', element: <SubmitPage /> },
        ],
      },
      // Admin login (no layout)
      { path: 'admin/login', element: <AdminLoginPage /> },
      // Admin protected layout
      {
        path: 'admin',
        element: <RequireAuth><AdminLayout /></RequireAuth>,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'words', element: <AdminWordsPage /> },
          { path: 'words/new', element: <AdminWordEditPage /> },
          { path: 'words/:id/edit', element: <AdminWordEditPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'submissions', element: <AdminSubmissionsPage /> },
          { path: 'daily', element: <AdminDailyPage /> },
        ],
      },
    ],
  },
]);
