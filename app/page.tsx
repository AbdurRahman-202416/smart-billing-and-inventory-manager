"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Loader2,
  Plus,
  Globe2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  SearchX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import type { Product } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────
interface GlobalProduct {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  quantity?: string;
  categories?: string;
}

interface ApiResponse {
  products: GlobalProduct[];
  count: number;
}

const PAGE_SIZE = 20;
const BASE = "https://world.openfoodfacts.org";

// ─── Component ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  // Loading / data states (manual fetch — no React Query to keep logic clear)
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // true after first load
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [addingId, setAddingId] = useState<string | null>(null);
  const { addProduct, inventory } = useStore();

  // ── fetch helper ────────────────────────────────────────────────────────
  const fetchProducts = async (term: string, pg: number) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const cacheKey = `global_products_${term}_${pg}`;
      const cached = window.localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Retain cache for 5 minutes
        if (Date.now() - timestamp < 1000 * 60 * 5) {
          setApiData(data);
          setIsLoading(false);
          setHasSearched(true);
          return;
        }
      }

      const params = new URLSearchParams({
        action: "process",
        json: "true",
        page_size: String(PAGE_SIZE),
        page: String(pg),
        sort_by: "popularity_key",
        fields: "code,product_name,brands,image_url,image_front_url,quantity,categories",
      });

      if (term.trim()) {
        params.set("search_terms", term.trim());
      } else {
        params.set("countries_tags", "bangladesh");
      }

      const res = await fetch(`${BASE}/cgi/search.pl?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json: ApiResponse = await res.json();
      
      window.localStorage.setItem(cacheKey, JSON.stringify({
        data: json,
        timestamp: Date.now()
      }));
      setApiData(json);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  // ── initial load on mount ────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProducts("", 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── search trigger ───────────────────────────────────────────────────────
  const handleSearch = () => {
    setSubmittedSearch(inputValue);
    setPage(1);
    fetchProducts(inputValue, 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setInputValue("");
    setSubmittedSearch("");
    setPage(1);
    fetchProducts("", 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchProducts(submittedSearch, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── add to inventory ─────────────────────────────────────────────────────
  const handleAddProduct = (item: GlobalProduct) => {
    setAddingId(item.code);
    const existing = inventory.find((p) => p.barcode === item.code);
    if (!existing) {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        sku: `SKU-${item.code || Date.now()}`,
        name: item.product_name || "Unknown Product",
        brand: item.brands || undefined,
        image: item.image_front_url || item.image_url || undefined,
        barcode: item.code || undefined,
        price: 0, // Price must be set manually in inventory
        stock: 20,
        unit: item.quantity || "",
        category: item.categories?.split(",")[0]?.trim() || "Grocery",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addProduct(newProduct);
    }
    setTimeout(() => setAddingId(null), 500);
  };

  const products = apiData?.products ?? [];
  const totalProducts = apiData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const hasResults = hasSearched && !isLoading && products.length > 0;
  const noResults = hasSearched && !isLoading && !fetchError && products.length === 0;

  // ── render ───────────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="space-y-5 animate-pulse">
        {/* Skeleton Header */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="h-8 bg-gray-200 rounded-md w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded-md w-48"></div>
          </div>
          <div className="flex gap-2 w-full">
            <div className="h-10 bg-gray-200 rounded-xl flex-1"></div>
            <div className="h-10 bg-gray-200 rounded-xl w-24"></div>
          </div>
        </div>
        
        {/* Skeleton Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="h-32 md:h-40 bg-gray-200 w-full" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded-full w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Search className="text-indigo-600" size={22} />
            Product Sourcing Catalog
          </h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {hasSearched && !isLoading
              ? submittedSearch
                ? `Found ${totalProducts.toLocaleString()} results for "${submittedSearch}"`
                : `Browsing ${totalProducts.toLocaleString()} Bangladeshi products`
              : "Loading catalog..."}
          </p>
        </div>

        {/* Search bar + button */}
        <div className="flex gap-2 w-full">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Search products (e.g. Rice, Milk, Biscuit)..."
              className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all text-sm disabled:opacity-60"
            />
            {inputValue && !isLoading && (
              <button
                onClick={handleClear}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} strokeWidth={2.5} />
            )}
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        {/* Pagination (top) */}
        {hasResults && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1 || isLoading}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 min-w-[60px] text-center">
                {page}
                <span className="text-gray-300 mx-1">/</span>
                {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Loading State ──────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-5 animate-pulse mt-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="h-32 md:h-40 bg-gray-200 w-full" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-8 bg-gray-200 rounded-xl w-full max-w-[80px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error State ────────────────────────────────────────────────── */}
      {!isLoading && fetchError && products.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 md:p-14 text-center max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Globe2 className="text-red-400" size={28} />
          </div>
          <h3 className="font-bold text-lg text-gray-800 mb-2">Connection trouble</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            We couldn&apos;t reach the product catalog right now. This usually means a network issue on your end or the server is temporarily down.
          </p>
          <button
            onClick={() => fetchProducts(submittedSearch, page)}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors active:scale-95"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Inline error banner (when products loaded but refresh failed) ── */}
      {!isLoading && fetchError && products.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <Globe2 size={15} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-xs">Refresh failed</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Showing cached results. Your connection may be unstable.</p>
          </div>
          <button
            onClick={() => fetchProducts(submittedSearch, page)}
            className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-800 font-semibold rounded-lg text-xs shrink-0 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── No Results State ──────────────────────────────────────────── */}
      {noResults && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-5">
            <SearchX size={36} className="text-gray-200" />
          </div>
          <h3 className="font-bold text-gray-700 text-lg mb-2">Nothing found</h3>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            We couldn&apos;t find any products matching
            {" "}<strong className="text-gray-600">&quot;{submittedSearch}&quot;</strong>.
            Try a different keyword or browse all products.
          </p>
          <button
            onClick={handleClear}
            className="mt-6 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all active:scale-95"
          >
            Browse all products
          </button>
        </div>
      )}

      {/* ── Results Grid ──────────────────────────────────────────────── */}
      {hasResults && (
        <>
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-5"
          >
            <AnimatePresence mode="popLayout">
              {products.map((product) => {
                const inInventory = inventory.some((p) => p.barcode === product.code);
                const imgSrc = product.image_front_url || product.image_url || null;

                return (
                  <motion.div
                    key={product.code}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col group"
                  >
                    {/* Image */}
                    <div className="h-36 md:h-48 bg-gray-50 flex items-center justify-center relative">
                      {inInventory && (
                        <div className="absolute top-2 left-2 bg-green-500/90 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full z-10 uppercase">
                          In Store
                        </div>
                      )}
                      <Link
                        href={`/product/${product.code}`}
                        className="absolute inset-0 flex items-center justify-center p-4 md:p-8"
                      >
                        <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {imgSrc ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={imgSrc}
                              alt={product.product_name || "Product"}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              className="object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                              unoptimized // open food facts images are external
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <Package size={40} className="text-gray-200" />
                        )}
                      </Link>
                    </div>

                    {/* Content */}
                    <div className="p-3 md:p-5 flex-1 flex flex-col">
                      <Link href={`/product/${product.code}`}>
                        <h3 className="font-semibold text-gray-800 text-xs md:text-sm line-clamp-2 leading-tight mb-1 min-h-[2rem] md:min-h-[2.5rem] group-hover:text-indigo-600 transition-colors">
                          {product.product_name || "Unnamed Item"}
                        </h3>
                      </Link>
                      <p className="text-[9px] md:text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-3 truncate">
                        {product.brands || "Generic"}
                      </p>

                      <div className="mt-auto space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between text-[9px] md:text-[10px] font-medium text-gray-400 bg-gray-50 px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-gray-100">
                          <span className="truncate max-w-[55%]">{product.quantity || "Std"}</span>
                          <span className="font-mono text-[8px] md:text-[9px]">
                            {product.code?.slice(-6)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAddProduct(product)}
                          disabled={inInventory || addingId === product.code}
                          className={`w-full flex items-center justify-center gap-1.5 py-2 md:py-2.5 rounded-xl text-[11px] md:text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                            inInventory
                              ? "bg-green-50 text-green-600 cursor-not-allowed border border-green-100"
                              : addingId === product.code
                              ? "bg-gray-100 text-gray-400"
                              : "bg-gray-900 text-white hover:bg-indigo-600 active:scale-95"
                          }`}
                        >
                          {addingId === product.code ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : inInventory ? (
                            <>✔ Stocked</>
                          ) : (
                            <>
                              <Plus size={14} strokeWidth={3} />
                              <span>Add to Inventory</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Bottom Pagination */}
          <div className="flex items-center justify-center gap-2 md:gap-3 py-8 md:py-12">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronLeft size={16} className="inline" />
              <span className="hidden sm:inline ml-1">Prev</span>
            </button>
            <div className="bg-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 tabular-nums">
              {page}
              <span className="text-gray-300 mx-1.5">/</span>
              {totalPages}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium hover:bg-gray-50 disabled:opacity-30 transition-all active:scale-95"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight size={16} className="inline" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
