"use client";

import { useEffect, useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  Package,
  Hash,
  Layers,
} from "lucide-react";

export default function HistoryPage() {
  const { bills } = useStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [expandedBill, setExpandedBill] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const formatId = (id: string) => {
    if (id.startsWith("INV-")) return id;
    return `INV-${id.slice(0, 8).toUpperCase()}`;
  };

  const shortId = (id: string) => {
    if (id.startsWith("INV-")) return id.slice(0, 12);
    return `#${id.slice(0, 6).toUpperCase()}`;
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
        if (dateFilter === "today" && billDate < startOfDay) return false;
        if (dateFilter === "week" && billDate < startOfWeek) return false;
        if (dateFilter === "month" && billDate < startOfMonth) return false;

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

  // Daily revenue for mini chart (last 7 days)
  const dailyData = useMemo(() => {
    const days: { label: string; value: number; date: Date }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      days.push({ label: dayNames[d.getDay()], value: 0, date: d });
    }
    bills.forEach((bill) => {
      const bd = new Date(bill.createdAt);
      days.forEach((day) => {
        if (
          bd.getFullYear() === day.date.getFullYear() &&
          bd.getMonth() === day.date.getMonth() &&
          bd.getDate() === day.date.getDate()
        ) {
          day.value += bill.grandTotal;
        }
      });
    });
    return days;
  }, [bills]);

  const maxDailyValue = Math.max(...dailyData.map((d) => d.value), 1);

  // Group bills by date for timeline view
  const groupedBills = useMemo(() => {
    const groups: { date: string; bills: typeof filteredBills }[] = [];
    filteredBills.forEach((bill) => {
      const dateStr = formatDate(bill.createdAt);
      const existing = groups.find((g) => g.date === dateStr);
      if (existing) {
        existing.bills.push(bill);
      } else {
        groups.push({ date: dateStr, bills: [bill] });
      }
    });
    return groups;
  }, [filteredBills]);

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-gray-200 rounded-md w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-28" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 h-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20" />
          ))}
        </div>
      </div>
    );
  }

  const dateButtons: { key: typeof dateFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "today", label: "Today" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
              <BarChart3 size={18} className="text-white" />
            </div>
            Sales Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1 ml-[46px]">
            {stats.count} transaction{stats.count !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {/* Date filter pills */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {dateButtons.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === key
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {dateFilter === key && (
                <motion.div
                  layoutId="dateFilter"
                  className="absolute inset-0 bg-gray-800 rounded-lg"
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Revenue",
            value: `Tk${stats.totalRevenue.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            icon: DollarSign,
            color: "from-emerald-500 to-teal-600",
            shadow: "shadow-emerald-200",
            bg: "bg-emerald-50",
            text: "text-emerald-700",
          },
          {
            label: "Invoices",
            value: stats.count.toString(),
            icon: Receipt,
            color: "from-indigo-500 to-blue-600",
            shadow: "shadow-indigo-200",
            bg: "bg-indigo-50",
            text: "text-indigo-700",
          },
          {
            label: "Avg. Bill",
            value: `Tk${stats.avgBill.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            icon: TrendingUp,
            color: "from-amber-500 to-orange-600",
            shadow: "shadow-amber-200",
            bg: "bg-amber-50",
            text: "text-amber-700",
          },
          {
            label: "Items Sold",
            value: stats.totalItems.toString(),
            icon: ShoppingBag,
            color: "from-violet-500 to-purple-600",
            shadow: "shadow-violet-200",
            bg: "bg-violet-50",
            text: "text-violet-700",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
            className="bg-white rounded-2xl border border-gray-100 p-4 relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            {/* Decorative gradient blob */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${stat.color} rounded-full opacity-[0.07] group-hover:opacity-[0.12] transition-opacity`} />

            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon size={15} className={stat.text} />
              </div>
              <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.text} tabular-nums tracking-tight`}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Mini Bar Chart — 7-Day Activity ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="bg-white rounded-2xl border border-gray-100 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
              <Layers size={15} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-700">7-Day Activity</h3>
              <p className="text-[10px] text-gray-400 font-medium">Daily revenue overview</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-800 tabular-nums">
              Tk{dailyData.reduce((s, d) => s + d.value, 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-gray-400 font-medium">7-day total</p>
          </div>
        </div>

        <div className="flex items-end gap-2 h-32">
          {dailyData.map((day, i) => {
            const height = maxDailyValue > 0 ? (day.value / maxDailyValue) * 100 : 0;
            const isToday = i === dailyData.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                {/* Value tooltip on hover */}
                <div className="text-[9px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                  {day.value > 0 ? `Tk${day.value.toFixed(0)}` : "0"}
                </div>
                <div className="w-full flex justify-center" style={{ height: "80px" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 4)}%` }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                    className={`w-full max-w-[36px] rounded-lg ${
                      isToday
                        ? "bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-md shadow-indigo-200"
                        : day.value > 0
                        ? "bg-gradient-to-t from-gray-300 to-gray-200"
                        : "bg-gray-100"
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-semibold ${isToday ? "text-indigo-600" : "text-gray-400"}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by invoice ID, product name..."
          className="w-full pl-11 pr-10 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Invoice Timeline ───────────────────────────────────────────────── */}
      {filteredBills.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100"
        >
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={28} className="text-gray-200" />
          </div>
          <p className="text-sm font-semibold text-gray-500 mb-1">
            {bills.length === 0 ? "No sales yet" : "No matching invoices"}
          </p>
          <p className="text-xs text-gray-400 max-w-[240px] text-center">
            {bills.length === 0
              ? "Complete a sale from the Billing page to see it here."
              : "Try adjusting your filters or search query."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {groupedBills.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg">
                  <Calendar size={12} />
                  {group.date}
                </div>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] text-gray-400 font-semibold">
                  {group.bills.length} sale{group.bills.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Bills for this date */}
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {group.bills.map((bill, billIdx) => {
                    const isExpanded = expandedBill === bill.id;
                    const itemCount = bill.items.reduce((s, i) => s + i.quantity, 0);

                    return (
                      <motion.div
                        key={bill.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: billIdx * 0.04, duration: 0.3 }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Row — clickable summary */}
                        <button
                          onClick={() => setExpandedBill(isExpanded ? null : bill.id)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left group"
                        >
                          {/* Icon */}
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                            <Receipt size={18} className="text-indigo-500" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800">
                                {shortId(bill.id)}
                              </span>
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-semibold">
                                {itemCount} item{itemCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                <Clock size={10} />
                                {formatTime(bill.createdAt)}
                              </span>
                              {bill.items.length > 0 && (
                                <span className="text-[11px] text-gray-400 truncate max-w-[160px]">
                                  {bill.items[0].product.name}
                                  {bill.items.length > 1 && ` +${bill.items.length - 1} more`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Amount + chevron */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-base font-bold text-gray-800 tabular-nums">
                              Tk{bill.grandTotal.toFixed(0)}
                            </span>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-gray-300"
                            >
                              <ChevronDown size={16} />
                            </motion.div>
                          </div>
                        </button>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                                {/* Invoice ID */}
                                <div className="flex items-center gap-2 mb-3 text-[11px] text-gray-400">
                                  <Hash size={10} />
                                  <span className="font-mono">{formatId(bill.id)}</span>
                                </div>

                                {/* Items */}
                                <div className="space-y-2">
                                  {bill.items.map((item) => (
                                    <div
                                      key={item.product.id}
                                      className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5"
                                    >
                                      {/* Product image */}
                                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                        {item.product.image ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            src={item.product.image}
                                            alt=""
                                            className="w-full h-full object-contain"
                                          />
                                        ) : (
                                          <Package size={14} className="text-gray-300" />
                                        )}
                                      </div>

                                      {/* Name + qty */}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-700 truncate">
                                          {item.product.name}
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                          {item.quantity} &times; Tk{item.product.price.toFixed(2)}
                                        </p>
                                      </div>

                                      {/* Subtotal */}
                                      <span className="text-sm font-bold text-gray-700 tabular-nums shrink-0">
                                        Tk{item.subtotal.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Total footer */}
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                  <span className="text-xs font-semibold text-gray-400">Grand Total</span>
                                  <span className="text-lg font-bold text-indigo-600 tabular-nums">
                                    Tk{bill.grandTotal.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
