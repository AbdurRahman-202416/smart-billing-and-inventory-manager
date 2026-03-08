import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 size={40} className="animate-spin text-indigo-600" />
      <p className="text-sm font-medium text-gray-500">Loading...</p>
    </div>
  );
}
