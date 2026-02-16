import { createBrowserRouter, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Layout } from './components/layout/Layout';
import { NetworkGuard } from './components/layout/NetworkGuard';
import { HomePage3DCarousel } from './pages/HomePage3DCarousel';
import { FoundersDataProvider } from './contexts/FoundersDataContext';

// Lazy loaded pages (not needed on initial load)
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage').then(m => ({ default: m.AdminAuditPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Simple loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
    </div>
  );
}

// Root layout with Layout and NetworkGuard
function RootLayout() {
  return (
    <Layout>
      <NetworkGuard>
        <Outlet />
      </NetworkGuard>
    </Layout>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <FoundersDataProvider><HomePage3DCarousel /></FoundersDataProvider>,
      },
      {
        path: 'admin/audit',
        element: <Suspense fallback={<PageLoader />}><AdminAuditPage /></Suspense>,
      },
      {
        path: '*',
        element: <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
});
