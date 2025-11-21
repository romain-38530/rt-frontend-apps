/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Export statique pour AWS Amplify Hosting (CDN uniquement)
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
