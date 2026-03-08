# 🛒 Smart Inventory & POS Manager

A Next-generation, Mobile-Responsive Retail Management System built with **Next.js 15**, **Tailwind CSS**, and **Zustand**. Designed for ease of use, speed, and efficiency in managing inventory and sales.

---

## 🚀 Key Modules

### 🌏 1. Global Product Sourcing
Integrated with the **Open Food Facts API**, this module allows you to instantly fetch product data for millions of Bangladeshi and international products.
- **Instant Search:** Manual search with loading indicators and optimized API calls.
- **One-Click Stocking:** Add products from the global registry directly to your inventory with a single click.
- **Smart Image Loading:** Powered by Next.js optimized `<Image />` component.

### 📦 2. Strategic Inventory Manager
A centralized hub to manage your stock levels, categories, and pricing.
- **Scan to Add:** Integrated barcode scanner for lightning-fast data entry.
- **Split Measurement Fields:** Separate fields for Size Value (e.g., 500) and Unit (e.g., g, kg, L) for precision.
- **Admin Security:** Deleted products are protected by a secure admin password (`1234`).
- **Responsive Grid:** Intelligent layout that adapts from 1 column on mobile to 4+ columns on larger screens.

### 💰 3. POS Terminal (Billing)
A professional point-of-sale interface optimized for both desktop and mobile devices.
- **Live POS Scanner:** High-speed barcode scanning with laser animations and audio feedback.
- **Smart Cart:** Automatic quantity handling and subtotal calculations.
- **Mobile-First POS:** Fixed sticky sidebar on desktop transforms into a slim bottom navigation on mobile.
- **Invoice Generation:** Generate professional invoices for every sale.

### 📊 4. Sales Reports & History
Track every transaction with a built-in sales history logger.
- **Persistence:** All data is saved locally using Zustand with LocalStorage persistence.

---

## 🛠️ Technology Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Data Fetching:** [React Query](https://tanstack.com/query/latest) & Axios
- **Scanner:** [html5-qrcode](https://github.com/mebjas/html5-qrcode)

---

## 📱 Mobile-First Design Principles

This project follows a professional **Mobile-First** approach:
- **Responsive Sidebar:** Full sidebar on desktop; sleek **Bottom Navigation Bar** on mobile for easy thumb access.
- **Fluid Grids:** Layouts automatically adjust based on screen width (1-column on mobile, up to 6-column on wide screens).
- **Touch-Friendly UI:** Large buttons, intuitive spacing, and modal-based interactions.

---

## 🔧 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Development Mode
```bash
npm run dev
```
Visit `http://localhost:3000` to see the app.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 📝 Recent Updates & Fixes
- **Scanner Stability:** Fixed "Cannot transition to a new state" error by adding a robust lifecycle guard.
- **Search Optimization:** Optimized API calls to Open Food Facts with manual triggers and full-page loading overlays.
- **Inventory UI:** Enhanced card design with always-visible delete buttons on mobile.
- **Admin Password:** Updated management settings (Current Admin PIN: `1234`).
- **Vercel Readiness:** Added `vercel.json` and optimized memory usage for smoother deployments.

---

## 📂 Project Structure
```text
├── app/              # Next.js App Router (Pages)
├── components/       # Reusable UI Components
├── store/            # Zustand State Management
├── lib/              # Utility functions and API clients
├── types/            # TypeScript Interface definitions
└── public/           # Static assets (images, sounds)
```

**Designed with ❤️ for Smart Retailers.**
# smart-billing-and-inventory-manager
# smart-billing-and-inventory-manager
