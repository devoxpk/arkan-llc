/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable Strict Mode
  output: 'export', // Enable static HTML export
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
