/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages
  transpilePackages: ['@repo/ui-components', '@rt/contracts', '@rt/utils'],

  reactStrictMode: true,
  swcMinify: true,

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
