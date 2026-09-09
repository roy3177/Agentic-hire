import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Hides the floating "N / X Issues" dev-mode indicator badge (bottom-left
  // corner in `next dev`). Purely a local dev-tools overlay -- it never
  // appears in a production build/deploy, so this only affects what you see
  // while running `npm run dev`.
  devIndicators: false,
};

export default nextConfig;
