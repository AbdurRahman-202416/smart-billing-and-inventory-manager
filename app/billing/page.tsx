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
} from "lucide-react";
import { useStore } from "@/store/useStore";
import LiveScanner from "@/components/LiveScanner";
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
  const [mounted, setMounted] = useState(false);
  const [flash, setFlash] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Scan handler ────────────────────────────────────────────────────────────
  const handleScan = useCallback(
    (barcode: string) => {
      const now = Date.now();
      const lastScan = cooldownMap.current.get(barcode) ?? 0;

      // Silently drop re-scans within the cooldown window
      if (now - lastScan < COOLDOWN_MS) return;

      // Record new scan time
      cooldownMap.current.set(barcode, now);

      // Look up product before dispatching so we can play the right sound
      const product = inventory.find((p) => p.barcode === barcode);

      if (product) {
        playScanSuccess();
        setFlash("success");
      } else {
        playScanError();
        setFlash("error");
      }
      setTimeout(() => setFlash(null), 300);

      // Dispatch to store (alerts internally when barcode not found)
      addToCartByBarcode(barcode);

      // Update banner — clear any previous timer first
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
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
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
      <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
        <Monitor className="text-indigo-600" size={22} />
        Retail POS Terminal
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start">
        {/* ── LEFT: Scanner panel ───────────────────────────────────────────── */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-3">
          <LiveScanner onScan={handleScan} />

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
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Package size={48} className="mb-3 opacity-20" />
              <p className="text-sm">Scan a product to add it to the cart.</p>
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
                  <span className="text-2xl font-extrabold text-indigo-600 tabular-nums">
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
