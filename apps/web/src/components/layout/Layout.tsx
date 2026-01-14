import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.6)), url(${import.meta.env.BASE_URL}Background_INTUITION_3.png) center center / cover no-repeat fixed`,
        backgroundColor: '#0a0a0a' // Fallback color
      }}
    >
      <Header />
      <main className="flex-1 px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
