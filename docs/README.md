# docs/

This folder is no longer the GitHub Pages source.

The landing is built from [`site/`](../site/) by [`.github/workflows/deploy-site.yml`](../.github/workflows/deploy-site.yml) on every push to `main` that touches `site/`.

Locally:

```bash
npm run docs:dev      # vite dev server
npm run docs:build    # writes site/dist
npm run docs:preview  # preview site/dist
```

Custom domain: `skills.soralabs.io.vn`
