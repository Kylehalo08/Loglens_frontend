import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8080";
  const ingestTarget = env.VITE_INGEST_PROXY_TARGET || "http://localhost:8081";
  const wsTarget = apiTarget.replace(/^https:/, "wss:").replace(/^http:/, "ws:");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ""),
        },
        "/ingest": {
          target: ingestTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/ingest/, ""),
        },
        "/ws": {
          target: wsTarget,
          changeOrigin: true,
          ws: true,
          rewrite: (p) => p.replace(/^\/ws/, ""),
        },
      },
    },
  };
});
