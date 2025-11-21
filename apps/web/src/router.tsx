import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { NetworkGuard } from './components/NetworkGuard';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProposePage } from './pages/ProposePage';
import { ResultsPage } from './pages/ResultsPage';

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

function VotePage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">Vote for Totems</h2>
      <p className="text-white/70">Vote for your favorite totem proposals.</p>
    </div>
  );
}

function FounderVotePage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">Founder Totems</h2>
      <p className="text-white/70">Vote for totems for this founder.</p>
    </div>
  );
}

function FounderResultsPage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">Founder Results</h2>
      <p className="text-white/70">Detailed results for this founder.</p>
    </div>
  );
}

function MyVotesPage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">My Votes</h2>
      <p className="text-white/70">View your voting history.</p>
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
        element: <FounderResultsPage />,
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
