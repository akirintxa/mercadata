# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Mercadata is a real-time price comparator for Venezuelan supermarkets/pharmacies (Central Madeirense, Gama Supermercados, Automercados Plaza's, Kalea Market, Farmatodo). Built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. Development follows Spec-Driven Development (SDD) — living docs in `docs/` and `specs/`.

## Commands

```bash
npm run dev     # start dev server at http://localhost:3000
npm run build   # type-check + production build (also serves as the test/verification step — there is no separate test suite)
npm run start   # run production build
npm run lint    # next lint
```

There is no test runner in this repo; `npm run build` is the standard way to validate changes (TypeScript compilation + Next.js build).

## Architecture

Request flow: `Client UI` → `/api/search` or `/api/rate` route → `searchAllStores()` orchestrator → per-store scraper connectors → `evaluateProductMatch()` filtering/scoring → response.

- **`src/lib/scrapers/index.ts`** (`searchAllStores`) is the orchestrator: it fetches the BCV exchange rate, fans the query out to all enabled store scrapers in parallel via `Promise.allSettled` (a single store failing never blocks the others — errors are collected per-store into `SearchResponse.errors`), then evaluates and filters results.
- **`src/lib/scrapers/*.ts`** — one connector per store, each transforming that store's native API/HTML response into the unified `Product` type. Each store has a distinct integration mechanism (documented in `docs/architecture.md` and `README.md`): Central = WooCommerce Store REST API, Gama = SAP Commerce Cloud (Hybris OCC), Plaza's = Magento HTML parsing, Kalea = Supabase PostgREST, Farmatodo = Algolia Search. When adding/modifying a scraper, match the existing connector's shape (query in, `Product[]` out) so it plugs into the orchestrator unchanged.
- **`src/lib/scrapers/bcv.ts`** — official USD/VES exchange rate provider with a 30-minute in-memory cache and a 3-tier fallback chain (Kalea's Supabase table → dolarapi.com → hardcoded constant). All price conversion across stores depends on this.
- **`src/lib/searchMatcher.ts`** — the core matching/normalization engine, used both to build the query sent to each store and to filter/score results returned from all stores against the user's full original query:
  - `normalizeText()`: strips accents, normalizes brand punctuation (e.g. `P.A.N.` → `pan`), and normalizes metric units to a canonical form (`1 litro`/`1lt` → `1l`, `500 gr` → `500g`, etc.) so presentation sizes compare correctly across stores.
  - `evaluateProductMatch()`: requires all non-size keyword tokens to match (word-boundary or substring for compound words) AND, if the query specifies a size/presentation, an equivalent-unit size match (e.g. `1l` also matches `1000ml`). Produces a `matches` boolean (strict) and a `score` used for ranking/fallback.
  - Orchestrator behavior: strict matches are preferred; if none exist, it falls back to the top-scoring partial matches (score ≥ 40, top 30) rather than returning empty results.
- **`src/lib/types.ts`** — the unified `Product`, `StoreInfo`, and `SearchResponse` shapes all scrapers and the UI depend on.
- **`src/components/`** — UI: search bar, store filter, product cards, and two result layouts (`SideBySideView` for per-store columns, plus a general grid view).

## Conventions (from AGENTS.md)

- Strict TypeScript.
- Components in `src/components/`: React Server Components by default, `'use client'` only when state/interactivity is needed.
- Scrapers/connectors live in `src/lib/scrapers/`.
- All prices must be calculated with IVA (VAT) included — see `docs/constitution.md` for the pricing/currency principles this enforces (final consumer price, common-currency comparison via official BCV rate, strict presentation/size matching, per-store resilience).
- Do not modify API endpoints without updating `specs/` and `docs/architecture.md` accordingly.
