import { defineConfig } from "vite";

/** Build into ../docs so GitHub Pages (branch main, /docs) keeps working. */
export default defineConfig({
  base: "/",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    assetsDir: "assets",
  },
});
