/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force webpack
  experimental: {
    turbopack: false,
  },

  // Optimize images
  images: {
    domains: ['static.wikia.nocookie.net'], // For woodsprite image if needed
    formats: ['image/avif', 'image/webp'],
  },

  // Production optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Font optimization
  optimizeFonts: true,

  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_NFT_CONTRACT: process.env.NEXT_PUBLIC_NFT_CONTRACT,
    NEXT_PUBLIC_MONAD_CHAIN_ID: process.env.NEXT_PUBLIC_MONAD_CHAIN_ID,
    NEXT_PUBLIC_MONAD_RPC: process.env.NEXT_PUBLIC_MONAD_RPC,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://ay-vitraya.vercel.app',
  },

  // API routes configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },

  // Webpack optimization
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
