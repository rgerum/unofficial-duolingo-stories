import {
  Circle,
  HStack,
  Image,
  Link,
  Text,
  VStack,
  ZStack,
} from "@expo/ui/swift-ui";
import {
  aspectRatio,
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  multilineTextAlignment,
  offset,
  opacity,
  padding,
  resizable,
  shadow,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

// Color Block design (Variant K): full-bleed brand blue, white text, the
// story character floating with a shadow, and a footer row with the course
// flag + language + progress numbers. The flag is optional so the layout
// still reads before the widget-flag endpoint is deployed.
//
// NOTE: expo-widgets extracts only this single "widget"-tagged function into
// the widget runtime, so everything must stay inline — helper components or
// module-scope references are not available inside the widget.

export type NextStoryWidgetProps =
  | {
      state: "ready";
      storyId: number;
      storyName: string;
      courseName: string;
      imagePath?: string;
      flagPath?: string;
      listening: boolean;
      completedCount: number;
      totalCount: number;
    }
  | { state: "complete"; courseName: string }
  | { state: "empty" };

function NextStoryWidget(
  props: NextStoryWidgetProps,
  environment: WidgetEnvironment,
) {
  "widget";

  const BLUE = "#1cb0f6";
  const WHITE = "#ffffff";
  const SHADOW = "#00000040";
  // The decorative circle is a ZStack child, so its frame must stay within
  // the widget bounds — a larger fixed frame inflates the ZStack's layout
  // size and makes texts overflow the widget edges.
  const isSmall = environment.widgetFamily === "systemSmall";
  const decoSize = isSmall ? 120 : 150;
  const decoOffset = isSmall ? { x: 45, y: -45 } : { x: 60, y: -55 };

  if (props.state === "empty") {
    return (
      <Link destination="duostories:///add-course">
        <ZStack
          alignment="topTrailing"
          modifiers={[
            frame({ maxWidth: 1_000, maxHeight: 1_000 }),
            containerBackground(BLUE, "widget"),
          ]}
        >
          <Circle
            modifiers={[
              frame({ width: decoSize, height: decoSize }),
              foregroundStyle(WHITE),
              opacity(0.13),
              offset(decoOffset),
            ]}
          />
          <VStack
            alignment="leading"
            spacing={8}
            modifiers={[
              frame({ maxWidth: 1_000, maxHeight: 1_000, alignment: "center" }),
              padding({ all: 20 }),
            ]}
          >
            <Text
              modifiers={[
                font({ size: 20, weight: "bold" }),
                foregroundStyle(WHITE),
              ]}
            >
              Pick a course
            </Text>
            <Text
              modifiers={[
                font({ size: 14 }),
                foregroundStyle(WHITE),
                opacity(0.85),
              ]}
            >
              Choose a language to get your next story.
            </Text>
          </VStack>
        </ZStack>
      </Link>
    );
  }

  if (props.state === "complete") {
    return (
      <Link destination="duostories:///">
        <ZStack
          alignment="topTrailing"
          modifiers={[
            frame({ maxWidth: 1_000, maxHeight: 1_000 }),
            containerBackground(BLUE, "widget"),
          ]}
        >
          <Circle
            modifiers={[
              frame({ width: decoSize, height: decoSize }),
              foregroundStyle(WHITE),
              opacity(0.13),
              offset(decoOffset),
            ]}
          />
          <VStack
            alignment="leading"
            spacing={8}
            modifiers={[
              frame({ maxWidth: 1_000, maxHeight: 1_000, alignment: "center" }),
              padding({ all: 20 }),
            ]}
          >
            <Text
              modifiers={[
                font({ size: 20, weight: "bold" }),
                foregroundStyle(WHITE),
              ]}
            >
              All caught up!
            </Text>
            <Text
              modifiers={[
                font({ size: 14 }),
                foregroundStyle(WHITE),
                opacity(0.85),
                lineLimit(2),
              ]}
            >
              You finished every story in {props.courseName}.
            </Text>
          </VStack>
        </ZStack>
      </Link>
    );
  }

  const destination = `duostories:///story/${props.storyId}?listening=${props.listening ? "1" : "0"}`;

  if (environment.widgetFamily === "systemSmall") {
    return (
      <Link destination={destination}>
        <ZStack
          alignment="topTrailing"
          modifiers={[
            frame({ maxWidth: 1_000, maxHeight: 1_000 }),
            containerBackground(BLUE, "widget"),
          ]}
        >
          <Circle
            modifiers={[
              frame({ width: decoSize, height: decoSize }),
              foregroundStyle(WHITE),
              opacity(0.13),
              offset(decoOffset),
            ]}
          />
          <VStack
            alignment="center"
            spacing={5}
            modifiers={[
              frame({ maxWidth: 1_000, maxHeight: 1_000 }),
              padding({ all: 14 }),
            ]}
          >
            <Text
              modifiers={[
                font({ size: 11, weight: "heavy" }),
                foregroundStyle(WHITE),
                opacity(0.85),
              ]}
            >
              NEXT STORY
            </Text>
            {props.imagePath ? (
              <Image
                uiImage={props.imagePath}
                modifiers={[
                  resizable(),
                  aspectRatio({ contentMode: "fit" }),
                  frame({ width: 56, height: 52 }),
                  shadow({ radius: 6, y: 4, color: SHADOW }),
                ]}
              />
            ) : null}
            <Text
              modifiers={[
                font({ size: 15, weight: "bold" }),
                foregroundStyle(WHITE),
                multilineTextAlignment("center"),
                lineLimit(2),
              ]}
            >
              {props.storyName}
            </Text>
            <HStack spacing={6}>
              {props.flagPath ? (
                <Image
                  uiImage={props.flagPath}
                  modifiers={[
                    resizable(),
                    frame({ width: 20, height: 16 }),
                    clipShape("roundedRectangle", 4),
                  ]}
                />
              ) : null}
              <Text
                modifiers={[
                  font({ size: 13, weight: "heavy" }),
                  foregroundStyle(WHITE),
                  lineLimit(1),
                  minimumScaleFactor(0.7),
                ]}
              >
                {props.courseName}
              </Text>
              <Text
                modifiers={[
                  font({ size: 13, weight: "semibold" }),
                  foregroundStyle(WHITE),
                  opacity(0.75),
                  lineLimit(1),
                ]}
              >
                {props.completedCount}/{props.totalCount}
              </Text>
            </HStack>
          </VStack>
        </ZStack>
      </Link>
    );
  }

  return (
    <Link destination={destination}>
      <ZStack
        alignment="topTrailing"
        modifiers={[
          frame({ maxWidth: 1_000, maxHeight: 1_000 }),
          containerBackground(BLUE, "widget"),
        ]}
      >
        <Circle
          modifiers={[
            frame({ width: decoSize, height: decoSize }),
            foregroundStyle(WHITE),
            opacity(0.13),
            offset(decoOffset),
          ]}
        />
        <HStack
          spacing={12}
          modifiers={[
            frame({ maxWidth: 1_000, maxHeight: 1_000 }),
            padding({ leading: 20, trailing: 12, top: 16, bottom: 16 }),
          ]}
        >
          <VStack alignment="leading" spacing={10}>
            <Text
              modifiers={[
                font({ size: 12, weight: "heavy" }),
                foregroundStyle(WHITE),
                opacity(0.85),
              ]}
            >
              NEXT STORY
            </Text>
            <Text
              modifiers={[
                font({ size: 22, weight: "heavy" }),
                foregroundStyle(WHITE),
                lineLimit(2),
              ]}
            >
              {props.storyName}
            </Text>
            <HStack spacing={8}>
              {props.flagPath ? (
                <Image
                  uiImage={props.flagPath}
                  modifiers={[
                    resizable(),
                    frame({ width: 26, height: 21 }),
                    clipShape("roundedRectangle", 5),
                  ]}
                />
              ) : null}
              <Text
                modifiers={[
                  font({ size: 15, weight: "heavy" }),
                  foregroundStyle(WHITE),
                  lineLimit(1),
                  minimumScaleFactor(0.7),
                ]}
              >
                {props.courseName}
              </Text>
              <Text
                modifiers={[
                  font({ size: 15, weight: "semibold" }),
                  foregroundStyle(WHITE),
                  opacity(0.75),
                  lineLimit(1),
                ]}
              >
                {props.completedCount}/{props.totalCount}
              </Text>
            </HStack>
          </VStack>
          {props.imagePath ? (
            <Image
              uiImage={props.imagePath}
              modifiers={[
                resizable(),
                aspectRatio({ contentMode: "fit" }),
                frame({ width: 104, height: 96 }),
                shadow({ radius: 8, y: 6, color: SHADOW }),
              ]}
            />
          ) : null}
        </HStack>
      </ZStack>
    </Link>
  );
}

export default createWidget("NextStoryWidget", NextStoryWidget);
