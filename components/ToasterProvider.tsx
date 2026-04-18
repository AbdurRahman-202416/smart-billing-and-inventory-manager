"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={10}
      toastOptions={{
        className:
          "text-sm font-semibold max-w-[90vw] sm:max-w-md shadow-xl",
        duration: 3000,
        style: {
          padding: "14px 20px",
          borderRadius: "16px",
          gap: "10px",
        },
        success: {
          style: {
            background: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
          },
          iconTheme: {
            primary: "#10b981",
            secondary: "#fff",
          },
        },
        error: {
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
