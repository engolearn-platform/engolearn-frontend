import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET ?? "http://localhost:8080";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      strictPort: true,
      // Proxy API calls from FE dev origin (:3000) to BE (:8080) to avoid CORS during development
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src/"),
        "@features": path.resolve(__dirname, "./src/features/"),
        "@shared": path.resolve(__dirname, "./src/shared/"),
      },
    },
  };
});
