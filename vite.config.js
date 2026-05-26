import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Optional Cloudflare plugin for production/deployment environments
let cloudflarePlugin = null;
try {
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  cloudflarePlugin = cloudflare;
} catch (e) {
  // Plugin not installed locally, skipping
}

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    cloudflarePlugin ? cloudflarePlugin() : null
  ].filter(Boolean),
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3847",
        changeOrigin: true,
      },
    },
  },
});