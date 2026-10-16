# Surge Highlights

The SFU Surge take-home challenge, built with Next.js, TypeScript, and plain CSS.

Loads highlights from the supplied API and lets you create one without leaving the page. Cards use one, two, or three columns at the mobile, 788px, and 1280px layouts.

New highlights stay at the top after a refresh, above the nine starter cards.

## Run locally

Use Node.js 24.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `SURGE_ACCESS_KEY` in `.env.local` to your assigned key, then open http://localhost:3000.

Photos come from Wikimedia Commons searches by highlight name, falling back to the location. Searches are cached for a day. Missing or broken images are omitted; the small info button opens the photo credit.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Tests mock the external APIs, so they don't add entries to the live collection.

## Deploy

Import this repository into Vercel, add `SURGE_ACCESS_KEY` as an environment variable, and deploy with the default Next.js settings. No database or image API key is needed.
