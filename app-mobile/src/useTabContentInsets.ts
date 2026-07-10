import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IOS_TAB_BAR_CLEARANCE = 96;
const DEFAULT_TAB_BAR_CLEARANCE = 24;

export function useTabContentInsets() {
  const insets = useSafeAreaInsets();

  return {
    paddingBottom:
      insets.bottom +
      (Platform.OS === "ios"
        ? IOS_TAB_BAR_CLEARANCE
        : DEFAULT_TAB_BAR_CLEARANCE),
  };
}
