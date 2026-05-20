/**
 * @deprecated Use useResponsive() from ./useResponsive.ts instead.
 * This hook is kept for backward compatibility with existing screens.
 */
import { useState, useEffect } from "react";
import { Dimensions } from "react-native";

export type Orientation = "portrait" | "landscape";

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<Orientation>(
    getOrientation()
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", () => {
      setOrientation(getOrientation());
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return orientation;
};

function getOrientation(): Orientation {
  const { width, height } = Dimensions.get("window");
  return width > height ? "landscape" : "portrait";
}

// Helper to get responsive layout values
export const getResponsiveLayout = () => {
  const orientation = getOrientation();
  const { width, height } = Dimensions.get("window");

  return {
    orientation,
    isLandscape: orientation === "landscape",
    isPortrait: orientation === "portrait",
    width,
    height,
    // Horizontal padding that adjusts for landscape
    horizontalPadding: orientation === "landscape" ? 64 : 32,
    // Number of columns for grid layouts
    gridColumns: orientation === "landscape" ? 2 : 1,
    // Max width for content in landscape (prevents stretching)
    maxContentWidth: orientation === "landscape" ? 800 : width,
  };
};
