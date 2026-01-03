/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Static export + Amplify rewrites pour API proxy

  // Turbopack config for Next.js 16+
  turbopack: {},

  images: {
    unoptimized: true,
  },

  // Désactiver les erreurs TypeScript pendant le build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://ddaywxps9n701.cloudfront.net',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://rttechnologie.com',
  },

  // Note: redirects() not supported with static export
  // Implement client-side redirects in _app.js or page components if needed
};

module.exports = nextConfig;
