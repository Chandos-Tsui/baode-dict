import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';

// Root layout: wraps everything with AuthProvider + Toaster
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}

export default RootLayout;
