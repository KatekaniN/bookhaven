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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
        {/* Hero Section Skeleton */}
        <div className="text-center mb-16">
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-6 max-w-4xl"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-8 max-w-2xl"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mx-auto max-w-xs"></div>
          </div>
        </div>

        {/* Content Cards Skeleton */}
        <div className="space-y-16">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl p-8"
            >
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6 max-w-sm"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-4">
                      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded max-w-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded max-w-24"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center py-16">
          <div className="text-center">
            <SimpleLoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading Book Haven...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
