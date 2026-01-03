const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Transpile workspace packages
  transpilePackages: ['@rt/ui-components', '@rt/contracts', '@rt/utils'],

  // Turbopack config for Next.js 16+ (replaces webpack config)
  turbopack: {
    resolveAlias: {
      '@shared': path.resolve(__dirname, '../../packages/shared'),
    },
  },

  // Export statique pour AWS Amplify Hosting (CDN uniquement)
  output: 'export',

  // Use trailing slash for proper static file serving
  trailingSlash: true,

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ddaywxps9n701.cloudfront.net',
  },
};

module.exports = nextConfig;
