import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { NetworkGuard } from './components/NetworkGuard';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProposePage } from './pages/ProposePage';
import { VotePage } from './pages/VotePage';
import { ResultsPage } from './pages/ResultsPage';
import { FounderDetailsPage } from './pages/FounderDetailsPage';
import { TotemDetailsPage } from './pages/TotemDetailsPage';
import { MyVotesPage } from './pages/MyVotesPage';

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

// Placeholder pages - will be replaced with actual components

function FounderVotePage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">Founder Totems</h2>
      <p className="text-white/70">Vote for totems for this founder.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'propose',
        element: <ProposePage />,
      },
      {
        path: 'vote',
        element: <VotePage />,
      },
      {
        path: 'vote/:founderId',
        element: <FounderVotePage />,
      },
      {
        path: 'results',
        element: <ResultsPage />,
      },
      {
        path: 'results/:founderId',
        element: <FounderDetailsPage />,
      },
      {
        path: 'results/:founderId/:totemId',
        element: <TotemDetailsPage />,
      },
      {
        path: 'my-votes',
        element: <MyVotesPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
