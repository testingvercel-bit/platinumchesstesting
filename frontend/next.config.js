/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  outputFileTracingRoot: __dirname,
  async rewrites() {
    // Proxy API requests to the backend
    // In dev: localhost:3001
    // In prod: NEXT_PUBLIC_SERVER_URL or localhost:3001 fallback
    const backendUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
    
    return [
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      },
      {
        source: '/games/:path*',
        destination: `${backendUrl}/games/:path*`,
      },
      {
        source: '/payments/:path*',
        destination: `${backendUrl}/payments/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: '/fx/:path*',
        destination: `${backendUrl}/fx/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

module.exports = nextConfig;
