const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ignoreBuildErrors: true,
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

  // Configuration webpack pour transpiler TypeScript externe
  webpack: (config, { isServer }) => {
    // Alias pour @shared et @rt/ui-components
    config.resolve.alias['@shared'] = path.resolve(__dirname, '../../packages/shared');
    config.resolve.alias['@rt/ui-components'] = path.resolve(__dirname, '../../packages/ui-components/dist');

    // Transpiler les fichiers TypeScript du dossier src/ root et packages/shared
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [
        path.resolve(__dirname, '../../src'),
        path.resolve(__dirname, '../../packages/shared'),
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-typescript',
            ['@babel/preset-react', { runtime: 'automatic' }],
          ],
        },
      },
    });

    return config;
  },
};

module.exports = nextConfig;
