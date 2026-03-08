import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import QueryProvider from "@/components/QueryProvider";

export const metadata: Metadata = {
  title: "Smart Manager | Inventory & POS",
  description: "Next-generation store management and POS system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/*
        flex-col on mobile (sidebar at bottom via fixed pos) → md:flex-row on desktop
        pb-20 on mobile to give space above the bottom nav bar
      */}
      <body className="flex flex-col md:flex-row min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
          <QueryProvider>{children}</QueryProvider>
        </main>
      </body>
    </html>
  );
}
