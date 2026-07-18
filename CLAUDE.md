# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (Turbopack) at `http://localhost:3000`
- `npm run build` — production build
- `npm start` — run the production build
- `npm run lint` — ESLint via `eslint-config-next`

No test suite is configured — there is no `test` script, no test runner, and no `*.test.*` / `*.spec.*` files in the repo. Do not claim tests pass; if the user asks for tests, they need to be set up first.

Path alias: `@/*` resolves to the project root (see `tsconfig.json`).

## Architecture

This is a **100% client-side** Next.js 16 App Router application. There is no backend, database, or API route — all state lives in the browser.

### State layers (persistence mechanisms)

1. **`store/useStore.ts`** — Zustand store persisted to `localStorage` under key `billing-store`. Holds the three domain collections: `inventory`, `cart`, `bills`. All mutations (add product, cart ops, save bill) go through this store. Every page imports `useStore` directly.
2. **Catalog search cache** — `app/page.tsx` fetches the OpenFoodFacts catalog with raw `fetch()` and caches each result set in `localStorage` under `global_products_<term>_<page>` keys (hand-rolled, ~5-minute TTL). There is a code comment marking this as deliberate: "manual fetch — no React Query to keep logic clear".
3. **`components/QueryProvider.tsx`** — TanStack Query with `PersistQueryClientProvider` persisted under key `SMART_MANAGER_QUERY_CACHE_V1` (1-hour `staleTime`, 24-hour `gcTime`). The provider is mounted in the layout, but **no component currently calls `useQuery`/`useMutation`** — the persisted cache is never populated. Don't assume the catalog goes through React Query; if you add queries, this provider is ready, otherwise it's inert scaffolding.

Clearing `billing-store` resets the domain data; the catalog cache keys are independent of it.

### Barcode is the identity key, not `product.id`

This is a load-bearing invariant that touches most features:

- `addProduct` (store): if a product with the same `barcode` exists, stock is **merged** into the existing row (and `price` + `updatedAt` refreshed) instead of creating a duplicate.
- `addToCartByBarcode`: cart rows are matched by `item.product.barcode`, so even if the inventory ever contains duplicate entries, they collapse to a single cart row.
- `BillingScanner` and `/billing` both maintain a 3-second per-barcode cooldown (`COOLDOWN_MS = 3_000`) to prevent the same physical scan from firing repeatedly.

When changing cart/inventory logic, preserve barcode-based matching — do not switch to `product.id` as the key.

### External dependencies

- **OpenFoodFacts API** — the only external service the app talks to, reached two different ways:
  - `lib/axios.ts` (`foodApi`, baseURL `https://world.openfoodfacts.org/api/v2`) — used by `/inventory` (auto-fetch by barcode) and `/product/[id]` (product detail). Changes to this client do **not** affect the catalog.
  - `app/page.tsx` (catalog on `/`) — bypasses the axios client entirely: raw `fetch()` against the legacy `https://world.openfoodfacts.org/cgi/search.pl` endpoint with its own `BASE` const.
  - Next `images.remotePatterns` whitelists `**.openfoodfacts.org` and `**.openfoodfacts.net`.
- **html5-qrcode** — browser-only; listed in `next.config.ts` under `serverExternalPackages` so it's not bundled on the server. Any new code that imports it must stay inside `"use client"` components.

### Scanner components — three variants, don't confuse them

- `components/BarcodeScanner.tsx` — **single-scan** modal. Used by `/inventory` to capture one barcode and close.
- `components/BillingScanner.tsx` — **continuous-scan** modal with feed log, per-barcode cooldown, success/error flash, and Web Audio feedback. Used by `/billing`.
- `components/LiveScanner.tsx` — inline always-on scanner (not a modal).

### Domain types

`types/index.ts` defines `Product`, `CartItem`, `Bill`. `Bill.tax` is currently hardcoded to `0` in both `saveBill` (store) and `CheckoutModal`; there's a comment marking this as a future extension point (GST).

### Configuration hotspots

- **Shop details on receipts** — edit the `SHOP` const in `components/CheckoutModal.tsx`.
- **Admin PIN for product deletion** — hardcoded as `"1234"` at `app/inventory/page.tsx:157`. This is a client-side guard only, not real auth.
- **Audio feedback** — `lib/sounds.ts` synthesizes tones via Web Audio API; no asset files, reuses a single `AudioContext`.

### Layout

`app/layout.tsx` wraps every page in `Sidebar` + `QueryProvider` + `ToasterProvider`. The sidebar is a left rail on `md+` and a fixed bottom nav on mobile — the `<main>` uses `pt-20 md:pt-6 pb-24 md:pb-6` to avoid overlap.
