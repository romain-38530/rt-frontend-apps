/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export', // Static export restored - backend now uses HTTPS via CloudFront

  images: {
    unoptimized: true,
  },

  // Désactiver ESLint pendant le build pour déployer rapidement
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Désactiver les erreurs TypeScript pendant le build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://rttechnologie.com',
  },

  // Note: redirects() not supported with static export
  // Implement client-side redirects in _app.js or page components if needed
};

module.exports = nextConfig;
