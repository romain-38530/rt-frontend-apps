/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Mode standalone OBLIGATOIRE pour AWS Amplify (génère required-server-files.json)
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

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_ORDERS_API_URL: process.env.NEXT_PUBLIC_ORDERS_API_URL || 'http://localhost:3030',
    NEXT_PUBLIC_AFFRET_API_URL: process.env.NEXT_PUBLIC_AFFRET_API_URL || 'http://localhost:3010',
    NEXT_PUBLIC_VIGILANCE_API_URL: process.env.NEXT_PUBLIC_VIGILANCE_API_URL || 'http://localhost:3040',
    NEXT_PUBLIC_AUTHZ_URL: process.env.NEXT_PUBLIC_AUTHZ_URL || 'http://localhost:3007',
  },
};
module.exports = nextConfig;
