"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Monitor, BarChart3, Search, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Global Products", fullLabel: "Global Products", icon: Search },
  { href: "/inventory", label: "Inventory Stock", fullLabel: "Inventory Stock", icon: Package },
  { href: "/billing", label: "Billing", fullLabel: "Billing", icon: Monitor },
  { href: "/history", label: "Sales Reports", fullLabel: "Sales Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* ── Mobile Hamburger Button ────────────────────────────────────────── */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-gray-900 text-white rounded-xl shadow-lg border border-gray-800"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* ── Desktop Sidebar (hidden on mobile) ────────────────────────────── */}
      <aside className="hidden md:flex w-64 min-h-screen bg-gray-900 text-white flex-col p-4 shadow-2xl shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-2 text-xl font-extrabold mb-10 px-2 text-indigo-400">
          <Monitor size={32} className="text-white shrink-0" />
          <span className="tracking-tight text-sm">Smart Inventory Management</span>
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

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="md:hidden fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm"
            />

            {/* Side Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 z-[55] w-72 bg-gray-900 text-white flex flex-col p-4 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-xl font-extrabold mb-10 px-2 mt-12 text-indigo-400">
                <Monitor size={32} className="text-white shrink-0" />
                <span className="tracking-tight text-sm">Smart Inventory Management</span>
              </div>

              <nav className="flex flex-col gap-1.5">
                {navLinks.map(({ href, fullLabel, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeSidebar}
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
