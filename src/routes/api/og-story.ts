import { createFileRoute } from "@tanstack/react-router";
import { GET } from "@/app/api/og-story/route";

export const Route = createFileRoute("/api/og-story")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
