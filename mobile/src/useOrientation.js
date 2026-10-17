import { useWindowDimensions } from "react-native";

/** true, когда ширина экрана больше высоты (телефон повёрнут боком) */
export function useOrientation() {
  const { width, height } = useWindowDimensions();
  return { isLandscape: width > height };
}
