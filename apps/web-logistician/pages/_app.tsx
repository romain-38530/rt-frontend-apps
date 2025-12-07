import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { ToastProvider } from '@rt/ui-components';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider position="top-right">
      <Component {...pageProps} />
    </ToastProvider>
  );
}
