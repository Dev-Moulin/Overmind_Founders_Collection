import { createBrowserRouter, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { NetworkGuard } from './components/NetworkGuard';

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
function HomePage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">
        Welcome to Founders Totem
      </h2>
      <p className="text-white/70">
        Connect your wallet to propose and vote for founder totems.
      </p>
    </div>
  );
}

function ProposePage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">Propose a Totem</h2>
      <p className="text-white/70">Select a founder to propose a totem for.</p>
    </div>
  );
}

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

function ResultsPage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">Results</h2>
      <p className="text-white/70">View voting results for all founders.</p>
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

function NotFoundPage() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">404 - Page Not Found</h2>
      <p className="text-white/70">The page you're looking for doesn't exist.</p>
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
