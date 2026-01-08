const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async rewrites() {
    // In development, we proxy to the separate backend server.
    // In production, the backend serves the frontend, so no proxy is needed.
    if (!isDev) return [];
    
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
