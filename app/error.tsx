"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <AlertTriangle size={48} className="text-red-500" />
      <h2 className="text-2xl font-bold text-gray-800">Something went wrong!</h2>
      <p className="text-gray-500 max-w-md text-center">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 pt-[8px] pb-[8px] font-medium text-white transition-colors hover:bg-indigo-700"
      >
        Try again
      </button>
    </div>
  );
}
