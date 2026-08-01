# docs/

This folder is no longer the GitHub Pages source.

The landing is built from [`site/`](../site/) by [`.github/workflows/deploy-site.yml`](../.github/workflows/deploy-site.yml) on every push to `main` that touches `site/`.

Locally:

```bash
bun run docs:dev      # vite dev server
bun run docs:build    # writes site/dist (/, /animating-icons/, /motion-meaning/)
bun run docs:preview  # preview site/dist
# or: cd site && bun run dev|build|preview
```

Custom domain: `skills.soralabs.io.vn`
