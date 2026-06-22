import React from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../components/Text";
import { colors } from "../theme";
import { stopAudio } from "./audio";

type HintRequest = {
  translation: string;
  pronunciation?: string;
  x: number;
  y: number;
};

type HintPopupApi = {
  show: (hint: HintRequest) => void;
  hide: () => void;
};

export const HintPopupContext = React.createContext<HintPopupApi>({
  show: () => {},
  hide: () => {},
});

export const HintLookupContext = React.createContext<() => void>(() => {
  stopAudio(false);
});

const BUBBLE_MAX_WIDTH = 260;
const BUBBLE_MIN_WIDTH = 140;
const BUBBLE_EDGE_INSET = 8;
const BUBBLE_HORIZONTAL_PADDING = 32;
const BUBBLE_DEFAULT_HEIGHT = 46;
const BUBBLE_VERTICAL_GAP = 8;
const TRANSLATION_FONT_SIZE = 18;
const PRONUNCIATION_FONT_SIZE = 14;

function estimatePopupWidth(hint: HintRequest) {
  const translationWidth = hint.translation.length * TRANSLATION_FONT_SIZE * 0.56;
  const pronunciationWidth =
    (hint.pronunciation?.length ?? 0) * PRONUNCIATION_FONT_SIZE * 0.56;
  return Math.ceil(
    Math.max(translationWidth, pronunciationWidth) + BUBBLE_HORIZONTAL_PADDING,
  );
}

/**
 * Tap-to-translate bubble. The web shows hover tooltips; on mobile a tap on a
 * hinted word shows this bubble above the word for a couple of seconds.
 */
export function HintPopupHost({ children }: { children: React.ReactNode }) {
  const [hint, setHint] = React.useState<HintRequest | null>(null);
  const [bubbleHeight, setBubbleHeight] = React.useState(BUBBLE_DEFAULT_HEIGHT);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHint(null);
  }, []);

  const show = React.useCallback((request: HintRequest) => {
    if (timer.current) clearTimeout(timer.current);
    setBubbleHeight(BUBBLE_DEFAULT_HEIGHT);
    setHint(request);
    timer.current = setTimeout(() => {
      setHint(null);
      timer.current = null;
    }, 2500);
  }, []);

  const api = React.useMemo(() => ({ show, hide }), [show, hide]);
  const insets = useSafeAreaInsets();

  const screenWidth = Dimensions.get("window").width;
  const estimatedBubbleWidth = Math.min(
    BUBBLE_MAX_WIDTH,
    Math.max(BUBBLE_MIN_WIDTH, hint ? estimatePopupWidth(hint) : BUBBLE_MIN_WIDTH),
  );
  const bubbleLeft = hint
    ? Math.min(
        Math.max(hint.x - estimatedBubbleWidth / 2, BUBBLE_EDGE_INSET),
        screenWidth - (estimatedBubbleWidth + BUBBLE_EDGE_INSET),
      )
    : 0;
  // The host fills the modal window, so pageY maps directly. Keep the popup's
  // bottom edge just above the word; taller translations grow upward.
  const bubbleTop = hint
    ? Math.max(hint.y - bubbleHeight - BUBBLE_VERTICAL_GAP, insets.top + 8)
    : 0;

  return (
    <HintPopupContext.Provider value={api}>
      <Pressable style={{ flex: 1 }} onPress={hide}>
        {children}
        {hint && (
          <View
            pointerEvents="none"
            onLayout={(event) => {
              const height = event.nativeEvent.layout.height;
              if (height > 0 && Math.abs(height - bubbleHeight) > 0.5) {
                setBubbleHeight(height);
              }
            }}
            style={[
              styles.bubble,
              { left: bubbleLeft, top: bubbleTop, width: estimatedBubbleWidth },
            ]}
          >
            <Text style={styles.translation}>{hint.translation}</Text>
            {hint.pronunciation ? (
              <Text style={styles.pronunciation}>{hint.pronunciation}</Text>
            ) : null}
          </View>
        )}
      </Pressable>
    </HintPopupContext.Provider>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    minWidth: 140,
    maxWidth: BUBBLE_MAX_WIDTH,
    backgroundColor: "#ffffff",
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 100,
  },
  translation: {
    fontSize: 18,
    color: colors.text,
    textAlign: "center",
  },
  pronunciation: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: 2,
    textAlign: "center",
  },
});
