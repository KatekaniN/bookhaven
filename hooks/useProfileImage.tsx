"use client";

import { useState, useEffect } from "react";

export function useProfileImage(imageUrl?: string | null) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!imageUrl);

  useEffect(() => {
    if (!imageUrl) {
      setImageError(false);
      setIsLoading(false);
      return;
    }

    setImageError(false);
    setIsLoading(true);

    // Test if the image can be loaded
    const img = new Image();
    img.onload = () => {
      setIsLoading(false);
      setImageError(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      setImageError(true);
      console.warn("Failed to load profile image:", imageUrl);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  return {
    imageError,
    isLoading,
    shouldShowImage: imageUrl && !imageError && !isLoading,
  };
}
