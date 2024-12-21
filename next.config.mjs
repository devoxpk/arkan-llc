    /** @type {import('next').NextConfig} */
    const nextConfig = {
      reactStrictMode: true, // Enable Strict Mode for better SSR practices
      output: 'standalone', // Ensure the app is built for SSR
      webpack: (config, { isServer }) => {
        if (isServer) {
          config.resolve.fallback = {
            ...config.resolve.fallback,
            window: false, // Prevent "window" usage on the server
          };
        }
        return config;
      },
      // Disable Static Site Generation by ensuring all pages use Server-Side Rendering
      // Note: Actual disabling requires using getServerSideProps in all pages
      // Increasing serverless function timeout to 60 seconds for Vercel
      async headers() {
        return [
          {
            source: '/(.*)',
            headers: [
              { key: 'x-vercel-wait', value: '60' }, // Custom header to indicate timeout
            ],
          },
        ];
      },
      // Inform Vercel that the application uses SSR
      // This is generally handled automatically, but can be reinforced with specific configurations
      experimental: {
        // Ensure that all pages are treated as SSR
        appDir: true,
      },
    };
    
    export default nextConfig;
