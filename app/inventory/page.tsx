"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ScanLine, Plus, Package, Loader2, Trash2, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { foodApi } from "@/lib/axios";
import type { FoodApiResponse } from "@/lib/axios";
import BarcodeScanner from "@/components/BarcodeScanner";
import type { Product } from "@/types";

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------
interface FormState {
  name: string;
  brand: string;
  image: string;
  barcode: string;
  price: string;
  stock: string;
  sizeValue: string; // The numeric value (e.g., 500)
  unitType: string;  // The measurement type (e.g., g)
  category: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  brand: "",
  image: "",
  barcode: "",
  price: "",
  stock: "1",
  sizeValue: "",
  unitType: "",
  category: "",
};

// ---------------------------------------------------------------------------
// Predefined options for faster entry
// ---------------------------------------------------------------------------
const CATEGORIES = [
  "Grocery",
  "Beverages",
  "Snacks",
  "Dairy & Eggs",
  "Household",
  "Personal Care",
  "Bakery",
  "Frozen Foods",
  "Produce",
  "Meat & Seafood",
  "Confectionery",
  "Other"
];

const UNITS = [
  "kg", "g", "mg",
  "L", "ml",
  "pcs", "Pack", "Box", "Bottle", "Can", "Dozen"
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function InventoryPage() {
  const { inventory, addProduct, removeProduct } = useStore();

  const [showScanner, setShowScanner] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [mounted, setMounted] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: string; name: string } | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── helpers ────────────────────────────────────────────────────────────────
  const setField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ── scan handler: called by BarcodeScanner after a successful read ─────────
  const handleScan = useCallback(async (barcode: string) => {
    setShowScanner(false);
    setFetching(true);
    setFetchError(null);
    setForm((prev) => ({ ...prev, barcode }));

    try {
      const { data } = await foodApi.get<FoodApiResponse>(`/product/${barcode}.json`);

      if (data.status !== 1 || !data.product) {
        setFetchError("Product not found in OpenFoodFacts — fill details manually.");
        return;
      }

      const p = data.product;
      
      // Smart splitting of quantity (e.g., "400 g" or "1kg")
      const qty = p.quantity || "";
      const match = qty.match(/^([\d.]+)\s*(.*)$/);
      const sizeValue = match ? match[1] : "";
      const unitType = match ? match[2] : "";

      setForm((prev) => ({
        ...prev,
        name: p.product_name ?? prev.name,
        brand: p.brands ?? prev.brand,
        image: p.image_front_url ?? p.image_url ?? prev.image,
        sizeValue: sizeValue || prev.sizeValue,
        unitType: unitType || prev.unitType,
      }));
    } catch {
      setFetchError("Network error fetching product data — fill details manually.");
    } finally {
      setFetching(false);
    }
  }, []);

  // ── form submit ────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newProduct: Product = {
      id: crypto.randomUUID(),
      sku: `SKU-${Date.now()}`,
      name: form.name.trim(),
      brand: form.brand.trim() || undefined,
      image: form.image.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10) || 0,
      unit: `${form.sizeValue}${form.unitType}`.trim(),
      category: form.category.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addProduct(newProduct);
    setForm(EMPTY_FORM);
    setFetchError(null);
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteData({ id, name });
    setAdminPassword("");
    setAdminError(false);
  };

  const confirmDelete = () => {
    if (adminPassword === "1234") {
      if (deleteData) {
        removeProduct(deleteData.id);
        setDeleteData(null);
      }
    } else {
      setAdminError(true);
    }
  };

  // ── filter inventory ────────────────────────────────────────────────────────
  const filteredInventory = inventory.filter((product) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      product.brand?.toLowerCase().includes(q) ||
      product.barcode?.toLowerCase().includes(q) ||
      product.category?.toLowerCase().includes(q)
    );
  });

  // ── stock badge colour ─────────────────────────────────────────────────────
  const stockBadge = (stock: number) => {
    if (stock > 10) return "bg-green-100 text-green-700";
    if (stock > 0) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  // ── render ─────────────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Package className="text-indigo-600" />
        Inventory Management Hub
      </h1>

      {/* ── Add Product card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-5">Add New Product</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Scan row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <ScanLine size={16} />
              Scan to Fetch
            </button>

            {form.barcode && (
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {form.barcode}
              </span>
            )}

            {fetching && (
              <span className="inline-flex items-center gap-1.5 text-sm text-indigo-500">
                <Loader2 size={14} className="animate-spin" />
                Fetching product data…
              </span>
            )}
          </div>

          {/* Fetch error / warning */}
          {fetchError && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              ⚠ {fetchError}
            </p>
          )}

          {/* Auto-filled fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Product Name <span className="text-red-400">*</span>{" "}
                <span className="text-indigo-400">(auto filled after scan)</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={setField("name")}
                placeholder="e.g. Nutella"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Brand <span className="text-indigo-400">(auto filled after scan)</span>
              </label>
              <input
                type="text"
                value={form.brand}
                onChange={setField("brand")}
                placeholder="e.g. Ferrero"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Image preview + URL — only shown once we have a URL */}
          {form.image && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.image}
                alt="Product preview"
                className="h-20 w-20 object-contain rounded-lg border border-gray-100 bg-gray-50 shrink-0"
              />
              <input
                type="url"
                value={form.image}
                onChange={setField("image")}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-500"
              />
            </div>
          )}

          {/* Manual fields */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Price (Tk) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={setField("price")}
                placeholder="0.00"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Size / Weight
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.sizeValue}
                  onChange={setField("sizeValue")}
                  placeholder="Value"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={form.unitType}
                  onChange={setField("unitType")}
                  className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  <option value="">Unit</option>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Initial Stock
              </label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={setField("stock")}
                placeholder="1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={setField("category")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!form.name.trim() || !form.price}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add to Inventory
          </button>
        </form>
      </div>

      {/* ── Product grid ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            All Products{" "}
            <span className="text-sm font-normal text-gray-400">
              ({filteredInventory.length} item{filteredInventory.length !== 1 ? "s" : ""})
            </span>
          </h2>

          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, barcode..."
              className="w-full pl-10 pr-10 py-2 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-3 flex items-center text-gray-300 hover:text-gray-500"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package size={52} className="mb-3 opacity-20" />
            <p className="text-sm">{searchQuery ? "No products match your search." : "No products yet — scan a barcode to get started."}</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            <AnimatePresence>
              {filteredInventory.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col group relative"
                >
                {/* Product image */}
                <Link href={`/product/${product.id}`} className="h-40 bg-gray-50 flex items-center justify-center p-3 relative cursor-pointer">
                  <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Package size={44} className="text-gray-200" />
                  )}
                </Link>

                {/* Card body */}
                <div className="p-4 space-y-1">
                  <Link href={`/product/${product.id}`}>
                    <p className="font-semibold text-gray-800 truncate hover:text-indigo-600 cursor-pointer">{product.name}</p>
                  </Link>

                  {product.brand && (
                    <p className="text-xs text-gray-500 truncate">{product.brand}</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-indigo-600 font-bold text-sm">
                      Tk{product.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${stockBadge(
                        product.stock
                      )}`}
                    >
                      {product.stock} in stock
                    </span>
                  </div>

                  {product.unit && (
                    <p className="text-xs text-gray-400">{product.unit}</p>
                  )}

                  {product.category && (
                    <span className="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {product.category}
                    </span>
                  )}

                  {product.barcode && (
                    <p className="text-xs text-gray-300 font-mono truncate pt-1">
                      {product.barcode}
                    </p>
                  )}

                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm border border-gray-100"
                    title="Delete Product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Scanner modal ─────────── */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ── Delete Confirmation Modal ─────────── */}
      <AnimatePresence>
        {deleteData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteData(null)}
              className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="text-red-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Product?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete <span className="font-semibold text-gray-800">"{deleteData.name}"</span>? 
                  This action cannot be undone.
                </p>

                <div className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => {
                        setAdminPassword(e.target.value);
                        setAdminError(false);
                      }}
                      placeholder="Enter Admin Password"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        adminError ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                      } text-center text-sm transition-all focus:outline-none`}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && confirmDelete()}
                    />
                    {adminError && (
                      <p className="text-xs text-red-500 mt-1.5 font-medium">Incorrect admin password</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteData(null)}
                      className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
