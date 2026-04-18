"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  Receipt,
  Package,
  CheckCircle2,
  Clock,
  Monitor,
  Search,
  Keyboard,
  Scan,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import BillingScanner from "@/components/BillingScanner";
import CheckoutModal from "@/components/CheckoutModal";
import { playScanSuccess, playScanError } from "@/lib/sounds";

// How long (ms) to ignore re-scans of the same barcode
const COOLDOWN_MS = 3_000;

// ── Cooldown state shown under the scanner ──────────────────────────────────
interface ScannedInfo {
  barcode: string;
  productName: string | null; // null = not found in inventory
  expiresAt: number;
}

export default function BillingPage() {
  const {
    cart,
    addToCartByBarcode,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    saveBill,
    inventory,
  } = useStore();

  // Map of barcode → timestamp of last successful scan (not persisted, in-memory only)
  const cooldownMap = useRef<Map<string, number>>(new Map());
  const [scannedInfo, setScannedInfo] = useState<ScannedInfo | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [flash, setFlash] = useState<"success" | "error" | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Scan handler (manual entry / search) ──────────────────────────────────
  const handleScan = useCallback(
    (barcode: string) => {
      const now = Date.now();
      const lastScan = cooldownMap.current.get(barcode) ?? 0;
      if (now - lastScan < COOLDOWN_MS) return;
      cooldownMap.current.set(barcode, now);

      const product = inventory.find((p) => p.barcode === barcode);

      if (product) {
        playScanSuccess();
        setFlash("success");
      } else {
        playScanError();
        setFlash("error");
      }
      setTimeout(() => setFlash(null), 300);

      addToCartByBarcode(barcode);

      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      setScannedInfo({
        barcode,
        productName: product?.name ?? null,
        expiresAt: now + COOLDOWN_MS,
      });
      cooldownTimerRef.current = setTimeout(() => setScannedInfo(null), COOLDOWN_MS);
    },
    [addToCartByBarcode, inventory]
  );

  // ── Scan handler for modal scanner (returns result) ─────────────────────
  const handleModalScan = useCallback(
    (barcode: string): { found: boolean; name: string | null } => {
      const product = inventory.find((p) => p.barcode === barcode);

      if (product) {
        playScanSuccess();
        setFlash("success");
      } else {
        playScanError();
        setFlash("error");
      }
      setTimeout(() => setFlash(null), 300);

      addToCartByBarcode(barcode);

      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      setScannedInfo({
        barcode,
        productName: product?.name ?? null,
        expiresAt: Date.now() + COOLDOWN_MS,
      });
      cooldownTimerRef.current = setTimeout(() => setScannedInfo(null), COOLDOWN_MS);

      return { found: !!product, name: product?.name ?? null };
    },
    [addToCartByBarcode, inventory]
  );

  // ── Manual barcode entry ──────────────────────────────────────────────────────
  const handleManualBarcode = () => {
    const code = manualBarcode.trim();
    if (!code) return;
    handleScan(code);
    setManualBarcode("");
  };

  // ── Search inventory for quick add ──────────────────────────────────────────
  const filteredProducts = searchQuery.trim()
    ? inventory.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  // ── Derived totals ───────────────────────────────────────────────────────────
  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ── Open checkout ────────────────────────────────────────────────────────────
  const handleGenerateInvoice = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded-md w-48" />
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-80 xl:w-96 shrink-0 h-80 bg-gray-200 rounded-2xl" />
          <div className="w-full flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[60vh] overflow-hidden">
            <div className="h-14 border-b border-gray-100 bg-gray-50 flex items-center px-5">
              <div className="h-5 bg-gray-200 rounded w-24" />
            </div>
            <div className="p-5 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Visual Flash Overlay */}
      {flash && (
        <div
          className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 ${
            flash === "success" ? "bg-green-500/20" : "bg-red-500/20"
          }`}
        />
      )}
      <h1 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
        <Monitor className="text-indigo-600" size={22} />
        Retail POS Terminal
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start">
        {/* ── LEFT: Scanner panel ───────────────────────────────────────────── */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-3">
          {/* Open scanner button */}
          <button
            onClick={() => setShowScanner(true)}
            className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 rounded-2xl transition-colors shadow-lg group"
          >
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
              <Scan size={20} className="text-indigo-400" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-semibold">Open Scanner</span>
              <span className="block text-[10px] text-gray-400 font-medium">Tap to scan product barcodes</span>
            </div>
          </button>

          {/* ── Manual barcode entry ────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <Keyboard size={14} />
              <span>Manual Barcode Entry</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualBarcode()}
                placeholder="Type or paste barcode..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleManualBarcode}
                disabled={!manualBarcode.trim()}
                className="px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* ── Product search ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 text-xs text-gray-500 font-medium w-full"
            >
              <Search size={14} />
              <span>Search Inventory</span>
              <span className="ml-auto text-gray-300 text-[10px]">{showSearch ? "Hide" : "Show"}</span>
            </button>
            {showSearch && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, brand..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {filteredProducts.length > 0 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          if (product.barcode) handleScan(product.barcode);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-indigo-50 text-left transition-colors"
                      >
                        <div className="w-8 h-8 bg-gray-50 rounded border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Package size={14} className="text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                          <p className="text-[10px] text-gray-400">Tk{product.price.toFixed(2)}</p>
                        </div>
                        <Plus size={14} className="text-indigo-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.trim() && filteredProducts.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No products found</p>
                )}
              </div>
            )}
          </div>

          {/* Last-scanned status banner */}
          {scannedInfo ? (
            <div
              className={`rounded-xl px-4 py-3 flex items-start gap-3 text-sm ${
                scannedInfo.productName
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {scannedInfo.productName ? (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-500" />
              ) : (
                <X size={18} className="shrink-0 mt-0.5 text-red-400" />
              )}
              <div className="min-w-0">
                {scannedInfo.productName ? (
                  <>
                    <p className="font-semibold truncate">{scannedInfo.productName}</p>
                    <p className="text-xs text-green-600 mt-0.5">Added to cart</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Not in inventory</p>
                    <p className="text-xs mt-0.5 font-mono text-red-500 truncate">
                      {scannedInfo.barcode}
                    </p>
                  </>
                )}
                <p className="flex items-center gap-1 text-xs mt-1.5 opacity-60">
                  <Clock size={11} />
                  3-second rescan cooldown active
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-center text-gray-400 py-1">
              Point the camera at any product barcode
            </p>
          )}
        </div>

        {/* ── RIGHT: Cart ───────────────────────────────────────────────────── */}
        <div className="w-full flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          {/* Cart header */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <ShoppingCart size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-700">Cart</h2>
            {totalQty > 0 && (
              <span className="ml-1 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                {totalQty} item{totalQty !== 1 ? "s" : ""}
              </span>
            )}
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="ml-auto inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={13} />
                Clear all
              </button>
            )}
          </div>

          {/* Empty state */}
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingCart size={28} className="text-gray-200" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Cart is empty</p>
              <p className="text-xs text-gray-400 text-center max-w-[200px]">Scan a barcode, search products, or type a barcode manually to get started.</p>
              <div className="mt-8 w-full max-w-[220px] space-y-2 opacity-40">
                <div className="flex justify-between text-xs">
                  <span>Subtotal</span><span>Tk0.00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Tax</span><span>--</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-medium">
                  <span>Total</span><span>Tk0.00</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Column headers — visible on sm+ */}
              <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
                <span className="w-12">Image</span>
                <span>Product</span>
                <span className="text-center w-24">Qty</span>
                <span className="text-right w-20">Subtotal</span>
                <span className="w-6" />
              </div>

              {/* Cart rows */}
              <div className="divide-y divide-gray-50 overflow-y-auto flex-1">
                <AnimatePresence initial={false}>
                  {cart.map(({ product, quantity, subtotal }) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-[56px_1fr_auto] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-3 sm:gap-4 items-center px-5 py-4"
                    >
                    {/* Image */}
                    <div className="h-14 w-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Package size={24} className="text-gray-200" />
                      )}
                    </div>

                    {/* Name + price */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {product.name}
                      </p>
                      {product.brand && (
                        <p className="text-xs text-gray-400 truncate">{product.brand}</p>
                      )}
                      <p className="text-xs text-indigo-500 mt-0.5">
                        Tk{product.price.toFixed(2)} / unit
                      </p>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateCartQuantity(product.id, quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-gray-700 tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(product.id, quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="hidden sm:block text-right min-w-[72px] shrink-0">
                      <p className="text-sm font-bold text-indigo-600 tabular-nums">
                        Tk{subtotal.toFixed(2)}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                      aria-label={`Remove ${product.name}`}
                    >
                      <X size={16} />
                    </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Cart footer — totals + CTA */}
              <div className="mt-auto border-t border-gray-100 bg-gray-50 px-5 py-5 space-y-4">
                {/* Breakdown */}
                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>
                      Subtotal
                      <span className="text-gray-400 text-xs ml-1">
                        ({cart.length} line{cart.length !== 1 ? "s" : ""}, {totalQty} unit
                        {totalQty !== 1 ? "s" : ""})
                      </span>
                    </span>
                    <span className="tabular-nums">Tk{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>Tax / GST</span>
                    <span>—</span>
                  </div>
                </div>

                {/* Grand total */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-base font-bold text-gray-800">Grand Total</span>
                  <span className="text-2xl font-bold text-indigo-600 tabular-nums">
                    Tk{grandTotal.toFixed(2)}
                  </span>
                </div>

                {/* Generate Invoice */}
                <button
                  onClick={handleGenerateInvoice}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  <Receipt size={18} />
                  Generate Invoice
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Scanner modal ──────────────────────────────────────────────────── */}
      {showScanner && (
        <BillingScanner
          onScan={handleModalScan}
          onClose={() => setShowScanner(false)}
          cartCount={totalQty}
        />
      )}

      {/* ── Checkout modal ─────────────────────────────────────────────────── */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onCompleteSale={saveBill}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}
