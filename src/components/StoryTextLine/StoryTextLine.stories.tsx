import StoryTextLine from "./StoryTextLine";

const meta = {
  component: StoryTextLine,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: () => (
    <StoryTextLine
      active={true}
      settings={{
        show_names: true,
        highlight_name: [],
        hideNonHighlighted: false,
        id: "test-settings",
      }}
      element={{
        trackingProperties: {
          line_index: 0,
        },
        lang: "en",
        line: {
          avatarUrl:
            "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
          characterId: "100",
          type: "CHARACTER",
          content: {
            text: "This is a test.",
            hintMap: [
              {
                rangeFrom: 0,
                rangeTo: 3,
                hintIndex: 0,
              },
              {
                rangeFrom: 6,
                rangeTo: 6,
                hintIndex: 1,
              },
              {
                rangeFrom: 8,
                rangeTo: 8,
                hintIndex: 2,
              },
            ],
            hints: ["Here", "am", "I"],
          },
        },
      }}
    ></StoryTextLine>
  ),
};
