import { defineConfig } from "vite";
import path from "node:path";

const shouldEmptyOutDir = process.env.OPENCLAW_STUDIO_EMPTY_OUTDIR !== "0";

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
    emptyOutDir: shouldEmptyOutDir,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("node_modules")) {
            return "vendor";
          }

          if (
            normalizedId.includes("/apps/studio/src/components/DeliveryChainWorkspace.tsx") ||
            normalizedId.includes("/apps/studio/src/components/OperatorReviewBoard.tsx")
          ) {
            return "shell-review";
          }

          if (
            normalizedId.includes("/apps/studio/src/components/WindowSharedStateBoard.tsx") ||
            normalizedId.includes("/apps/studio/src/components/HostTracePanel.tsx") ||
            normalizedId.includes("/apps/studio/src/components/BoundarySummaryCard.tsx") ||
            normalizedId.includes("/apps/studio/src/components/host-trace-state.ts")
          ) {
            return "shell-boundary";
          }

          if (
            normalizedId.includes("/apps/studio/src/components/ContextualCommandPanel.tsx") ||
            normalizedId.includes("/apps/studio/src/components/CommandPalette.tsx") ||
            normalizedId.includes("/apps/studio/src/reviewCoverageRouteState.ts")
          ) {
            return "shell-command";
          }

          if (
            normalizedId.includes("/apps/studio/src/components/workbench-") ||
            normalizedId.includes("/apps/studio/src/components/focused-slot-") ||
            normalizedId.includes("/apps/studio/src/components/shell-layout-persistence.ts") ||
            normalizedId.includes("/apps/studio/src/components/companion-route-history-persistence.ts")
          ) {
            return "shell-workbench";
          }
        }
      }
    }
  }
});
