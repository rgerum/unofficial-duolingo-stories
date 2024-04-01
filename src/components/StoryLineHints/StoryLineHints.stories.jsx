import StoryLineHints from "./StoryLineHints";

const meta = {
  component: StoryLineHints,
  argTypes: {
    unhide: {
      control: { type: "range", min: 0, max: 30, step: 1 },
    },
    audioRange: {
      control: { type: "range", min: 0, max: 30, step: 1 },
    },
  },
};

export default meta;

export const Normal = {
  render: (args) => (
    <div style={{ display: "grid", placeItems: "center", height: "200px" }}>
      <div>
        <StoryLineHints
          content={{
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
          }}
          hideRangesForChallenge={[{ start: 5, end: 9 }]}
          unhide={0}
          {...args}
        ></StoryLineHints>
      </div>
    </div>
  ),
};
