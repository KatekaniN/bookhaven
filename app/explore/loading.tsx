// Simple server-compatible loading component
function SimpleLoadingSpinner() {
  return (
    <div className="inline-flex items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-gray-200 dark:border-gray-700 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-3 h-3 bg-primary-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
        {/* Hero Section Skeleton */}
        <div className="text-center mb-12">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-4 max-w-2xl"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-6 max-w-3xl"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-8 max-w-md"></div>

            {/* Search Bar Skeleton */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
            </div>
          </div>
        </div>

        {/* Mood Filter Skeleton */}
        <div className="mb-12">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-6 max-w-xs"></div>
              <div className="flex flex-wrap gap-3">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-32"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center py-16">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 border border-white/20 dark:border-gray-700/20 shadow-xl">
            <SimpleLoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
              Loading amazing book collections...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
