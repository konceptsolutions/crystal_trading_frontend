/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  webpack: (config, { isServer }) => {
    // Fix case sensitivity issues on Windows
    config.resolve.symlinks = false;
    return config;
  },
}

module.exports = nextConfig

