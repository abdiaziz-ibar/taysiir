import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Taysir Foundation",
        short_name: "Taysir",
        description: "Parent Fee & Debt Management System",
        theme_color: "#1F3A5F",
        background_color: "#FAFAF9",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache only the hashed JS/CSS/images. index.html is deliberately
        // NOT cached and there is no navigation fallback: pages always come
        // from the network, so a deploy shows up on the next normal refresh
        // instead of after the old cached shell is replaced. /api is never
        // cached either, so fee/payment data can't go stale.
        globPatterns: ["**/*.{js,css,svg,png,ico}"],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
