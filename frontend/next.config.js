/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        source: '/login/:path*',
        destination: 'http://localhost:4000/login/:path*',
      },
    ];
  },
  
  // Ensure server-side rendering doesn't break
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:4000',
    NEXT_PUBLIC_GITHUB_ORG_NAME: process.env.GITHUB_ORG_NAME || 'sajjadkhan-academy',
  },
};

module.exports = nextConfig;

