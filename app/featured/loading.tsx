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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6 lg:px-8 xl:px-12 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-64"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-96"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          </div>
        </div>

        {/* Refresh Button Skeleton */}
        <div className="mb-6 flex justify-end">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          </div>
        </div>

        {/* Books Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="animate-pulse">
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
              {/* Featured reason badge skeleton */}
              <div className="mt-2 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 mx-auto"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex justify-center items-center space-x-2">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center py-8">
          <div className="text-center">
            <SimpleLoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading featured books...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
