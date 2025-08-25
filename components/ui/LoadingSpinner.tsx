interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?:
    | "default"
    | "wave"
    | "pulse"
    | "dots"
    | "ripple"
    | "spiral"
    | "breath"
    | "liquid";
  className?: string;
  message?: string;
}

export function LoadingSpinner({
  size = "md",
  variant = "wave",
  className = "",
  message,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  // Elegant wave animation
  if (variant === "wave") {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center ${className}`}
      >
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-8 bg-gradient-to-t from-primary-600 to-primary-400 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: "1.2s",
                transform: `scaleY(${0.4 + Math.sin(i * 0.8) * 0.3})`,
              }}
            ></div>
          ))}
        </div>

        {message && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Breathing pulse effect
  if (variant === "pulse") {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center ${className}`}
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-primary-200 dark:bg-primary-800 rounded-full animate-ping opacity-20"></div>
          <div
            className="absolute w-12 h-12 bg-primary-300 dark:bg-primary-700 rounded-full animate-ping opacity-30"
            style={{ animationDelay: "0.3s" }}
          ></div>
          <div
            className="absolute w-8 h-8 bg-primary-400 dark:bg-primary-600 rounded-full animate-ping opacity-40"
            style={{ animationDelay: "0.6s" }}
          ></div>
          <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
        </div>

        {message && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Dancing dots
  if (variant === "dots") {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center ${className}`}
      >
        <div className="flex items-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: "0.8s",
              }}
            ></div>
          ))}
        </div>

        {message && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Ripple effect
  if (variant === "ripple") {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center ${className}`}
      >
        <div className="relative w-16 h-16 flex items-center justify-center">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute border-2 border-primary-500 rounded-full animate-ping"
              style={{
                width: `${(i + 1) * 16}px`,
                height: `${(i + 1) * 16}px`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: "1.5s",
              }}
            ></div>
          ))}
          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
        </div>

        {message && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Spiral loader
  if (variant === "spiral") {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center ${className}`}
      >
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-700 rounded-full"></div>
          <div
            className="absolute inset-0 border-2 border-transparent border-t-primary-500 border-r-primary-500 rounded-full animate-spin"
            style={{ animationDuration: "1s" }}
          ></div>
          <div
            className="absolute inset-2 border-2 border-transparent border-b-secondary-500 border-l-secondary-500 rounded-full animate-spin"
            style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
          ></div>
          <div
            className="absolute inset-4 border-2 border-transparent border-t-accent-500 rounded-full animate-spin"
            style={{ animationDuration: "2s" }}
          ></div>
        </div>

        {message && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
            {message}
          </p>
        )}
      </div>
    );
  }

  // Breathing animation
  if (variant === "breath") {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center ${className}`}
      >
        <div className="relative">
          <div
            className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full opacity-80"
            style={{
              animation: "breathe 2s ease-in-out infinite",
            }}
          ></div>
          <div
            className="absolute inset-2 bg-gradient-to-br from-secondary-400 to-accent-400 rounded-full opacity-60"
            style={{
              animation: "breathe 2s ease-in-out infinite 0.5s",
            }}
          ></div>
          <div
            className="absolute inset-4 bg-gradient-to-br from-accent-400 to-purple-400 rounded-full opacity-40"
            style={{
              animation: "breathe 2s ease-in-out infinite 1s",
            }}
          ></div>
        </div>

        {message && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
            {message}
          </p>
        )}

        <style jsx>{`
          @keyframes breathe {
            0%,
            100% {
              transform: scale(1);
              opacity: 0.8;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.4;
            }
          }
        `}</style>
      </div>
    );
  }

  // Liquid morphing effect
  if (variant === "liquid") {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center ${className}`}
      >
        <div className="relative w-16 h-16">
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full"
            style={{
              animation: "liquid 3s ease-in-out infinite",
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          ></div>
          <div
            className="absolute inset-2 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-full"
            style={{
              animation: "liquid 3s ease-in-out infinite 1s",
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          ></div>
          <div
            className="absolute inset-4 bg-gradient-to-br from-accent-500 to-purple-500 rounded-full"
            style={{
              animation: "liquid 3s ease-in-out infinite 2s",
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
            }}
          ></div>
        </div>

        {message && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
            {message}
          </p>
        )}

        <style jsx>{`
          @keyframes liquid {
            0%,
            100% {
              border-radius: 50%;
              transform: rotate(0deg) scale(1);
            }
            25% {
              border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
              transform: rotate(90deg) scale(1.1);
            }
            50% {
              border-radius: 20% 80% 20% 80% / 80% 20% 80% 20%;
              transform: rotate(180deg) scale(0.9);
            }
            75% {
              border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
              transform: rotate(270deg) scale(1.1);
            }
          }
        `}</style>
      </div>
    );
  }

  // Simple elegant default
  return (
    <div
      className={`inline-flex flex-col items-center justify-center ${className}`}
    >
      <div className="relative">
        <div className="w-8 h-8 border-2 border-primary-200 dark:border-primary-800 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-2 h-2 bg-primary-500 rounded-full"></div>
        </div>
      </div>

      {message && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
          {message}
        </p>
      )}
    </div>
  );
}
