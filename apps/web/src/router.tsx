import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { NetworkGuard } from './components/layout/NetworkGuard';
// DEPRECATED - Ancienne HomePage remplacée par HomePage3DCarousel le 14/01/2026
// import { HomePage } from './pages/HomePage';
import { HomePage3DCarousel } from './pages/HomePage3DCarousel';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminAuditPage } from './pages/AdminAuditPage';

// DEPRECATED - Pages à supprimer - Commenté le 27/11/2025
// import { ProposePage } from './pages/ProposePage';
// import { VotePage } from './pages/VotePage';
// import { ResultsPage } from './pages/ResultsPage';
// import { FounderDetailsPage } from './pages/FounderDetailsPage';
// import { TotemDetailsPage } from './pages/TotemDetailsPage';
// import { MyVotesPage } from './pages/MyVotesPage';

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

// DEPRECATED - Placeholder à supprimer - Commenté le 27/11/2025
/*
function FounderVotePage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">Founder Totems</h2>
      <p className="text-white/70">Vote for totems for this founder.</p>
    </div>
  );
}
*/

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage3DCarousel />,
      },
      // DEPRECATED - Route temporaire supprimée le 14/01/2026
      // {
      //   path: 'carousel-3d',
      //   element: <HomePage3DCarousel />,
      // },
      // DEPRECATED - Routes à supprimer - Commenté le 27/11/2025
      // {
      //   path: 'propose',
      //   element: <ProposePage />,
      // },
      // {
      //   path: 'vote',
      //   element: <VotePage />,
      // },
      // {
      //   path: 'vote/:founderId',
      //   element: <FounderVotePage />,
      // },
      // {
      //   path: 'results',
      //   element: <ResultsPage />,
      // },
      // {
      //   path: 'results/:founderId',
      //   element: <FounderDetailsPage />,
      // },
      // {
      //   path: 'results/:founderId/:totemId',
      //   element: <TotemDetailsPage />,
      // },
      // {
      //   path: 'my-votes',
      //   element: <MyVotesPage />,
      // },
      // Results route removed - results now integrated in FounderHomeCard on HomePage
      {
        path: 'admin/audit',
        element: <AdminAuditPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
});
