"use client";

import { useEffect, useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import {
  FileText,
  Calendar,
  Clock,
  Receipt,
  BarChart3,
  TrendingUp,
  Search,
  X,
  ShoppingBag,
  DollarSign,
} from "lucide-react";

export default function HistoryPage() {
  const { bills } = useStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  const formatId = (id: string) => {
    if (id.startsWith("INV-")) return id;
    return `INV-${id.slice(0, 8).toUpperCase()}`;
  };

  // Filter and sort bills
  const filteredBills = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return [...bills]
      .filter((bill) => {
        const billDate = new Date(bill.createdAt);

        // Date filter
        if (dateFilter === "today" && billDate < startOfDay) return false;
        if (dateFilter === "week" && billDate < startOfWeek) return false;
        if (dateFilter === "month" && billDate < startOfMonth) return false;

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesId = bill.id.toLowerCase().includes(q);
          const matchesProduct = bill.items.some((item) =>
            item.product.name.toLowerCase().includes(q)
          );
          return matchesId || matchesProduct;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bills, dateFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const totalRevenue = filteredBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalItems = filteredBills.reduce(
      (sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    const avgBill = filteredBills.length > 0 ? totalRevenue / filteredBills.length : 0;
    return { totalRevenue, totalItems, avgBill, count: filteredBills.length };
  }, [filteredBills]);

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 rounded-md w-56" />
            <div className="h-4 bg-gray-200 rounded-md w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-56" />
          ))}
        </div>
      </div>
    );
  }

  const dateButtons: { key: typeof dateFilter; label: string }[] = [
    { key: "all", label: "All Time" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <BarChart3 className="text-indigo-600" size={22} />
          Sales Reports
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track transactions, revenue, and sales performance.
        </p>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Receipt size={16} className="text-indigo-600" />
            </div>
            <span className="text-xs text-gray-500">Invoices</span>
          </div>
          <p className="text-xl font-bold text-gray-800 tabular-nums">{stats.count}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign size={16} className="text-green-600" />
            </div>
            <span className="text-xs text-gray-500">Revenue</span>
          </div>
          <p className="text-xl font-bold text-gray-800 tabular-nums">Tk{stats.totalRevenue.toFixed(0)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-amber-600" />
            </div>
            <span className="text-xs text-gray-500">Avg Bill</span>
          </div>
          <p className="text-xl font-bold text-gray-800 tabular-nums">Tk{stats.avgBill.toFixed(0)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <ShoppingBag size={16} className="text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">Items Sold</span>
          </div>
          <p className="text-xl font-bold text-gray-800 tabular-nums">{stats.totalItems}</p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Date filter pills */}
        <div className="flex gap-1.5 overflow-x-auto">
          {dateButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                dateFilter === key
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoices, products..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Invoice List ────────────────────────────────────────────────────── */}
      {filteredBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
            <FileText size={24} className="text-gray-200" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            {bills.length === 0 ? "No sales yet" : "No matching invoices"}
          </p>
          <p className="text-xs text-gray-400">
            {bills.length === 0
              ? "Complete a sale from the Billing page to see it here."
              : "Try adjusting your filters or search terms."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBills.map((bill) => (
            <div
              key={bill.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-mono font-medium text-indigo-700 text-sm">
                  {formatId(bill.id)}
                </span>
                <span className="font-semibold text-gray-800 tabular-nums">
                  Tk{bill.grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" />
                    {formatDate(bill.createdAt)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-gray-400" />
                    {formatTime(bill.createdAt)}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Items ({bill.items.reduce((s, i) => s + i.quantity, 0)})
                  </p>
                  <ul className="space-y-1.5 text-sm max-h-[120px] overflow-y-auto">
                    {bill.items.map((item) => (
                      <li key={item.product.id} className="flex items-start justify-between gap-3">
                        <span className="text-gray-700 leading-tight min-w-0">
                          <span className="block truncate text-sm">{item.product.name}</span>
                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            {item.quantity} x Tk{item.product.price.toFixed(2)}
                          </span>
                        </span>
                        <span className="font-medium text-gray-700 tabular-nums shrink-0 text-sm">
                          Tk{item.subtotal.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
