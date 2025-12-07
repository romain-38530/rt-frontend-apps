/**
 * Hook sécurisé pour utiliser le router Next.js avec export statique
 * N'appelle PAS useRouter pendant le SSR pour éviter l'erreur "NextRouter was not mounted"
 */

import { useEffect, useState, useCallback, useMemo } from 'react';

// Type pour le router simulé
interface SafeRouter {
  pathname: string;
  query: Record<string, string | string[] | undefined>;
  asPath: string;
  basePath: string;
  locale?: string;
  locales?: string[];
  defaultLocale?: string;
  isReady: boolean;
  isPreview: boolean;
  isFallback: boolean;
  mounted: boolean;
  push: (url: string) => void;
  replace: (url: string) => void;
  back: () => void;
  reload: () => void;
  prefetch: (url: string) => Promise<void>;
  events: {
    on: (event: string, handler: () => void) => void;
    off: (event: string, handler: () => void) => void;
    emit: (event: string) => void;
  };
}

// Router par défaut pour SSR
const defaultRouter: SafeRouter = {
  pathname: '/',
  query: {},
  asPath: '/',
  basePath: '',
  locale: undefined,
  locales: undefined,
  defaultLocale: undefined,
  isReady: false,
  isPreview: false,
  isFallback: false,
  mounted: false,
  push: () => {},
  replace: () => {},
  back: () => {},
  reload: () => {},
  prefetch: async () => {},
  events: {
    on: () => {},
    off: () => {},
    emit: () => {},
  },
};

export function useSafeRouter(): SafeRouter {
  const [mounted, setMounted] = useState(false);
  const [routerState, setRouterState] = useState<SafeRouter>(defaultRouter);

  useEffect(() => {
    // Importer useRouter uniquement côté client
    const initRouter = async () => {
      const { useRouter } = await import('next/router');
      // Note: on ne peut pas utiliser useRouter ici car on est dans useEffect
      // On utilise window.location à la place
      if (typeof window !== 'undefined') {
        setRouterState({
          pathname: window.location.pathname,
          query: Object.fromEntries(new URLSearchParams(window.location.search)),
          asPath: window.location.pathname + window.location.search,
          basePath: '',
          isReady: true,
          isPreview: false,
          isFallback: false,
          mounted: true,
          push: (url: string) => {
            window.location.href = url;
          },
          replace: (url: string) => {
            window.location.replace(url);
          },
          back: () => {
            window.history.back();
          },
          reload: () => {
            window.location.reload();
          },
          prefetch: async () => {},
          events: {
            on: () => {},
            off: () => {},
            emit: () => {},
          },
        });
        setMounted(true);
      }
    };

    initRouter();
  }, []);

  return useMemo(() => ({
    ...routerState,
    mounted,
  }), [routerState, mounted]);
}

export default useSafeRouter;
