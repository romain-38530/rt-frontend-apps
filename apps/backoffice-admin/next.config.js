const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Transpile workspace packages (méthode recommandée par Next.js)
  transpilePackages: ['@rt/ui-components', '@rt/contracts', '@rt/utils', '@rt/shared'],

  // Export statique pour AWS Amplify Hosting (CDN uniquement)
  output: 'export',

  // Trailing slash pour compatibilité avec les redirects Amplify
  trailingSlash: true,

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Désactiver ESLint pendant le build pour déployer rapidement
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript checking activé pendant le build
  typescript: {
    ignoreBuildErrors: false,
  },

  // Désactiver optimisation des polices Google
  optimizeFonts: false,

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ddaywxps9n701.cloudfront.net',
    NEXT_PUBLIC_ORDERS_API_URL: process.env.NEXT_PUBLIC_ORDERS_API_URL || 'https://dh9acecfz0wg0.cloudfront.net',
    NEXT_PUBLIC_AFFRET_API_URL: process.env.NEXT_PUBLIC_AFFRET_API_URL || 'https://d393yiia4ig3bw.cloudfront.net',
    NEXT_PUBLIC_VIGILANCE_API_URL: process.env.NEXT_PUBLIC_VIGILANCE_API_URL || 'https://d23m3oa6ef3tr1.cloudfront.net',
    NEXT_PUBLIC_AUTHZ_URL: process.env.NEXT_PUBLIC_AUTHZ_URL || 'https://ddaywxps9n701.cloudfront.net',
  },

  // Configuration webpack pour alias @shared
  webpack: (config) => {
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../../packages/shared');
    return config;
  },
};

module.exports = nextConfig;
