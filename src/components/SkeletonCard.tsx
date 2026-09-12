/**
 * SkeletonCard
 * Animated placeholder card matching campaign card dimensions.
 * Used in ExplorePage while campaigns are loading.
 */
const SkeletonCard = () => {
  return (
    <div
      className="flex flex-col bg-[#111111] border border-[#222222] rounded-lg overflow-hidden"
      aria-hidden="true"
    >
      {/* Image placeholder */}
      <div className="h-48 w-full bg-[#1a1a1a] animate-pulse" />

      <div className="p-4 flex flex-col gap-3">
        {/* Title */}
        <div className="h-5 w-3/4 bg-[#222222] rounded animate-pulse" />
        {/* Description lines */}
        <div className="space-y-2">
          <div className="h-3 w-full bg-[#1e1e1e] rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-[#1e1e1e] rounded animate-pulse" />
        </div>

        <div className="mt-auto space-y-3">
          {/* Creator row */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#222222] animate-pulse" />
            <div className="h-3 w-28 bg-[#1e1e1e] rounded animate-pulse" />
          </div>
          {/* Progress bar */}
          <div className="h-3 flex justify-between">
            <div className="h-3 w-24 bg-[#1e1e1e] rounded animate-pulse" />
            <div className="h-3 w-8 bg-[#1e1e1e] rounded animate-pulse" />
          </div>
          <div className="w-full h-1 bg-[#222222] rounded-full" />
          {/* Goal row */}
          <div className="h-3 flex justify-between">
            <div className="h-3 w-20 bg-[#1e1e1e] rounded animate-pulse" />
            <div className="h-3 w-16 bg-[#1e1e1e] rounded animate-pulse" />
          </div>
          {/* Button placeholder */}
          <div className="h-10 w-full bg-[#222222] rounded animate-pulse mt-2" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
