const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages
  transpilePackages: ['@repo/ui-components', '@rt/contracts', '@rt/utils'],

  reactStrictMode: true,

  // Turbopack config for Next.js 16+ (replaces webpack config)
  turbopack: {
    resolveAlias: {
      '@shared': path.resolve(__dirname, '../../packages/shared'),
    },
  },

  // Export statique pour AWS Amplify Hosting (CDN uniquement)
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Désactiver TypeScript checking pendant le build
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
