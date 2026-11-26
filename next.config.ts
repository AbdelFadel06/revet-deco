import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/9nwwmw2u/**" }],
  },
  // Pas de « Cache Components » (cacheComponents) : incompatible pour l'instant avec
  // Cloudflare Workers (le runtime bloque les requêtes, erreur 1101). Cache classique
  // de Next.js par tags, géré par l'adaptateur OpenNext.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
