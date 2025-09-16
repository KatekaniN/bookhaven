import React, { useState, useEffect } from "react";

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  priority: "high" | "normal" | "low";
  delay?: number;
  fallback?: React.ReactNode;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  children,
  priority,
  delay = 0,
  fallback = null,
}) => {
  const [shouldRender, setShouldRender] = useState(priority === "high");

  useEffect(() => {
    if (priority !== "high") {
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    }
  }, [priority, delay]);

  if (!shouldRender) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
