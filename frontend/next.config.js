const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  // No rewrites needed; backend and frontend share the same server and port in production
};
module.exports = nextConfig;
