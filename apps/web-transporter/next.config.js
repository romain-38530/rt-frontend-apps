const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages
  transpilePackages: ['@repo/ui-components', '@rt/contracts', '@rt/utils'],

  reactStrictMode: true,
  swcMinify: true,

  // Webpack config for @shared alias
  webpack: (config) => {
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../../packages/shared');
    return config;
  },

  // Export statique pour AWS Amplify Hosting (CDN uniquement)
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Désactiver ESLint pendant le build pour déployer rapidement
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Désactiver TypeScript checking pendant le build
  typescript: {
    ignoreBuildErrors: false,
  },

  // Désactiver optimisation des polices Google
  optimizeFonts: false,
};

module.exports = nextConfig;
