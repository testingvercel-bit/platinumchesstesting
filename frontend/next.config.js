const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async rewrites() {
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
        source: '/auth/email-for-username/:path*',
        destination: 'http://localhost:3001/auth/email-for-username/:path*',
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
  },
};
module.exports = nextConfig;
