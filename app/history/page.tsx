"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { History as HistoryIcon, FileText, Calendar, Clock, Receipt, BarChart3 } from "lucide-react";

export default function HistoryPage() {
  const { bills } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  if (!mounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  // Generate a mock bill id in case `id` is too long, we can show a short version
  const formatId = (id: string) => {
    if (id.startsWith("INV-")) return id;
    return `INV-${id.slice(0, 8).toUpperCase()}`;
  };

  // Sort bills by newest first
  const sortedBills = [...bills].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" />
            Accounting & Sales Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review detailed transaction records and stock movement.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
          <Receipt size={18} className="text-gray-400" />
          <span className="font-semibold text-gray-700">{bills.length}</span>
          <span className="text-sm text-gray-500">Invoices generated</span>
        </div>
      </div>

      {sortedBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <FileText size={48} className="text-gray-200 opacity-50" />
          <p className="text-gray-400 font-medium">No billing history found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedBills.map((bill) => (
            <div 
              key={bill.id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <span className="font-mono font-semibold text-indigo-700 text-sm">
                  {formatId(bill.id)}
                </span>
                <span className="font-bold text-gray-800 tabular-nums">
                  Tk{bill.grandTotal.toFixed(2)}
                </span>
              </div>
              
              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(bill.createdAt)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-400" />
                    {formatTime(bill.createdAt)}
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Items ({bill.items.reduce((s, i) => s + i.quantity, 0)})
                  </p>
                  <ul className="space-y-2 text-sm max-h-[140px] overflow-y-auto pr-1">
                    {bill.items.map((item) => (
                      <li key={item.product.id} className="flex items-start justify-between gap-3">
                        <span className="text-gray-700 font-medium leading-tight min-w-0">
                          <span className="block truncate">{item.product.name}</span>
                          <span className="text-xs text-gray-400 block mt-0.5">
                            {item.quantity} × Tk{item.product.price.toFixed(2)}
                          </span>
                        </span>
                        <span className="font-semibold text-gray-800 tabular-nums shrink-0">
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
