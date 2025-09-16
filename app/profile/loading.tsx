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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
        {/* Profile Header Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-48"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-8 px-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="py-4 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                >
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Activity Section Skeleton */}
            <div className="space-y-8">
              <div>
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-32"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="w-12 h-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      <div className="flex-1 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Favorite Genres Section Skeleton */}
              <div>
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-40"></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Recommendations Section Skeleton */}
              <div>
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-48"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center py-8">
          <div className="text-center">
            <SimpleLoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading your profile...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
