/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ["localhost", "avatars.githubusercontent.com", "lh3.googleusercontent.com"],
  },
  experimental: {
    swcTraceProfiling: false,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;
