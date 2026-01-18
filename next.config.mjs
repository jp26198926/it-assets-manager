/** @type {import('next').NextConfig} */
const nextConfig = {
  // Uncomment these for production subdirectory deployment
  // basePath: "/it-assets-manager",
  // assetPrefix: "/it-assets-manager",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable Vercel Analytics for self-hosted deployments
  experimental: {
    webVitalsAttribution: [],
  },
};

export default nextConfig;
