import { Image, Link, Text, VStack } from "@expo/ui/swift-ui";
import {
  aspectRatio,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export type NextStoryWidgetProps =
  | {
      state: "ready";
      storyId: number;
      storyName: string;
      courseName: string;
      imagePath?: string;
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

  const background = environment.colorScheme === "dark" ? "#131f22" : "#ffffff";
  const text = environment.colorScheme === "dark" ? "#f7f7f7" : "#3c3c3c";

  if (props.state === "empty") {
    return (
      <Link destination="duostories:///add-course">
        <VStack
          alignment="leading"
          spacing={8}
          modifiers={[
            frame({ maxWidth: 1_000, maxHeight: 1_000, alignment: "center" }),
            padding({ all: 16 }),
            containerBackground(background, "widget"),
          ]}
        >
          <Text
            modifiers={[
              font({ size: 18, weight: "bold" }),
              foregroundStyle(text),
            ]}
          >
            Pick a course
          </Text>
          <Text modifiers={[font({ size: 14 }), foregroundStyle("#777777")]}>
            Choose a language to get your next story.
          </Text>
        </VStack>
      </Link>
    );
  }

  if (props.state === "complete") {
    return (
      <Link destination="duostories:///">
        <VStack
          alignment="leading"
          spacing={8}
          modifiers={[
            frame({ maxWidth: 1_000, maxHeight: 1_000, alignment: "center" }),
            padding({ all: 16 }),
            containerBackground(background, "widget"),
          ]}
        >
          <Text
            modifiers={[
              font({ size: 18, weight: "bold" }),
              foregroundStyle(text),
            ]}
          >
            All caught up!
          </Text>
          <Text
            modifiers={[
              font({ size: 14 }),
              foregroundStyle("#777777"),
              lineLimit(2),
            ]}
          >
            You finished every story in {props.courseName}.
          </Text>
        </VStack>
      </Link>
    );
  }

  const destination = `duostories:///story/${props.storyId}?listening=${props.listening ? "1" : "0"}`;
  if (environment.widgetFamily === "systemSmall") {
    return (
      <Link destination={destination}>
        <VStack
          alignment="leading"
          spacing={6}
          modifiers={[
            frame({ maxWidth: 1_000, maxHeight: 1_000 }),
            padding({ all: 10 }),
            containerBackground(background, "widget"),
          ]}
        >
          {props.imagePath ? (
            <Image
              uiImage={props.imagePath}
              modifiers={[
                frame({ maxWidth: 1_000 }),
                aspectRatio({ ratio: 1.9, contentMode: "fill" }),
              ]}
            />
          ) : null}
          <Text
            modifiers={[
              font({ size: 14, weight: "bold" }),
              foregroundStyle(text),
              lineLimit(2),
            ]}
          >
            {props.storyName}
          </Text>
        </VStack>
      </Link>
    );
  }

  return (
    <Link destination={destination}>
      <VStack
        alignment="leading"
        spacing={7}
        modifiers={[
          frame({ maxWidth: 1_000, maxHeight: 1_000 }),
          padding({ all: 12 }),
          containerBackground(background, "widget"),
        ]}
      >
        {props.imagePath ? (
          <Image
            uiImage={props.imagePath}
            modifiers={[
              frame({ maxWidth: 1_000 }),
              aspectRatio({ ratio: 3.1, contentMode: "fill" }),
            ]}
          />
        ) : null}
        <Text
          modifiers={[
            font({ size: 16, weight: "bold" }),
            foregroundStyle(text),
            lineLimit(1),
          ]}
        >
          {props.storyName}
        </Text>
        <Text
          modifiers={[
            font({ size: 12 }),
            foregroundStyle("#777777"),
            lineLimit(1),
          ]}
        >
          {props.courseName} · {props.completedCount}/{props.totalCount}{" "}
          complete
        </Text>
      </VStack>
    </Link>
  );
}

export default createWidget("NextStoryWidget", NextStoryWidget);
