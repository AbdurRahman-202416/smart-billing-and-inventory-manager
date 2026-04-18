# Smart Billing and Inventory Manager

A retail point-of-sale (POS) and inventory management system built for small to mid-size stores. It runs entirely in the browser with local storage persistence, requiring no backend or database setup.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, and Framer Motion.


## Features

### Product Sourcing Catalog
- Browse and search products from the OpenFoodFacts global database
- Add products to your local inventory with one click
- Automatic product detail fetching (name, brand, image, size, category)
- Pagination and cached search results

### Inventory Management
- Add products manually or by scanning barcodes with the device camera
- Barcode scanning powered by the html5-qrcode library with auto-detection of rear cameras
- Duplicate barcode detection: re-adding a product with the same barcode merges stock counts instead of creating duplicates
- Search and filter inventory by name, brand, barcode, or category
- Admin-protected product deletion (default PIN: 1234)

### Billing / POS Terminal
- Continuous barcode scanning modal for adding items to the cart
- Manual barcode entry and inventory search for quick product lookup
- Cart with quantity controls, per-item subtotals, and a grand total
- 3-second per-barcode cooldown to prevent accidental duplicate scans
- Same-barcode items merge into a single cart row with incremented quantity
- Audio feedback with distinct tones for successful scans and errors

### Checkout
- Invoice generation with shop details, itemized breakdown, date, and invoice ID
- Print-optimized receipt layout

### Sales Dashboard
- Summary stats: total revenue, invoice count, average bill, items sold
- 7-day revenue bar chart
- Date filtering (today, this week, this month, all time)
- Timeline-grouped invoice list with expandable detail view
- Search invoices by ID or product name


## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 3 |
| State | Zustand with localStorage persistence |
| Animations | Framer Motion |
| Data Fetching | Axios, TanStack React Query |
| Barcode Scanning | html5-qrcode |
| Notifications | react-hot-toast |
| Icons | Lucide React |


## Project Structure

```
app/
  page.tsx              Product sourcing catalog (home page)
  billing/page.tsx      POS terminal with scanner and cart
  history/page.tsx      Sales dashboard and invoice history
  inventory/page.tsx    Inventory management and product entry
  product/[id]/         Individual product detail page

components/
  BarcodeScanner.tsx    Single-scan modal (used in inventory)
  BillingScanner.tsx    Continuous-scan modal (used in billing)
  LiveScanner.tsx       Inline always-on scanner component
  CheckoutModal.tsx     Invoice generation and print layout
  Sidebar.tsx           App navigation (sidebar on desktop, bottom bar on mobile)
  ToasterProvider.tsx   Toast notification configuration
  QueryProvider.tsx     TanStack Query provider wrapper

store/
  useStore.ts           Zustand store (inventory, cart, bills)

types/
  index.ts              TypeScript interfaces (Product, CartItem, Bill)

lib/
  axios.ts              Axios instance for OpenFoodFacts API
  sounds.ts             Synthesized audio feedback (no external files needed)
```


## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm

### Installation

```bash
git clone <repository-url>
cd smart-billing-and-inventory-manager
npm install
```

### Development

```bash
npm run dev
```

The app starts at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```


## Pages

| Route | Purpose |
|---|---|
| `/` | Browse and import products from OpenFoodFacts |
| `/inventory` | Manage local product inventory |
| `/billing` | POS terminal for scanning and checkout |
| `/history` | Sales reports and invoice history |
| `/product/[id]` | Product detail view |


## Mobile-First Design

- Responsive sidebar on desktop transforms into a bottom navigation bar on mobile
- Fluid grid layouts that adjust from 1 column on mobile to 5+ columns on wide screens
- Touch-friendly controls with large tap targets and modal-based interactions
- Safe area support for notched devices


## Data Persistence

All data (inventory, cart, bills) is stored in the browser via localStorage under the key `billing-store`. No server or database is required. Clearing browser data will reset the application state.


## Configuration

Shop details for receipts can be updated in `components/CheckoutModal.tsx`:

```typescript
const SHOP = {
  name: "Smart Mart",
  tagline: "Quality you can trust",
  address: "Dhaka, Bangladesh",
  phone: "+8801723456789",
  gstin: "27AAAAA0000A1Z5",
};
```
