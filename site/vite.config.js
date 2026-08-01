import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Output to site/dist — GitHub Actions uploads this to Pages. */
export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        animatingIcons: resolve(__dirname, "animating-icons/index.html"),
        motionMeaning: resolve(__dirname, "motion-meaning/index.html"),
      },
    },
  },
});
