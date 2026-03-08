"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Monitor, BarChart3, Search } from "lucide-react";

const navLinks = [
  { href: "/", label: "Global Products", fullLabel: "Global Products", icon: Search },
  { href: "/inventory", label: "Inventory Stock", fullLabel: "Inventory Stock", icon: Package },
  { href: "/billing", label: "Billing", fullLabel: "Billing", icon: Monitor },
  { href: "/history", label: "Sales Reports", fullLabel: "Sales Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop Sidebar (hidden on mobile) ────────────────────────────── */}
      <aside className="hidden md:flex w-64 min-h-screen bg-gray-900 text-white flex-col p-4 shadow-2xl shrink-0">
        <div className="flex items-center gap-2 text-xl font-extrabold mb-10 px-2 text-indigo-400">
          <Monitor size={40} className="text-white" />
          <span className="tracking-tight ">Smart Inventory Management</span>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navLinks.map(({ href, fullLabel, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                pathname === href
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              }`}
            >
              <Icon
                size={20}
                className={pathname === href ? "text-white" : "text-gray-500 group-hover:text-gray-300"}
              />
              <span className="text-[14px] font-semibold tracking-wide">{fullLabel}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50 text-center">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Status</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-xs font-bold text-gray-300 tracking-tight">Active Session</span>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar (visible on mobile only) ──────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 flex items-stretch justify-around safe-b">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-3 transition-all ${
                active ? "text-indigo-400" : "text-gray-500"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-bold tracking-wide ${active ? "text-indigo-400" : "text-gray-600"}`}>
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
