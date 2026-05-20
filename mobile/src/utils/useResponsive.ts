import { useMemo } from "react";
import { useWindowDimensions, PixelRatio } from "react-native";

export type DeviceType = "phone" | "tablet";
export type Breakpoint = "sm" | "md" | "lg" | "xl";

const REFERENCE_WIDTH = 390;

function getBreakpoint(width: number): Breakpoint {
  if (width < 390) return "sm";
  if (width < 744) return "md";
  if (width < 1024) return "lg";
  return "xl";
}

function getDeviceType(width: number, height: number): DeviceType {
  return Math.min(width, height) >= 600 ? "tablet" : "phone";
}

export interface ResponsiveValues {
  deviceType: DeviceType;
  isTablet: boolean;
  isPhone: boolean;

  orientation: "portrait" | "landscape";
  isLandscape: boolean;
  isPortrait: boolean;

  width: number;
  height: number;

  breakpoint: Breakpoint;

  fontScale: number;
  isLargeFont: boolean;

  scale: (base: number) => number;
  scaleFont: (base: number) => number;
  responsiveValue: <T>(values: Partial<Record<Breakpoint, T>>) => T;

  contentMaxWidth: number | undefined;
  horizontalPadding: number;
  gridColumns: number;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const breakpoint = getBreakpoint(width);
    const deviceType = getDeviceType(width, height);
    const isTablet = deviceType === "tablet";
    const isPhone = deviceType === "phone";
    const orientation = width > height ? "landscape" : "portrait";
    const isLandscape = orientation === "landscape";
    const isPortrait = orientation === "portrait";
    const fontScale = PixelRatio.getFontScale();
    const isLargeFont = fontScale >= 1.2;

    const rawRatio = width / REFERENCE_WIDTH;
    const dampened = 1 + (rawRatio - 1) * 0.5;
    const clampedRatio = Math.min(Math.max(dampened, 0.85), 1.4);

    const fontDampened = 1 + (rawRatio - 1) * 0.35;
    const fontClampedRatio = Math.min(Math.max(fontDampened, 0.85), 1.25);

    const scale = (base: number): number => Math.round(base * clampedRatio);

    const scaleFont = (base: number): number => Math.round(base * fontClampedRatio);

    const responsiveValue = <T,>(values: Partial<Record<Breakpoint, T>>): T => {
      const order: Breakpoint[] = ["xl", "lg", "md", "sm"];
      const idx = order.indexOf(breakpoint);
      for (let i = idx; i < order.length; i++) {
        if (values[order[i]] !== undefined) return values[order[i]]!;
      }
      for (let i = idx - 1; i >= 0; i--) {
        if (values[order[i]] !== undefined) return values[order[i]]!;
      }
      return Object.values(values)[0] as T;
    };

    const contentMaxWidth = responsiveValue<number | undefined>({
      sm: undefined,
      md: undefined,
      lg: 700,
      xl: 900,
    });

    const horizontalPadding = responsiveValue({
      sm: 16,
      md: 16,
      lg: 32,
      xl: 48,
    });

    const gridColumns = isLargeFont
      ? 1
      : responsiveValue({ sm: 1, md: 1, lg: 2, xl: 2 });

    return {
      deviceType,
      isTablet,
      isPhone,
      orientation,
      isLandscape,
      isPortrait,
      width,
      height,
      breakpoint,
      fontScale,
      isLargeFont,
      scale,
      scaleFont,
      responsiveValue,
      contentMaxWidth,
      horizontalPadding,
      gridColumns,
    };
  }, [width, height]);
}
