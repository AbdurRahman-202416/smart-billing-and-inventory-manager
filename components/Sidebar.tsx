"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Monitor, BarChart3, Search, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Products", fullLabel: "Global Products", icon: Search },
  { href: "/inventory", label: "Inventory", fullLabel: "Inventory Stock", icon: Package },
  { href: "/billing", label: "Billing", fullLabel: "Billing", icon: Monitor },
  { href: "/history", label: "Reports", fullLabel: "Sales Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* ── Mobile Top Bar ────────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-800 z-[60] flex items-center px-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="ml-3 flex items-center gap-2">
          <Monitor size={20} className="text-indigo-400" />
          <span className="text-white font-semibold text-sm tracking-tight truncate">Smart Inventory</span>
        </div>
      </header>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-stretch justify-around h-16">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors relative ${
                  active ? "text-indigo-600" : "text-gray-400"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-600 rounded-full" />
                )}
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 min-h-screen bg-gray-900 text-white flex-col p-4 shadow-2xl shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 mb-10 px-2">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Monitor size={20} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block leading-tight">Smart Inventory</span>
            <span className="text-[10px] text-gray-500 font-medium">Management System</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navLinks.map(({ href, fullLabel, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                pathname === href
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              }`}
            >
              <Icon
                size={18}
                className={pathname === href ? "text-white" : "text-gray-500 group-hover:text-gray-300"}
              />
              <span className="text-[13px] font-medium">{fullLabel}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[11px] text-gray-400">System Online</span>
          </div>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="md:hidden fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 z-[55] w-72 bg-gray-900 text-white flex flex-col p-4 shadow-2xl"
            >
              <div className="mt-14" />

              <nav className="flex flex-col gap-1 pt-4">
                {navLinks.map(({ href, fullLabel, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                      pathname === href
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={pathname === href ? "text-white" : "text-gray-500 group-hover:text-gray-300"}
                    />
                    <span className="text-[13px] font-medium">{fullLabel}</span>
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
