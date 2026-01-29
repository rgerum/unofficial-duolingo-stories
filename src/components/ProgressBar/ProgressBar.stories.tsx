import ProgressBar from "./ProgressBar";

const meta = {
  component: ProgressBar,
  argTypes: {
    progress: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
};

export default meta;

export const Normal = {
  render: ({ progress }: { progress: number }) => (
    <ProgressBar length={100} progress={progress}></ProgressBar>
  ),
};
