/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for production
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  // Prevent chunk loading errors
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { isServer, dev }) => {
    // Fix case sensitivity issues on Windows
    config.resolve.symlinks = false;
    
    // Improve chunk loading reliability
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    
    // Disable problematic cache strategies on Windows
    if (config.cache) {
      config.cache = {
        ...config.cache,
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    // Ignore Windows system files and directories to prevent Watchpack errors
    if (!isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/C:/DumpStack.log.tmp',
          '**/C:/System Volume Information/**',
          '**/C:/hiberfil.sys',
          '**/C:/pagefile.sys',
          '**/C:/swapfile.sys',
          '**/C:/$Recycle.Bin/**',
          '**/C:/Recovery/**',
          '**/C:/Windows/**',
        ],
      };
    }
    
    return config;
  },
}

module.exports = nextConfig

