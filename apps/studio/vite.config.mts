import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@openclaw/shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@openclaw/bridge": path.resolve(__dirname, "../../packages/bridge/src/index.ts")
    }
  },
  build: {
    outDir: "dist-renderer",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        }
      }
    }
  }
});
