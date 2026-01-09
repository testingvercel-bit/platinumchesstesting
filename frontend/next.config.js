/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async rewrites() {
    // In development, we proxy requests to the backend (port 3001).
    // In production, the backend serves the frontend, so no proxy is needed.
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/socket.io/:path*',
          destination: 'http://localhost:3001/socket.io/:path*',
        },
        {
          source: '/games/:path*',
          destination: 'http://localhost:3001/games/:path*',
        },
        {
          source: '/payments/:path*',
          destination: 'http://localhost:3001/payments/:path*',
        },
        {
          source: '/auth/:path*',
          destination: 'http://localhost:3001/auth/:path*',
        },
        {
          source: '/fx/:path*',
          destination: 'http://localhost:3001/fx/:path*',
        },
        {
          source: '/health',
          destination: 'http://localhost:3001/health',
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
