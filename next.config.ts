import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three.js ships large ESM bundles; transpiling lets Next tree-shake the
  // drei/fiber re-exports we actually use instead of pulling the whole library.
  transpilePackages: ["three"],
  experimental: {
    optimizePackageImports: ["@react-three/drei", "motion", "gsap"],
  },
};

export default nextConfig;
