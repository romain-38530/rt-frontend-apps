const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Transpile workspace packages (méthode recommandée par Next.js)
  transpilePackages: ['@rt/ui-components', '@rt/contracts', '@rt/utils', '@rt/shared'],

  // Turbopack config for Next.js 16+ (replaces webpack config)
  turbopack: {
    resolveAlias: {
      '@shared': path.resolve(__dirname, '../../packages/shared'),
    },
  },

  // Export statique pour AWS Amplify Hosting (CDN uniquement)
  output: 'export',

  // Trailing slash pour compatibilité avec les redirects Amplify
  trailingSlash: true,

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // TypeScript checking activé pendant le build
  typescript: {
    ignoreBuildErrors: false,
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ddaywxps9n701.cloudfront.net',
    NEXT_PUBLIC_ORDERS_API_URL: process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net',
    NEXT_PUBLIC_AFFRET_API_URL: process.env.NEXT_PUBLIC_AFFRET_API_URL || 'https://d393yiia4ig3bw.cloudfront.net',
    NEXT_PUBLIC_VIGILANCE_API_URL: process.env.NEXT_PUBLIC_VIGILANCE_API_URL || 'https://d23m3oa6ef3tr1.cloudfront.net',
    NEXT_PUBLIC_AUTHZ_URL: process.env.NEXT_PUBLIC_AUTHZ_URL || 'https://ddaywxps9n701.cloudfront.net',
  },
};

module.exports = nextConfig;
