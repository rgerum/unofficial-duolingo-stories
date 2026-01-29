import DocsBreadCrumbNav from "./DocsBreadCrumbNav";

const meta = {
  component: DocsBreadCrumbNav,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: (args: {
    path_titles: Record<string, { group: string; title: string }>;
  }) => <DocsBreadCrumbNav {...args}></DocsBreadCrumbNav>,
};
