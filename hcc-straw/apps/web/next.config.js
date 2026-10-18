/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optional isolated output when concurrent agents race on the default `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'AUTARCH Web Platform',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
}

module.exports = nextConfig
