/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Standalone mode pour AWS Amplify avec SSR
  output: 'standalone',

  // Désactiver ESLint pendant le build pour déployer rapidement
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Désactiver TypeScript checking pendant le build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Désactiver optimisation des polices Google
  optimizeFonts: false,
};

module.exports = nextConfig;
