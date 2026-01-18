/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/it-assets-manager",
  assetPrefix: "/it-assets-manager",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
