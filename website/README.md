# Abyss Stack Website

Static-first website for Abyss Stack.

Run locally:

```bash
npm --prefix website run dev
```

Or from this directory:

```bash
npm run dev
```

The site is intentionally dependency-light so it can be deployed as static files later, including to Domainhotelli.

Current files:

- `index.html`
- `styles.css`
- `server.mjs`
- `site.js`
- `codec-fixtures.json`, generated from `examples/codec/satire-codec.fixtures.json`

Regenerate fixture data from the repository root:

```bash
npm run build:website-data
```

No backend is required yet. The website should eventually consume checked-in examples and docs, not invent platform claims from brochure vapour.
