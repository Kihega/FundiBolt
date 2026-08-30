import { useWindowDimensions } from "react-native";

// Baseline reference size (standard mid-size phone). Scaling is computed
// relative to this so layouts stay proportional on smaller and larger screens.
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const TABLET_BREAKPOINT = 768;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const scale = (size: number) => (width / BASE_WIDTH) * size;
  const verticalScale = (size: number) => (height / BASE_HEIGHT) * size;
  // moderateScale dampens the effect for things like font sizes, so text
  // doesn't grow linearly (and awkwardly) on very large screens.
  const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

  const isTablet = width >= TABLET_BREAKPOINT;
  // On tablets/large screens, cap form content width and center it instead
  // of letting inputs stretch edge-to-edge.
  const maxContentWidth = isTablet ? 480 : width;

  return { width, height, isTablet, scale, verticalScale, moderateScale, maxContentWidth };
}
