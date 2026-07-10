import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

function runHaptic(effect: Promise<void>) {
  void effect.catch(() => {
    // Haptics are optional feedback; unsupported devices should not affect play.
  });
}

export function playSelectionHaptic() {
  if (Platform.OS === "android") {
    runHaptic(
      Haptics.performAndroidHapticsAsync(
        Haptics.AndroidHaptics.Segment_Frequent_Tick,
      ),
    );
    return;
  }

  runHaptic(Haptics.selectionAsync());
}

export function playSuccessHaptic() {
  if (Platform.OS === "android") {
    runHaptic(
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm),
    );
    return;
  }

  runHaptic(
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}

export function playErrorHaptic() {
  if (Platform.OS === "android") {
    runHaptic(
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject),
    );
    return;
  }

  runHaptic(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}
