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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-80"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          </div>
        </div>

        {/* Reading Goals Section Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-32"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
                <div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-32"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Period Selector Skeleton */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-28"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg"
            >
              <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Stats Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg"
            >
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-32"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Progress Chart Skeleton */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg mb-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-48"></div>
            <div className="flex items-end justify-between gap-2 h-40">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-gray-200 dark:bg-gray-700 rounded-t"
                    style={{ height: `${20 + Math.random() * 100}px` }}
                  />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mt-2 w-8"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mt-1 w-4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Year Summary Skeleton */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-16 mx-auto"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center py-8">
          <div className="text-center">
            <SimpleLoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Calculating your reading statistics...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
