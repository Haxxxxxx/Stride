/** Reusable loading skeleton with #ff6600 pulse animation — matches STRIDE aesthetic */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white/5 animate-pulse ${className}`}
      style={{ animationDuration: "1.5s" }}
    />
  );
}

/** Full-screen loading state for route-level screens */
export default function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Header area */}
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="h-5 w-5" />
      </div>

      {/* Status card */}
      <SkeletonBlock className="h-24 w-full" />

      {/* Content rows */}
      <div className="space-y-3 mt-6">
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-14 w-full" />
      </div>

      {/* Secondary section */}
      <SkeletonBlock className="h-5 w-24 mt-6" />
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock className="h-20" />
        <SkeletonBlock className="h-20" />
      </div>
    </div>
  );
}
