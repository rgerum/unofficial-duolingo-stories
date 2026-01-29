import StoryTextLineSimple from "./StoryTextLineSimple";

const meta = {
  component: StoryTextLineSimple,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: () => (
    <StoryTextLineSimple speaker="" highlight={false} id="">
      test
    </StoryTextLineSimple>
  ),
};
