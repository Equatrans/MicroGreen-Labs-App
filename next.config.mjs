/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true, // Useful for static exports or if not using Next.js Image Optimization extensively yet
  },
  // Fix for Three.js in Next.js
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }]; // required for some libs
    return config;
  },
};

export default nextConfig;