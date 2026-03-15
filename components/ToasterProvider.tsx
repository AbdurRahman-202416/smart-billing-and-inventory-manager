"use client";

import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className: "text-sm sm:text-base font-bold max-w-[90vw] sm:max-w-md text-center shadow-lg",
        duration: 3000,
        style: {
          background: "#333",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: "16px",
        },
        success: {
          style: {
            background: "#10B981", // green-500
          },
        },
        error: {
          style: {
            background: "#EF4444", // red-500
          },
        },
      }}
    />
  );
}
