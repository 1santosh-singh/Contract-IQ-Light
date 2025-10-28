// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'standalone' only for Docker, not for Vercel
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
  // Performance optimizations for Vercel
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  // Image optimization
  images: {
    domains: ['i.ibb.co'],
    formats: ['image/webp', 'image/avif'],
  },
  // Bundle analyzer in development
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer')({
          enabled: true,
        }))()
      );
      return config;
    },
  }),
};

export default nextConfig;