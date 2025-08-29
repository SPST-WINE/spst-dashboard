export function ShipmentCardSkeleton() {
  return (
    <div className="rounded-2xl border p-4 bg-white shadow-sm animate-pulse">
      <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-64 bg-gray-200 rounded mb-1" />
      <div className="h-3 w-48 bg-gray-200 rounded mb-3" />
      <div className="flex gap-2">
        <div className="h-7 w-28 bg-gray-200 rounded" />
        <div className="h-7 w-28 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
