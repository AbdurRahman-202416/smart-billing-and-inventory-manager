"use client";

import { useRef } from "react";
import { X, Printer, CheckCircle2, Store, ArrowLeft } from "lucide-react";
import type { CartItem } from "@/types";

// ── Shop config — update these for a real deployment ─────────────────────────
const SHOP = {
  name: "Smart Mart",
  tagline: "Quality you can trust",
  address: "123 Main Street, City — 400001",
  phone: "+91 98765 43210",
  gstin: "27AAAAA0000A1Z5",
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatTime(d: Date) {
  const h = d.getHours();
  const m = pad(d.getMinutes());
  const ampm = h >= 12 ? "PM" : "AM";
  return `${pad(h % 12 || 12)}:${m} ${ampm}`;
}

function makeBillNo() {
  // e.g. INV-2603-4F2A
  const now = new Date();
  const dateTag = `${pad(now.getDate())}${pad(now.getMonth() + 1)}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${dateTag}-${rand}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  cart: CartItem[];
  onCompleteSale: () => void; // should call saveBill() — clears cart + saves history
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CheckoutModal({ cart, onCompleteSale, onClose }: Props) {
  // Freeze bill metadata at the moment the modal opens
  const billDate = useRef(new Date());
  const billNo = useRef(makeBillNo());

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const tax = 0; // extend later (e.g. 5% GST)
  const grandTotal = subtotal + tax;
  const totalUnits = cart.reduce((s, i) => s + i.quantity, 0);

  const handlePrint = () => window.print();

  const handleCompleteSale = () => {
    onCompleteSale(); // saveBill() → persists bill, clears cart
    onClose();
  };

  return (
    <>
      {/*
       * ── Print styles ─────────────────────────────────────────────────────
       *
       * The <style> tag is mounted while this modal is open and removed on
       * unmount, so it never affects the rest of the app.
       *
       * Strategy: make *everything* on the page invisible, then make the
       * receipt div and all its descendants visible again.
       * visibility:visible on a child always wins over visibility:hidden on
       * an ancestor, regardless of DOM depth or display:none on wrappers.
       */}
      <style>{`
        @media print {
          * {
            visibility: hidden !important;
            box-shadow: none !important;
          }
          #checkout-receipt,
          #checkout-receipt * {
            visibility: visible !important;
          }
          #checkout-receipt {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
            background: white !important;
            padding: 24px !important;
            z-index: 99999 !important;
          }
          @page {
            size: 80mm auto; /* thermal receipt width */
            margin: 0;
          }
        }
      `}</style>

      {/* ── Backdrop ─────────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-black/70 z-50 overflow-y-auto px-4 pt-20 pb-10 md:py-12"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* ── Close button (top-right, hidden during print) ─────────────────── */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-[60] bg-white rounded-full p-2.5 shadow-lg text-gray-500 hover:text-gray-800 transition-colors print:hidden"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="max-w-sm mx-auto space-y-4">
          {/* ── Receipt card ─────────────────────────────────────────────────── */}
          <div
            id="checkout-receipt"
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {/* ── Shop header ──────────────────────────────────────────────── */}
              <div className="text-center space-y-0.5">
                <div className="flex items-center justify-center gap-2">
                  <Store size={20} className="text-indigo-600" />
                  <h1 className="text-2xl font-extrabold tracking-wide text-gray-900">
                    {SHOP.name}
                  </h1>
                </div>
                <p className="text-xs text-gray-500 italic">{SHOP.tagline}</p>
                <p className="text-xs text-gray-500">{SHOP.address}</p>
                <p className="text-xs text-gray-500">
                  Tel: {SHOP.phone} &nbsp;|&nbsp; GSTIN: {SHOP.gstin}
                </p>
              </div>

              {/* ── Separator ────────────────────────────────────────────────── */}
              <div className="border-t-2 border-dashed border-gray-200" />

              {/* ── Bill metadata ─────────────────────────────────────────────── */}
              <div className="flex justify-between text-xs">
                <div className="space-y-0.5 text-gray-600">
                  <p>
                    <span className="text-gray-400">Bill No:</span>{" "}
                    <span className="font-mono font-semibold text-gray-800">
                      {billNo.current}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-400">Cashier:</span>{" "}
                    <span className="font-medium">Admin</span>
                  </p>
                </div>
                <div className="text-right space-y-0.5 text-gray-600">
                  <p className="font-semibold text-gray-800">
                    {formatDate(billDate.current)}
                  </p>
                  <p className="text-gray-400">{formatTime(billDate.current)}</p>
                </div>
              </div>

              {/* ── Separator ────────────────────────────────────────────────── */}
              <div className="border-t border-dashed border-gray-200" />

              {/* ── Column headers ───────────────────────────────────────────── */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amt</span>
              </div>

              {/* ── Line items ───────────────────────────────────────────────── */}
              <div className="divide-y divide-gray-50 -mt-2">
                {cart.map(({ product, quantity, subtotal: lineTotal }) => (
                  <div
                    key={product.id}
                    className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 py-2 text-sm"
                  >
                    {/* Item name + unit */}
                    <div className="min-w-0 pr-1">
                      <p className="font-medium text-gray-800 truncate leading-tight">
                        {product.name}
                      </p>
                      {product.unit && (
                        <p className="text-[10px] text-gray-400 leading-tight">
                          {product.unit}
                        </p>
                      )}
                    </div>
                    <span className="text-right text-gray-600 tabular-nums self-start mt-0.5">
                      {quantity}
                    </span>
                    <span className="text-right text-gray-600 tabular-nums self-start mt-0.5">
                      Tk{product.price.toFixed(2)}
                    </span>
                    <span className="text-right font-semibold text-gray-800 tabular-nums self-start mt-0.5">
                      Tk{lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Separator ────────────────────────────────────────────────── */}
              <div className="border-t border-dashed border-gray-300" />

              {/* ── Totals breakdown ─────────────────────────────────────────── */}
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Subtotal{" "}
                    <span className="text-xs text-gray-400">
                      ({totalUnits} unit{totalUnits !== 1 ? "s" : ""})
                    </span>
                  </span>
                  <span className="tabular-nums">Tk{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>CGST + SGST (0%)</span>
                  <span>Tk0.00</span>
                </div>
              </div>

              {/* ── Grand total ──────────────────────────────────────────────── */}
              <div className="border-t-4 border-double border-gray-800 pt-3 flex items-baseline justify-between">
                <span className="text-base font-extrabold text-gray-900 uppercase tracking-wide">
                  Grand Total
                </span>
                <span className="text-2xl font-extrabold text-indigo-600 tabular-nums">
                  Tk{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* ── Footer ───────────────────────────────────────────────────── */}
              <div className="border-t border-dashed border-gray-200 pt-3 text-center space-y-0.5">
                <p className="text-xs font-semibold text-gray-600">
                  Thank you for shopping at {SHOP.name}!
                </p>
                <p className="text-[10px] text-gray-400">
                  Goods once sold will not be taken back.
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">
                  ✦ ✦ ✦
                </p>
              </div>
            </div>
          </div>

          {/* ── Action buttons (hidden during print) ─────────────────────────── */}
          <div className="space-y-2 print:hidden">
            {/* Print */}
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors shadow-sm"
            >
              <Printer size={18} />
              Print Receipt
            </button>

            {/* Complete Sale — the destructive / final action */}
            <button
              onClick={handleCompleteSale}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              <CheckCircle2 size={18} />
              Complete Sale
            </button>

            {/* Back without completing */}
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 py-2 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
