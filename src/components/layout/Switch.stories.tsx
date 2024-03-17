import type { Meta, StoryObj } from "@storybook/react";

import Switch from "./switch";
import React from "react";

const meta: Meta<typeof Switch> = {
  component: Switch,
  argTypes: {
    primary: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */

export const Normal: Story = {
  render: () => {
    const [checked, setChecked] = React.useState(false);
    return <Switch checked={checked} onClick={() => setChecked(!checked)} />;
  },
};
