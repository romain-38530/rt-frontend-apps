import type { AppProps } from 'next/app';
import { useState } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('admin_jwt') : null;

  // Pages without sidebar/header
  const isAuthPage = router.pathname === '/login' || router.pathname === '/register';

  if (isAuthPage) {
    return <Component {...pageProps} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="lg:ml-[280px] transition-all duration-300">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            <Component {...pageProps} />
          </div>
        </main>
      </div>
    </div>
  );
}
