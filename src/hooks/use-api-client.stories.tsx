import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { useState } from "react";

import { useApiClient } from "./use-api-client";

function ApiClientExample({ fetcher }: { fetcher: typeof fetch }) {
  const api = useApiClient({ baseUrl: "/api", fetcher });
  const [result, setResult] = useState("idle");
  async function request() {
    try {
      await api.post("health", { ready: true });
      setResult("success");
    } catch {
      setResult("failed");
    }
  }
  return (
    <div>
      <button type="button" onClick={request}>Send request</button>
      <output aria-label="Request state">{api.isLoading ? "loading" : result}</output>
      <output aria-label="Request error">{api.error?.message ?? "none"}</output>
    </div>
  );
}

const meta = { title: "Hooks/useApiClient", component: ApiClientExample } satisfies Meta<typeof ApiClientExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const EmptySuccessResponse: Story = {
  args: { fetcher: fn(async () => new Response(null, { status: 204 })) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Send request" }));
    await expect(canvas.getByLabelText("Request state")).toHaveTextContent("success");
    await expect(canvas.getByLabelText("Request error")).toHaveTextContent("none");
    await expect(args.fetcher).toHaveBeenCalledWith("/api/health", expect.objectContaining({
      method: "POST", credentials: "same-origin", body: JSON.stringify({ ready: true }),
    }));
  },
};

export const ServerError: Story = {
  args: { fetcher: fn(async () => new Response(JSON.stringify({ message: "Service unavailable" }), {
    status: 503, headers: { "Content-Type": "application/json" },
  })) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Send request" }));
    await expect(canvas.getByLabelText("Request state")).toHaveTextContent("failed");
    await expect(canvas.getByLabelText("Request error")).toHaveTextContent("Service unavailable");
  },
};
