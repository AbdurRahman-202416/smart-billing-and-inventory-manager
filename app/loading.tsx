export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="h-8 bg-gray-200 rounded-md w-48 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm">
            <div className="aspect-square bg-gray-100 rounded-xl" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
