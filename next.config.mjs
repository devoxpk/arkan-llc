// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable Strict Mode (you can turn it on if desired)
  output: 'standalone', // Force serverless deployment for Vercel SSR
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        window: false, // Prevent "window" usage on the server
      };
    }
    return config;
  },
};

export default nextConfig;
