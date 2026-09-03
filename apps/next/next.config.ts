import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
