import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'images.samsung.com',
      },
      {
        protocol: 'https',
        hostname: 'www.sony.cl',
      },
      {
        protocol: 'https',
        hostname: 'www.nespresso.com',
      },
      {
        protocol: 'https',
        hostname: 'static.nike.com',
      },
      {
        protocol: 'https',
        hostname: 'www.uniqlo.com',
      },
      {
        protocol: 'https',
        hostname: 'www.lg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.adidas.com',
      },
      {
        protocol: 'https',
        hostname: 'store.storeimages.cdn-apple.com',
      },
      {
        protocol: 'https',
        hostname: 'lsco.scene7.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['192.168.18.27:3002'],
};

export default nextConfig;
