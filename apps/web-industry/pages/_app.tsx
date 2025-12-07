import { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { ToastProvider } from '@rt/ui-components';
import dynamic from 'next/dynamic';

// Import dynamique du ChatBot pour éviter les erreurs SSR
const ChatBotWrapper = dynamic(
  () => import('../components/ChatBotWrapper'),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ne rendre que le HTML minimal pendant le SSR
  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1a2e' }}>
        <Component {...pageProps} />
      </div>
    );
  }

  return (
    <ToastProvider position="top-right">
      <Component {...pageProps} />
      <ChatBotWrapper />
    </ToastProvider>
  );
}
