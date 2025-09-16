// Simple server-compatible loading component
function SimpleLoadingSpinner() {
  return (
    <div className="inline-flex items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-white rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-3 h-3 bg-primary-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Bar Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-primary-500 h-2 rounded-full w-1/6 animate-pulse"></div>
          </div>
        </div>

        {/* Welcome Message Skeleton */}
        <div className="text-center mb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-80 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto"></div>
          </div>
        </div>

        {/* Step Content Skeleton */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 shadow-lg p-8 mb-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-64 mx-auto"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-80 mx-auto"></div>
              </div>
            </div>

            {/* Grid Content */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>

            {/* Progress Text */}
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Navigation Skeleton */}
        <div className="flex justify-between">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center py-8">
          <div className="text-center">
            <SimpleLoadingSpinner />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Preparing your personalized onboarding...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
