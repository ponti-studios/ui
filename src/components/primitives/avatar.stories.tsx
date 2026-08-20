import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "./avatar";

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Self-contained SVG so the story has no network dependency (CI-safe).
const AVATAR_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23ff5a36'/%3E%3Ctext x='32' y='40' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%2315110f'%3ECN%3C/text%3E%3C/svg%3E";

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src={AVATAR_SRC} alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

export const WithFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/broken-image.jpg" alt="Broken" />
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar size="default">
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Avatar statusBadge>
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>CD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>EF</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  ),
};
