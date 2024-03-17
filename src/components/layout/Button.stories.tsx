import type { Meta, StoryObj } from "@storybook/react";

import Button from "./button";

const meta: Meta<typeof Button> = {
  component: Button,
  argTypes: {
    primary: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {
  render: () => <Button primary>Click</Button>,
};

export const Normal: Story = {
  render: () => <Button>Click</Button>,
};
