import { defineConfig } from "vite";

/** Output to site/dist — GitHub Actions uploads this to Pages. */
export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
